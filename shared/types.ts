/** Shared types used across web, api, and mobile layers */

export interface Service {
  id: string
  name: string
  description: string
  duration: number // minutes
  price: number
  category: string
  imageUrl?: string
  isActive: boolean
}

export interface Booking {
  id: string
  serviceId: string
  serviceName: string
  providerId: string
  providerName: string
  clientId: string
  clientName: string
  date: string
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  amount: number
  notes?: string
}

export interface Provider {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  services: string[]
  availability: WeeklySchedule
  isActive: boolean
  rating: number
  totalBookings: number
}

export interface WeeklySchedule {
  [day: string]: { start: string; end: string; available: boolean }
}

export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  totalBookings: number
  totalSpent: number
  loyaltyPoints: number
  lastVisit?: string
}

export interface Review {
  id: string
  bookingId: string
  clientId: string
  clientName: string
  providerId: string
  rating: number
  comment: string
  createdAt: string
}

export interface FeatureFlags {
  onlineBooking: boolean
  serviceCatalog: boolean
  staffManagement: boolean
  customerReviews: boolean
  loyaltyProgram: boolean
  inventoryManagement: boolean
}
