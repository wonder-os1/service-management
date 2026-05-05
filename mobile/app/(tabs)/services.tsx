import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatCurrency, formatDuration } from '@/lib/utils'
import type { ServiceCategory, Service } from '@/types'

const CATEGORY_ICONS: Record<string, string> = {
  'Hair Care': 'cut-outline',
  'Skin Care': 'sparkles-outline',
  'Spa & Massage': 'leaf-outline',
  'Nail Care': 'color-palette-outline',
  'Fitness': 'fitness-outline',
  'Repair & Maintenance': 'build-outline',
}

export default function ServicesScreen() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: categories, isLoading: catLoading, refetch } = useQuery<ServiceCategory[]>({
    queryKey: ['mobile-service-categories'],
    queryFn: async () => {
      const { data } = await api.get('/service-categories')
      return data.data
    },
  })

  const { data: services, isLoading: svcLoading } = useQuery<Service[]>({
    queryKey: ['mobile-services', selectedCategory],
    queryFn: async () => {
      const params = selectedCategory ? `?categoryId=${selectedCategory}` : ''
      const { data } = await api.get(`/services${params}`)
      return data.data
    },
  })

  const isLoading = catLoading || svcLoading

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            style={{
              paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
              backgroundColor: !selectedCategory ? '#7c3aed' : '#f1f5f9',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: !selectedCategory ? '#fff' : '#64748b' }}>All</Text>
          </TouchableOpacity>
          {categories?.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={{
                paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
                backgroundColor: selectedCategory === cat.id ? '#7c3aed' : '#f1f5f9',
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}
            >
              <Ionicons
                name={(CATEGORY_ICONS[cat.name] || 'ellipsis-horizontal-outline') as any}
                size={14}
                color={selectedCategory === cat.id ? '#fff' : '#64748b'}
              />
              <Text style={{ fontSize: 13, fontWeight: '500', color: selectedCategory === cat.id ? '#fff' : '#64748b' }}>
                {cat.name}
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
        {isLoading && !services?.length ? (
          <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 40 }} />
        ) : !services?.length ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="grid-outline" size={48} color="#cbd5e1" />
            <Text style={{ color: '#94a3b8', marginTop: 12 }}>No services found</Text>
          </View>
        ) : (
          services.map((service) => (
            <View
              key={service.id}
              style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 15 }}>{service.name}</Text>
                  {service.description && (
                    <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                      {service.description}
                    </Text>
                  )}
                </View>
                {!service.isActive && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#fef2f2' }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#ef4444' }}>INACTIVE</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', marginTop: 12, gap: 16, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="cash-outline" size={14} color="#22c55e" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#22c55e' }}>{formatCurrency(service.basePrice)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="time-outline" size={14} color="#94a3b8" />
                  <Text style={{ fontSize: 13, color: '#64748b' }}>{formatDuration(service.duration)}</Text>
                </View>
                {service.category && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="pricetag-outline" size={14} color="#94a3b8" />
                    <Text style={{ fontSize: 13, color: '#64748b' }}>{service.category.name}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => router.push(`/book-service?serviceId=${service.id}`)}
                style={{ marginTop: 12, backgroundColor: '#f5f3ff', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#7c3aed' }}>Book Now</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
