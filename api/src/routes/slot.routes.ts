import { Router } from 'express'
import { prisma } from '../config/database'

const router = Router()

// GET /slots/available?providerId=X&date=YYYY-MM-DD
router.get('/available', async (req, res, next) => {
  try {
    const { providerId, date } = req.query
    if (!providerId || !date) return res.status(400).json({ error: 'providerId and date are required' })
    const provider = await prisma.serviceProvider.findUnique({ where: { id: providerId as string } })
    if (!provider) return res.status(404).json({ error: 'Provider not found' })
    const schedule = (provider.schedule as any) || {}
    const dayIndex = new Date(date as string).getDay()
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const daySchedule = schedule[dayNames[dayIndex]] || schedule[dayIndex] || null
    if (!daySchedule || daySchedule.closed) return res.json({ data: [] })
    const dateStart = new Date(date as string); dateStart.setHours(0,0,0,0)
    const dateEnd = new Date(dateStart); dateEnd.setDate(dateEnd.getDate()+1)
    const existingBookings = await prisma.booking.findMany({
      where: { providerId: providerId as string, date: { gte: dateStart, lt: dateEnd }, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
      select: { startTime: true, endTime: true }
    })
    const bookedSlots = new Set(existingBookings.map(b => b.startTime))
    const slotDuration = 30
    const slots: any[] = []
    const startH = parseInt((daySchedule.start || '09:00').split(':')[0])
    const startM = parseInt((daySchedule.start || '09:00').split(':')[1])
    const endH = parseInt((daySchedule.end || '18:00').split(':')[0])
    const endM = parseInt((daySchedule.end || '18:00').split(':')[1])
    let current = startH * 60 + startM
    const end = endH * 60 + endM
    while (current + slotDuration <= end) {
      const time = `${Math.floor(current/60).toString().padStart(2,'0')}:${(current%60).toString().padStart(2,'0')}`
      const endTime = `${Math.floor((current+slotDuration)/60).toString().padStart(2,'0')}:${((current+slotDuration)%60).toString().padStart(2,'0')}`
      slots.push({ startTime: time, endTime, available: !bookedSlots.has(time) })
      current += slotDuration
    }
    res.json({ data: slots })
  } catch (error) { next(error) }
})

// GET /slots/providers?serviceId=X&date=YYYY-MM-DD
router.get('/providers', async (req, res, next) => {
  try {
    const { serviceId, date } = req.query
    const where: any = { isAvailable: true }
    if (serviceId) { where.services = { some: { serviceId: serviceId as string } } }
    const providers = await prisma.serviceProvider.findMany({ where, include: { user: { select: { name: true, email: true } }, services: { include: { service: true } } } })
    res.json({ data: providers })
  } catch (error) { next(error) }
})

export default router
