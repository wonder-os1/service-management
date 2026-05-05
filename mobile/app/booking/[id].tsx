import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatDate, formatTime, formatCurrency, getStatusColor } from '@/lib/utils'

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const { data } = await api.get(`/bookings/${id}`)
      return data.data
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/bookings/${id}`, { status: 'CANCELLED' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['mobile-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['mobile-dashboard'] })
      Alert.alert('Cancelled', 'Booking has been cancelled.')
    },
    onError: () => {
      Alert.alert('Error', 'Failed to cancel booking.')
    },
  })

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ]
    )
  }

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#7c3aed" /></View>
  if (!booking) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#94a3b8' }}>Not found</Text></View>

  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20 }}>
      {/* Status Badge */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: getStatusColor(booking.status) + '20' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: getStatusColor(booking.status) }}>
            {booking.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Client Info */}
      <InfoCard title="Client" icon="person-outline">
        <Text style={{ fontWeight: '600', fontSize: 16 }}>{booking.client?.user?.name}</Text>
        <Text style={{ color: '#64748b', marginTop: 2 }}>{booking.client?.user?.email}</Text>
        {booking.client?.user?.phone && <Text style={{ color: '#64748b' }}>{booking.client.user.phone}</Text>}
      </InfoCard>

      {/* Provider Info */}
      <InfoCard title="Service Provider" icon="briefcase-outline">
        <TouchableOpacity onPress={() => router.push(`/provider/${booking.providerId}`)}>
          <Text style={{ fontWeight: '600', fontSize: 16, color: '#7c3aed' }}>{booking.provider?.user?.name}</Text>
        </TouchableOpacity>
        <Text style={{ color: '#64748b', marginTop: 2 }}>{booking.provider?.specialization}</Text>
      </InfoCard>

      {/* Booking Details */}
      <InfoCard title="Booking Details" icon="information-circle-outline">
        <DetailRow label="Date" value={formatDate(booking.date)} />
        <DetailRow label="Time" value={`${formatTime(booking.startTime)} — ${formatTime(booking.endTime)}`} />
        <DetailRow label="Total" value={formatCurrency(booking.totalAmount)} />
        {booking.notes && <DetailRow label="Notes" value={booking.notes} />}
      </InfoCard>

      {/* Services */}
      {booking.items && booking.items.length > 0 && (
        <InfoCard title="Services" icon="grid-outline">
          {booking.items.map((item: any, idx: number) => (
            <View key={item.id || idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '500', color: '#0f172a' }}>{item.serviceName}</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>{item.duration} min</Text>
              </View>
              <Text style={{ fontWeight: '500', color: '#22c55e' }}>{formatCurrency(item.price)}</Text>
            </View>
          ))}
        </InfoCard>
      )}

      {/* Actions */}
      {canCancel && (
        <TouchableOpacity
          onPress={handleCancel}
          disabled={cancelMutation.isPending}
          style={{
            backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#fecaca', marginTop: 8,
          }}
        >
          <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
          <Text style={{ color: '#ef4444', fontWeight: '600' }}>
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

function InfoCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Ionicons name={icon as any} size={18} color="#7c3aed" />
        <Text style={{ fontWeight: '600', color: '#374151' }}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: '#64748b', fontSize: 14 }}>{label}</Text>
      <Text style={{ fontWeight: '500', color: '#0f172a', fontSize: 14, maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  )
}
