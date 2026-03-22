import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { MainLayout } from '@/components/Layout/MainLayout'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/Badge'
import { getCurrentUser } from '@/lib/actions/auth'
import {
  acceptExpressOrder,
  confirmExpressOrder,
  createCampusPayment,
  createExpressOrder,
  deliverExpressOrder,
  getCampusDashboard,
  listExpressOrders,
  pickupExpressOrder,
  syncCampusPayment,
} from '@/lib/actions/campus'
import { EXPRESS_STATUS_LABELS, PAY_TYPE_LABELS } from '@/lib/types'

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'warning' | 'success' | 'outline'> = {
  PENDING_PAYMENT: 'warning',
  OPEN: 'default',
  ACCEPTED: 'secondary',
  PICKED_UP: 'secondary',
  DELIVERED: 'warning',
  COMPLETED: 'success',
}

function getParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}

function messageUrl(base: string, key: 'notice' | 'error', message: string) {
  return `${base}?${key}=${encodeURIComponent(message)}`
}

function parseCodes(value: string) {
  return value
    .split(/\r?\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default async function CampusExpressPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const notice = getParam(params.notice)
  const error = getParam(params.error)
  const current = await getCurrentUser()

  async function createOrderAction(formData: FormData) {
    'use server'

    try {
      await createExpressOrder({
        pickupStation: String(formData.get('pickupStation') || ''),
        pickupCodes: parseCodes(String(formData.get('pickupCodes') || '')),
        deliveryBuilding: String(formData.get('deliveryBuilding') || ''),
        deliveryAddress: String(formData.get('deliveryAddress') || ''),
        expectedTime: String(formData.get('expectedTime') || ''),
        remark: String(formData.get('remark') || ''),
        smallCount: Number(formData.get('smallCount') || 0),
        mediumCount: Number(formData.get('mediumCount') || 0),
        largeCount: Number(formData.get('largeCount') || 0),
        xlargeCount: Number(formData.get('xlargeCount') || 0),
      })
      revalidatePath('/campus/express')
      redirect(messageUrl('/campus/express', 'notice', '快递订单已创建，请选择支付方式。'))
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : '创建快递订单失败。'
      redirect(messageUrl('/campus/express', 'error', message))
    }
  }

  async function paymentAction(formData: FormData) {
    'use server'

    try {
      const { payment } = await createCampusPayment({
        bizType: 'EXPRESS_ORDER',
        bizId: String(formData.get('orderId') || ''),
        payType: String(formData.get('payType') || 'wxpay') as 'wxpay' | 'alipay',
      })
      revalidatePath('/campus/express')
      if (payment.pay_url) {
        redirect(payment.pay_url)
      }
      redirect(messageUrl('/campus/express', 'notice', '支付链接已生成，请在支付平台完成付款。'))
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : '发起支付失败。'
      redirect(messageUrl('/campus/express', 'error', message))
    }
  }

  async function syncAction(formData: FormData) {
    'use server'

    try {
      await syncCampusPayment({
        bizType: 'EXPRESS_ORDER',
        bizId: String(formData.get('orderId') || ''),
      })
      revalidatePath('/campus/express')
      redirect(messageUrl('/campus/express', 'notice', '已同步最新支付状态。'))
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : '同步支付状态失败。'
      redirect(messageUrl('/campus/express', 'error', message))
    }
  }

  async function orderAction(formData: FormData) {
    'use server'

    const orderId = String(formData.get('orderId') || '')
    const intent = String(formData.get('intent') || '')

    try {
      if (intent === 'accept') {
        await acceptExpressOrder(orderId)
      }
      if (intent === 'pickup') {
        await pickupExpressOrder(orderId)
      }
      if (intent === 'deliver') {
        await deliverExpressOrder(orderId)
      }
      if (intent === 'confirm') {
        await confirmExpressOrder(orderId)
      }
      revalidatePath('/campus/express')
      redirect(messageUrl('/campus/express', 'notice', '订单状态已更新。'))
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : '订单操作失败。'
      redirect(messageUrl('/campus/express', 'error', message))
    }
  }

  if (!current) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-20">
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">请先登录后再使用快递代取</h1>
              <p className="text-gray-600">这里会统一处理快递下单、支付、接单和确认收货。</p>
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
    const [{ data: dashboard }, { orders: squareOrders }, { orders: myOrders }, { orders: runnerOrders }] = await Promise.all([
      getCampusDashboard(),
      listExpressOrders('square'),
      listExpressOrders('mine'),
      listExpressOrders('runner'),
    ])

    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto py-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">校园快递代取</h1>
              <p className="text-gray-600 mt-3 leading-7 max-w-3xl">
                支持小件、中件、大件、超大件合单。用户只看应付金额，支付完成后进入接单广场，接单员完成后收入进入待完成或可结算余额。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/70 px-4 py-3 border border-white/60">
                <div className="text-gray-500">可结算余额</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">￥{Number(dashboard.profile.campus_available_balance || 0).toFixed(2)}</div>
              </div>
              <div className="rounded-2xl bg-white/70 px-4 py-3 border border-white/60">
                <div className="text-gray-500">当前广场待接单</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{squareOrders.length}</div>
              </div>
            </div>
          </div>

          {(notice || error) && (
            <div className={`rounded-2xl px-5 py-4 text-sm ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {error || notice}
            </div>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>创建快递订单</CardTitle>
                <CardDescription>定价：小件 2 元 / 中件 4 元 / 大件 6 元 / 超大件 8 元；同单满 3 件后每件减 1 元。</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createOrderAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>取件点</span>
                    <input name="pickupStation" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" placeholder="例如：菜鸟驿站、南门快递点" required />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>送达时间</span>
                    <input name="expectedTime" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" placeholder="例如：今晚 21:00 前" required />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>楼栋</span>
                    <input name="deliveryBuilding" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" placeholder="例如：3 号楼" required />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>详细地址</span>
                    <input name="deliveryAddress" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" placeholder="例如：3 号楼 402" required />
                  </label>
                  <label className="md:col-span-2 space-y-2 text-sm text-gray-600">
                    <span>取件码</span>
                    <textarea name="pickupCodes" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 min-h-28" placeholder="支持一行一个，也支持逗号分隔" required />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>小件数量</span>
                    <input name="smallCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>中件数量</span>
                    <input name="mediumCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>大件数量</span>
                    <input name="largeCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>超大件数量</span>
                    <input name="xlargeCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" />
                  </label>
                  <label className="md:col-span-2 space-y-2 text-sm text-gray-600">
                    <span>备注</span>
                    <textarea name="remark" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 min-h-24" placeholder="例如：到楼下电话联系、包含易碎件等" />
                  </label>
                  <div className="md:col-span-2 flex items-center justify-between rounded-2xl bg-orange-50 px-4 py-4 text-sm text-gray-600">
                    <div>平台手续费不在下单页对用户展示；支付页只展示应付金额，支持微信支付和支付宝。</div>
                    <Button type="submit">提交订单</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>接单广场</CardTitle>
                <CardDescription>任何注册用户都可以接单，接单后对应收入先记到待完成余额。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {squareOrders.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">当前没有待接单的快递订单。</div>}
                {squareOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{order.order_no}</div>
                        <div className="text-sm text-gray-500 mt-1">{order.pickup_station} → {order.delivery_building} / 共 {order.total_count} 件</div>
                      </div>
                      <Badge variant={STATUS_VARIANTS[order.status] || 'outline'}>{EXPRESS_STATUS_LABELS[order.status]}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>应付金额：<span className="font-semibold text-gray-900">￥{Number(order.order_amount).toFixed(2)}</span></div>
                      <div>接单可得：<span className="font-semibold text-orange-600">￥{Number(order.runner_income).toFixed(2)}</span></div>
                      <div>送达时间：{order.expected_time}</div>
                      <div>取件码：{Array.isArray(order.pickup_codes) ? order.pickup_codes.join(' / ') : ''}</div>
                    </div>
                    <form action={orderAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="intent" value="accept" />
                      <Button type="submit" size="sm">立即接单</Button>
                    </form>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>我下的快递单</CardTitle>
                <CardDescription>未支付订单可直接发起微信支付或支付宝支付；支付完成后可同步支付状态。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myOrders.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">你还没有发起快递订单。</div>}
                {myOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{order.order_no}</div>
                        <div className="text-sm text-gray-500 mt-1">{order.delivery_building} / {order.delivery_address}</div>
                      </div>
                      <Badge variant={STATUS_VARIANTS[order.status] || 'outline'}>{EXPRESS_STATUS_LABELS[order.status]}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>应付金额：<span className="font-semibold text-gray-900">￥{Number(order.order_amount).toFixed(2)}</span></div>
                      <div>支付方式：{order.pay_type ? PAY_TYPE_LABELS[order.pay_type] : '未支付'}</div>
                      <div>件数：{order.total_count} 件</div>
                      <div>送达时间：{order.expected_time}</div>
                    </div>
                    {order.status === 'PENDING_PAYMENT' && (
                      <div className="flex flex-wrap gap-3">
                        <form action={paymentAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="payType" value="wxpay" />
                          <Button type="submit" size="sm">微信支付</Button>
                        </form>
                        <form action={paymentAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="payType" value="alipay" />
                          <Button type="submit" size="sm" variant="secondary">支付宝支付</Button>
                        </form>
                      </div>
                    )}
                    {(order.status === 'PENDING_PAYMENT' || order.status === 'OPEN') && (
                      <form action={syncAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <Button type="submit" size="sm" variant="outline">同步支付状态</Button>
                      </form>
                    )}
                    {order.status === 'DELIVERED' && (
                      <form action={orderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="intent" value="confirm" />
                        <Button type="submit" size="sm">确认收货</Button>
                      </form>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>我接的快递单</CardTitle>
                <CardDescription>接单后先进入待完成收入；用户确认收货后转为可结算余额。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {runnerOrders.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">你还没有接过快递单。</div>}
                {runnerOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{order.order_no}</div>
                        <div className="text-sm text-gray-500 mt-1">{order.pickup_station} → {order.delivery_building}</div>
                      </div>
                      <Badge variant={STATUS_VARIANTS[order.status] || 'outline'}>{EXPRESS_STATUS_LABELS[order.status]}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>可得收入：<span className="font-semibold text-orange-600">￥{Number(order.runner_income).toFixed(2)}</span></div>
                      <div>件数：{order.total_count} 件</div>
                      <div>送达时间：{order.expected_time}</div>
                      <div>取件码：{Array.isArray(order.pickup_codes) ? order.pickup_codes.join(' / ') : ''}</div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {order.status === 'ACCEPTED' && (
                        <form action={orderAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="intent" value="pickup" />
                          <Button type="submit" size="sm">标记已取件</Button>
                        </form>
                      )}
                      {(order.status === 'ACCEPTED' || order.status === 'PICKED_UP') && (
                        <form action={orderAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="intent" value="deliver" />
                          <Button type="submit" size="sm" variant="secondary">标记已送达</Button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </MainLayout>
    )
  } catch (loadError) {
    const message = loadError instanceof Error ? loadError.message : '快递模块加载失败。'

    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-20">
          <Card>
            <CardContent className="p-10 space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">快递模块暂时不可用</h1>
              <p className="text-gray-600 leading-7">{message}</p>
              <p className="text-sm text-gray-500 leading-7">如果你刚接入新功能，先执行最新 Supabase schema，并配置 `SUPABASE_SERVICE_ROLE_KEY` 后再刷新。</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }
}
