import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'

const router = Router()

// GET /api/dashboard/stats
router.get('/stats', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [
      totalClients,
      totalProviders,
      totalBookings,
      todayBookings,
      monthRevenue,
      pendingBookings,
      recentBookings,
      topProviders,
    ] = await Promise.all([
      prisma.client.count({ where: { user: { isActive: true } } }),
      prisma.serviceProvider.count({ where: { user: { isActive: true } } }),
      prisma.booking.count(),
      prisma.booking.count({
        where: { date: { gte: today, lt: tomorrow } },
      }),
      prisma.invoice.aggregate({
        where: { status: 'PAID', createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.findMany({
        where: { date: { gte: today } },
        include: {
          client: { include: { user: { select: { name: true } } } },
          provider: { include: { user: { select: { name: true } } } },
          items: { include: { service: { select: { name: true } } } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 10,
      }),
      prisma.serviceProvider.findMany({
        where: { user: { isActive: true }, totalReviews: { gt: 0 } },
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { rating: 'desc' },
        take: 5,
      }),
    ])

    res.json({
      success: true,
      data: {
        totalClients,
        totalProviders,
        totalBookings,
        todayBookings,
        pendingBookings,
        monthRevenue: monthRevenue._sum.total || 0,
        recentBookings,
        topProviders,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/dashboard/revenue
router.get('/revenue', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { period } = req.query as { period?: string }
    const months = period === 'year' ? 12 : 6

    const data = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

      const revenue = await prisma.invoice.aggregate({
        where: { status: 'PAID', createdAt: { gte: start, lt: end } },
        _sum: { total: true },
        _count: true,
      })

      data.push({
        month: start.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: revenue._sum.total || 0,
        count: revenue._count,
      })
    }

    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
})

// GET /api/dashboard/provider-stats (for individual provider)
router.get('/provider-stats', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: req.user!.userId },
    })

    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider profile not found' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [todayBookings, completedBookings, pendingReviews, upcomingBookings] = await Promise.all([
      prisma.booking.count({
        where: { providerId: provider.id, date: { gte: today, lt: tomorrow } },
      }),
      prisma.booking.count({
        where: { providerId: provider.id, status: 'COMPLETED' },
      }),
      prisma.review.count({
        where: { providerId: provider.id, status: 'PENDING' },
      }),
      prisma.booking.findMany({
        where: {
          providerId: provider.id,
          date: { gte: today },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        include: {
          client: { include: { user: { select: { name: true, phone: true } } } },
          items: { include: { service: { select: { name: true } } } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        take: 10,
      }),
    ])

    res.json({
      success: true,
      data: {
        todayBookings,
        completedBookings,
        pendingReviews,
        rating: provider.rating,
        totalReviews: provider.totalReviews,
        upcomingBookings,
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as dashboardRoutes }
