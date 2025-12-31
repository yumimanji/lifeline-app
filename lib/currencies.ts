import type { CurrencyConfig } from './types'

export const currencies: CurrencyConfig[] = [
  { code: 'CNY', symbol: '¥', name: '人民币', decimalPlaces: 2 },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 },
  { code: 'JPY', symbol: '¥', name: '日本円', decimalPlaces: 0 },
  { code: 'KRW', symbol: '₩', name: '한국 원', decimalPlaces: 0 },
  { code: 'HKD', symbol: 'HK$', name: '港币', decimalPlaces: 2 },
  { code: 'TWD', symbol: 'NT$', name: '新台幣', decimalPlaces: 0 },
]

export function getCurrencyByCode(code: string): CurrencyConfig {
  return currencies.find((c) => c.code === code) || currencies[0]
}

export function formatCurrency(
  amount: number,
  currencyCode: string = 'CNY',
  showSymbol: boolean = true
): string {
  const currency = getCurrencyByCode(currencyCode)
  const formatted = Math.abs(amount).toFixed(currency.decimalPlaces)

  // Add thousand separators
  const parts = formatted.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const formattedWithSeparators = parts.join('.')

  const sign = amount < 0 ? '-' : ''
  return showSymbol
    ? `${sign}${currency.symbol}${formattedWithSeparators}`
    : `${sign}${formattedWithSeparators}`
}

export function parseCurrencyInput(input: string): number {
  // Remove currency symbols and separators
  const cleaned = input.replace(/[^0-9.-]/g, '')
  return parseFloat(cleaned) || 0
}
