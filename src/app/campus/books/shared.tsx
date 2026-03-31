import { getSession } from '@/lib/actions/auth'
import { listBookOrders, listBookPosts } from '@/lib/actions/campus'
import type { CampusBookOrder, CampusBookPost } from '@/lib/types'

export const BOOK_ORDER_LABELS = {
  PENDING_PAYMENT: '待支付',
  WAITING_SELLER: '待卖家送达',
  DELIVERED: '待确认收货',
  COMPLETED: '已完成',
} as const

export const BOOK_POST_LABELS = {
  ON_SALE: '在售',
  LOCKED: '已锁定',
  SOLD: '已售出',
  OFF_SHELF: '已下架',
} as const

export const PAY_LABELS = {
  alipay: '支付宝',
  wxpay: '微信支付',
} as const

export const ORDER_VARIANTS: Record<string, 'default' | 'secondary' | 'warning' | 'success' | 'outline'> = {
  PENDING_PAYMENT: 'warning',
  WAITING_SELLER: 'secondary',
  DELIVERED: 'warning',
  COMPLETED: 'success',
}

export const POST_VARIANTS: Record<string, 'default' | 'secondary' | 'warning' | 'success' | 'outline'> = {
  ON_SALE: 'success',
  LOCKED: 'warning',
  SOLD: 'secondary',
  OFF_SHELF: 'outline',
}

export function getParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}

function resolveCollection<T>(
  result: PromiseSettledResult<T>,
  warnings: string[],
  label: string,
  picker: (value: T) => CampusBookPost[] | CampusBookOrder[],
) {
  if (result.status === 'fulfilled') {
    return picker(result.value)
  }

  warnings.push(label)
  return []
}

export async function getBooksPageState(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
) {
  const params = await searchParams
  const session = await getSession()
  const notice = getParam(params.notice)
  const error = getParam(params.error)

  if (!session) {
    return {
      session,
      notice,
      error,
      warnings: [] as string[],
      marketPosts: [] as CampusBookPost[],
      myPosts: [] as CampusBookPost[],
      buyerOrders: [] as CampusBookOrder[],
      sellerOrders: [] as CampusBookOrder[],
    }
  }

  const warnings: string[] = []
  const [marketResult, myPostsResult, buyerResult, sellerResult] = await Promise.allSettled([
    listBookPosts('market'),
    listBookPosts('mine'),
    listBookOrders('buyer'),
    listBookOrders('seller'),
  ])

  const marketPosts = resolveCollection(marketResult, warnings, '旧书广场', (value) => value.posts) as CampusBookPost[]
  const myPosts = resolveCollection(myPostsResult, warnings, '我发布的旧书', (value) => value.posts) as CampusBookPost[]
  const buyerOrders = resolveCollection(buyerResult, warnings, '我买到的旧书', (value) => value.orders) as CampusBookOrder[]
  const sellerOrders = resolveCollection(sellerResult, warnings, '我卖出的旧书', (value) => value.orders) as CampusBookOrder[]

  return {
    session,
    notice,
    error,
    warnings,
    marketPosts,
    myPosts,
    buyerOrders,
    sellerOrders,
  }
}
