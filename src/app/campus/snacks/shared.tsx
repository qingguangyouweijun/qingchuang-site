import { getSession } from "@/lib/actions/auth"
import { listSnackOrders, listSnackProducts } from "@/lib/actions/campus"
import type { CampusSnackOrder, CampusSnackProduct } from "@/lib/types"

export const SNACK_ORDER_LABELS = {
  PENDING_PAYMENT: "待支付",
  PAID: "已支付",
  COMPLETED: "已完成",
} as const

export const SNACK_PRODUCT_LABELS = {
  ON_SALE: "在售",
  SOLD_OUT: "售罄",
  OFF_SHELF: "已下架",
} as const

export const PAY_LABELS = {
  alipay: "支付宝",
  wxpay: "微信支付",
} as const

export const ORDER_VARIANTS: Record<string, "default" | "secondary" | "warning" | "success" | "outline"> = {
  PENDING_PAYMENT: "warning",
  PAID: "secondary",
  COMPLETED: "success",
}

export const PRODUCT_VARIANTS: Record<string, "default" | "secondary" | "warning" | "success" | "outline"> = {
  ON_SALE: "success",
  SOLD_OUT: "warning",
  OFF_SHELF: "outline",
}

export function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : ""
}

function resolveCollection<T>(
  result: PromiseSettledResult<T>,
  warnings: string[],
  label: string,
  picker: (value: T) => CampusSnackProduct[] | CampusSnackOrder[],
) {
  if (result.status === "fulfilled") {
    return picker(result.value)
  }

  warnings.push(label)
  return []
}

export async function getSnacksPageState(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
) {
  const params = await searchParams
  const notice = getParam(params.notice)
  const error = getParam(params.error)
  const selectedProductId = getParam(params.product)
  const session = await getSession().catch(() => null)

  const warnings: string[] = []
  const [productsResult, ordersResult] = await Promise.allSettled([
    listSnackProducts(),
    session ? listSnackOrders() : Promise.resolve({ orders: [] as CampusSnackOrder[] }),
  ])

  const products = resolveCollection(productsResult, warnings, "零食快递货架", (value) => value.products) as CampusSnackProduct[]
  const orders = resolveCollection(ordersResult, warnings, "我的零食订单", (value) => value.orders) as CampusSnackOrder[]
  const selectedProduct = products.find((product) => product.id === selectedProductId) || products[0] || null

  return {
    session,
    notice,
    error,
    warnings,
    selectedProductId,
    selectedProduct,
    products,
    orders,
  }
}

