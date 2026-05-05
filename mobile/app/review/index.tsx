import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '@/lib/api'

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!bookingId) {
      Alert.alert('Error', 'No booking selected')
      return
    }
    setLoading(true)
    try {
      await api.post('/reviews', {
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      })
      Alert.alert('Success', 'Review submitted!', [{ text: 'OK', onPress: () => router.back() }])
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Rate your experience</Text>
      <View style={s.stars}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[s.star, star <= rating ? s.active : s.inactive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={s.input}
        multiline
        numberOfLines={4}
        placeholder="Share your experience..."
        value={comment}
        onChangeText={setComment}
      />
      <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={handleSubmit} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Submitting...' : 'Submit Review'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  star: { fontSize: 40 },
  active: { color: '#F59E0B' },
  inactive: { color: '#D1D5DB' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  btn: { backgroundColor: '#7C3AED', padding: 16, borderRadius: 12, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
