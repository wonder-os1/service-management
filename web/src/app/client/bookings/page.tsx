'use client'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function ClientBookings() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('clientToken') : null
  const headers = { Authorization: `Bearer ${token}` }
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['client-bookings', tab],
    queryFn: () =>
      fetch(`${API}/client/bookings?status=${tab === 'upcoming' ? 'CONFIRMED' : 'COMPLETED'}`, { headers }).then(r => r.json()),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Bookings</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'upcoming' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'past' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}
        >
          Past
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(bookings as any[]).map((b: any) => (
            <div key={b.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{b.service?.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(b.date).toLocaleDateString()} at {b.time} · {b.provider?.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-purple-600">₹{((b.amount || 0) / 100).toLocaleString()}</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    b.status === 'CONFIRMED'
                      ? 'bg-purple-100 text-purple-700'
                      : b.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
          {(bookings as any[]).length === 0 && (
            <p className="text-center text-gray-500 py-8">No {tab} bookings</p>
          )}
        </div>
      )}
    </div>
  )
}
