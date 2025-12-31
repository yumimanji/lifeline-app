import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatCurrency } from '@/lib/currencies'

interface SafetyLandingProps {
  balance: number
  daysFromNow: number
  currency?: string
  label?: string
}

export function SafetyLanding({
  balance,
  daysFromNow,
  currency = 'CNY',
  label = '安全着陆点',
}: SafetyLandingProps) {
  const isNegative = balance < 0

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="trending-down-outline" size={14} color="#71717a" />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, isNegative && styles.negative]}>
        {formatCurrency(balance, currency)}
      </Text>
      <Text style={styles.subtitle}>{daysFromNow} 天后的最低余额</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fafafa',
    fontVariant: ['tabular-nums'],
  },
  negative: {
    color: '#ef4444',
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
  },
})
