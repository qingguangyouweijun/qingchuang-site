import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Badge } from "@/components/UI/Badge"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card"
import { getSession } from "@/lib/actions/auth"
import { listBookOrders, listExpressOrders } from "@/lib/actions/campus"
import type { BookOrderStatus, CampusBookOrder, CampusExpressOrder, ExpressOrderStatus } from "@/lib/types"

const EXPRESS_STATUS_LABELS: Record<ExpressOrderStatus, string> = {
  PENDING_PAYMENT: "待支付",
  OPEN: "待接单",
  ACCEPTED: "已接单",
  PICKED_UP: "已取件",
  DELIVERED: "已送达",
  COMPLETED: "已完成",
}

const BOOK_ORDER_STATUS_LABELS: Record<BookOrderStatus, string> = {
  PENDING_PAYMENT: "待支付",
  WAITING_SELLER: "待卖家送达",
  DELIVERED: "待确认收货",
  COMPLETED: "已完成",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "warning" | "success" | "outline"> = {
  PENDING_PAYMENT: "warning",
  OPEN: "default",
  ACCEPTED: "secondary",
  PICKED_UP: "secondary",
  DELIVERED: "warning",
  COMPLETED: "success",
  WAITING_SELLER: "secondary",
}

function resolveCollection<T>(
  result: PromiseSettledResult<T>,
  warnings: string[],
  label: string,
  picker: (value: T) => unknown[],
) {
  if (result.status === "fulfilled") {
    return picker(result.value)
  }

  warnings.push(label)
  return [] as unknown[]
}

function getExpressStatusLabel(status: string) {
  return EXPRESS_STATUS_LABELS[status as ExpressOrderStatus] || status
}

function getBookOrderStatusLabel(status: string) {
  return BOOK_ORDER_STATUS_LABELS[status as BookOrderStatus] || status
}

export default async function CampusOrdersPage() {
  const session = await getSession()

  if (!session) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-5xl py-8 space-y-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            返回我的
          </Link>
          <Card>
            <CardContent className="space-y-4 p-10 text-center">
              <h1 className="text-3xl font-bold text-slate-900">请先登录后查看订单中心</h1>
              <p className="text-slate-600">订单中心会汇总快递代取和旧书交易的全部订单视角。</p>
              <div className="flex justify-center gap-4">
                <Link href="/auth/login">
                  <Button>去登录</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="outline">邮箱注册</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const warnings: string[] = []
  const [myExpressResult, runnerExpressResult, buyerOrdersResult, sellerOrdersResult] = await Promise.allSettled([
    listExpressOrders("mine"),
    listExpressOrders("runner"),
    listBookOrders("buyer"),
    listBookOrders("seller"),
  ])

  const myExpress = resolveCollection(myExpressResult, warnings, "我下的快递单", (value) => value.orders) as CampusExpressOrder[]
  const runnerExpress = resolveCollection(runnerExpressResult, warnings, "我接的快递单", (value) => value.orders) as CampusExpressOrder[]
  const buyerOrders = resolveCollection(buyerOrdersResult, warnings, "我买到的旧书", (value) => value.orders) as CampusBookOrder[]
  const sellerOrders = resolveCollection(sellerOrdersResult, warnings, "我卖出的旧书", (value) => value.orders) as CampusBookOrder[]

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8 py-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回我的
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">订单中心</h1>
            <p className="mt-3 text-slate-600 leading-7">
              订单中心已经收进“我的”页面。这里统一查看快递代取和旧书交易的下单、接单、购买与卖出记录。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/campus/express">
              <Button variant="outline">去快递代取</Button>
            </Link>
            <Link href="/campus/books">
              <Button>去旧书广场</Button>
            </Link>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            当前部分订单数据还在同步中：{warnings.join("、")} 暂时为空。
          </div>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我下的快递单</CardTitle>
              <CardDescription>支付和确认收货请继续回到快递代取页面操作。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myExpress.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">暂时没有我下的快递单。</div>
              )}
              {myExpress.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.order_no}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {order.pickup_station} → {order.delivery_building} / ¥{Number(order.order_amount).toFixed(2)}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status] || "outline"}>
                    {getExpressStatusLabel(order.status)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我接的快递单</CardTitle>
              <CardDescription>接单收入会在用户确认收货后进入校园钱包的可结算余额。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {runnerExpress.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">暂时没有我接的快递单。</div>
              )}
              {runnerExpress.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.order_no}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {order.pickup_station} → {order.delivery_building} / 可得 ¥{Number(order.runner_income).toFixed(2)}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status] || "outline"}>
                    {getExpressStatusLabel(order.status)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我买到的旧书</CardTitle>
              <CardDescription>买家订单会在这里汇总，支付和确认收货请回到旧书广场页面继续操作。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {buyerOrders.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">暂时没有我买到的旧书订单。</div>
              )}
              {buyerOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.book_title}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      订单号：{order.order_no} / 楼栋：{order.delivery_building} / ¥{Number(order.sale_price).toFixed(2)}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status] || "outline"}>
                    {getBookOrderStatusLabel(order.status)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我卖出的旧书</CardTitle>
              <CardDescription>买家确认收货后，卖家到手金额才会真正进入校园钱包。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sellerOrders.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">暂时没有我卖出的旧书订单。</div>
              )}
              {sellerOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.book_title}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      订单号：{order.order_no} / 买家楼栋：{order.delivery_building} / 到手 ¥{Number(order.seller_income).toFixed(2)}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status] || "outline"}>
                    {getBookOrderStatusLabel(order.status)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  )
}
