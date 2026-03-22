import Link from 'next/link'
import { MainLayout } from '@/components/Layout/MainLayout'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/Badge'
import { getCurrentUser } from '@/lib/actions/auth'
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

export default async function CampusOrdersPage() {
  const current = await getCurrentUser()

  if (!current) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-20">
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">请先登录后查看订单中心</h1>
              <p className="text-gray-600">订单中心会汇总快递订单和旧书订单。</p>
              <div className="flex justify-center gap-4">
                <Link href="/auth/login"><Button>去登录</Button></Link>
                <Link href="/auth/register"><Button variant="outline">注册账号</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  try {
    const [{ orders: myExpress }, { orders: runnerExpress }, { orders: buyerOrders }, { orders: sellerOrders }] = await Promise.all([
      listExpressOrders('mine'),
      listExpressOrders('runner'),
      listBookOrders('buyer'),
      listBookOrders('seller'),
    ])

    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto py-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">订单中心</h1>
              <p className="text-gray-600 mt-3 leading-7">这里统一汇总校园快递代取和旧书交易的四类订单视角。</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/campus/express"><Button variant="outline">去快递页操作</Button></Link>
              <Link href="/campus/books"><Button>去旧书页操作</Button></Link>
            </div>
          </div>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>我发起的快递单</CardTitle>
                <CardDescription>支付、确认收货等动作请在快递页继续操作。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myExpress.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">暂无我发起的快递单。</div>}
                {myExpress.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-gray-900">{order.order_no}</div>
                      <div className="text-sm text-gray-500 mt-1">{order.pickup_station} → {order.delivery_building} / ￥{Number(order.order_amount).toFixed(2)}</div>
                    </div>
                    <Badge variant={STATUS_VARIANTS[order.status] || 'outline'}>{EXPRESS_STATUS_LABELS[order.status]}</Badge>
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
                {runnerExpress.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">暂无我接到的快递单。</div>}
                {runnerExpress.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-gray-900">{order.order_no}</div>
                      <div className="text-sm text-gray-500 mt-1">{order.pickup_station} → {order.delivery_building} / 可得 ￥{Number(order.runner_income).toFixed(2)}</div>
                    </div>
                    <Badge variant={STATUS_VARIANTS[order.status] || 'outline'}>{EXPRESS_STATUS_LABELS[order.status]}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>我买到的旧书</CardTitle>
                <CardDescription>买家订单统一在这里查看，支付和确认收货请回旧书页操作。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {buyerOrders.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">暂无我买到的旧书订单。</div>}
                {buyerOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-gray-900">{order.book_title}</div>
                      <div className="text-sm text-gray-500 mt-1">订单号：{order.order_no} / 楼栋：{order.delivery_building} / ￥{Number(order.sale_price).toFixed(2)}</div>
                    </div>
                    <Badge variant={STATUS_VARIANTS[order.status] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[order.status]}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>我卖出的旧书</CardTitle>
                <CardDescription>买家确认收货后，到手价才会真正计入你的校园钱包可结算余额。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sellerOrders.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">暂无我卖出的旧书订单。</div>}
                {sellerOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-gray-900">{order.book_title}</div>
                      <div className="text-sm text-gray-500 mt-1">订单号：{order.order_no} / 买家楼栋：{order.delivery_building} / 到手 ￥{Number(order.seller_income).toFixed(2)}</div>
                    </div>
                    <Badge variant={STATUS_VARIANTS[order.status] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[order.status]}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </MainLayout>
    )
  } catch (loadError) {
    const message = loadError instanceof Error ? loadError.message : '订单中心加载失败。'

    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-20">
          <Card>
            <CardContent className="p-10 space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">订单中心暂时不可用</h1>
              <p className="text-gray-600 leading-7">{message}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }
}
