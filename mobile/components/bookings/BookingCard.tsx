import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatDate, formatTime, formatCurrency, getStatusColor } from '@/lib/utils'
import type { Booking } from '@/types'

interface BookingCardProps {
  booking: Booking
  onPress: () => void
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 15 }}>
            {booking.client?.user?.name || 'Client'}
          </Text>
          <Text style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
            {booking.provider?.user?.name}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: getStatusColor(booking.status) + '20' }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: getStatusColor(booking.status) }}>
            {booking.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
          <Text style={{ fontSize: 13, color: '#64748b' }}>{formatDate(booking.date)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={14} color="#94a3b8" />
          <Text style={{ fontSize: 13, color: '#64748b' }}>{formatTime(booking.startTime)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="cash-outline" size={14} color="#94a3b8" />
          <Text style={{ fontSize: 13, color: '#64748b' }}>{formatCurrency(booking.totalAmount)}</Text>
        </View>
      </View>

      {booking.items && booking.items.length > 0 && (
        <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          {booking.items.map((i) => i.serviceName).join(', ')}
        </Text>
      )}
    </TouchableOpacity>
  )
}
