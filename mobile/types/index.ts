export type UserRole = 'ADMIN' | 'PROVIDER' | 'STAFF' | 'CLIENT'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  client?: Client
  provider?: ServiceProvider
}

export interface Client {
  id: string
  userId: string
  loyaltyPoints: number
  loyaltyTier: string
  visitCount: number
  totalSpent: number
  dateOfBirth?: string
  gender?: string
  address?: string
  notes?: string
  user?: User
  createdAt: string
}

export interface ServiceProvider {
  id: string
  userId: string
  specialization: string
  qualifications: string[]
  experience: number
  rating: number
  reviewCount: number
  isAvailable: boolean
  schedule?: Record<string, any>
  bio?: string
  user?: User
}

export interface ServiceCategory {
  id: string
  name: string
  description?: string
  icon?: string
  services?: Service[]
}

export interface Service {
  id: string
  name: string
  description?: string
  categoryId: string
  basePrice: number
  duration: number
  isActive: boolean
  category?: ServiceCategory
}

export interface Booking {
  id: string
  clientId: string
  providerId: string
  date: string
  startTime: string
  endTime: string
  status: string
  notes?: string
  totalAmount: number
  client?: Client
  provider?: ServiceProvider
  items?: BookingItem[]
  createdAt: string
}

export interface BookingItem {
  id: string
  bookingId: string
  serviceId: string
  serviceName: string
  price: number
  duration: number
  service?: Service
}

export interface Review {
  id: string
  clientId: string
  providerId: string
  bookingId: string
  rating: number
  comment?: string
  status: string
  client?: Client
  provider?: ServiceProvider
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  bookingId?: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  client?: Client
  createdAt: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {
  totalClients: number
  totalProviders: number
  todayBookings: number
  todayCompleted: number
  monthlyRevenue: number
  pendingBookings: number
  recentBookings: Booking[]
}

export interface TimeSlot {
  start: string
  end: string
  available: boolean
}
