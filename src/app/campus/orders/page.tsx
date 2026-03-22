import Link from 'next/link'
import { MainLayout } from '@/components/Layout/MainLayout'
import { CampusSubnav } from '@/components/campus/CampusSubnav'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/Badge'
import { getSession } from '@/lib/actions/auth'
import { listBookOrders, listExpressOrders } from '@/lib/actions/campus'
import { BOOK_ORDER_STATUS_LABELS, EXPRESS_STATUS_LABELS } from '@/lib/types'

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'warning' | 'success' | 'outline'> = {
  PENDING_PAYMENT: 'warning',
  OPEN: 'default',
  ACCEPTED: 'secondary',
  PICKED_UP: 'secondary',
  DELIVERED: 'warning',
  COMPLETED: 'success',
  WAITING_SELLER: 'secondary',
}

function resolveCollection<T>(result: PromiseSettledResult<T>, warnings: string[], label: string, picker: (value: T) => any[]) {
  if (result.status === 'fulfilled') {
    return picker(result.value)
  }

  warnings.push(label)
  return [] as any[]
}

export default async function CampusOrdersPage() {
  const session = await getSession()

  if (!session) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto py-8 space-y-6">
          <CampusSubnav />
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <h1 className="text-3xl font-bold text-slate-900">请先登录后查看订单中心</h1>
              <p className="text-slate-600">订单中心会汇总快递订单和旧书订单。</p>
              <div className="flex justify-center gap-4">
                <Link href="/auth/login"><Button>去登录</Button></Link>
                <Link href="/auth/register"><Button variant="outline">邮箱注册</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const warnings: string[] = []
  const [myExpressResult, runnerExpressResult, buyerOrdersResult, sellerOrdersResult] = await Promise.allSettled([
    listExpressOrders('mine'),
    listExpressOrders('runner'),
    listBookOrders('buyer'),
    listBookOrders('seller'),
  ])

  const myExpress = resolveCollection(myExpressResult, warnings, '我发起的快递单', (value) => value.orders)
  const runnerExpress = resolveCollection(runnerExpressResult, warnings, '我接到的快递单', (value) => value.orders)
  const buyerOrders = resolveCollection(buyerOrdersResult, warnings, '我买到的旧书', (value) => value.orders)
  const sellerOrders = resolveCollection(sellerOrdersResult, warnings, '我卖出的旧书', (value) => value.orders)

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <CampusSubnav />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">订单中心</h1>
            <p className="mt-3 text-slate-600 leading-7">这里统一汇总校园快递代取和旧书交易的四类订单视角。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/campus/express"><Button variant="outline">去快递页操作</Button></Link>
            <Link href="/campus/books"><Button>去旧书页操作</Button></Link>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            当前订单数据还在同步中，{warnings.join('、')} 可能暂时为空。
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我发起的快递单</CardTitle>
              <CardDescription>支付和确认收货请继续在快递页处理。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myExpress.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">暂无我发起的快递单。</div>}
              {myExpress.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.order_no}</div>
                    <div className="mt-1 text-sm text-slate-500">{order.pickup_station} → {order.delivery_building} / ￥{Number(order.order_amount).toFixed(2)}</div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>{EXPRESS_STATUS_LABELS[order.status as keyof typeof EXPRESS_STATUS_LABELS] || order.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我接到的快递单</CardTitle>
              <CardDescription>接单收入会在用户确认收货后进入可结算余额。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {runnerExpress.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">暂无我接到的快递单。</div>}
              {runnerExpress.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.order_no}</div>
                    <div className="mt-1 text-sm text-slate-500">{order.pickup_station} → {order.delivery_building} / 可得 ￥{Number(order.runner_income).toFixed(2)}</div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>{EXPRESS_STATUS_LABELS[order.status as keyof typeof EXPRESS_STATUS_LABELS] || order.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我买到的旧书</CardTitle>
              <CardDescription>买家订单统一在这里查看，支付和确认收货请回旧书页继续操作。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {buyerOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">暂无我买到的旧书订单。</div>}
              {buyerOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.book_title}</div>
                    <div className="mt-1 text-sm text-slate-500">订单号：{order.order_no} / 楼栋：{order.delivery_building} / ￥{Number(order.sale_price).toFixed(2)}</div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[order.status as keyof typeof BOOK_ORDER_STATUS_LABELS] || order.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我卖出的旧书</CardTitle>
              <CardDescription>买家确认收货后，到手价才会真正计入校园钱包。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sellerOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">暂无我卖出的旧书订单。</div>}
              {sellerOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.book_title}</div>
                    <div className="mt-1 text-sm text-slate-500">订单号：{order.order_no} / 买家楼栋：{order.delivery_building} / 到手 ￥{Number(order.seller_income).toFixed(2)}</div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[order.status as keyof typeof BOOK_ORDER_STATUS_LABELS] || order.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  )
}