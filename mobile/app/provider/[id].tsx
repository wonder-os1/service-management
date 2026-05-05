import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { getInitials, formatCurrency } from '@/lib/utils'
import type { ServiceProvider } from '@/types'

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: provider, isLoading } = useQuery<ServiceProvider>({
    queryKey: ['provider', id],
    queryFn: async () => {
      const { data } = await api.get(`/providers/${id}`)
      return data.data
    },
  })

  const { data: reviews } = useQuery({
    queryKey: ['provider-reviews', id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews?providerId=${id}&status=APPROVED&limit=10`)
      return data.data
    },
    enabled: !!id,
  })

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#7c3aed" /></View>
  if (!provider) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#94a3b8' }}>Provider not found</Text></View>

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20 }}>
      {/* Avatar & Name */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
            {provider.user ? getInitials(provider.user.name) : 'P'}
          </Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginTop: 12 }}>{provider.user?.name}</Text>
        <Text style={{ color: '#64748b', marginTop: 2 }}>{provider.specialization}</Text>

        {/* Rating */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <Ionicons name="star" size={18} color="#f59e0b" />
          <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 16 }}>{provider.rating.toFixed(1)}</Text>
          <Text style={{ color: '#94a3b8', fontSize: 13 }}>({provider.reviewCount} reviews)</Text>
        </View>

        {/* Availability */}
        <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: provider.isAvailable ? '#f0fdf4' : '#fef2f2', marginTop: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: provider.isAvailable ? '#22c55e' : '#ef4444' }}>
            {provider.isAvailable ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 12 }}>Details</Text>
        <DetailRow icon="briefcase-outline" label="Specialization" value={provider.specialization} />
        <DetailRow icon="time-outline" label="Experience" value={`${provider.experience} years`} />
        {provider.qualifications?.length > 0 && (
          <DetailRow icon="school-outline" label="Qualifications" value={provider.qualifications.join(', ')} />
        )}
        {provider.bio && <DetailRow icon="document-text-outline" label="About" value={provider.bio} />}
      </View>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 12 }}>Recent Reviews</Text>
          {reviews.map((review: any) => (
            <View key={review.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '500', color: '#0f172a' }}>{review.client?.user?.name || 'Client'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name={i < review.rating ? 'star' : 'star-outline'} size={14} color="#f59e0b" />
                  ))}
                </View>
              </View>
              {review.comment && (
                <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{review.comment}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Book Button */}
      {provider.isAvailable && (
        <TouchableOpacity
          onPress={() => router.push(`/book-service?providerId=${id}`)}
          style={{ backgroundColor: '#7c3aed', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Book Service</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 }}>
      <Ionicons name={icon as any} size={18} color="#94a3b8" style={{ marginRight: 12, marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>{label}</Text>
        <Text style={{ fontWeight: '500', color: '#0f172a', marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  )
}
