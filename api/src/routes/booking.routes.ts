import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createBookingSchema, updateBookingStatusSchema, paginationSchema } from '../validators'
import { sendBookingConfirmation } from '../utils/email'
import { env } from '../config/env'

const router = Router()

// GET /api/bookings
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { providerId, clientId, status, date } = req.query as Record<string, string>

    const where: any = {}

    // Role-based filtering
    if (req.user!.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } })
      if (client) where.clientId = client.id
    } else if (req.user!.role === 'PROVIDER') {
      const provider = await prisma.serviceProvider.findUnique({ where: { userId: req.user!.userId } })
      if (provider) where.providerId = provider.id
    }

    // Additional filters
    if (providerId) where.providerId = providerId
    if (clientId) where.clientId = clientId
    if (status) where.status = status
    if (date) where.date = new Date(date)

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          client: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
          provider: { include: { user: { select: { id: true, name: true, email: true } }, category: true } },
          items: { include: { service: { select: { id: true, name: true } } } },
        },
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
      }),
      prisma.booking.count({ where }),
    ])

    res.json({
      success: true,
      data: bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/bookings/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        client: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        provider: { include: { user: { select: { id: true, name: true, email: true } }, category: true } },
        items: { include: { service: true } },
        invoice: true,
        review: true,
      },
    })

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' })
    }

    res.json({ success: true, data: booking })
  } catch (error) {
    next(error)
  }
})

// POST /api/bookings
router.post('/', authenticate, validate(createBookingSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { clientId, providerId, date, startTime, endTime, type, notes, items } = req.body

    // Check for scheduling conflict
    const conflict = await prisma.booking.findFirst({
      where: {
        providerId,
        date: new Date(date),
        startTime,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      },
    })

    if (conflict) {
      return res.status(409).json({ success: false, error: 'This time slot is already booked' })
    }

    // Fetch service prices
    const serviceIds = items.map((i: any) => i.serviceId)
    const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } })
    const serviceMap = new Map(services.map((s) => [s.id, s]))

    const bookingItems = items.map((item: any) => {
      const service = serviceMap.get(item.serviceId)
      if (!service) throw Object.assign(new Error(`Service ${item.serviceId} not found`), { statusCode: 400 })
      return {
        serviceId: item.serviceId,
        quantity: item.quantity,
        price: service.price,
        duration: service.duration,
      }
    })

    const totalAmount = bookingItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)

    const booking = await prisma.booking.create({
      data: {
        clientId,
        providerId,
        date: new Date(date),
        startTime,
        endTime,
        type,
        notes,
        totalAmount,
        items: { create: bookingItems },
      },
      include: {
        client: { include: { user: { select: { name: true, email: true } } } },
        provider: { include: { user: { select: { name: true } } } },
        items: { include: { service: { select: { name: true } } } },
      },
    })

    // Send confirmation email
    const firstServiceName = booking.items[0]?.service?.name || 'Service'
    sendBookingConfirmation(booking.client.user.email, {
      clientName: booking.client.user.name,
      providerName: booking.provider.user.name,
      serviceName: firstServiceName,
      date: new Date(date).toLocaleDateString('en-IN'),
      time: startTime,
    }).catch(console.error)

    // Create notification
    await prisma.notification.create({
      data: {
        userId: booking.client.userId,
        type: 'BOOKING',
        title: 'Booking Confirmed',
        message: `Your booking with ${booking.provider.user.name} is confirmed for ${startTime}`,
        data: { bookingId: booking.id },
      },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'booking', entityId: booking.id },
    })

    res.status(201).json({ success: true, data: booking })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/bookings/:id/status
router.patch('/:id/status', authenticate, validate(updateBookingStatusSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, notes, cancelReason } = req.body

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(notes && { notes }),
        ...(cancelReason && { cancelReason }),
      },
      include: {
        client: { include: { user: { select: { name: true, email: true, id: true } } } },
        provider: { include: { user: { select: { name: true } } } },
      },
    })

    // On COMPLETED: update client stats and award loyalty points
    if (status === 'COMPLETED') {
      const pointsEarned = Math.floor((booking.totalAmount / 100) * env.LOYALTY_POINTS_PER_100)

      await prisma.client.update({
        where: { id: booking.clientId },
        data: {
          visitCount: { increment: 1 },
          totalSpent: { increment: booking.totalAmount },
          loyaltyPoints: { increment: pointsEarned },
        },
      })

      if (pointsEarned > 0) {
        await prisma.loyaltyTransaction.create({
          data: {
            clientId: booking.clientId,
            points: pointsEarned,
            type: 'earned',
            description: `Earned from booking on ${booking.date.toLocaleDateString('en-IN')}`,
            referenceId: booking.id,
          },
        })
      }
    }

    // Create notification for status change
    await prisma.notification.create({
      data: {
        userId: booking.client.user.id,
        type: 'BOOKING',
        title: `Booking ${status}`,
        message: `Your booking with ${booking.provider.user.name} has been ${status.toLowerCase()}`,
        data: { bookingId: booking.id },
      },
    })

    res.json({ success: true, data: booking })
  } catch (error) {
    next(error)
  }
})


// PATCH /:id/reschedule
router.patch('/:id/reschedule', authenticate, async (req: any, res, next) => {
  try {
    const { date, startTime, endTime } = req.body
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) return res.status(400).json({ error: 'Only pending/confirmed bookings can be rescheduled' })
    const dateStart = new Date(date); dateStart.setHours(0,0,0,0)
    const dateEnd = new Date(dateStart); dateEnd.setDate(dateEnd.getDate()+1)
    const conflict = await prisma.booking.findFirst({ where: { providerId: booking.providerId, date: { gte: dateStart, lt: dateEnd }, startTime, status: { notIn: ['CANCELLED', 'NO_SHOW'] }, id: { not: booking.id } } })
    if (conflict) return res.status(409).json({ error: 'Time slot not available' })
    const updated = await prisma.booking.update({ where: { id: req.params.id }, data: { date: new Date(date), startTime, endTime }, include: { client: { include: { user: true } }, provider: { include: { user: true } }, items: true } })
    res.json({ data: updated })
  } catch (error) { next(error) }
})

export { router as bookingRoutes }
