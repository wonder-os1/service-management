import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createCategorySchema } from '../validators'

const router = Router()

// GET /api/service-categories
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: { _count: { select: { services: true, providers: true } } },
      orderBy: { sortOrder: 'asc' },
    })

    res.json({ success: true, data: categories })
  } catch (error) {
    next(error)
  }
})

// POST /api/service-categories
router.post('/', authenticate, requireAdmin, validate(createCategorySchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, description, icon } = req.body

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const category = await prisma.serviceCategory.create({
      data: { name, slug, description, icon },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'service_category', entityId: category.id },
    })

    res.status(201).json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/service-categories/:id
router.patch('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, description, icon, isActive, sortOrder } = req.body

    const category = await prisma.serviceCategory.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    res.json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
})

export { router as serviceCategoryRoutes }
