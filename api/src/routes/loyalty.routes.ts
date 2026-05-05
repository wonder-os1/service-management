import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { requireFeature } from '../middleware/feature-gate'
import { paginationSchema } from '../validators'

const router = Router()

// All loyalty routes require the feature flag
router.use(requireFeature('loyaltyProgram'))

// GET /api/loyalty/my-points (client's own points)
router.get('/my-points', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true, loyaltyPoints: true, loyaltyTier: true, totalSpent: true, visitCount: true },
    })

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client profile not found' })
    }

    const history = await prisma.loyaltyTransaction.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    res.json({ success: true, data: { ...client, history } })
  } catch (error) {
    next(error)
  }
})

// GET /api/loyalty/leaderboard
router.get('/leaderboard', authenticate, requireStaff, async (_req, res, next) => {
  try {
    const topClients = await prisma.client.findMany({
      orderBy: { loyaltyPoints: 'desc' },
      take: 20,
      include: { user: { select: { name: true, avatar: true } } },
      where: { user: { isActive: true } },
    })

    res.json({ success: true, data: topClients })
  } catch (error) {
    next(error)
  }
})

// POST /api/loyalty/redeem
router.post('/redeem', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { points, description } = req.body

    if (!points || points <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid points value' })
    }

    const client = await prisma.client.findUnique({
      where: { userId: req.user!.userId },
    })

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client profile not found' })
    }

    if (client.loyaltyPoints < points) {
      return res.status(400).json({ success: false, error: 'Insufficient loyalty points' })
    }

    await prisma.client.update({
      where: { id: client.id },
      data: { loyaltyPoints: { decrement: points } },
    })

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        clientId: client.id,
        points: -points,
        type: 'redeemed',
        description: description || `Redeemed ${points} points`,
      },
    })

    res.json({ success: true, data: transaction })
  } catch (error) {
    next(error)
  }
})

// POST /api/loyalty/award (staff gives bonus points)
router.post('/award', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const { clientId, points, description } = req.body

    if (!clientId || !points || points <= 0) {
      return res.status(400).json({ success: false, error: 'clientId and positive points required' })
    }

    await prisma.client.update({
      where: { id: clientId },
      data: { loyaltyPoints: { increment: points } },
    })

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        clientId,
        points,
        type: 'bonus',
        description: description || `Bonus: ${points} points awarded`,
      },
    })

    res.json({ success: true, data: transaction })
  } catch (error) {
    next(error)
  }
})

// GET /api/loyalty/transactions/:clientId
router.get('/transactions/:clientId', authenticate, requireStaff, async (req, res, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: { clientId: req.params.clientId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.loyaltyTransaction.count({ where: { clientId: req.params.clientId } }),
    ])

    res.json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

export { router as loyaltyRoutes }
