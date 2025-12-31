import React, { useEffect } from 'react'
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useAppStore } from '@/lib/store'
import { parseCurrencyInput } from '@/lib/currencies'
import { DailyAllowanceCard } from '@/components/DailyAllowance'
import { TotalBalanceCard } from '@/components/TotalBalance'
import { PaydayCountdown } from '@/components/PaydayCountdown'
import { TimelineChart } from '@/components/TimelineChart'
import { SafetyLanding } from '@/components/SafetyLanding'
import { FloatingInput } from '@/components/FloatingInput'

export default function HomeScreen() {
  const {
    initialize,
    isLoading,
    isInitialized,
    totalBalance,
    dailyAllowance,
    daysUntilPayday,
    safetyLevel,
    forecastData,
    safetyLandingPoint,
    settings,
    accounts,
    addTransaction,
  } = useAppStore()

  useEffect(() => {
    initialize()
  }, [])

  const handleQuickInput = async (input: string) => {
    // Parse input like "午饭 35" or "35 午饭"
    const parts = input.trim().split(/\s+/)
    let amount = 0
    let description = ''

    for (const part of parts) {
      const num = parseCurrencyInput(part)
      if (num > 0) {
        amount = num
      } else {
        description += (description ? ' ' : '') + part
      }
    }

    if (amount > 0 && accounts.length > 0) {
      await addTransaction({
        accountId: accounts[0].id!,
        amount,
        type: 'expense',
        category: 'other',
        description: description || '支出',
        source: 'manual',
        date: Date.now(),
      })
    }
  }

  if (isLoading || !isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Allowance - Hero Card */}
        <DailyAllowanceCard
          amount={dailyAllowance}
          currency={settings.currency}
          safetyLevel={safetyLevel}
        />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TotalBalanceCard
            amount={totalBalance}
            currency={settings.currency}
          />
          <PaydayCountdown days={daysUntilPayday} />
        </View>

        {/* Timeline Chart */}
        <View style={styles.chartCard}>
          <TimelineChart
            data={forecastData}
            currency={settings.currency}
          />
        </View>

        {/* Safety Landing Point */}
        {safetyLandingPoint && (
          <SafetyLanding
            balance={safetyLandingPoint.balance}
            daysFromNow={safetyLandingPoint.daysFromNow}
            currency={settings.currency}
          />
        )}

        {/* Bottom spacing for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingInput onSubmit={handleQuickInput} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  chartCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
})
