import type { SmsParseResult } from '../../lib/types'

// 银行短信解析器
// 支持主流银行的交易短信格式

interface BankPattern {
  name: string
  keywords: string[]
  expensePatterns: RegExp[]
  incomePatterns: RegExp[]
  balancePattern?: RegExp
  cardPattern?: RegExp
}

const bankPatterns: BankPattern[] = [
  {
    name: '工商银行',
    keywords: ['工商银行', '工行', 'ICBC'],
    expensePatterns: [
      /支出.*?(\d+\.?\d*)元/,
      /消费.*?(\d+\.?\d*)元/,
      /转出.*?(\d+\.?\d*)元/,
    ],
    incomePatterns: [
      /收入.*?(\d+\.?\d*)元/,
      /转入.*?(\d+\.?\d*)元/,
      /存入.*?(\d+\.?\d*)元/,
    ],
    balancePattern: /余额.*?(\d+\.?\d*)元/,
    cardPattern: /尾号(\d{4})/,
  },
  {
    name: '建设银行',
    keywords: ['建设银行', '建行', 'CCB'],
    expensePatterns: [
      /支出(\d+\.?\d*)元/,
      /消费(\d+\.?\d*)元/,
      /转出(\d+\.?\d*)元/,
    ],
    incomePatterns: [
      /收入(\d+\.?\d*)元/,
      /转入(\d+\.?\d*)元/,
      /存入(\d+\.?\d*)元/,
    ],
    balancePattern: /余额(\d+\.?\d*)元/,
    cardPattern: /尾号(\d{4})/,
  },
  {
    name: '招商银行',
    keywords: ['招商银行', '招行', 'CMB'],
    expensePatterns: [
      /支出(\d+\.?\d*)/,
      /消费(\d+\.?\d*)/,
      /转出(\d+\.?\d*)/,
    ],
    incomePatterns: [
      /收入(\d+\.?\d*)/,
      /转入(\d+\.?\d*)/,
      /存入(\d+\.?\d*)/,
    ],
    balancePattern: /余额(\d+\.?\d*)/,
    cardPattern: /(\d{4})卡/,
  },
  {
    name: '农业银行',
    keywords: ['农业银行', '农行', 'ABC'],
    expensePatterns: [
      /支出.*?(\d+\.?\d*)元/,
      /消费.*?(\d+\.?\d*)元/,
    ],
    incomePatterns: [
      /收入.*?(\d+\.?\d*)元/,
      /转入.*?(\d+\.?\d*)元/,
    ],
    balancePattern: /余额.*?(\d+\.?\d*)元/,
    cardPattern: /尾号(\d{4})/,
  },
  {
    name: '中国银行',
    keywords: ['中国银行', '中行', 'BOC'],
    expensePatterns: [
      /支出(\d+\.?\d*)元/,
      /消费(\d+\.?\d*)元/,
    ],
    incomePatterns: [
      /收入(\d+\.?\d*)元/,
      /转入(\d+\.?\d*)元/,
    ],
    balancePattern: /余额(\d+\.?\d*)元/,
    cardPattern: /尾号(\d{4})/,
  },
  {
    name: '交通银行',
    keywords: ['交通银行', '交行', 'BOCOM'],
    expensePatterns: [
      /支出(\d+\.?\d*)元/,
      /消费(\d+\.?\d*)元/,
    ],
    incomePatterns: [
      /收入(\d+\.?\d*)元/,
      /转入(\d+\.?\d*)元/,
    ],
    balancePattern: /余额(\d+\.?\d*)元/,
    cardPattern: /尾号(\d{4})/,
  },
]

// 通用金额提取模式
const genericAmountPatterns = {
  expense: [
    /支出[人民币RMB￥¥]*(\d+\.?\d*)/i,
    /消费[人民币RMB￥¥]*(\d+\.?\d*)/i,
    /转出[人民币RMB￥¥]*(\d+\.?\d*)/i,
    /付款[人民币RMB￥¥]*(\d+\.?\d*)/i,
    /扣款[人民币RMB￥¥]*(\d+\.?\d*)/i,
  ],
  income: [
    /收入[人民币RMB￥¥]*(\d+\.?\d*)/i,
    /转入[人民币RMB￥¥]*(\d+\.?\d*)/i,
    /存入[人民币RMB￥¥]*(\d+\.?\d*)/i,
    /到账[人民币RMB￥¥]*(\d+\.?\d*)/i,
    /入账[人民币RMB￥¥]*(\d+\.?\d*)/i,
  ],
}

export function parseBankSms(text: string): SmsParseResult {
  const result: SmsParseResult = {
    success: false,
    rawText: text,
  }

  // 识别银行
  let matchedBank: BankPattern | null = null
  for (const bank of bankPatterns) {
    if (bank.keywords.some((keyword) => text.includes(keyword))) {
      matchedBank = bank
      result.bankName = bank.name
      break
    }
  }

  const patterns = matchedBank || {
    expensePatterns: genericAmountPatterns.expense,
    incomePatterns: genericAmountPatterns.income,
  }

  // 尝试匹配支出
  for (const pattern of patterns.expensePatterns) {
    const match = text.match(pattern)
    if (match) {
      result.success = true
      result.amount = parseFloat(match[1])
      result.type = 'expense'
      break
    }
  }

  // 尝试匹配收入
  if (!result.success) {
    for (const pattern of patterns.incomePatterns) {
      const match = text.match(pattern)
      if (match) {
        result.success = true
        result.amount = parseFloat(match[1])
        result.type = 'income'
        break
      }
    }
  }

  // 提取卡号后四位
  if (matchedBank?.cardPattern) {
    const cardMatch = text.match(matchedBank.cardPattern)
    if (cardMatch) {
      result.cardLast4 = cardMatch[1]
    }
  } else {
    const genericCardMatch = text.match(/尾号(\d{4})/)
    if (genericCardMatch) {
      result.cardLast4 = genericCardMatch[1]
    }
  }

  // 提取余额
  if (matchedBank?.balancePattern) {
    const balanceMatch = text.match(matchedBank.balancePattern)
    if (balanceMatch) {
      result.balance = parseFloat(balanceMatch[1])
    }
  } else {
    const genericBalanceMatch = text.match(/余额[人民币RMB￥¥]*(\d+\.?\d*)/i)
    if (genericBalanceMatch) {
      result.balance = parseFloat(genericBalanceMatch[1])
    }
  }

  // 尝试提取商户名
  const merchantPatterns = [
    /在(.+?)消费/,
    /向(.+?)转/,
    /(.+?)支付/,
    /收到(.+?)转/,
  ]
  for (const pattern of merchantPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.merchant = match[1].trim()
      break
    }
  }

  return result
}

// 判断是否为银行短信
export function isBankSms(text: string): boolean {
  const bankKeywords = [
    '银行', '信用卡', '储蓄卡', '借记卡',
    '支出', '收入', '转账', '消费',
    '余额', '尾号', '账户',
    'ICBC', 'CCB', 'CMB', 'ABC', 'BOC',
  ]

  return bankKeywords.some((keyword) => text.includes(keyword))
}
