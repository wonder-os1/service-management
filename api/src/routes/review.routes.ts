import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createReviewSchema, replyReviewSchema, paginationSchema } from '../validators'

const router = Router()

// GET /api/reviews
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { providerId, status } = req.query as Record<string, string>

    const where: any = {}
    if (providerId) where.providerId = providerId
    if (status) where.status = status

    // Providers see their own reviews
    if (req.user!.role === 'PROVIDER') {
      const provider = await prisma.serviceProvider.findUnique({ where: { userId: req.user!.userId } })
      if (provider) where.providerId = provider.id
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          client: { include: { user: { select: { name: true, avatar: true } } } },
          provider: { include: { user: { select: { name: true } } } },
          booking: { select: { date: true, items: { include: { service: { select: { name: true } } } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where }),
    ])

    res.json({
      success: true,
      data: reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/reviews
router.post('/', authenticate, validate(createReviewSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { bookingId, rating, comment } = req.body

    const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } })
    if (!client) {
      return res.status(403).json({ success: false, error: 'Only clients can submit reviews' })
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' })
    }

    if (booking.clientId !== client.id) {
      return res.status(403).json({ success: false, error: 'You can only review your own bookings' })
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Booking must be completed before reviewing' })
    }

    // Check for existing review
    const existing = await prisma.review.findUnique({ where: { bookingId } })
    if (existing) {
      return res.status(409).json({ success: false, error: 'Review already submitted for this booking' })
    }

    const review = await prisma.review.create({
      data: {
        clientId: client.id,
        providerId: booking.providerId,
        bookingId,
        rating,
        comment,
      },
      include: {
        client: { include: { user: { select: { name: true } } } },
        provider: { include: { user: { select: { name: true } } } },
      },
    })

    // Update provider rating
    const providerReviews = await prisma.review.aggregate({
      where: { providerId: booking.providerId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    })

    await prisma.serviceProvider.update({
      where: { id: booking.providerId },
      data: {
        rating: providerReviews._avg.rating || 0,
        totalReviews: providerReviews._count,
      },
    })

    res.status(201).json({ success: true, data: review })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/reviews/:id/reply
router.patch('/:id/reply', authenticate, requireStaff, validate(replyReviewSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { reply } = req.body

    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { reply, repliedAt: new Date() },
    })

    res.json({ success: true, data: review })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/reviews/:id/moderate
router.patch('/:id/moderate', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status } = req.body
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' })
    }

    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { status },
    })

    // Recalculate provider rating after moderation
    const providerReviews = await prisma.review.aggregate({
      where: { providerId: review.providerId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: true,
    })

    await prisma.serviceProvider.update({
      where: { id: review.providerId },
      data: {
        rating: providerReviews._avg.rating || 0,
        totalReviews: providerReviews._count,
      },
    })

    res.json({ success: true, data: review })
  } catch (error) {
    next(error)
  }
})

export { router as reviewRoutes }
