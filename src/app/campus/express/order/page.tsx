import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/Badge'
import { getSession } from '@/lib/actions/auth'
import {
  confirmExpressOrder,
  createCampusPayment,
  createExpressOrder,
  listExpressOrders,
  syncCampusPayment,
} from '@/lib/actions/campus'
import { EXPRESS_STATUS_LABELS, PAY_TYPE_LABELS } from '@/lib/types'
import type { CampusExpressOrder } from '@/lib/types'

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

function revalidateExpressPaths() {
  revalidatePath('/campus/express')
  revalidatePath('/campus/express/order')
  revalidatePath('/campus/express/runner')
  revalidatePath('/campus/orders')
}

export default async function CampusExpressOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const notice = getParam(params.notice)
  const error = getParam(params.error)
  const session = await getSession()

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
      revalidateExpressPaths()
      redirect(messageUrl('/campus/express/order', 'notice', '快递订单已创建，请继续完成支付。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '创建快递订单失败。'
      redirect(messageUrl('/campus/express/order', 'error', message))
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
      revalidateExpressPaths()
      if (payment.pay_url) {
        redirect(payment.pay_url)
      }
      redirect(messageUrl('/campus/express/order', 'notice', '支付链接已生成，请在支付平台完成付款。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '发起支付失败。'
      redirect(messageUrl('/campus/express/order', 'error', message))
    }
  }

  async function syncAction(formData: FormData) {
    'use server'

    try {
      await syncCampusPayment({
        bizType: 'EXPRESS_ORDER',
        bizId: String(formData.get('orderId') || ''),
      })
      revalidateExpressPaths()
      redirect(messageUrl('/campus/express/order', 'notice', '已同步最新支付状态。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '同步支付状态失败。'
      redirect(messageUrl('/campus/express/order', 'error', message))
    }
  }

  async function orderAction(formData: FormData) {
    'use server'

    try {
      await confirmExpressOrder(String(formData.get('orderId') || ''))
      revalidateExpressPaths()
      redirect(messageUrl('/campus/express/order', 'notice', '已确认收货，订单完成。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '确认收货失败。'
      redirect(messageUrl('/campus/express/order', 'error', message))
    }
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="space-y-4 p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">请先登录后使用快递代取下单</h1>
          <p className="text-slate-600">登录后即可创建快递面单、完成支付并查看你发起的快递订单。</p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/login"><Button>去邮箱登录</Button></Link>
            <Link href="/auth/register"><Button variant="outline">邮箱注册</Button></Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { orders: myOrders } = await listExpressOrders('mine').catch(() => ({ orders: [] as CampusExpressOrder[] }))
  const pendingPaymentCount = myOrders.filter((order) => order.status === 'PENDING_PAYMENT').length

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">快递代取下单</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            这里统一处理创建快递面单、支付、同步支付状态，以及查看你自己发起的快递代取订单。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">我下的快递单</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{myOrders.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">待支付</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{pendingPaymentCount}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">已完成</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{myOrders.filter((order) => order.status === 'COMPLETED').length}</div>
          </div>
        </div>
      </div>

      {(notice || error) && (
        <div className={`rounded-2xl px-5 py-4 text-sm ${error ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || notice}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>创建快递面单</CardTitle>
            <CardDescription>小件 2 元 / 中件 4 元 / 大件 6 元 / 超大件 8 元，同单满 3 件后每件减 1 元。</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createOrderAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-600">
                <span>取件点</span>
                <input name="pickupStation" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：菜鸟驿站、南门快递点" required />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>送达时间</span>
                <input name="expectedTime" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：今晚 21:00 前" required />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>楼栋</span>
                <input name="deliveryBuilding" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：3 号楼" required />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>详细地址</span>
                <input name="deliveryAddress" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：3 号楼 402" required />
              </label>
              <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
                <span>取件码</span>
                <textarea name="pickupCodes" className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="支持一行一个，也支持逗号分隔" required />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>小件数量</span>
                <input name="smallCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>中件数量</span>
                <input name="mediumCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>大件数量</span>
                <input name="largeCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>超大件数量</span>
                <input name="xlargeCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
              </label>
              <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
                <span>备注</span>
                <textarea name="remark" className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：到楼下电话联系、包含易碎件等" />
              </label>
              <div className="md:col-span-2 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <div>提交后会先生成订单，再由你选择微信支付或支付宝完成付款。</div>
                <Button type="submit">提交订单</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>我下的快递单</CardTitle>
            <CardDescription>未支付订单可直接发起支付；已送达订单可以在这里确认收货。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">你还没有发起快递代取订单。</div>}
            {myOrders.map((order) => (
              <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{order.order_no}</div>
                    <div className="mt-1 text-sm text-slate-500">{order.delivery_building} / {order.delivery_address}</div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>
                    {EXPRESS_STATUS_LABELS[order.status as keyof typeof EXPRESS_STATUS_LABELS] || order.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>应付金额：<span className="font-semibold text-slate-900">¥{Number(order.order_amount).toFixed(2)}</span></div>
                  <div>支付方式：{order.pay_type ? PAY_TYPE_LABELS[order.pay_type as keyof typeof PAY_TYPE_LABELS] : '未支付'}</div>
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
                    <Button type="submit" size="sm">确认收货</Button>
                  </form>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

