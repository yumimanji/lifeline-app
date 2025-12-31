import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { formatCurrency } from '@/lib/currencies'

interface DailyAllowanceCardProps {
  amount: number
  currency?: string
  safetyLevel: 'safe' | 'warning' | 'danger'
  label?: string
}

export function DailyAllowanceCard({
  amount,
  currency = 'CNY',
  safetyLevel,
  label = '今日可用',
}: DailyAllowanceCardProps) {
  const colors = {
    safe: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  }

  const statusText = {
    safe: '财务状况良好',
    warning: '注意控制支出',
    danger: '超支风险',
  }

  const color = colors[safetyLevel]

  return (
    <View style={[styles.card, safetyLevel === 'safe' && styles.glowSafe, safetyLevel === 'danger' && styles.glowDanger]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.amount, { color }]}>
        {formatCurrency(amount, currency)}
      </Text>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={styles.statusText}>{statusText[safetyLevel]}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  glowSafe: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  glowDanger: {
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  label: {
    fontSize: 12,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#71717a',
  },
})
