import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatDate, formatTime, formatCurrency, getStatusColor } from '@/lib/utils'

const TABS = ['all', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

export default function BookingsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mobile-bookings', activeTab, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (activeTab !== 'all') params.set('status', activeTab)
      const { data } = await api.get(`/bookings?${params}`)
      return data
    },
  })

  const bookings = data?.data || []

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Status Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => { setActiveTab(tab); setPage(1) }}
              style={{
                paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
                backgroundColor: activeTab === tab ? '#7c3aed' : '#f1f5f9',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: activeTab === tab ? '#fff' : '#64748b', textTransform: 'capitalize' }}>
                {tab === 'all' ? 'All' : tab.replace('_', ' ').toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {isLoading && !bookings.length ? (
          <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 40 }} />
        ) : bookings.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
            <Text style={{ color: '#94a3b8', marginTop: 12 }}>No bookings found</Text>
          </View>
        ) : (
          bookings.map((booking: any) => (
            <TouchableOpacity
              key={booking.id}
              onPress={() => router.push(`/booking/${booking.id}`)}
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
                  {booking.items.map((i: any) => i.serviceName).join(', ')}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  )
}
