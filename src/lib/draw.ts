export const DRAW_PRICING = {
  BASIC: { normal: 2.48, discounted: 1.68 },
  PREMIUM: { normal: 4.68, discounted: 3.48 },
} as const

export type DrawType = 'BASIC' | 'PREMIUM'
