'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

type Step = 'service' | 'provider' | 'slot' | 'details' | 'confirmation'

export default function PublicBookingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('service')
  const [serviceId, setServiceId] = useState('')
  const [providerId, setProviderId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [bookingResult, setBookingResult] = useState<any>(null)

  const { data: services = [] } = useQuery({
    queryKey: ['public-services'],
    queryFn: () => fetch(`${API}/public/services`).then(r => r.json()),
  })

  const { data: providers = [] } = useQuery({
    queryKey: ['public-providers', serviceId],
    queryFn: () => fetch(`${API}/public/providers?serviceId=${serviceId}`).then(r => r.json()),
    enabled: !!serviceId,
  })

  const { data: slots = [] } = useQuery({
    queryKey: ['slots', providerId, selectedDate],
    queryFn: () =>
      fetch(`${API}/slots/available?providerId=${providerId}&date=${selectedDate}`).then(r => r.json()),
    enabled: !!providerId && !!selectedDate,
  })

  const bookMut = useMutation({
    mutationFn: (data: any) =>
      fetch(`${API}/public/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: (data) => {
      setBookingResult(data)
      setStep('confirmation')
    },
  })

  const selectedService = (services as any[]).find((s: any) => s.id === serviceId)
  const selectedProvider = (providers as any[]).find((p: any) => p.id === providerId)

  const handleBook = () => {
    bookMut.mutate({
      serviceId,
      providerId,
      date: selectedDate,
      timeSlot: selectedSlot,
      clientName: form.name,
      clientPhone: form.phone,
      clientEmail: form.email,
      notes: form.notes,
    })
  }

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-purple-600">Book a Service</h1>
          <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-700">
            Back
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex gap-2 mb-8">
          {(['service', 'provider', 'slot', 'details'] as Step[]).map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-2 rounded-full ${
                  ['service', 'provider', 'slot', 'details', 'confirmation'].indexOf(step) >= i
                    ? 'bg-purple-600'
                    : 'bg-gray-200'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1 capitalize">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pb-12">
        {/* Step 1: Service */}
        {step === 'service' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select a Service</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {(services as any[]).map((svc: any) => (
                <button
                  key={svc.id}
                  onClick={() => {
                    setServiceId(svc.id)
                    setStep('provider')
                  }}
                  className={`text-left p-4 rounded-xl border-2 transition hover:border-purple-500 ${
                    serviceId === svc.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="font-medium">{svc.name}</p>
                  {svc.description && <p className="text-sm text-gray-500 mt-1">{svc.description}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-purple-600 font-semibold">
                      ₹{((svc.price || 0) / 100).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">{svc.duration || 30} min</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Provider */}
        {step === 'provider' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Select a Provider</h2>
              <button onClick={() => setStep('service')} className="text-sm text-purple-600">Back</button>
            </div>
            {(providers as any[]).length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No providers available for this service</p>
            ) : (
              <div className="space-y-3">
                {(providers as any[]).map((prov: any) => (
                  <button
                    key={prov.id}
                    onClick={() => {
                      setProviderId(prov.id)
                      setStep('slot')
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition hover:border-purple-500 flex items-center gap-4 ${
                      providerId === prov.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                      {prov.user?.name?.[0] || prov.name?.[0] || 'P'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{prov.user?.name || prov.name}</p>
                      {prov.avgRating && (
                        <p className="text-sm text-gray-500">
                          {'★'.repeat(Math.round(prov.avgRating))} ({prov.reviewCount || 0} reviews)
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 'slot' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Select Date & Time</h2>
              <button onClick={() => setStep('provider')} className="text-sm text-purple-600">Back</button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Select Date</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map(d => {
                  const dateObj = new Date(d + 'T00:00:00')
                  const isToday = d === new Date().toISOString().split('T')[0]
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`flex-shrink-0 w-16 p-2 rounded-xl text-center border-2 transition ${
                        selectedDate === d
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      <p className="text-xs text-gray-500">
                        {dateObj.toLocaleDateString('en', { weekday: 'short' })}
                      </p>
                      <p className="text-lg font-bold">{dateObj.getDate()}</p>
                      <p className="text-xs text-gray-500">
                        {isToday ? 'Today' : dateObj.toLocaleDateString('en', { month: 'short' })}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Available Slots</h3>
                {(slots as any[]).length === 0 ? (
                  <p className="text-gray-500 py-4">No slots available for this date</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {(slots as any[]).map((slot: any) => {
                      const time = typeof slot === 'string' ? slot : slot.time || slot.startTime
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedSlot(time)}
                          className={`py-2 px-3 rounded-lg text-sm border-2 transition ${
                            selectedSlot === time
                              ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                              : 'border-gray-200 bg-white hover:border-purple-300'
                          }`}
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <button
                onClick={() => setStep('details')}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700"
              >
                Continue
              </button>
            )}
          </div>
        )}

        {/* Step 4: Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Details</h2>
              <button onClick={() => setStep('slot')} className="text-sm text-purple-600">Back</button>
            </div>
            <div className="bg-white rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  className="w-full border rounded-lg px-4 py-2.5"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  className="w-full border rounded-lg px-4 py-2.5"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  className="w-full border rounded-lg px-4 py-2.5"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full border rounded-lg px-4 py-2.5"
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any specific requirements..."
                />
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 space-y-2">
              <h3 className="font-medium text-purple-900">Booking Summary</h3>
              <div className="text-sm text-purple-800 space-y-1">
                <p>Service: {selectedService?.name}</p>
                <p>Provider: {selectedProvider?.user?.name || selectedProvider?.name}</p>
                <p>Date: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>Time: {selectedSlot}</p>
                <p className="font-semibold">
                  Amount: ₹{((selectedService?.price || 0) / 100).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={handleBook}
              disabled={!form.name || !form.phone || bookMut.isPending}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {bookMut.isPending ? 'Booking...' : 'Confirm Booking'}
            </button>
            {bookMut.isError && (
              <p className="text-red-600 text-sm text-center">Failed to book. Please try again.</p>
            )}
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 'confirmation' && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl text-green-600">✓</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-700">Booking Confirmed!</h2>
              <p className="text-gray-500 mt-2">Your booking has been successfully placed.</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-left max-w-md mx-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service</span>
                <span className="font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">{selectedProvider?.user?.name || selectedProvider?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{selectedDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">{selectedSlot}</span>
              </div>
              {bookingResult?.id && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-mono text-xs">{bookingResult.id}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push('/')} className="px-6 py-2 border rounded-lg text-sm hover:bg-gray-50">
                Back to Home
              </button>
              <button
                onClick={() => {
                  setStep('service')
                  setServiceId('')
                  setProviderId('')
                  setSelectedDate('')
                  setSelectedSlot('')
                  setForm({ name: '', phone: '', email: '', notes: '' })
                  setBookingResult(null)
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
              >
                Book Another
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
