import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useRouter, Stack, useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { Button, Card, Input, EmptyState } from '@/components/ui'
import { formatCurrency, formatDuration, getInitials } from '@/lib/utils'
import type { ServiceProvider, Service } from '@/types'

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
]

export default function BookServiceScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useLocalSearchParams<{ providerId?: string; serviceId?: string }>()
  const user = useAuthStore((s) => s.user)

  // Form state
  const [step, setStep] = useState(1) // 1: Services, 2: Provider, 3: Date/Time, 4: Confirm
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch services
  const { data: servicesData, isLoading: loadingServices } = useQuery<Service[]>({
    queryKey: ['book-services'],
    queryFn: async () => {
      const { data } = await api.get('/services?limit=100')
      return data.data
    },
  })

  // Fetch providers
  const { data: providersData, isLoading: loadingProviders } = useQuery<ServiceProvider[]>({
    queryKey: ['book-providers', searchQuery],
    queryFn: async () => {
      const { data } = await api.get('/providers', {
        params: { search: searchQuery, limit: 50 },
      })
      return data.data
    },
  })

  // Fetch available slots
  const { data: availableSlots } = useQuery({
    queryKey: ['slots', selectedProvider?.id, selectedDate],
    queryFn: async () => {
      if (!selectedProvider?.id || !selectedDate) return TIME_SLOTS
      try {
        const { data } = await api.get('/bookings/available-slots', {
          params: { providerId: selectedProvider.id, date: selectedDate },
        })
        return (data.data as string[]) || TIME_SLOTS
      } catch {
        return TIME_SLOTS
      }
    },
    enabled: !!selectedProvider?.id && !!selectedDate,
  })

  // Book mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      // Calculate endTime from startTime + total duration
      const [hours, mins] = selectedTime.split(':').map(Number)
      const endMinutes = hours * 60 + mins + totalDuration
      const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0')
      const endM = String(endMinutes % 60).padStart(2, '0')

      const { data } = await api.post('/bookings', {
        clientId: user?.client?.id,
        providerId: selectedProvider!.id,
        date: selectedDate,
        startTime: selectedTime,
        endTime: `${endH}:${endM}`,
        type: 'online',
        items: selectedServices.map((s) => ({ serviceId: s.id, quantity: 1 })),
        notes,
      })
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mobile-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['mobile-dashboard'] })
      Alert.alert('Booking Confirmed', 'Your service has been booked successfully.', [
        { text: 'View', onPress: () => router.replace(`/booking/${data.id}`) },
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: (error: any) => {
      Alert.alert('Booking Failed', error.response?.data?.error || 'Could not book the service. Please try again.')
    },
  })

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.getTime() === today.getTime()) return 'Today'
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const toggleService = (service: Service) => {
    setSelectedServices((prev) =>
      prev.find((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    )
  }

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.basePrice, 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)
  const slots = availableSlots || TIME_SLOTS

  return (
    <>
      <Stack.Screen options={{ title: 'Book Service', headerBackTitle: 'Back' }} />
      <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View style={{ padding: 20 }}>
          {/* Step Indicators */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={{
                  width: s === step ? 32 : 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: s <= step ? '#7c3aed' : '#e2e8f0',
                }}
              />
            ))}
          </View>

          {/* Step 1: Select Services */}
          {step === 1 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Select Services</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Choose the services you need</Text>

              {loadingServices ? (
                <EmptyState icon="hourglass-outline" title="Loading services..." />
              ) : !servicesData?.length ? (
                <EmptyState icon="grid-outline" title="No services available" />
              ) : (
                servicesData.filter((s) => s.isActive).map((service) => {
                  const isSelected = selectedServices.some((s) => s.id === service.id)
                  return (
                    <TouchableOpacity
                      key={service.id}
                      onPress={() => toggleService(service)}
                      style={{
                        backgroundColor: isSelected ? '#f5f3ff' : '#fff',
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? '#7c3aed' : '#e2e8f0',
                        borderRadius: 12, padding: 16, marginBottom: 10,
                        flexDirection: 'row', alignItems: 'center',
                      }}
                    >
                      <View style={{
                        width: 24, height: 24, borderRadius: 12,
                        borderWidth: 2, borderColor: isSelected ? '#7c3aed' : '#d1d5db',
                        backgroundColor: isSelected ? '#7c3aed' : 'transparent',
                        justifyContent: 'center', alignItems: 'center', marginRight: 12,
                      }}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600', color: '#0f172a' }}>{service.name}</Text>
                        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {formatDuration(service.duration)} · {service.category?.name}
                        </Text>
                      </View>
                      <Text style={{ fontWeight: '600', color: '#22c55e' }}>{formatCurrency(service.basePrice)}</Text>
                    </TouchableOpacity>
                  )
                })
              )}

              {selectedServices.length > 0 && (
                <View style={{ backgroundColor: '#f5f3ff', borderRadius: 12, padding: 16, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} · {formatDuration(totalDuration)}</Text>
                    <Text style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 18 }}>{formatCurrency(totalPrice)}</Text>
                  </View>
                  <Button title="Next" onPress={() => setStep(2)} />
                </View>
              )}
            </View>
          )}

          {/* Step 2: Select Provider */}
          {step === 2 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Select Provider</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Choose your service provider</Text>

              <Input
                placeholder="Search by name or specialization..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                containerStyle={{ marginBottom: 16 }}
              />

              {loadingProviders ? (
                <EmptyState icon="hourglass-outline" title="Loading providers..." />
              ) : !providersData?.length ? (
                <EmptyState icon="people-outline" title="No providers found" description="Try a different search" />
              ) : (
                providersData.filter((p) => p.isAvailable).map((provider) => (
                  <TouchableOpacity
                    key={provider.id}
                    onPress={() => { setSelectedProvider(provider); setStep(3) }}
                    style={{
                      backgroundColor: selectedProvider?.id === provider.id ? '#f5f3ff' : '#fff',
                      borderWidth: selectedProvider?.id === provider.id ? 2 : 1,
                      borderColor: selectedProvider?.id === provider.id ? '#7c3aed' : '#e2e8f0',
                      borderRadius: 12, padding: 16, marginBottom: 10,
                      flexDirection: 'row', alignItems: 'center',
                    }}
                  >
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '600', color: '#7c3aed' }}>{provider.user ? getInitials(provider.user.name) : 'P'}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 15 }}>{provider.user?.name}</Text>
                      <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{provider.specialization}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Ionicons name="star" size={12} color="#f59e0b" />
                        <Text style={{ fontSize: 12, color: '#64748b' }}>{provider.rating.toFixed(1)} ({provider.reviewCount})</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                ))
              )}

              <Button title="Back" variant="outline" onPress={() => setStep(1)} style={{ marginTop: 8 }} />
            </View>
          )}

          {/* Step 3: Select Date & Time */}
          {step === 3 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Select Date & Time</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                With {selectedProvider?.user?.name}
              </Text>

              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {dates.map((date) => (
                    <TouchableOpacity
                      key={date}
                      onPress={() => { setSelectedDate(date); setSelectedTime('') }}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
                        backgroundColor: selectedDate === date ? '#7c3aed' : '#fff',
                        borderWidth: 1, borderColor: selectedDate === date ? '#7c3aed' : '#e2e8f0',
                        minWidth: 80, alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: selectedDate === date ? '#fff' : '#374151' }}>
                        {formatDateLabel(date)}
                      </Text>
                      <Text style={{ fontSize: 11, color: selectedDate === date ? '#e9d5ff' : '#94a3b8', marginTop: 2 }}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {selectedDate ? (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Available Slots</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {slots.map((slot) => (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => setSelectedTime(slot)}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
                          backgroundColor: selectedTime === slot ? '#7c3aed' : '#fff',
                          borderWidth: 1, borderColor: selectedTime === slot ? '#7c3aed' : '#e2e8f0',
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '500', color: selectedTime === slot ? '#fff' : '#374151' }}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <Card style={{ alignItems: 'center' as const, padding: 24 }}>
                  <Ionicons name="calendar-outline" size={32} color="#94a3b8" />
                  <Text style={{ color: '#94a3b8', marginTop: 8 }}>Select a date to see available slots</Text>
                </Card>
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <Button title="Back" variant="outline" onPress={() => setStep(2)} style={{ flex: 1 }} />
                <Button
                  title="Next"
                  onPress={() => setStep(4)}
                  disabled={!selectedDate || !selectedTime}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Confirm Booking</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Review and confirm your booking</Text>

              {/* Summary */}
              <Card style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontWeight: '600', color: '#7c3aed' }}>{selectedProvider?.user ? getInitials(selectedProvider.user.name) : 'P'}</Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontWeight: '600', color: '#0f172a' }}>{selectedProvider?.user?.name}</Text>
                    <Text style={{ fontSize: 13, color: '#64748b' }}>{selectedProvider?.specialization}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Date</Text>
                    <Text style={{ fontWeight: '500', color: '#0f172a' }}>{formatDateLabel(selectedDate)}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Time</Text>
                    <Text style={{ fontWeight: '500', color: '#0f172a' }}>{selectedTime}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Duration</Text>
                    <Text style={{ fontWeight: '500', color: '#0f172a' }}>{formatDuration(totalDuration)}</Text>
                  </View>
                </View>
              </Card>

              {/* Selected Services */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Services</Text>
              <Card style={{ marginBottom: 16 }}>
                {selectedServices.map((service, idx) => (
                  <View key={service.id} style={{
                    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
                    borderBottomWidth: idx < selectedServices.length - 1 ? 1 : 0, borderBottomColor: '#f1f5f9',
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '500', color: '#0f172a' }}>{service.name}</Text>
                      <Text style={{ fontSize: 12, color: '#94a3b8' }}>{formatDuration(service.duration)}</Text>
                    </View>
                    <Text style={{ fontWeight: '500', color: '#22c55e' }}>{formatCurrency(service.basePrice)}</Text>
                  </View>
                ))}
                <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '600', color: '#0f172a' }}>Total</Text>
                  <Text style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 16 }}>{formatCurrency(totalPrice)}</Text>
                </View>
              </Card>

              {/* Notes */}
              <Input
                label="Notes (Optional)"
                placeholder="Any special requests or instructions..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: 'top' }}
                containerStyle={{ marginBottom: 24 }}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button title="Back" variant="outline" onPress={() => setStep(3)} style={{ flex: 1 }} />
                <Button
                  title="Confirm Booking"
                  onPress={() => bookMutation.mutate()}
                  loading={bookMutation.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  )
}
