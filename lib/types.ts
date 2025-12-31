// Account Types
export interface Account {
  id?: number
  name: string
  type: 'cash' | 'bank' | 'credit' | 'wechat' | 'alipay'
  balance: number
  currency: string
  createdAt: number // timestamp
  updatedAt: number
}

// Transaction Types
export interface Transaction {
  id?: number
  accountId: number
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
  merchant?: string // 商户名称
  source: 'manual' | 'notification' | 'sms' | 'import' // 来源
  rawData?: string // 原始数据（用于调试）
  date: number // timestamp
  createdAt: number
}

// Recurring Rule Types
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export interface RecurringRule {
  id?: number
  accountId: number
  name: string
  amount: number
  type: 'income' | 'expense'
  frequency: RecurrenceFrequency
  dayOfMonth?: number
  dayOfWeek?: number
  customDays?: number
  startDate: number
  endDate?: number
  autoConfirm: boolean
  nextOccurrence: number
  createdAt: number
  updatedAt: number
}

// Forecast Point
export interface ForecastPoint {
  date: Date
  balance: number
  isPast: boolean
  events: ForecastEvent[]
}

export interface ForecastEvent {
  ruleId?: number
  name: string
  amount: number
  type: 'income' | 'expense'
}

// User Settings
export interface UserSettings {
  id?: number
  locale: 'zh' | 'en'
  currency: string
  currencySymbol: string
  paydayOfMonth: number
  dailyBudgetMode: 'auto' | 'manual'
  manualDailyBudget?: number
  // 账单获取设置
  enableNotificationListener: boolean
  enableSmsParser: boolean
  notificationApps: string[] // 监听的App包名
}

// Currency Configuration
export interface CurrencyConfig {
  code: string
  symbol: string
  name: string
  decimalPlaces: number
}

// 账单导入相关
export interface BillImportResult {
  success: boolean
  totalCount: number
  importedCount: number
  skippedCount: number
  errors: string[]
  transactions: Transaction[]
}

// 通知解析结果
export interface NotificationParseResult {
  success: boolean
  amount?: number
  merchant?: string
  type?: 'income' | 'expense'
  source: 'wechat' | 'alipay' | 'bank' | 'unknown'
  rawText: string
}

// 短信解析结果
export interface SmsParseResult {
  success: boolean
  amount?: number
  merchant?: string
  type?: 'income' | 'expense'
  bankName?: string
  cardLast4?: string
  balance?: number
  rawText: string
}
