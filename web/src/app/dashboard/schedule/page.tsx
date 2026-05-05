'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function SchedulePage() {
  const qc = useQueryClient()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => fetch(`${API}/schedules`, { headers }).then(r => r.json()),
  })

  const updateMut = useMutation({
    mutationFn: (data: any) =>
      fetch(`${API}/schedules`, { method: 'PUT', headers, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  })

  const getSchedule = (day: number) =>
    (schedules as any[]).find((s: any) => s.dayOfWeek === day) || {
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '17:00',
      isActive: false,
      slotDuration: 30,
    }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Schedule Management</h1>

      <div className="space-y-3">
        {DAYS.map((day, i) => {
          const s = getSchedule(i)
          return (
            <div key={day} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
              <button
                onClick={() => updateMut.mutate({ ...s, isActive: !s.isActive })}
                className={`w-10 h-6 rounded-full transition ${s.isActive ? 'bg-purple-600' : 'bg-gray-300'}`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    s.isActive ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className={`font-medium w-24 ${!s.isActive ? 'text-gray-400' : ''}`}>{day}</span>
              {s.isActive && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={s.startTime}
                    onChange={e => updateMut.mutate({ ...s, startTime: e.target.value })}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    value={s.endTime}
                    onChange={e => updateMut.mutate({ ...s, endTime: e.target.value })}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <select
                    value={s.slotDuration}
                    onChange={e => updateMut.mutate({ ...s, slotDuration: parseInt(e.target.value) })}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="15">15m</option>
                    <option value="30">30m</option>
                    <option value="45">45m</option>
                    <option value="60">60m</option>
                  </select>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
