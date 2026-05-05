"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { UserCheck } from "lucide-react"

function formatPrice(paise: number): string {
  return (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const loyaltyTierColors: Record<string, string> = {
  BRONZE: "bg-orange-100 text-orange-700",
  SILVER: "bg-slate-100 text-slate-700",
  GOLD: "bg-amber-100 text-amber-700",
  PLATINUM: "bg-purple-100 text-purple-700",
}

export default function ClientsPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["clients", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      const res = await api.get(`/clients?${params}`)
      return res.data
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clients: any[] = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your client base
          </p>
        </div>
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-64 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">Visits</th>
              <th className="px-6 py-3 font-medium">Loyalty Tier</th>
              <th className="px-6 py-3 font-medium">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-muted-foreground"
                >
                  Loading clients...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-muted-foreground"
                >
                  <UserCheck className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  No clients found
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b last:border-0 hover:bg-muted/50"
                >
                  <td className="px-6 py-3 font-medium">
                    {client.user?.name || "--"}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {client.user?.email || "--"}
                  </td>
                  <td className="px-6 py-3">
                    {client.user?.phone || "--"}
                  </td>
                  <td className="px-6 py-3">{client.visitCount}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        loyaltyTierColors[client.loyaltyTier] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {client.loyaltyTier}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    ₹{formatPrice(client.totalSpent)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
