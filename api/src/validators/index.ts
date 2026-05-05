import { z } from 'zod'

// ---- Auth ----
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
  role: z.enum(['PROVIDER', 'STAFF', 'CLIENT']).default('CLIENT'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ---- Client ----
export const createClientSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  notes: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial()

// ---- Service Provider ----
export const createProviderSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  specialization: z.string().min(2),
  qualifications: z.array(z.string()).default([]),
  experience: z.number().int().min(0).default(0),
  bio: z.string().optional(),
  categoryId: z.string().optional(),
  schedule: z.record(z.any()).optional(),
})

export const updateProviderSchema = createProviderSchema.partial()

// ---- Service Category ----
export const createCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  icon: z.string().optional(),
})

// ---- Service ----
export const createServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string(),
  duration: z.number().int().min(15).default(60),
  price: z.number().int().min(0),
  comparePrice: z.number().int().min(0).optional(),
  image: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

// ---- Booking ----
export const createBookingSchema = z.object({
  clientId: z.string(),
  providerId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  type: z.string().default('walk-in'),
  notes: z.string().optional(),
  items: z.array(z.object({
    serviceId: z.string(),
    quantity: z.number().int().min(1).default(1),
  })).min(1),
})

export const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  notes: z.string().optional(),
  cancelReason: z.string().optional(),
})

// ---- Review ----
export const createReviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

export const replyReviewSchema = z.object({
  reply: z.string().min(1),
})

// ---- Billing ----
export const createInvoiceSchema = z.object({
  clientId: z.string(),
  bookingId: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().int().min(0),
  })).min(1),
  discount: z.number().int().min(0).default(0),
  notes: z.string().optional(),
})

export const createPaymentSchema = z.object({
  invoiceId: z.string(),
  method: z.enum(['razorpay', 'cash', 'card', 'upi']).default('razorpay'),
})

// ---- Settings ----
export const updateSettingSchema = z.object({
  key: z.string(),
  value: z.any(),
})

// ---- Pagination ----
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
