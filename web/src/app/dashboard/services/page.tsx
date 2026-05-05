"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import type { Service } from "@/types"
import { useAuthStore } from "@/stores/auth-store"
import { Scissors, Plus, Clock, X } from "lucide-react"

function formatPrice(paise: number): string {
  return (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function ServicesPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    duration: 30,
    price: 0,
  })

  const { data, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.get("/services?limit=50")
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (serviceData: typeof formData) => {
      const res = await api.post("/services", {
        ...serviceData,
        price: serviceData.price * 100,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      setShowForm(false)
      setFormData({
        name: "",
        description: "",
        categoryId: "",
        duration: 30,
        price: 0,
      })
    },
  })

  const services: Service[] = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-sm text-muted-foreground">
            Manage your service catalog
          </p>
        </div>
        {user?.role === "ADMIN" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">New Service</h2>
            <button onClick={() => setShowForm(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate(formData)
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Category ID
              </label>
              <input
                type="text"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Duration (min)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Price (INR)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating..." : "Create Service"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading services...
        </div>
      ) : services.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Scissors className="mx-auto mb-2 h-12 w-12 opacity-50" />
          <p className="mt-4">No services yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{service.name}</h3>
                  {service.category && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {service.category.name}
                    </p>
                  )}
                </div>
                {!service.isActive && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                    Inactive
                  </span>
                )}
              </div>

              {service.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold">
                    ₹{formatPrice(service.price)}
                  </span>
                  {service.comparePrice &&
                    service.comparePrice > service.price && (
                      <span className="ml-2 text-sm text-muted-foreground line-through">
                        ₹{formatPrice(service.comparePrice)}
                      </span>
                    )}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-sm">{service.duration} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
