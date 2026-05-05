import { Router } from 'express'
import { prisma } from '../config/database'
import { authenticate } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'

const router = Router()
router.use(authenticate, requireAdmin)

router.get('/', async (req, res, next) => {
  try {
    const staff = await prisma.serviceProvider.findMany({ include: { user: { select: { id: true, name: true, email: true, phone: true, role: true, status: true } }, services: { include: { service: true } } }, orderBy: { user: { name: 'asc' } } })
    res.json({ data: staff })
  } catch (error) { next(error) }
})

router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, role, specialization, schedule, serviceIds, bio } = req.body
    const { hashPassword, generateSecurePassword } = require('../utils/password')
    const user = await prisma.user.create({ data: { name, email, phone, password: await hashPassword(generateSecurePassword()), role: role || 'PROVIDER' } })
    const provider = await prisma.serviceProvider.create({
      data: { userId: user.id, specialization: specialization || '', experience: 0, bio, schedule: schedule || {}, services: serviceIds?.length ? { create: serviceIds.map((sid: string) => ({ serviceId: sid })) } : undefined },
      include: { user: true, services: { include: { service: true } } }
    })
    res.status(201).json({ data: provider })
  } catch (error) { next(error) }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, email, phone, specialization, schedule, bio, serviceIds } = req.body
    const provider = await prisma.serviceProvider.findUnique({ where: { id: req.params.id } })
    if (\!provider) return res.status(404).json({ error: 'Staff not found' })
    if (name || email || phone) await prisma.user.update({ where: { id: provider.userId }, data: { ...(name && { name }), ...(email && { email }), ...(phone && { phone }) } })
    if (serviceIds) { await prisma.providerService.deleteMany({ where: { providerId: req.params.id } }); await prisma.providerService.createMany({ data: serviceIds.map((sid: string) => ({ providerId: req.params.id, serviceId: sid })) }) }
    const updated = await prisma.serviceProvider.update({ where: { id: req.params.id }, data: { ...(specialization && { specialization }), ...(schedule && { schedule }), ...(bio \!== undefined && { bio }) }, include: { user: true, services: { include: { service: true } } } })
    res.json({ data: updated })
  } catch (error) { next(error) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({ where: { id: req.params.id } })
    if (\!provider) return res.status(404).json({ error: 'Staff not found' })
    await prisma.user.update({ where: { id: provider.userId }, data: { status: 'INACTIVE' } })
    await prisma.serviceProvider.update({ where: { id: req.params.id }, data: { isAvailable: false } })
    res.json({ data: { message: 'Staff deactivated' } })
  } catch (error) { next(error) }
})

export default router
