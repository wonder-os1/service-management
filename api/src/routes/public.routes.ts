import { Router } from 'express'
import { prisma } from '../config/database'

const router = Router()

router.get('/services', async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({ where: { isActive: true }, include: { category: true }, orderBy: { name: 'asc' } })
    res.json({ data: services })
  } catch (error) { next(error) }
})

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.serviceCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, include: { _count: { select: { services: true } } } })
    res.json({ data: categories })
  } catch (error) { next(error) }
})

router.get('/providers', async (req, res, next) => {
  try {
    const providers = await prisma.serviceProvider.findMany({ where: { isAvailable: true }, include: { user: { select: { name: true, email: true, phone: true } }, services: { include: { service: true } } }, orderBy: { rating: 'desc' } })
    res.json({ data: providers })
  } catch (error) { next(error) }
})

router.get('/providers/:id', async (req, res, next) => {
  try {
    const provider = await prisma.serviceProvider.findUnique({ where: { id: req.params.id }, include: { user: { select: { name: true, email: true, phone: true } }, services: { include: { service: true } } } })
    if (\!provider) return res.status(404).json({ error: 'Provider not found' })
    res.json({ data: provider })
  } catch (error) { next(error) }
})

router.post('/book', async (req, res, next) => {
  try {
    const { services: serviceItems, date, startTime, providerId, clientName, clientPhone, clientEmail, notes } = req.body
    let client = await prisma.client.findFirst({ where: { user: { phone: clientPhone } }, include: { user: true } })
    if (\!client) {
      const { hashPassword, generateSecurePassword } = require('../utils/password')
      const user = await prisma.user.create({ data: { name: clientName, phone: clientPhone, email: clientEmail || clientPhone + '@client.local', password: await hashPassword(generateSecurePassword()), role: 'CLIENT' } })
      client = await prisma.client.create({ data: { userId: user.id }, include: { user: true } })
    }
    let totalAmount = 0; let totalDuration = 0
    const items: any[] = []
    if (serviceItems && serviceItems.length > 0) {
      for (const si of serviceItems) {
        const service = await prisma.service.findUnique({ where: { id: si.serviceId } })
        if (service) { totalAmount += service.price; totalDuration += service.duration; items.push({ serviceId: service.id, serviceName: service.name, price: service.price, duration: service.duration, quantity: 1 }) }
      }
    }
    const [h, m] = startTime.split(':').map(Number)
    const endMinutes = h * 60 + m + totalDuration
    const endTime = String(Math.floor(endMinutes/60)).padStart(2,'0') + ':' + String(endMinutes%60).padStart(2,'0')
    const booking = await prisma.booking.create({
      data: { clientId: client.id, providerId, date: new Date(date), startTime, endTime, totalAmount, notes, status: 'PENDING', items: { create: items } },
      include: { client: { include: { user: true } }, provider: { include: { user: true } }, items: true }
    })
    res.status(201).json({ data: booking })
  } catch (error) { next(error) }
})

export default router
