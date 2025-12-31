import { Platform } from 'react-native'

// 根据平台动态导入数据库实现
// Web 平台使用 localStorage，原生平台使用 SQLite

let dbModule: typeof import('./db.native') | typeof import('./db.web')

if (Platform.OS === 'web') {
  // Web 平台
  dbModule = require('./db.web')
} else {
  // 原生平台 (iOS/Android)
  dbModule = require('./db.native')
}

export const getDatabase = dbModule.getDatabase
export const accountsDB = dbModule.accountsDB
export const transactionsDB = dbModule.transactionsDB
export const recurringRulesDB = dbModule.recurringRulesDB
export const settingsDB = dbModule.settingsDB
