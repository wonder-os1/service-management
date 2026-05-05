'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  { label: 'Dashboard', href: '/client', icon: '🏠' },
  { label: 'Bookings', href: '/client/bookings', icon: '📅' },
  { label: 'Invoices', href: '/client/invoices', icon: '💳' },
  { label: 'Reviews', href: '/client/reviews', icon: '⭐' },
  { label: 'Profile', href: '/client/profile', icon: '👤' },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [name, setName] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('clientToken')
    if (!token) {
      router.push('/login?role=client')
      return
    }
    const stored = localStorage.getItem('clientName')
    if (stored) setName(stored)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold text-purple-600">My Portal</h2>
          {name && <p className="text-sm text-gray-500 mt-1">{name}</p>}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                pathname === item.href
                  ? 'bg-purple-50 text-purple-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={() => {
              localStorage.removeItem('clientToken')
              localStorage.removeItem('clientName')
              router.push('/login')
            }}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
