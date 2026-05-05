"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Calendar, Users, IndianRupee, Clock } from "lucide-react"
import type { DashboardStats } from "@/types"

function formatPrice(paise: number): string {
  return (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard/stats")
      return res.data.data ?? res.data
    },
  })

  const stats = [
    {
      label: "Total Clients",
      value: data?.totalClients ?? 0,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Today's Bookings",
      value: data?.todayBookings ?? 0,
      icon: Calendar,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Month Revenue",
      value: `₹${formatPrice(data?.monthRevenue ?? 0)}`,
      icon: IndianRupee,
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Pending Bookings",
      value: data?.pendingBookings ?? 0,
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? "--" : stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">Provider</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentBookings?.length ? (
                data.recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b last:border-0">
                    <td className="px-6 py-3">{formatDate(booking.date)}</td>
                    <td className="px-6 py-3">{booking.startTime}</td>
                    <td className="px-6 py-3">
                      {(booking.client as Record<string, unknown>)?.name as string ??
                        ((booking.client as Record<string, Record<string, unknown>>)?.user?.name as string) ??
                        "--"}
                    </td>
                    <td className="px-6 py-3">
                      {(booking.provider as Record<string, unknown>)?.name as string ??
                        ((booking.provider as Record<string, Record<string, unknown>>)?.user?.name as string) ??
                        "--"}
                    </td>
                    <td className="px-6 py-3">
                      ₹{formatPrice(booking.totalAmount)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          booking.status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : booking.status === "COMPLETED"
                                ? "bg-blue-100 text-blue-700"
                                : booking.status === "IN_PROGRESS"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : booking.status === "CANCELLED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    {isLoading ? "Loading..." : "No recent bookings"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
