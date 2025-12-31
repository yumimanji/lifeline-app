import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import type { BillImportResult, Transaction } from '../lib/types'

// CSV 解析器
function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/)
  const result: string[][] = []

  for (const line of lines) {
    if (line.trim()) {
      // 简单的 CSV 解析，处理引号内的逗号
      const row: string[] = []
      let current = ''
      let inQuotes = false

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      row.push(current.trim())
      result.push(row)
    }
  }

  return result
}

// 微信账单解析
// 微信账单 CSV 格式:
// 交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,当前状态,交易单号,商户单号,备注
export function parseWechatBill(content: string): Transaction[] {
  const transactions: Transaction[] = []
  const rows = parseCSV(content)

  // 跳过标题行（通常前几行是账单信息）
  let dataStartIndex = 0
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0]?.includes('交易时间')) {
      dataStartIndex = i + 1
      break
    }
  }

  for (let i = dataStartIndex; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 6) continue

    const [dateStr, , merchant, description, direction, amountStr] = row

    // 解析金额
    const amount = parseFloat(amountStr?.replace(/[¥,]/g, '') || '0')
    if (amount === 0) continue

    // 解析日期
    const date = new Date(dateStr).getTime()
    if (isNaN(date)) continue

    // 判断收支类型
    const type = direction?.includes('收入') ? 'income' : 'expense'

    transactions.push({
      accountId: 1, // 默认账户，后续可以让用户选择
      amount,
      type,
      category: 'other',
      description: description || '',
      merchant: merchant || '',
      source: 'import',
      rawData: row.join(','),
      date,
      createdAt: Date.now(),
    })
  }

  return transactions
}

// 支付宝账单解析
// 支付宝账单 CSV 格式:
// 交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态,交易订单号,商家订单号,备注
export function parseAlipayBill(content: string): Transaction[] {
  const transactions: Transaction[] = []
  const rows = parseCSV(content)

  // 跳过标题行
  let dataStartIndex = 0
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0]?.includes('交易时间') || rows[i][0]?.includes('交易创建时间')) {
      dataStartIndex = i + 1
      break
    }
  }

  for (let i = dataStartIndex; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 7) continue

    const [dateStr, category, merchant, , description, direction, amountStr] = row

    // 解析金额
    const amount = parseFloat(amountStr?.replace(/[¥,]/g, '') || '0')
    if (amount === 0) continue

    // 解析日期
    const date = new Date(dateStr).getTime()
    if (isNaN(date)) continue

    // 判断收支类型
    const type = direction?.includes('收入') ? 'income' : 'expense'

    // 映射分类
    const categoryMap: Record<string, string> = {
      '餐饮美食': 'food',
      '交通出行': 'transport',
      '日用百货': 'shopping',
      '充值缴费': 'utilities',
      '转账': 'transfer',
      '红包': 'gift',
    }

    transactions.push({
      accountId: 1,
      amount,
      type,
      category: categoryMap[category] || 'other',
      description: description || '',
      merchant: merchant || '',
      source: 'import',
      rawData: row.join(','),
      date,
      createdAt: Date.now(),
    })
  }

  return transactions
}

// 自动检测账单类型并解析
function detectAndParseBill(content: string): Transaction[] {
  // 检测微信账单
  if (content.includes('微信支付账单') || content.includes('微信支付交易明细')) {
    return parseWechatBill(content)
  }

  // 检测支付宝账单
  if (content.includes('支付宝') || content.includes('alipay')) {
    return parseAlipayBill(content)
  }

  // 尝试通用解析
  return parseGenericBill(content)
}

// 通用账单解析（尝试识别常见格式）
function parseGenericBill(content: string): Transaction[] {
  const transactions: Transaction[] = []
  const rows = parseCSV(content)

  if (rows.length < 2) return transactions

  // 尝试识别列
  const header = rows[0].map((h) => h.toLowerCase())
  const dateIndex = header.findIndex((h) =>
    h.includes('日期') || h.includes('时间') || h.includes('date')
  )
  const amountIndex = header.findIndex((h) =>
    h.includes('金额') || h.includes('amount') || h.includes('money')
  )
  const typeIndex = header.findIndex((h) =>
    h.includes('类型') || h.includes('收支') || h.includes('type')
  )
  const descIndex = header.findIndex((h) =>
    h.includes('描述') || h.includes('备注') || h.includes('说明') || h.includes('description')
  )

  if (dateIndex === -1 || amountIndex === -1) {
    return transactions
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]

    const dateStr = row[dateIndex]
    const amountStr = row[amountIndex]
    const typeStr = typeIndex !== -1 ? row[typeIndex] : ''
    const description = descIndex !== -1 ? row[descIndex] : ''

    const amount = parseFloat(amountStr?.replace(/[^0-9.-]/g, '') || '0')
    if (amount === 0) continue

    const date = new Date(dateStr).getTime()
    if (isNaN(date)) continue

    const type =
      typeStr?.includes('收入') || typeStr?.includes('income') || amount > 0
        ? 'income'
        : 'expense'

    transactions.push({
      accountId: 1,
      amount: Math.abs(amount),
      type,
      category: 'other',
      description,
      source: 'import',
      rawData: row.join(','),
      date,
      createdAt: Date.now(),
    })
  }

  return transactions
}

// 导入账单文件
export async function importBillFile(): Promise<BillImportResult> {
  const result: BillImportResult = {
    success: false,
    totalCount: 0,
    importedCount: 0,
    skippedCount: 0,
    errors: [],
    transactions: [],
  }

  try {
    // 选择文件
    const pickerResult = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
      copyToCacheDirectory: true,
    })

    if (pickerResult.canceled) {
      result.errors.push('用户取消了文件选择')
      return result
    }

    const file = pickerResult.assets[0]

    // 读取文件内容
    const content = await FileSystem.readAsStringAsync(file.uri, {
      encoding: 'utf8',
    })

    // 解析账单
    const transactions = detectAndParseBill(content)

    result.totalCount = transactions.length
    result.transactions = transactions
    result.importedCount = transactions.length
    result.success = transactions.length > 0

    if (transactions.length === 0) {
      result.errors.push('无法识别账单格式或账单为空')
    }
  } catch (error) {
    result.errors.push(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }

  return result
}
