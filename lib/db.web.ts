// Web 平台数据库实现 - 使用 localStorage
import type { Account, Transaction, RecurringRule, UserSettings } from './types'

const STORAGE_KEYS = {
  accounts: 'lifeline_accounts',
  transactions: 'lifeline_transactions',
  recurringRules: 'lifeline_recurring_rules',
  settings: 'lifeline_settings',
}

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : defaultValue
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

let nextAccountId = 1
let nextTransactionId = 1
let nextRuleId = 1

function initializeIds() {
  const accounts = getStorage<Account[]>(STORAGE_KEYS.accounts, [])
  const transactions = getStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
  const rules = getStorage<RecurringRule[]>(STORAGE_KEYS.recurringRules, [])

  nextAccountId = Math.max(1, ...accounts.map((a) => (a.id || 0) + 1))
  nextTransactionId = Math.max(1, ...transactions.map((t) => (t.id || 0) + 1))
  nextRuleId = Math.max(1, ...rules.map((r) => (r.id || 0) + 1))
}

// 初始化默认数据
export async function getDatabase(): Promise<null> {
  initializeIds()

  // 初始化默认设置
  const settings = getStorage<UserSettings | null>(STORAGE_KEYS.settings, null)
  if (!settings) {
    setStorage(STORAGE_KEYS.settings, {
      locale: 'zh',
      currency: 'CNY',
      currencySymbol: '¥',
      paydayOfMonth: 15,
      dailyBudgetMode: 'auto',
      enableNotificationListener: false,
      enableSmsParser: false,
      notificationApps: ['com.tencent.mm', 'com.eg.android.AlipayGphone'],
    })
  }

  // 初始化默认账户
  const accounts = getStorage<Account[]>(STORAGE_KEYS.accounts, [])
  if (accounts.length === 0) {
    const now = Date.now()
    setStorage(STORAGE_KEYS.accounts, [
      {
        id: nextAccountId++,
        name: '现金',
        type: 'cash',
        balance: 0,
        currency: 'CNY',
        createdAt: now,
        updatedAt: now,
      },
    ])
  }

  return null
}

// Account operations
export const accountsDB = {
  async getAll(): Promise<Account[]> {
    return getStorage<Account[]>(STORAGE_KEYS.accounts, [])
  },

  async getById(id: number): Promise<Account | null> {
    const accounts = getStorage<Account[]>(STORAGE_KEYS.accounts, [])
    return accounts.find((a) => a.id === id) || null
  },

  async add(account: Omit<Account, 'id'>): Promise<number> {
    const accounts = getStorage<Account[]>(STORAGE_KEYS.accounts, [])
    const id = nextAccountId++
    accounts.push({ ...account, id })
    setStorage(STORAGE_KEYS.accounts, accounts)
    return id
  },

  async update(id: number, changes: Partial<Account>): Promise<void> {
    const accounts = getStorage<Account[]>(STORAGE_KEYS.accounts, [])
    const index = accounts.findIndex((a) => a.id === id)
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...changes, updatedAt: Date.now() }
      setStorage(STORAGE_KEYS.accounts, accounts)
    }
  },

  async delete(id: number): Promise<void> {
    const accounts = getStorage<Account[]>(STORAGE_KEYS.accounts, [])
    setStorage(
      STORAGE_KEYS.accounts,
      accounts.filter((a) => a.id !== id)
    )
  },

  async getTotalBalance(): Promise<number> {
    const accounts = getStorage<Account[]>(STORAGE_KEYS.accounts, [])
    return accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
  },
}

// Transaction operations
export const transactionsDB = {
  async getAll(): Promise<Transaction[]> {
    const transactions = getStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
    return transactions.sort((a, b) => b.date - a.date)
  },

  async getByDateRange(start: number, end: number): Promise<Transaction[]> {
    const transactions = getStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
    return transactions
      .filter((t) => t.date >= start && t.date <= end)
      .sort((a, b) => b.date - a.date)
  },

  async getByAccount(accountId: number): Promise<Transaction[]> {
    const transactions = getStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
    return transactions
      .filter((t) => t.accountId === accountId)
      .sort((a, b) => b.date - a.date)
  },

  async add(transaction: Omit<Transaction, 'id'>): Promise<number> {
    const transactions = getStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
    const id = nextTransactionId++
    transactions.push({ ...transaction, id })
    setStorage(STORAGE_KEYS.transactions, transactions)

    // Update account balance
    const accounts = getStorage<Account[]>(STORAGE_KEYS.accounts, [])
    const accountIndex = accounts.findIndex((a) => a.id === transaction.accountId)
    if (accountIndex !== -1) {
      const balanceChange =
        transaction.type === 'income' ? transaction.amount : -transaction.amount
      accounts[accountIndex].balance =
        (accounts[accountIndex].balance || 0) + balanceChange
      accounts[accountIndex].updatedAt = Date.now()
      setStorage(STORAGE_KEYS.accounts, accounts)
    }

    return id
  },

  async delete(id: number): Promise<void> {
    const transactions = getStorage<Transaction[]>(STORAGE_KEYS.transactions, [])
    const transaction = transactions.find((t) => t.id === id)

    if (transaction) {
      // Revert account balance
      const accounts = getStorage<Account[]>(STORAGE_KEYS.accounts, [])
      const accountIndex = accounts.findIndex((a) => a.id === transaction.accountId)
      if (accountIndex !== -1) {
        const balanceChange =
          transaction.type === 'income' ? -transaction.amount : transaction.amount
        accounts[accountIndex].balance =
          (accounts[accountIndex].balance || 0) + balanceChange
        accounts[accountIndex].updatedAt = Date.now()
        setStorage(STORAGE_KEYS.accounts, accounts)
      }

      setStorage(
        STORAGE_KEYS.transactions,
        transactions.filter((t) => t.id !== id)
      )
    }
  },

  async getRecentDailyAverage(days: number = 30): Promise<number> {
    const endDate = Date.now()
    const startDate = endDate - days * 24 * 60 * 60 * 1000
    const transactions = getStorage<Transaction[]>(STORAGE_KEYS.transactions, [])

    const total = transactions
      .filter((t) => t.type === 'expense' && t.date >= startDate && t.date <= endDate)
      .reduce((sum, t) => sum + t.amount, 0)

    return total / days
  },

  async addBatch(transactions: Omit<Transaction, 'id'>[]): Promise<number[]> {
    const ids: number[] = []
    for (const transaction of transactions) {
      const id = await this.add(transaction)
      ids.push(id)
    }
    return ids
  },
}

// Recurring rules operations
export const recurringRulesDB = {
  async getAll(): Promise<RecurringRule[]> {
    const rules = getStorage<RecurringRule[]>(STORAGE_KEYS.recurringRules, [])
    return rules.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  },

  async getByType(type: 'income' | 'expense'): Promise<RecurringRule[]> {
    const rules = getStorage<RecurringRule[]>(STORAGE_KEYS.recurringRules, [])
    return rules
      .filter((r) => r.type === type)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  },

  async add(rule: Omit<RecurringRule, 'id'>): Promise<number> {
    const rules = getStorage<RecurringRule[]>(STORAGE_KEYS.recurringRules, [])
    const id = nextRuleId++
    rules.push({ ...rule, id })
    setStorage(STORAGE_KEYS.recurringRules, rules)
    return id
  },

  async update(id: number, changes: Partial<RecurringRule>): Promise<void> {
    const rules = getStorage<RecurringRule[]>(STORAGE_KEYS.recurringRules, [])
    const index = rules.findIndex((r) => r.id === id)
    if (index !== -1) {
      rules[index] = { ...rules[index], ...changes, updatedAt: Date.now() }
      setStorage(STORAGE_KEYS.recurringRules, rules)
    }
  },

  async delete(id: number): Promise<void> {
    const rules = getStorage<RecurringRule[]>(STORAGE_KEYS.recurringRules, [])
    setStorage(
      STORAGE_KEYS.recurringRules,
      rules.filter((r) => r.id !== id)
    )
  },
}

// Settings operations
export const settingsDB = {
  async get(): Promise<UserSettings> {
    return getStorage<UserSettings>(STORAGE_KEYS.settings, {
      locale: 'zh',
      currency: 'CNY',
      currencySymbol: '¥',
      paydayOfMonth: 15,
      dailyBudgetMode: 'auto',
      enableNotificationListener: false,
      enableSmsParser: false,
      notificationApps: ['com.tencent.mm', 'com.eg.android.AlipayGphone'],
    })
  },

  async update(changes: Partial<UserSettings>): Promise<void> {
    const settings = await this.get()
    setStorage(STORAGE_KEYS.settings, { ...settings, ...changes })
  },
}
