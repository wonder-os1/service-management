'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function ClientDashboard() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('clientToken') : null
  const headers = { Authorization: `Bearer ${token}` }

  const { data: stats } = useQuery({
    queryKey: ['client-stats'],
    queryFn: () => fetch(`${API}/client/stats`, { headers }).then(r => r.json()),
  })

  const { data: upcomingBookings = [] } = useQuery({
    queryKey: ['client-upcoming'],
    queryFn: () => fetch(`${API}/client/bookings?status=CONFIRMED&limit=3`, { headers }).then(r => r.json()),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Bookings</p>
          <p className="text-2xl font-bold">{stats?.totalBookings || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Upcoming</p>
          <p className="text-2xl font-bold text-purple-600">{stats?.upcomingCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats?.completedCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold">
            ₹{((stats?.totalSpent || 0) / 100).toLocaleString()}
          </p>
        </div>
      </div>

      {(upcomingBookings as any[]).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Bookings</h2>
          <div className="space-y-3">
            {(upcomingBookings as any[]).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{b.service?.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(b.date).toLocaleDateString()} at {b.time} · {b.provider?.name}
                  </p>
                </div>
                <span className="text-sm font-medium text-purple-600">
                  ₹{((b.amount || 0) / 100).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <Link href="/client/bookings" className="text-sm text-purple-600 hover:underline mt-3 inline-block">
            View all bookings →
          </Link>
        </div>
      )}
    </div>
  )
}
