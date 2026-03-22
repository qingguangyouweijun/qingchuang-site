import type { BookSettlementResult, ExpressQuoteInput, ExpressQuoteResult } from '@/lib/types'

const EXPRESS_RULES = {
  small: { price: 2, fee: 0.5 },
  medium: { price: 4, fee: 1 },
  large: { price: 6, fee: 1.5 },
  xlarge: { price: 8, fee: 1 },
} as const

export function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function normalizeCount(value: number | undefined) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(Number(value))) : 0
}

export function computeExpressQuote(input: ExpressQuoteInput): ExpressQuoteResult {
  const smallCount = normalizeCount(input.smallCount)
  const mediumCount = normalizeCount(input.mediumCount)
  const largeCount = normalizeCount(input.largeCount)
  const xlargeCount = normalizeCount(input.xlargeCount)
  const totalCount = smallCount + mediumCount + largeCount + xlargeCount
  const rawAmount =
    smallCount * EXPRESS_RULES.small.price +
    mediumCount * EXPRESS_RULES.medium.price +
    largeCount * EXPRESS_RULES.large.price +
    xlargeCount * EXPRESS_RULES.xlarge.price
  const discountAmount = totalCount >= 3 ? totalCount : 0
  const orderAmount = Math.max(0, rawAmount - discountAmount)
  const platformFee =
    smallCount * EXPRESS_RULES.small.fee +
    mediumCount * EXPRESS_RULES.medium.fee +
    largeCount * EXPRESS_RULES.large.fee +
    xlargeCount * EXPRESS_RULES.xlarge.fee

  return {
    smallCount,
    mediumCount,
    largeCount,
    xlargeCount,
    totalCount,
    rawAmount: roundMoney(rawAmount),
    discountAmount: roundMoney(discountAmount),
    orderAmount: roundMoney(orderAmount),
    platformFee: roundMoney(platformFee),
    runnerIncome: roundMoney(orderAmount - platformFee),
  }
}

export function computeBookSettlement(price: number): BookSettlementResult {
  const salePrice = roundMoney(Number(price || 0))
  const platformFee = 2
  const sellerIncome = Math.max(0, roundMoney(salePrice - platformFee))

  return {
    salePrice,
    platformFee,
    sellerIncome,
  }
}
