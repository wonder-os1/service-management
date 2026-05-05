'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function ClientProfile() {
  const qc = useQueryClient()
  const token = typeof window !== 'undefined' ? localStorage.getItem('clientToken') : null
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const { data: profile } = useQuery({
    queryKey: ['client-profile'],
    queryFn: () => fetch(`${API}/client/profile`, { headers }).then(r => r.json()),
  })

  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || '', email: profile.email || '', phone: profile.phone || '' })
    }
  }, [profile])

  const updateMut = useMutation({
    mutationFn: (data: any) =>
      fetch(`${API}/client/profile`, { method: 'PATCH', headers, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-profile'] }),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="w-full border rounded-lg px-4 py-2"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full border rounded-lg px-4 py-2"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              className="w-full border rounded-lg px-4 py-2"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <button
            onClick={() => updateMut.mutate(form)}
            disabled={updateMut.isPending}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {updateMut.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          {updateMut.isSuccess && (
            <p className="text-sm text-green-600">Profile updated successfully</p>
          )}
        </div>
      </div>
    </div>
  )
}
