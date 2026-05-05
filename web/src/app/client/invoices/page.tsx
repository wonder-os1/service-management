'use client'
import { useQuery } from '@tanstack/react-query'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function ClientInvoices() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('clientToken') : null
  const headers = { Authorization: `Bearer ${token}` }

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['client-invoices'],
    queryFn: () => fetch(`${API}/client/invoices`, { headers }).then(r => r.json()),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Invoices</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse h-20" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(invoices as any[]).map((inv: any) => (
            <div key={inv.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{inv.invoiceNumber || inv.id.slice(0, 8)}</p>
                <p className="text-sm text-gray-500">
                  {new Date(inv.createdAt).toLocaleDateString()} · {inv.service?.name || 'Service'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold">₹{((inv.amount || 0) / 100).toLocaleString()}</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {inv.status}
                </span>
              </div>
            </div>
          ))}
          {(invoices as any[]).length === 0 && (
            <p className="text-center text-gray-500 py-8">No invoices yet</p>
          )}
        </div>
      )}
    </div>
  )
}
