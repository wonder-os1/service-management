'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function StaffPage() {
  const qc = useQueryClient()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'STAFF', password: '' })

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => fetch(`${API}/staff`, { headers }).then(r => r.json()),
  })

  const createMut = useMutation({
    mutationFn: (data: any) =>
      fetch(`${API}/staff`, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      setShowForm(false)
      setForm({ name: '', email: '', phone: '', role: 'STAFF', password: '' })
    },
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`${API}/staff/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ isActive }) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-gray-500">{(staff as any[]).length} members</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? 'Cancel' : 'Add Staff'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input className="w-full border rounded-lg px-4 py-2" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input className="w-full border rounded-lg px-4 py-2" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input className="w-full border rounded-lg px-4 py-2" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select className="w-full border rounded-lg px-4 py-2" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="STAFF">Staff</option>
                <option value="PROVIDER">Provider</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => createMut.mutate(form)}
            disabled={createMut.isPending}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {createMut.isPending ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {(staff as any[]).map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                {s.name?.[0]}
              </div>
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-gray-500">{s.email} · {s.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {s.isActive !== false ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => toggleMut.mutate({ id: s.id, isActive: s.isActive === false })}
                className="text-sm text-purple-600 hover:underline"
              >
                {s.isActive !== false ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
