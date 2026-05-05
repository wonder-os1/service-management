import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createServiceSchema, updateServiceSchema, paginationSchema } from '../validators'

const router = Router()

// GET /api/services
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { categoryId } = req.query as Record<string, string>

    const where: any = { isActive: true }
    if (categoryId) where.categoryId = categoryId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.service.count({ where }),
    ])

    res.json({
      success: true,
      data: services,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/services/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        providers: {
          where: { isActive: true },
          include: { provider: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
        },
      },
    })

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' })
    }

    res.json({ success: true, data: service })
  } catch (error) {
    next(error)
  }
})

// POST /api/services
router.post('/', authenticate, requireStaff, validate(createServiceSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, description, categoryId, duration, price, comparePrice, image, metadata } = req.body

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const service = await prisma.service.create({
      data: { name, slug, description, categoryId, duration, price, comparePrice, image, metadata },
      include: { category: true },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'service', entityId: service.id },
    })

    res.status(201).json({ success: true, data: service })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/services/:id
router.patch('/:id', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = updateServiceSchema.parse(req.body)

    const service = await prisma.service.update({
      where: { id: req.params.id },
      data,
      include: { category: true },
    })

    res.json({ success: true, data: service })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/services/:id (soft delete)
router.delete('/:id', authenticate, requireStaff, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.service.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })

    res.json({ success: true, message: 'Service deactivated' })
  } catch (error) {
    next(error)
  }
})

export { router as serviceRoutes }
