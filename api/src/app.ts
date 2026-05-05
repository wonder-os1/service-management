import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import { errorHandler } from './middleware/error-handler'
import { healthRoutes } from './routes/health.routes'
import { authRoutes } from './routes/auth.routes'
import { clientRoutes } from './routes/client.routes'
import { providerRoutes } from './routes/provider.routes'
import { serviceCategoryRoutes } from './routes/service-category.routes'
import { serviceRoutes } from './routes/service.routes'
import { bookingRoutes } from './routes/booking.routes'
import { billingRoutes } from './routes/billing.routes'
import { reviewRoutes } from './routes/review.routes'
import { loyaltyRoutes } from './routes/loyalty.routes'
import { dashboardRoutes } from './routes/dashboard.routes'
import { notificationRoutes } from './routes/notification.routes'
import { settingsRoutes } from './routes/settings.routes'
import slotRoutes from './routes/slot.routes'
import publicRoutes from './routes/public.routes'
import staffRoutes from './routes/staff.routes'
import setupRoutes from './routes/setup.routes'

const app = express()

// Security
app.use(helmet())
app.use(cors({
  origin: env.APP_URL,
  credentials: true,
}))

// Parsing
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Routes
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/providers', providerRoutes)
app.use('/api/service-categories', serviceCategoryRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/loyalty', loyaltyRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/slots', slotRoutes)
import { publicLimiter } from './middleware/rate-limiter'
app.use('/api/public', publicLimiter, publicRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/setup', setupRoutes)

// Error handler (must be last)
app.use(errorHandler)

export { app }
