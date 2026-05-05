'use client'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

const defaultSteps = [
  { key: 'business', label: 'Business Profile', completed: false },
  { key: 'services', label: 'Add Services', completed: false },
  { key: 'categories', label: 'Categories', completed: false },
  { key: 'providers', label: 'Add Providers', completed: false },
  { key: 'schedule', label: 'Set Schedule', completed: false },
]

const routes: Record<string, string> = {
  business: '/dashboard/settings',
  services: '/dashboard/services',
  categories: '/dashboard/services',
  providers: '/dashboard/staff',
  schedule: '/dashboard/schedule',
}

export default function SetupPage() {
  const router = useRouter()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const { data: status } = useQuery({
    queryKey: ['setup'],
    queryFn: () =>
      fetch(`${API}/setup/status`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
  })

  const steps = status?.steps || defaultSteps

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Set up your business</h1>
        <p className="text-gray-500">Complete these steps to start accepting bookings</p>
        <p className="text-sm text-purple-600 mt-1">
          {status?.completedCount || 0}/{status?.totalSteps || 5} steps completed
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        {steps.map((s: any, i: number) => (
          <div
            key={s.key}
            className={`flex items-center justify-between p-4 rounded-xl border ${
              s.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-purple-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s.completed ? 'bg-green-600 text-white' : 'bg-gray-200'
                }`}
              >
                {s.completed ? '✓' : i + 1}
              </div>
              <span className={`font-medium ${s.completed ? 'text-green-700' : ''}`}>{s.label}</span>
            </div>
            <button
              onClick={() => router.push(routes[s.key] || '/dashboard')}
              className={`px-4 py-1.5 rounded-lg text-sm ${
                s.completed
                  ? 'text-green-600 hover:bg-green-100'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {s.completed ? 'Edit' : 'Set up'}
            </button>
          </div>
        ))}
      </div>

      {status?.isComplete && (
        <div className="text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-purple-700"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  )
}
