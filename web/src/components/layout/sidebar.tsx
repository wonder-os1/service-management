'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Scissors, Users, UserCheck,
  Receipt, Star, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { isFeatureEnabled } from '@/lib/features'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
  feature?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'PROVIDER', 'STAFF', 'CLIENT'] },
  { label: 'Bookings', href: '/dashboard/bookings', icon: Calendar, roles: ['ADMIN', 'PROVIDER', 'STAFF', 'CLIENT'] },
  { label: 'Services', href: '/dashboard/services', icon: Scissors, roles: ['ADMIN', 'PROVIDER', 'STAFF'] },
  { label: 'Providers', href: '/dashboard/providers', icon: Users, roles: ['ADMIN', 'STAFF', 'CLIENT'] },
  { label: 'Clients', href: '/dashboard/clients', icon: UserCheck, roles: ['ADMIN', 'PROVIDER', 'STAFF'] },
  { label: 'Billing', href: '/dashboard/billing', icon: Receipt, roles: ['ADMIN', 'STAFF', 'CLIENT'] },
  { label: 'Reviews', href: '/dashboard/reviews', icon: Star, roles: ['ADMIN', 'PROVIDER', 'STAFF'] },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN'] },
]

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Service Hub'

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const visibleItems = navItems.filter((item) => {
    if (!user || !item.roles.includes(user.role)) return false
    if (item.feature && !isFeatureEnabled(item.feature as any)) return false
    return true
  })

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            S
          </div>
          <span className="font-semibold">{APP_NAME}</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">Powered by Wonder OS</p>
      </div>
    </aside>
  )
}
