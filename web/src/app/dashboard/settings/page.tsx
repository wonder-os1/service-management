"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import api from "@/lib/api"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [saved, setSaved] = useState(false)

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get("/settings")
      return res.data.data ?? res.data
    },
  })

  useEffect(() => {
    if (data) {
      setBusinessName(
        data.businessName || data["business.name"] || ""
      )
      setPhone(data.phone || data["business.phone"] || "")
      setEmail(data.email || data["business.email"] || "")
      setAddress(data.address || data["business.address"] || "")
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async (settings: {
      businessName: string
      phone: string
      email: string
      address: string
    }) => {
      await api.put("/settings", settings)
    },
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    saveMutation.mutate({ businessName, phone, email, address })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your business settings
        </p>
      </div>

      <div className="max-w-2xl rounded-xl border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Business Information</h2>
            <p className="text-sm text-muted-foreground">
              Update your business details
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your Business Name"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="business@example.com"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Business Street, City, State, PIN"
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </button>
            {saved && (
              <span className="text-sm text-green-600">
                Settings saved successfully!
              </span>
            )}
            {saveMutation.isError && (
              <span className="text-sm text-destructive">
                Failed to save. Please try again.
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
