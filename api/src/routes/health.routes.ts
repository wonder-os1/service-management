import { Router } from 'express'
import { prisma } from '../config/database'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() })
  } catch {
    res.status(503).json({ success: false, status: 'unhealthy' })
  }
})

export { router as healthRoutes }
