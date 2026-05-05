import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createClientSchema, updateClientSchema, paginationSchema } from '../validators'
import { hashPassword, generateSecurePassword } from '../utils/password'

const router = Router()

// GET /api/clients
router.get('/', authenticate, requireStaff, async (req, res, next) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit

    const where: any = { user: { isActive: true } }
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatar: true, isActive: true } },
          _count: { select: { bookings: true, reviews: true, invoices: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ])

    res.json({
      success: true,
      data: clients,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/clients/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            provider: { include: { user: { select: { name: true } } } },
            items: { include: { service: { select: { name: true } } } },
          },
        },
        reviews: { orderBy: { createdAt: 'desc' }, take: 5 },
        loyaltyHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' })
    }

    // Ensure clients can only see their own profile unless staff/admin
    if (req.user!.role === 'CLIENT') {
      if (client.userId !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions' })
      }
    }

    res.json({ success: true, data: client })
  } catch (error) {
    next(error)
  }
})

// POST /api/clients
router.post('/', authenticate, requireStaff, validate(createClientSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, email, phone, password, dateOfBirth, gender, address, city, state, pincode, notes } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' })
    }

    const hashed = await hashPassword(password || generateSecurePassword())

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashed,
        role: 'CLIENT',
        client: {
          create: {
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender,
            address,
            city,
            state,
            pincode,
            notes,
          },
        },
      },
      include: { client: true },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'client', entityId: user.client!.id },
    })

    const { password: _, ...userWithoutPassword } = user
    res.status(201).json({ success: true, data: userWithoutPassword })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/clients/:id
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } })
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' })
    }

    // Only staff+ or the client themselves can update
    if (req.user!.role === 'CLIENT' && req.user!.userId !== client.userId) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' })
    }

    const data = updateClientSchema.parse(req.body)
    const { name, email, phone, ...clientData } = data

    const updated = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...(clientData.dateOfBirth && { dateOfBirth: new Date(clientData.dateOfBirth) }),
        ...(clientData.gender !== undefined && { gender: clientData.gender }),
        ...(clientData.address !== undefined && { address: clientData.address }),
        ...(clientData.city !== undefined && { city: clientData.city }),
        ...(clientData.state !== undefined && { state: clientData.state }),
        ...(clientData.pincode !== undefined && { pincode: clientData.pincode }),
        ...(clientData.notes !== undefined && { notes: clientData.notes }),
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
      },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

export { router as clientRoutes }
