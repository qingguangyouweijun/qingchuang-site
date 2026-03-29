import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/Badge'
import { getSession } from '@/lib/actions/auth'
import {
  acceptExpressOrder,
  deliverExpressOrder,
  listExpressOrders,
  pickupExpressOrder,
} from '@/lib/actions/campus'
import { EXPRESS_STATUS_LABELS } from '@/lib/types'

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'warning' | 'success' | 'outline'> = {
  OPEN: 'default',
  ACCEPTED: 'secondary',
  PICKED_UP: 'warning',
  DELIVERED: 'warning',
  COMPLETED: 'success',
}

function getParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}

function messageUrl(base: string, key: 'notice' | 'error', message: string) {
  return `${base}?${key}=${encodeURIComponent(message)}`
}

function revalidateExpressPaths() {
  revalidatePath('/campus/express')
  revalidatePath('/campus/express/order')
  revalidatePath('/campus/express/runner')
  revalidatePath('/profile/orders')
}

export default async function CampusExpressRunnerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const notice = getParam(params.notice)
  const error = getParam(params.error)
  const session = await getSession()

  async function acceptAction(formData: FormData) {
    'use server'

    try {
      await acceptExpressOrder(String(formData.get('orderId') || ''))
      revalidateExpressPaths()
      redirect(messageUrl('/campus/express/runner', 'notice', '接单成功，订单已进入我接的快递单。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }

      const message = actionError instanceof Error ? actionError.message : '接单失败。'
      redirect(messageUrl('/campus/express/runner', 'error', message))
    }
  }

  async function pickupAction(formData: FormData) {
    'use server'

    try {
      await pickupExpressOrder(String(formData.get('orderId') || ''))
      revalidateExpressPaths()
      redirect(messageUrl('/campus/express/runner', 'notice', '已标记为已取件。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }

      const message = actionError instanceof Error ? actionError.message : '标记已取件失败。'
      redirect(messageUrl('/campus/express/runner', 'error', message))
    }
  }

  async function deliverAction(formData: FormData) {
    'use server'

    try {
      await deliverExpressOrder(String(formData.get('orderId') || ''))
      revalidateExpressPaths()
      redirect(messageUrl('/campus/express/runner', 'notice', '已标记为已送达，等待下单人确认收货。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }

      const message = actionError instanceof Error ? actionError.message : '标记已送达失败。'
      redirect(messageUrl('/campus/express/runner', 'error', message))
    }
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="space-y-4 p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">请先登录后使用快递代取接单</h1>
          <p className="text-slate-600">登录后即可浏览接单广场，接单并统一管理你接下的快递订单。</p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/login"><Button>去邮箱登录</Button></Link>
            <Link href="/auth/register"><Button variant="outline">邮箱注册</Button></Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const [squareResult, runnerResult] = await Promise.allSettled([
    listExpressOrders('square'),
    listExpressOrders('runner'),
  ])

  const squareOrders = squareResult.status === 'fulfilled' ? squareResult.value.orders : []
  const runnerOrders = runnerResult.status === 'fulfilled' ? runnerResult.value.orders : []

  const acceptedCount = runnerOrders.filter((order) => order.status === 'ACCEPTED').length
  const deliveringCount = runnerOrders.filter((order) => order.status === 'PICKED_UP').length
  const deliveredCount = runnerOrders.filter((order) => order.status === 'DELIVERED').length

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">快递代取接单</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            接单广场和我接的快递单已合并到这里。你可以先在广场抢单，再统一管理已接单、已取件、已送达和待确认收货的快递任务。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">接单广场</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{squareOrders.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">我接的快递单</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{runnerOrders.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">配送中</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{acceptedCount + deliveringCount}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">待确认收货</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{deliveredCount}</div>
          </div>
        </div>
      </div>

      {(notice || error) && (
        <div className={`rounded-2xl px-5 py-4 text-sm ${error ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || notice}
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>接单广场</CardTitle>
            <CardDescription>这里展示所有已经支付、正在等待同学接单的快递代取任务。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {squareOrders.length === 0 && (
              <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                当前没有待接单的快递订单。
              </div>
            )}
            {squareOrders.map((order) => (
              <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{order.order_no}</div>
                    <div className="mt-1 text-sm text-slate-500">{order.pickup_station} → {order.delivery_building}</div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>
                    {EXPRESS_STATUS_LABELS[order.status as keyof typeof EXPRESS_STATUS_LABELS] || order.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>件数：<span className="font-semibold text-slate-900">{order.total_count} 件</span></div>
                  <div>跑腿收入：<span className="font-semibold text-emerald-700">¥{Number(order.runner_income).toFixed(2)}</span></div>
                  <div>送达时间：{order.expected_time}</div>
                  <div>取件码：{order.pickup_codes.length} 个</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {order.delivery_address}
                  {order.remark ? ` · 备注：${order.remark}` : ''}
                </div>
                <form action={acceptAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <Button type="submit" size="sm">立即接单</Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>我接的快递单</CardTitle>
            <CardDescription>你接下的订单会在这里流转，依次完成取件、送达和等待确认收货。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {runnerOrders.length === 0 && (
              <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                你还没有接下任何快递订单。
              </div>
            )}
            {runnerOrders.map((order) => (
              <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{order.order_no}</div>
                    <div className="mt-1 text-sm text-slate-500">{order.pickup_station} → {order.delivery_building} / {order.delivery_address}</div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>
                    {EXPRESS_STATUS_LABELS[order.status as keyof typeof EXPRESS_STATUS_LABELS] || order.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>取件码：{order.pickup_codes.join('、')}</div>
                  <div>跑腿收入：<span className="font-semibold text-emerald-700">¥{Number(order.runner_income).toFixed(2)}</span></div>
                  <div>件数：{order.total_count} 件</div>
                  <div>送达时间：{order.expected_time}</div>
                </div>
                {order.remark && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    备注：{order.remark}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {order.status === 'ACCEPTED' && (
                    <form action={pickupAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <Button type="submit" size="sm">标记已取件</Button>
                    </form>
                  )}
                  {(order.status === 'ACCEPTED' || order.status === 'PICKED_UP') && (
                    <form action={deliverAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <Button type="submit" size="sm" variant="secondary">标记已送达</Button>
                    </form>
                  )}
                  {order.status === 'DELIVERED' && (
                    <div className="rounded-full bg-amber-50 px-4 py-2 text-sm text-amber-700">
                      已送达，等待下单人确认收货。
                    </div>
                  )}
                  {order.status === 'COMPLETED' && (
                    <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                      订单已完成，收入已计入校园钱包。
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

