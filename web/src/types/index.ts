export type UserRole = "ADMIN" | "PROVIDER" | "STAFF" | "CLIENT"

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatar?: string
  isActive?: boolean
  lastLoginAt?: string
  createdAt?: string
  updatedAt?: string
  client?: Client
  provider?: ServiceProvider
}

export interface Client {
  id: string
  userId: string
  gender?: string
  address?: string
  city?: string
  loyaltyTier: string
  loyaltyPoints: number
  totalSpent: number
  visitCount: number
  notes?: string
  user?: User
  _count?: { bookings: number; reviews: number; invoices: number }
}

export interface ServiceProvider {
  id: string
  userId: string
  specialization: string
  qualifications?: string[]
  experience: number
  bio?: string
  rating: number
  totalReviews: number
  schedule?: Record<string, unknown>
  category?: string
  categoryId?: string
  isAvailable?: boolean
  user?: User
  _count?: { bookings: number; reviews: number }
}

export interface ServiceCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  isActive: boolean
  _count?: { services: number; providers: number }
}

export interface Service {
  id: string
  name: string
  slug: string
  description?: string
  categoryId: string
  duration: number
  price: number
  comparePrice?: number
  isActive: boolean
  image?: string
  category?: ServiceCategory
}

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"

export interface BookingItem {
  id: string
  serviceId: string
  quantity: number
  price: number
  duration: number
  service?: Service
}

export interface Booking {
  id: string
  clientId: string
  providerId: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  type?: string
  totalAmount: number
  notes?: string
  cancelReason?: string
  createdAt?: string
  updatedAt?: string
  client?: Client | User
  provider?: ServiceProvider | User
  items?: BookingItem[]
  invoice?: Invoice
  review?: Review
}

export interface Review {
  id: string
  clientId: string
  providerId: string
  bookingId?: string
  rating: number
  comment?: string
  status: string
  reply?: string
  repliedAt?: string
  createdAt?: string
  updatedAt?: string
  client?: Client | User
  provider?: ServiceProvider | User
  booking?: Booking
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  bookingId?: string
  amount: number
  tax: number
  discount: number
  totalAmount: number
  subtotal?: number
  total?: number
  items?: InvoiceLineItem[]
  status: string
  dueDate?: string
  paidAt?: string
  createdAt?: string
  updatedAt?: string
  client?: Client | User
  booking?: Booking
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  method: string
  transactionId?: string
  status: string
  paidAt?: string
  createdAt?: string
  invoice?: Invoice
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {
  totalClients: number
  todayBookings: number
  monthRevenue: number
  pendingBookings: number
  totalProviders?: number
  totalBookings?: number
  recentBookings: Booking[]
  topProviders?: ServiceProvider[]
}

export interface PaginatedResponse<T> {
  success?: boolean
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
