import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { revalidatePath } from 'next/cache'
import { MainLayout } from '@/components/Layout/MainLayout'
import { CampusSubnav } from '@/components/campus/CampusSubnav'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/Badge'
import { getSession } from '@/lib/actions/auth'
import {
  acceptExpressOrder,
  confirmExpressOrder,
  createCampusPayment,
  createExpressOrder,
  deliverExpressOrder,
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
    .split(/\r?\n|,|锛?)
    .map((item) => item.trim())
    .filter(Boolean)
}

function resolveOrders(result: PromiseSettledResult<{ orders: any[] }>, warnings: string[], label: string) {
  if (result.status === 'fulfilled') {
    return result.value.orders
  }

  warnings.push(label)
  return [] as any[]
}

export default async function CampusExpressPage({
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
      revalidatePath('/campus/express')
      redirect(messageUrl('/campus/express', 'notice', '蹇€掕鍗曞凡鍒涘缓锛岃閫夋嫨鏀粯鏂瑰紡銆?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '鍒涘缓蹇€掕鍗曞け璐ャ€?
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
      redirect(messageUrl('/campus/express', 'notice', '鏀粯閾炬帴宸茬敓鎴愶紝璇峰湪鏀粯骞冲彴瀹屾垚浠樻銆?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '鍙戣捣鏀粯澶辫触銆?
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
      redirect(messageUrl('/campus/express', 'notice', '宸插悓姝ユ渶鏂版敮浠樼姸鎬併€?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '鍚屾鏀粯鐘舵€佸け璐ャ€?
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
      redirect(messageUrl('/campus/express', 'notice', '璁㈠崟鐘舵€佸凡鏇存柊銆?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '璁㈠崟鎿嶄綔澶辫触銆?
      redirect(messageUrl('/campus/express', 'error', message))
    }
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto py-8 space-y-6">
          <CampusSubnav />
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <h1 className="text-3xl font-bold text-slate-900">璇峰厛鐧诲綍鍚庡啀浣跨敤蹇€掍唬鍙?/h1>
              <p className="text-slate-600">鐧诲綍鍚庡氨鑳藉垱寤哄揩閫掑崟銆佹敮浠樸€佹帴鍗曞拰纭鏀惰揣銆?/p>
              <div className="flex justify-center gap-4">
                <Link href="/auth/login"><Button>鍘荤櫥褰?/Button></Link>
                <Link href="/auth/register"><Button variant="outline">閭娉ㄥ唽</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const warnings: string[] = []
  const [squareResult, myResult, runnerResult] = await Promise.allSettled([
    listExpressOrders('square'),
    listExpressOrders('mine'),
    listExpressOrders('runner'),
  ])

  const squareOrders = resolveOrders(squareResult, warnings, '鎺ュ崟骞垮満')
  const myOrders = resolveOrders(myResult, warnings, '鎴戜笅鐨勫揩閫掑崟')
  const runnerOrders = resolveOrders(runnerResult, warnings, '鎴戞帴鐨勫揩閫掑崟')

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <CampusSubnav />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">蹇€掍唬鍙?/h1>
            <p className="mt-3 max-w-3xl text-slate-600 leading-7">
              蹇€掍唬鍙栨敹鍦ㄦ牎鍥湇鍔′富绾块噷銆傝繖閲岀粺涓€瀹屾垚涓嬪崟銆佹敮浠樸€佽繘鍏ユ帴鍗曞箍鍦恒€佹帴鍗曢厤閫佸拰纭鏀惰揣銆?
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-slate-500">寰呮帴鍗?/div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{squareOrders.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-slate-500">鎴戜笅鍗?/div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{myOrders.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-slate-500">鎴戞帴鍗?/div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{runnerOrders.length}</div>
            </div>
          </div>
        </div>

        {(notice || error) && (
          <div className={`rounded-2xl px-5 py-4 text-sm ${error ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || notice}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            褰撳墠鏍″洯鏈嶅姟鏁版嵁杩樺湪鍚屾涓紝{warnings.join('銆?)} 鍙兘鏆傛椂涓虹┖锛屼絾椤甸潰鍏ュ彛鍜屾搷浣滃凡缁忎繚鐣欍€?
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[1.08fr_0.92fr] gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鍒涘缓蹇€掕鍗?/CardTitle>
              <CardDescription>灏忎欢 2 鍏?/ 涓欢 4 鍏?/ 澶т欢 6 鍏?/ 瓒呭ぇ浠?8 鍏冿紝鍚屽崟婊?3 浠跺悗姣忎欢鍑?1 鍏冦€?/CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createOrderAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm text-slate-600">
                  <span>鍙栦欢鐐?/span>
                  <input name="pickupStation" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="渚嬪锛氳彍楦熼┛绔欍€佸崡闂ㄥ揩閫掔偣" required />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>閫佽揪鏃堕棿</span>
                  <input name="expectedTime" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="渚嬪锛氫粖鏅?21:00 鍓? required />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>妤兼爧</span>
                  <input name="deliveryBuilding" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="渚嬪锛? 鍙锋ゼ" required />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>璇︾粏鍦板潃</span>
                  <input name="deliveryAddress" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="渚嬪锛? 鍙锋ゼ 402" required />
                </label>
                <label className="md:col-span-2 space-y-2 text-sm text-slate-600">
                  <span>鍙栦欢鐮?/span>
                  <textarea name="pickupCodes" className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="鏀寔涓€琛屼竴涓紝涔熸敮鎸侀€楀彿鍒嗛殧" required />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>灏忎欢鏁伴噺</span>
                  <input name="smallCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>涓欢鏁伴噺</span>
                  <input name="mediumCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>澶т欢鏁伴噺</span>
                  <input name="largeCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>瓒呭ぇ浠舵暟閲?/span>
                  <input name="xlargeCount" type="number" min="0" defaultValue="0" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" />
                </label>
                <label className="md:col-span-2 space-y-2 text-sm text-slate-600">
                  <span>澶囨敞</span>
                  <textarea name="remark" className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="渚嬪锛氬埌妤间笅鐢佃瘽鑱旂郴銆佸寘鍚槗纰庝欢绛? />
                </label>
                <div className="md:col-span-2 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  <div>涓嬪崟椤靛彧灞曠ず搴斾粯閲戦锛涙敮浠樻敮鎸佸井淇℃敮浠樺拰鏀粯瀹濄€?/div>
                  <Button type="submit">鎻愪氦璁㈠崟</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鎺ュ崟骞垮満</CardTitle>
              <CardDescription>娉ㄥ唽鐢ㄦ埛閮藉彲浠ユ帴鍗曪紝鎺ュ崟鍚庢敹鍏ュ厛杩涘叆寰呭畬鎴愪綑棰濄€?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {squareOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">褰撳墠娌℃湁寰呮帴鍗曠殑蹇€掕鍗曘€?/div>}
              {squareOrders.map((order) => (
                <div key={order.id} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{order.order_no}</div>
                      <div className="mt-1 text-sm text-slate-500">{order.pickup_station} 鈫?{order.delivery_building} / 鍏?{order.total_count} 浠?/div>
                    </div>
                    <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>{EXPRESS_STATUS_LABELS[order.status as keyof typeof EXPRESS_STATUS_LABELS] || order.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>搴斾粯閲戦锛?span className="font-semibold text-slate-900">锟Number(order.order_amount).toFixed(2)}</span></div>
                    <div>鎺ュ崟鍙緱锛?span className="font-semibold text-emerald-700">锟Number(order.runner_income).toFixed(2)}</span></div>
                    <div>閫佽揪鏃堕棿锛歿order.expected_time}</div>
                    <div>鍙栦欢鐮侊細{Array.isArray(order.pickup_codes) ? order.pickup_codes.join(' / ') : ''}</div>
                  </div>
                  <form action={orderAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="intent" value="accept" />
                    <Button type="submit" size="sm">绔嬪嵆鎺ュ崟</Button>
                  </form>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鎴戜笅鐨勫揩閫掑崟</CardTitle>
              <CardDescription>鏈敮浠樿鍗曞彲鐩存帴鍙戣捣寰俊鏀粯鎴栨敮浠樺疂鏀粯銆?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">浣犺繕娌℃湁鍙戣捣蹇€掕鍗曘€?/div>}
              {myOrders.map((order) => (
                <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{order.order_no}</div>
                      <div className="mt-1 text-sm text-slate-500">{order.delivery_building} / {order.delivery_address}</div>
                    </div>
                    <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>{EXPRESS_STATUS_LABELS[order.status as keyof typeof EXPRESS_STATUS_LABELS] || order.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>搴斾粯閲戦锛?span className="font-semibold text-slate-900">锟Number(order.order_amount).toFixed(2)}</span></div>
                    <div>鏀粯鏂瑰紡锛歿order.pay_type ? PAY_TYPE_LABELS[order.pay_type as keyof typeof PAY_TYPE_LABELS] : '鏈敮浠?}</div>
                    <div>浠舵暟锛歿order.total_count} 浠?/div>
                    <div>閫佽揪鏃堕棿锛歿order.expected_time}</div>
                  </div>
                  {order.status === 'PENDING_PAYMENT' && (
                    <div className="flex flex-wrap gap-3">
                      <form action={paymentAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="payType" value="wxpay" />
                        <Button type="submit" size="sm">寰俊鏀粯</Button>
                      </form>
                      <form action={paymentAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="payType" value="alipay" />
                        <Button type="submit" size="sm" variant="secondary">鏀粯瀹濇敮浠?/Button>
                      </form>
                    </div>
                  )}
                  {(order.status === 'PENDING_PAYMENT' || order.status === 'OPEN') && (
                    <form action={syncAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <Button type="submit" size="sm" variant="outline">鍚屾鏀粯鐘舵€?/Button>
                    </form>
                  )}
                  {order.status === 'DELIVERED' && (
                    <form action={orderAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="intent" value="confirm" />
                      <Button type="submit" size="sm">纭鏀惰揣</Button>
                    </form>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鎴戞帴鐨勫揩閫掑崟</CardTitle>
              <CardDescription>鎺ュ崟鍚庡厛杩涘叆寰呭畬鎴愭敹鍏ワ紱鐢ㄦ埛纭鏀惰揣鍚庤浆涓哄彲缁撶畻浣欓銆?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {runnerOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">浣犺繕娌℃湁鎺ヨ繃蹇€掑崟銆?/div>}
              {runnerOrders.map((order) => (
                <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{order.order_no}</div>
                      <div className="mt-1 text-sm text-slate-500">{order.pickup_station} 鈫?{order.delivery_building}</div>
                    </div>
                    <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>{EXPRESS_STATUS_LABELS[order.status as keyof typeof EXPRESS_STATUS_LABELS] || order.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>鍙緱鏀跺叆锛?span className="font-semibold text-emerald-700">锟Number(order.runner_income).toFixed(2)}</span></div>
                    <div>浠舵暟锛歿order.total_count} 浠?/div>
                    <div>閫佽揪鏃堕棿锛歿order.expected_time}</div>
                    <div>鍙栦欢鐮侊細{Array.isArray(order.pickup_codes) ? order.pickup_codes.join(' / ') : ''}</div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {order.status === 'ACCEPTED' && (
                      <form action={orderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="intent" value="pickup" />
                        <Button type="submit" size="sm">鏍囪宸插彇浠?/Button>
                      </form>
                    )}
                    {(order.status === 'ACCEPTED' || order.status === 'PICKED_UP') && (
                      <form action={orderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="intent" value="deliver" />
                        <Button type="submit" size="sm" variant="secondary">鏍囪宸查€佽揪</Button>
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
}
