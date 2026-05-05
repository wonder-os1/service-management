export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: '#eab308',
    CONFIRMED: '#3b82f6',
    IN_PROGRESS: '#8b5cf6',
    COMPLETED: '#22c55e',
    CANCELLED: '#ef4444',
    NO_SHOW: '#6b7280',
    PAID: '#22c55e',
    PARTIAL: '#f59e0b',
    OVERDUE: '#ef4444',
    APPROVED: '#22c55e',
    REJECTED: '#ef4444',
  }
  return colors[status] || '#6b7280'
}

export function getLoyaltyTierColor(tier: string): string {
  const colors: Record<string, string> = {
    BRONZE: '#cd7f32',
    SILVER: '#94a3b8',
    GOLD: '#eab308',
    PLATINUM: '#a78bfa',
  }
  return colors[tier] || '#6b7280'
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
}
