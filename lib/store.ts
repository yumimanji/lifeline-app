import { create } from 'zustand'
import type {
  Account,
  Transaction,
  RecurringRule,
  UserSettings,
  ForecastPoint,
} from './types'
import {
  accountsDB,
  transactionsDB,
  recurringRulesDB,
  settingsDB,
  getDatabase,
} from './db'
import {
  generateForecast,
  daysUntilPayday,
  calculateDailyAllowance,
  findSafetyLandingPoint,
  getSafetyLevel,
} from './forecast'

interface AppState {
  // Data
  accounts: Account[]
  transactions: Transaction[]
  recurringRules: RecurringRule[]
  settings: UserSettings
  forecastData: ForecastPoint[]

  // Computed values
  totalBalance: number
  dailyAllowance: number
  daysUntilPayday: number
  safetyLevel: 'safe' | 'warning' | 'danger'
  safetyLandingPoint: { date: Date; balance: number; daysFromNow: number } | null
  dailyExpenseAverage: number

  // UI State
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initialize: () => Promise<void>
  refreshData: () => Promise<void>
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateAccount: (id: number, changes: Partial<Account>) => Promise<void>
  deleteAccount: (id: number) => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>
  addTransactionBatch: (transactions: Omit<Transaction, 'id' | 'createdAt'>[]) => Promise<void>
  deleteTransaction: (id: number) => Promise<void>
  addRecurringRule: (rule: Omit<RecurringRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateRecurringRule: (id: number, changes: Partial<RecurringRule>) => Promise<void>
  deleteRecurringRule: (id: number) => Promise<void>
  updateSettings: (changes: Partial<UserSettings>) => Promise<void>
  simulateExpense: (amount: number) => ForecastPoint[]
}

export const useAppStore = create<AppState>()((set, get) => ({
  // Initial state
  accounts: [],
  transactions: [],
  recurringRules: [],
  settings: {
    locale: 'zh',
    currency: 'CNY',
    currencySymbol: '¥',
    paydayOfMonth: 15,
    dailyBudgetMode: 'auto',
    enableNotificationListener: false,
    enableSmsParser: false,
    notificationApps: [],
  },
  forecastData: [],
  totalBalance: 0,
  dailyAllowance: 0,
  daysUntilPayday: 0,
  safetyLevel: 'safe',
  safetyLandingPoint: null,
  dailyExpenseAverage: 0,
  isLoading: true,
  isInitialized: false,

  // Initialize the store with data from SQLite
  initialize: async () => {
    if (get().isInitialized) return

    set({ isLoading: true })

    try {
      // Initialize database
      await getDatabase()
      await get().refreshData()
      set({ isInitialized: true })
    } catch (error) {
      console.error('Failed to initialize:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // Refresh all data from database
  refreshData: async () => {
    const [accounts, transactions, recurringRules, settings] = await Promise.all([
      accountsDB.getAll(),
      transactionsDB.getAll(),
      recurringRulesDB.getAll(),
      settingsDB.get(),
    ])

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
    const dailyExpenseAverage = await transactionsDB.getRecentDailyAverage(30)
    const days = daysUntilPayday(settings.paydayOfMonth)

    // Calculate fixed expenses until payday
    const fixedExpenses = recurringRules
      .filter((r) => r.type === 'expense' && r.autoConfirm)
      .reduce((sum, r) => sum + r.amount, 0)

    const dailyAllowance = calculateDailyAllowance(totalBalance, fixedExpenses, days)
    const safetyLevel = getSafetyLevel(dailyAllowance, dailyExpenseAverage || 100)

    // Generate forecast
    const forecastData = generateForecast(
      totalBalance,
      recurringRules,
      dailyExpenseAverage,
      90
    )
    const safetyLandingPoint = findSafetyLandingPoint(forecastData)

    set({
      accounts,
      transactions,
      recurringRules,
      settings,
      totalBalance,
      dailyAllowance,
      daysUntilPayday: days,
      safetyLevel,
      forecastData,
      safetyLandingPoint,
      dailyExpenseAverage,
    })
  },

  // Account actions
  addAccount: async (account) => {
    const now = Date.now()
    await accountsDB.add({
      ...account,
      createdAt: now,
      updatedAt: now,
    })
    await get().refreshData()
  },

  updateAccount: async (id, changes) => {
    await accountsDB.update(id, changes)
    await get().refreshData()
  },

  deleteAccount: async (id) => {
    await accountsDB.delete(id)
    await get().refreshData()
  },

  // Transaction actions
  addTransaction: async (transaction) => {
    await transactionsDB.add({
      ...transaction,
      createdAt: Date.now(),
    })
    await get().refreshData()
  },

  addTransactionBatch: async (transactions) => {
    const now = Date.now()
    await transactionsDB.addBatch(
      transactions.map((t) => ({
        ...t,
        createdAt: now,
      }))
    )
    await get().refreshData()
  },

  deleteTransaction: async (id) => {
    await transactionsDB.delete(id)
    await get().refreshData()
  },

  // Recurring rule actions
  addRecurringRule: async (rule) => {
    const now = Date.now()
    await recurringRulesDB.add({
      ...rule,
      createdAt: now,
      updatedAt: now,
    })
    await get().refreshData()
  },

  updateRecurringRule: async (id, changes) => {
    await recurringRulesDB.update(id, changes)
    await get().refreshData()
  },

  deleteRecurringRule: async (id) => {
    await recurringRulesDB.delete(id)
    await get().refreshData()
  },

  // Settings actions
  updateSettings: async (changes) => {
    await settingsDB.update(changes)
    await get().refreshData()
  },

  // Simulate an expense (for "What-If" scenarios)
  simulateExpense: (amount: number) => {
    const { totalBalance, recurringRules, dailyExpenseAverage } = get()
    return generateForecast(
      totalBalance - amount,
      recurringRules,
      dailyExpenseAverage,
      90
    )
  },
}))
