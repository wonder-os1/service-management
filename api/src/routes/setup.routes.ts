import { Router } from 'express'
import { prisma } from '../config/database'
import { authenticate } from '../middleware/auth'
import { requireAdmin } from '../middleware/rbac'

const router = Router()

router.get('/status', authenticate, async (req, res, next) => {
  try {
    const setting = await prisma.setting.findFirst({ where: { key: 'setup_completed' } })
    res.json({ data: { completed: setting?.value === 'true' } })
  } catch (error) { next(error) }
})

router.post('/complete', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { businessName, phone, email, address, businessHours, services, team } = req.body
    await prisma.$transaction(async (tx) => {
      const settingsData = [
        { key: 'business_name', value: businessName || 'My Business', group: 'general' },
        { key: 'business_phone', value: phone || '', group: 'general' },
        { key: 'business_email', value: email || '', group: 'general' },
        { key: 'business_address', value: address || '', group: 'general' },
        { key: 'business_hours', value: JSON.stringify(businessHours || {}), group: 'general' },
        { key: 'setup_completed', value: 'true', group: 'system' },
      ]
      for (const s of settingsData) { await tx.setting.upsert({ where: { key: s.key }, create: s, update: { value: s.value } }) }
      if (services?.length) { for (const svc of services) { await tx.service.create({ data: { name: svc.name, categoryId: svc.categoryId, price: svc.price || 0, duration: svc.duration || 30, isActive: true } }) } }
      if (team?.length) {
        const { hashPassword, generateSecurePassword } = require('../utils/password')
        for (const member of team) {
          const user = await tx.user.create({ data: { name: member.name, email: member.email, phone: member.phone || '', password: await hashPassword(generateSecurePassword()), role: member.role || 'PROVIDER' } })
          await tx.serviceProvider.create({ data: { userId: user.id, specialization: member.specialization || 'General', experience: 0, schedule: {} } })
        }
      }
    })
    res.json({ data: { message: 'Setup completed successfully' } })
  } catch (error) { next(error) }
})

export default router
