import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatCurrency } from '@/lib/currencies'

interface TotalBalanceCardProps {
  amount: number
  currency?: string
  label?: string
}

export function TotalBalanceCard({
  amount,
  currency = 'CNY',
  label = '总余额',
}: TotalBalanceCardProps) {
  const isNegative = amount < 0

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="wallet-outline" size={14} color="#71717a" />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, isNegative && styles.negative]}>
        {formatCurrency(amount, currency)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fafafa',
    fontVariant: ['tabular-nums'],
  },
  negative: {
    color: '#ef4444',
  },
})
