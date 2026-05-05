"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Star, MessageSquare } from "lucide-react"

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const reviewStatusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
}

export default function ReviewsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" })
      if (statusFilter) params.set("status", statusFilter)
      const res = await api.get(`/reviews?${params}`)
      return res.data
    },
  })

  const replyMutation = useMutation({
    mutationFn: async ({
      reviewId,
      reply,
    }: {
      reviewId: string
      reply: string
    }) => {
      const res = await api.patch(`/reviews/${reviewId}/reply`, { reply })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] })
      setReplyingTo(null)
      setReplyText("")
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews: any[] = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Client feedback and ratings
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-medium">
                      {review.rating}/5
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        reviewStatusColors[review.status] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {review.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    by{" "}
                    <span className="font-medium text-foreground">
                      {review.client?.user?.name || review.client?.name || "Client"}
                    </span>
                    {" for "}
                    <span className="font-medium text-foreground">
                      {review.provider?.user?.name || review.provider?.name || "Provider"}
                    </span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {review.createdAt ? formatDate(review.createdAt) : ""}
                </p>
              </div>

              {review.comment && (
                <p className="mt-3 text-sm">{review.comment}</p>
              )}

              {review.reply && (
                <div className="mt-3 rounded-lg bg-muted p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Provider Reply
                  </p>
                  <p className="text-sm">{review.reply}</p>
                </div>
              )}

              {!review.reply && (
                <>
                  {replyingTo === review.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            replyMutation.mutate({
                              reviewId: review.id,
                              reply: replyText,
                            })
                          }
                          disabled={
                            !replyText.trim() || replyMutation.isPending
                          }
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {replyMutation.isPending
                            ? "Sending..."
                            : "Submit Reply"}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyText("")
                          }}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Reply
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
