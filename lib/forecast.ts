import type { ForecastPoint, ForecastEvent, RecurringRule } from './types'

// Calculate next occurrence date based on recurring rule
export function calculateNextOccurrence(rule: RecurringRule, fromDate: Date = new Date()): Date {
  const next = new Date(fromDate)

  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      const currentDay = next.getDay()
      const targetDay = rule.dayOfWeek ?? 0
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7
      next.setDate(next.getDate() + daysUntil)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      next.setDate(Math.min(rule.dayOfMonth ?? 1, getDaysInMonth(next)))
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      break
    case 'custom':
      next.setDate(next.getDate() + (rule.customDays ?? 1))
      break
  }

  return next
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

// Check if a recurring rule occurs on a specific date
export function occursOnDate(rule: RecurringRule, date: Date): boolean {
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  const startDate = new Date(rule.startDate)
  startDate.setHours(0, 0, 0, 0)

  if (targetDate < startDate) return false
  if (rule.endDate) {
    const endDate = new Date(rule.endDate)
    endDate.setHours(0, 0, 0, 0)
    if (targetDate > endDate) return false
  }

  switch (rule.frequency) {
    case 'daily':
      return true
    case 'weekly':
      return targetDate.getDay() === rule.dayOfWeek
    case 'monthly':
      return targetDate.getDate() === rule.dayOfMonth
    case 'yearly':
      const start = new Date(rule.startDate)
      return (
        targetDate.getMonth() === start.getMonth() &&
        targetDate.getDate() === start.getDate()
      )
    case 'custom':
      const daysDiff = Math.floor(
        (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysDiff % (rule.customDays ?? 1) === 0
    default:
      return false
  }
}

// Generate forecast data for the next N days
export function generateForecast(
  currentBalance: number,
  rules: RecurringRule[],
  dailyExpenseAverage: number,
  days: number = 90
): ForecastPoint[] {
  const forecast: ForecastPoint[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let runningBalance = currentBalance

  for (let i = 0; i <= days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)

    const events: ForecastEvent[] = []

    // Check each recurring rule
    for (const rule of rules) {
      if (occursOnDate(rule, date)) {
        events.push({
          ruleId: rule.id,
          name: rule.name,
          amount: rule.amount,
          type: rule.type,
        })

        if (rule.type === 'income') {
          runningBalance += rule.amount
        } else {
          runningBalance -= rule.amount
        }
      }
    }

    // Apply daily expense average for future days (not today)
    if (i > 0) {
      runningBalance -= dailyExpenseAverage
    }

    forecast.push({
      date,
      balance: Math.round(runningBalance * 100) / 100,
      isPast: i === 0,
      events,
    })
  }

  return forecast
}

// Calculate days until next payday
export function daysUntilPayday(paydayOfMonth: number): number {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let nextPayday: Date

  if (currentDay < paydayOfMonth) {
    nextPayday = new Date(currentYear, currentMonth, paydayOfMonth)
  } else {
    nextPayday = new Date(currentYear, currentMonth + 1, paydayOfMonth)
  }

  const diffTime = nextPayday.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Calculate dynamic daily allowance
export function calculateDailyAllowance(
  currentBalance: number,
  fixedExpensesUntilPayday: number,
  daysUntilPayday: number
): number {
  const freeBalance = currentBalance - fixedExpensesUntilPayday
  if (daysUntilPayday <= 0) return freeBalance
  return Math.max(0, freeBalance / daysUntilPayday)
}

// Find the "safety landing point" - minimum balance before next income
export function findSafetyLandingPoint(forecast: ForecastPoint[]): {
  date: Date
  balance: number
  daysFromNow: number
} {
  let minBalance = Infinity
  let minDate = new Date()
  let minIndex = 0

  let nextIncomeIndex = forecast.findIndex(
    (point) => point.events.some((e) => e.type === 'income')
  )

  if (nextIncomeIndex === -1) {
    nextIncomeIndex = forecast.length
  }

  for (let i = 0; i < nextIncomeIndex; i++) {
    if (forecast[i].balance < minBalance) {
      minBalance = forecast[i].balance
      minDate = forecast[i].date
      minIndex = i
    }
  }

  return {
    date: minDate,
    balance: minBalance,
    daysFromNow: minIndex,
  }
}

// Determine safety level based on balance
export function getSafetyLevel(
  dailyAllowance: number,
  averageDailyExpense: number
): 'safe' | 'warning' | 'danger' {
  const ratio = dailyAllowance / averageDailyExpense

  if (ratio >= 1.2) return 'safe'
  if (ratio >= 0.8) return 'warning'
  return 'danger'
}
