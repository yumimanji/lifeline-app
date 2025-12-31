import * as SQLite from 'expo-sqlite'
import type { Account, Transaction, RecurringRule, UserSettings } from './types'

let db: SQLite.SQLiteDatabase | null = null

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('lifeline.db')
    await initializeDatabase(db)
  }
  return db
}

async function initializeDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'CNY',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      merchant TEXT,
      source TEXT DEFAULT 'manual',
      rawData TEXT,
      date INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (accountId) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS recurring_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      frequency TEXT NOT NULL,
      dayOfMonth INTEGER,
      dayOfWeek INTEGER,
      customDays INTEGER,
      startDate INTEGER NOT NULL,
      endDate INTEGER,
      autoConfirm INTEGER DEFAULT 1,
      nextOccurrence INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (accountId) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      locale TEXT DEFAULT 'zh',
      currency TEXT DEFAULT 'CNY',
      currencySymbol TEXT DEFAULT '¥',
      paydayOfMonth INTEGER DEFAULT 15,
      dailyBudgetMode TEXT DEFAULT 'auto',
      manualDailyBudget REAL,
      enableNotificationListener INTEGER DEFAULT 0,
      enableSmsParser INTEGER DEFAULT 0,
      notificationApps TEXT DEFAULT '[]'
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId);
  `)

  // Initialize default settings if not exists
  const settings = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM settings'
  )
  if (settings?.count === 0) {
    await database.runAsync(
      `INSERT INTO settings (locale, currency, currencySymbol, paydayOfMonth, dailyBudgetMode, enableNotificationListener, enableSmsParser, notificationApps)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['zh', 'CNY', '¥', 15, 'auto', 0, 0, '["com.tencent.mm", "com.eg.android.AlipayGphone"]']
    )
  }

  // Initialize default account if not exists
  const accounts = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM accounts'
  )
  if (accounts?.count === 0) {
    const now = Date.now()
    await database.runAsync(
      `INSERT INTO accounts (name, type, balance, currency, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['现金', 'cash', 0, 'CNY', now, now]
    )
  }
}

// Account operations
export const accountsDB = {
  async getAll(): Promise<Account[]> {
    const db = await getDatabase()
    return db.getAllAsync<Account>('SELECT * FROM accounts ORDER BY createdAt DESC')
  },

  async getById(id: number): Promise<Account | null> {
    const db = await getDatabase()
    return db.getFirstAsync<Account>('SELECT * FROM accounts WHERE id = ?', [id])
  },

  async add(account: Omit<Account, 'id'>): Promise<number> {
    const db = await getDatabase()
    const result = await db.runAsync(
      `INSERT INTO accounts (name, type, balance, currency, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [account.name, account.type, account.balance, account.currency, account.createdAt, account.updatedAt]
    )
    return result.lastInsertRowId
  },

  async update(id: number, changes: Partial<Account>): Promise<void> {
    const db = await getDatabase()
    const fields: string[] = []
    const values: any[] = []

    Object.entries(changes).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    })

    if (fields.length > 0) {
      fields.push('updatedAt = ?')
      values.push(Date.now())
      values.push(id)
      await db.runAsync(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`, values)
    }
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase()
    await db.runAsync('DELETE FROM accounts WHERE id = ?', [id])
  },

  async getTotalBalance(): Promise<number> {
    const db = await getDatabase()
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(balance), 0) as total FROM accounts'
    )
    return result?.total ?? 0
  },
}

// Transaction operations
export const transactionsDB = {
  async getAll(): Promise<Transaction[]> {
    const db = await getDatabase()
    return db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC')
  },

  async getByDateRange(start: number, end: number): Promise<Transaction[]> {
    const db = await getDatabase()
    return db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE date BETWEEN ? AND ? ORDER BY date DESC',
      [start, end]
    )
  },

  async getByAccount(accountId: number): Promise<Transaction[]> {
    const db = await getDatabase()
    return db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE accountId = ? ORDER BY date DESC',
      [accountId]
    )
  },

  async add(transaction: Omit<Transaction, 'id'>): Promise<number> {
    const db = await getDatabase()
    const result = await db.runAsync(
      `INSERT INTO transactions (accountId, amount, type, category, description, merchant, source, rawData, date, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.accountId,
        transaction.amount,
        transaction.type,
        transaction.category,
        transaction.description,
        transaction.merchant || null,
        transaction.source,
        transaction.rawData || null,
        transaction.date,
        transaction.createdAt,
      ]
    )

    // Update account balance
    const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount
    await db.runAsync(
      'UPDATE accounts SET balance = balance + ?, updatedAt = ? WHERE id = ?',
      [balanceChange, Date.now(), transaction.accountId]
    )

    return result.lastInsertRowId
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase()
    const transaction = await db.getFirstAsync<Transaction>(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    )

    if (transaction) {
      const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount
      await db.runAsync(
        'UPDATE accounts SET balance = balance + ?, updatedAt = ? WHERE id = ?',
        [balanceChange, Date.now(), transaction.accountId]
      )
      await db.runAsync('DELETE FROM transactions WHERE id = ?', [id])
    }
  },

  async getRecentDailyAverage(days: number = 30): Promise<number> {
    const db = await getDatabase()
    const endDate = Date.now()
    const startDate = endDate - days * 24 * 60 * 60 * 1000

    const result = await db.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE type = 'expense' AND date BETWEEN ? AND ?`,
      [startDate, endDate]
    )

    return (result?.total ?? 0) / days
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
    const db = await getDatabase()
    return db.getAllAsync<RecurringRule>('SELECT * FROM recurring_rules ORDER BY createdAt DESC')
  },

  async getByType(type: 'income' | 'expense'): Promise<RecurringRule[]> {
    const db = await getDatabase()
    return db.getAllAsync<RecurringRule>(
      'SELECT * FROM recurring_rules WHERE type = ? ORDER BY createdAt DESC',
      [type]
    )
  },

  async add(rule: Omit<RecurringRule, 'id'>): Promise<number> {
    const db = await getDatabase()
    const result = await db.runAsync(
      `INSERT INTO recurring_rules (accountId, name, amount, type, frequency, dayOfMonth, dayOfWeek, customDays, startDate, endDate, autoConfirm, nextOccurrence, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rule.accountId,
        rule.name,
        rule.amount,
        rule.type,
        rule.frequency,
        rule.dayOfMonth || null,
        rule.dayOfWeek || null,
        rule.customDays || null,
        rule.startDate,
        rule.endDate || null,
        rule.autoConfirm ? 1 : 0,
        rule.nextOccurrence,
        rule.createdAt,
        rule.updatedAt,
      ]
    )
    return result.lastInsertRowId
  },

  async update(id: number, changes: Partial<RecurringRule>): Promise<void> {
    const db = await getDatabase()
    const fields: string[] = []
    const values: any[] = []

    Object.entries(changes).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        if (key === 'autoConfirm') {
          fields.push(`${key} = ?`)
          values.push(value ? 1 : 0)
        } else {
          fields.push(`${key} = ?`)
          values.push(value)
        }
      }
    })

    if (fields.length > 0) {
      fields.push('updatedAt = ?')
      values.push(Date.now())
      values.push(id)
      await db.runAsync(`UPDATE recurring_rules SET ${fields.join(', ')} WHERE id = ?`, values)
    }
  },

  async delete(id: number): Promise<void> {
    const db = await getDatabase()
    await db.runAsync('DELETE FROM recurring_rules WHERE id = ?', [id])
  },
}

// Settings operations
export const settingsDB = {
  async get(): Promise<UserSettings> {
    const db = await getDatabase()
    const settings = await db.getFirstAsync<any>('SELECT * FROM settings LIMIT 1')

    if (settings) {
      return {
        ...settings,
        enableNotificationListener: !!settings.enableNotificationListener,
        enableSmsParser: !!settings.enableSmsParser,
        notificationApps: JSON.parse(settings.notificationApps || '[]'),
      }
    }

    return {
      locale: 'zh',
      currency: 'CNY',
      currencySymbol: '¥',
      paydayOfMonth: 15,
      dailyBudgetMode: 'auto',
      enableNotificationListener: false,
      enableSmsParser: false,
      notificationApps: ['com.tencent.mm', 'com.eg.android.AlipayGphone'],
    }
  },

  async update(changes: Partial<UserSettings>): Promise<void> {
    const db = await getDatabase()
    const fields: string[] = []
    const values: any[] = []

    Object.entries(changes).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`)
        if (key === 'notificationApps') {
          values.push(JSON.stringify(value))
        } else if (key === 'enableNotificationListener' || key === 'enableSmsParser') {
          values.push(value ? 1 : 0)
        } else {
          values.push(value)
        }
      }
    })

    if (fields.length > 0) {
      await db.runAsync(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`, values)
    }
  },
}
