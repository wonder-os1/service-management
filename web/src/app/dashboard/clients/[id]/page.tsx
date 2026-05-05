'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function ClientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  const [tab, setTab] = useState<'overview' | 'bookings' | 'invoices' | 'reviews'>('overview')

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => fetch(`${API}/clients/${id}`, { headers }).then(r => r.json()),
  })

  const { data: bookings = [] } = useQuery({
    queryKey: ['client-bookings', id],
    queryFn: () => fetch(`${API}/bookings?clientId=${id}`, { headers }).then(r => r.json()),
    enabled: tab === 'bookings',
  })

  const { data: invoices = [] } = useQuery({
    queryKey: ['client-invoices', id],
    queryFn: () => fetch(`${API}/invoices?clientId=${id}`, { headers }).then(r => r.json()),
    enabled: tab === 'invoices',
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['client-reviews', id],
    queryFn: () => fetch(`${API}/reviews?clientId=${id}`, { headers }).then(r => r.json()),
    enabled: tab === 'reviews',
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const c = client as any

  if (!c) return <p className="text-gray-500 py-8 text-center">Client not found</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/clients')} className="text-purple-600 hover:underline text-sm">
          &larr; Clients
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600">
            {c.name?.[0] || c.user?.name?.[0] || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{c.name || c.user?.name}</h1>
            <p className="text-gray-500">{c.email || c.user?.email}</p>
            {c.phone && <p className="text-gray-500">{c.phone || c.user?.phone}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['overview', 'bookings', 'invoices', 'reviews'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === t ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span>{c.name || c.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span>{c.email || c.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span>{c.phone || c.user?.phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Member since</span>
                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{c._count?.bookings || c.totalBookings || 0}</p>
                <p className="text-xs text-gray-500">Total Bookings</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ₹{((c.totalSpent || 0) / 100).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{c._count?.reviews || c.totalReviews || 0}</p>
                <p className="text-xs text-gray-500">Reviews</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{c.avgRating ? `${c.avgRating.toFixed(1)}★` : '—'}</p>
                <p className="text-xs text-gray-500">Avg Rating</p>
              </div>
            </div>
          </div>
          {c.notes && (
            <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              <p className="text-sm">{c.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Bookings */}
      {tab === 'bookings' && (
        <div className="space-y-3">
          {(bookings as any[]).length === 0 ? (
            <p className="text-gray-500 py-8 text-center">No bookings found</p>
          ) : (
            (bookings as any[]).map((b: any) => (
              <div key={b.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{b.service?.name || 'Service'}</p>
                  <p className="text-sm text-gray-500">
                    {b.provider?.user?.name || b.provider?.name} &middot;{' '}
                    {new Date(b.date || b.startTime).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : b.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {b.status}
                  </span>
                  <p className="text-sm font-medium mt-1">₹{((b.amount || 0) / 100).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Invoices */}
      {tab === 'invoices' && (
        <div className="space-y-3">
          {(invoices as any[]).length === 0 ? (
            <p className="text-gray-500 py-8 text-center">No invoices found</p>
          ) : (
            (invoices as any[]).map((inv: any) => (
              <div key={inv.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium font-mono text-sm">{inv.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{((inv.amount || 0) / 100).toLocaleString()}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reviews */}
      {tab === 'reviews' && (
        <div className="space-y-3">
          {(reviews as any[]).length === 0 ? (
            <p className="text-gray-500 py-8 text-center">No reviews yet</p>
          ) : (
            (reviews as any[]).map((r: any) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">{r.service?.name}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
