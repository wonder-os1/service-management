'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function ClientReviews() {
  const qc = useQueryClient()
  const token = typeof window !== 'undefined' ? localStorage.getItem('clientToken') : null
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ bookingId: '', rating: 5, comment: '' })

  const { data: reviews = [] } = useQuery({
    queryKey: ['client-reviews'],
    queryFn: () => fetch(`${API}/client/reviews`, { headers }).then(r => r.json()),
  })

  const { data: reviewableBookings = [] } = useQuery({
    queryKey: ['reviewable-bookings'],
    queryFn: () => fetch(`${API}/client/bookings?status=COMPLETED&reviewed=false`, { headers }).then(r => r.json()),
  })

  const submitReview = useMutation({
    mutationFn: (data: any) =>
      fetch(`${API}/client/reviews`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-reviews'] })
      qc.invalidateQueries({ queryKey: ['reviewable-bookings'] })
      setShowForm(false)
      setForm({ bookingId: '', rating: 5, comment: '' })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Reviews</h1>
        {(reviewableBookings as any[]).length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            {showForm ? 'Cancel' : 'Write Review'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Booking</label>
            <select
              className="w-full border rounded-lg px-4 py-2"
              value={form.bookingId}
              onChange={e => setForm(f => ({ ...f, bookingId: e.target.value }))}
            >
              <option value="">Select a completed booking</option>
              {(reviewableBookings as any[]).map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.service?.name} - {new Date(b.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setForm(f => ({ ...f, rating: star }))}
                  className={`text-2xl ${star <= form.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comment</label>
            <textarea
              className="w-full border rounded-lg px-4 py-2 h-24"
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Share your experience..."
            />
          </div>
          <button
            onClick={() => submitReview.mutate(form)}
            disabled={submitReview.isPending || !form.bookingId}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {(reviews as any[]).map((r: any) => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{r.service?.name || r.booking?.service?.name}</p>
              <span className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={star <= r.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              ))}
            </div>
            {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
          </div>
        ))}
        {(reviews as any[]).length === 0 && (
          <p className="text-center text-gray-500 py-8">No reviews yet</p>
        )}
      </div>
    </div>
  )
}
