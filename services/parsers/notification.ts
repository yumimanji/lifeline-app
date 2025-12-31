import type { NotificationParseResult } from '../../lib/types'

// 微信支付通知解析
export function parseWechatNotification(text: string): NotificationParseResult {
  const result: NotificationParseResult = {
    success: false,
    source: 'wechat',
    rawText: text,
  }

  // 微信支付成功通知格式示例:
  // "微信支付: 你在XXX消费了XX.XX元"
  // "微信支付收款XX.XX元"
  // "收到XXX转账XX.XX元"

  // 支出模式
  const expensePatterns = [
    /消费了?(\d+\.?\d*)元/,
    /支付(\d+\.?\d*)元/,
    /付款(\d+\.?\d*)元/,
    /扣款(\d+\.?\d*)元/,
  ]

  // 收入模式
  const incomePatterns = [
    /收款(\d+\.?\d*)元/,
    /收到.*?(\d+\.?\d*)元/,
    /转账(\d+\.?\d*)元.*收到/,
    /到账(\d+\.?\d*)元/,
  ]

  // 商户名提取
  const merchantPatterns = [
    /在(.+?)消费/,
    /向(.+?)付款/,
    /(.+?)收款/,
    /收到(.+?)转账/,
  ]

  // 尝试匹配支出
  for (const pattern of expensePatterns) {
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
    for (const pattern of incomePatterns) {
      const match = text.match(pattern)
      if (match) {
        result.success = true
        result.amount = parseFloat(match[1])
        result.type = 'income'
        break
      }
    }
  }

  // 提取商户名
  for (const pattern of merchantPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.merchant = match[1].trim()
      break
    }
  }

  return result
}

// 支付宝通知解析
export function parseAlipayNotification(text: string): NotificationParseResult {
  const result: NotificationParseResult = {
    success: false,
    source: 'alipay',
    rawText: text,
  }

  // 支付宝通知格式示例:
  // "支付宝: 你已成功付款XX.XX元给XXX"
  // "支付宝: 收到XXX转账XX.XX元"
  // "支付宝: 你在XXX消费XX.XX元"

  // 支出模式
  const expensePatterns = [
    /付款(\d+\.?\d*)元/,
    /消费(\d+\.?\d*)元/,
    /支付(\d+\.?\d*)元/,
    /扣款(\d+\.?\d*)元/,
  ]

  // 收入模式
  const incomePatterns = [
    /收到.*?(\d+\.?\d*)元/,
    /到账(\d+\.?\d*)元/,
    /转入(\d+\.?\d*)元/,
    /退款(\d+\.?\d*)元/,
  ]

  // 商户名提取
  const merchantPatterns = [
    /付款.*?给(.+?)$/,
    /在(.+?)消费/,
    /收到(.+?)转账/,
    /(.+?)退款/,
  ]

  // 尝试匹配支出
  for (const pattern of expensePatterns) {
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
    for (const pattern of incomePatterns) {
      const match = text.match(pattern)
      if (match) {
        result.success = true
        result.amount = parseFloat(match[1])
        result.type = 'income'
        break
      }
    }
  }

  // 提取商户名
  for (const pattern of merchantPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.merchant = match[1].trim()
      break
    }
  }

  return result
}

// 通用通知解析入口
export function parsePaymentNotification(
  packageName: string,
  text: string
): NotificationParseResult {
  // 微信
  if (packageName === 'com.tencent.mm' || text.includes('微信')) {
    return parseWechatNotification(text)
  }

  // 支付宝
  if (packageName === 'com.eg.android.AlipayGphone' || text.includes('支付宝')) {
    return parseAlipayNotification(text)
  }

  // 未知来源，尝试通用解析
  return {
    success: false,
    source: 'unknown',
    rawText: text,
  }
}
