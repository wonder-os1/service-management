import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api'

export default function InvoicesScreen() {
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => fetch(`${API}/client/invoices`).then(r => r.json()),
  })

  return (
    <View style={s.container}>
      <Text style={s.title}>Invoices</Text>
      <FlatList
        data={invoices}
        keyExtractor={(i: any) => i.id}
        contentContainerStyle={s.list}
        renderItem={({ item }: { item: any }) => (
          <View style={s.card}>
            <View>
              <Text style={s.service}>{item.service?.name || 'Service'}</Text>
              <Text style={s.date}>
                {item.invoiceNumber} · {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={s.right}>
              <Text style={s.amount}>₹{((item.amount || 0) / 100).toLocaleString()}</Text>
              <View style={[s.badge, item.status === 'PAID' ? s.paid : s.pending]}>
                <Text style={[s.badgeText, item.status === 'PAID' ? s.paidText : s.pendingText]}>
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No invoices yet</Text>}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', padding: 24, paddingBottom: 8 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  service: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 4 },
  paid: { backgroundColor: '#D1FAE5' },
  pending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  paidText: { color: '#065F46' },
  pendingText: { color: '#92400E' },
  empty: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 40 },
})
