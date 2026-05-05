"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Star, Users } from "lucide-react"

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${
            n <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-slate-200"
          }`}
        />
      ))}
    </div>
  )
}

export default function ProvidersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await api.get("/providers?limit=50")
      return res.data
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const providers: any[] = data?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Service Providers</h1>
        <p className="text-sm text-muted-foreground">
          View and manage service providers
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading providers...
        </div>
      ) : providers.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No providers yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {provider.user?.name?.[0] || "P"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{provider.user?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {provider.specialization}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={provider.rating || 0} />
                  <span className="text-sm font-medium">
                    {provider.rating?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({provider.totalReviews} reviews)
                </span>
              </div>

              <div className="mt-2 text-sm text-muted-foreground">
                {provider.experience} yrs experience
              </div>

              {provider.category && (
                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {provider.category?.name || provider.category}
                  </span>
                </div>
              )}

              {provider.bio && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {provider.bio}
                </p>
              )}

              {provider.qualifications && provider.qualifications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {provider.qualifications.map(
                    (q: string, i: number) => (
                      <span
                        key={i}
                        className="rounded bg-muted px-2 py-0.5 text-xs"
                      >
                        {q}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
