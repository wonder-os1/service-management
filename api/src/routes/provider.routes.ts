import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireAdmin, requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createProviderSchema, updateProviderSchema, paginationSchema } from '../validators'
import { hashPassword } from '../utils/password'

const router = Router()

// GET /api/providers
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { categoryId } = req.query as Record<string, string>

    const where: any = { user: { isActive: true } }
    if (categoryId) where.categoryId = categoryId
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [providers, total] = await Promise.all([
      prisma.serviceProvider.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { bookings: true, reviews: true } },
        },
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      prisma.serviceProvider.count({ where }),
    ])

    res.json({
      success: true,
      data: providers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/providers/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        category: true,
        services: { where: { isActive: true }, include: { service: true } },
        reviews: {
          where: { status: 'APPROVED' },
          include: { client: { include: { user: { select: { name: true, avatar: true } } } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' })
    }

    res.json({ success: true, data: provider })
  } catch (error) {
    next(error)
  }
})

// POST /api/providers
router.post('/', authenticate, requireAdmin, validate(createProviderSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, email, phone, password, specialization, qualifications, experience, bio, categoryId, schedule } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' })
    }

    const hashed = await hashPassword(password || 'Provider@123')

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashed,
        role: 'PROVIDER',
        provider: {
          create: {
            specialization,
            qualifications,
            experience,
            bio,
            categoryId,
            schedule,
          },
        },
      },
      include: {
        provider: { include: { category: true } },
      },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'provider', entityId: user.provider!.id },
    })

    const { password: _, ...userWithoutPassword } = user
    res.status(201).json({ success: true, data: userWithoutPassword })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/providers/:id
router.patch('/:id', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({ where: { id: req.params.id } })
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' })
    }

    // Only admin or the provider themselves can update
    if (req.user!.role !== 'ADMIN' && req.user!.userId !== provider.userId) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' })
    }

    const data = updateProviderSchema.parse(req.body)
    const { name, email, phone, ...providerData } = data

    const updated = await prisma.serviceProvider.update({
      where: { id: req.params.id },
      data: {
        ...providerData,
        user: {
          update: {
            ...(name && { name }),
            ...(email && { email }),
            ...(phone && { phone }),
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        category: true,
      },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

// GET /api/providers/:id/schedule
router.get('/:id/schedule', authenticate, async (req, res, next) => {
  try {
    const { date } = req.query as { date?: string }

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: req.params.id },
      select: { schedule: true, isAvailable: true },
    })

    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' })
    }

    // Get booked slots for the date
    let bookedSlots: any[] = []
    if (date) {
      bookedSlots = await prisma.booking.findMany({
        where: {
          providerId: req.params.id,
          date: new Date(date),
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        },
        select: { startTime: true, endTime: true },
      })
    }

    res.json({
      success: true,
      data: {
        schedule: provider.schedule,
        isAvailable: provider.isAvailable,
        bookedSlots,
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as providerRoutes }
