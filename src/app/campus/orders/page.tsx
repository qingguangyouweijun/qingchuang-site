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
              <h1 className="text-3xl font-bold text-slate-900">璇峰厛鐧诲綍鍚庢煡鐪嬭鍗曚腑蹇?/h1>
              <p className="text-slate-600">璁㈠崟涓績浼氭眹鎬诲揩閫掕鍗曞拰鏃т功璁㈠崟銆?/p>
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
  const [myExpressResult, runnerExpressResult, buyerOrdersResult, sellerOrdersResult] = await Promise.allSettled([
    listExpressOrders('mine'),
    listExpressOrders('runner'),
    listBookOrders('buyer'),
    listBookOrders('seller'),
  ])

  const myExpress = resolveCollection(myExpressResult, warnings, '鎴戝彂璧风殑蹇€掑崟', (value) => value.orders)
  const runnerExpress = resolveCollection(runnerExpressResult, warnings, '鎴戞帴鍒扮殑蹇€掑崟', (value) => value.orders)
  const buyerOrders = resolveCollection(buyerOrdersResult, warnings, '鎴戜拱鍒扮殑鏃т功', (value) => value.orders)
  const sellerOrders = resolveCollection(sellerOrdersResult, warnings, '鎴戝崠鍑虹殑鏃т功', (value) => value.orders)

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <CampusSubnav />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">璁㈠崟涓績</h1>
            <p className="mt-3 text-slate-600 leading-7">杩欓噷缁熶竴姹囨€绘牎鍥揩閫掍唬鍙栧拰鏃т功浜ゆ槗鐨勫洓绫昏鍗曡瑙掋€?/p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/campus/express"><Button variant="outline">鍘诲揩閫掗〉鎿嶄綔</Button></Link>
            <Link href="/campus/books"><Button>鍘绘棫涔﹂〉鎿嶄綔</Button></Link>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            褰撳墠璁㈠崟鏁版嵁杩樺湪鍚屾涓紝{warnings.join('銆?)} 鍙兘鏆傛椂涓虹┖銆?
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鎴戝彂璧风殑蹇€掑崟</CardTitle>
              <CardDescription>鏀粯鍜岀‘璁ゆ敹璐ц缁х画鍦ㄥ揩閫掗〉澶勭悊銆?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myExpress.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">鏆傛棤鎴戝彂璧风殑蹇€掑崟銆?/div>}
              {myExpress.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.order_no}</div>
                    <div className="mt-1 text-sm text-slate-500">{order.pickup_station} 鈫?{order.delivery_building} / 锟Number(order.order_amount).toFixed(2)}</div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>{EXPRESS_STATUS_LABELS[order.status as keyof typeof EXPRESS_STATUS_LABELS] || order.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鎴戞帴鍒扮殑蹇€掑崟</CardTitle>
              <CardDescription>鎺ュ崟鏀跺叆浼氬湪鐢ㄦ埛纭鏀惰揣鍚庤繘鍏ュ彲缁撶畻浣欓銆?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {runnerExpress.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">鏆傛棤鎴戞帴鍒扮殑蹇€掑崟銆?/div>}
              {runnerExpress.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.order_no}</div>
                    <div className="mt-1 text-sm text-slate-500">{order.pickup_station} 鈫?{order.delivery_building} / 鍙緱 锟Number(order.runner_income).toFixed(2)}</div>
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
              <CardTitle>鎴戜拱鍒扮殑鏃т功</CardTitle>
              <CardDescription>涔板璁㈠崟缁熶竴鍦ㄨ繖閲屾煡鐪嬶紝鏀粯鍜岀‘璁ゆ敹璐ц鍥炴棫涔﹂〉缁х画鎿嶄綔銆?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {buyerOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">鏆傛棤鎴戜拱鍒扮殑鏃т功璁㈠崟銆?/div>}
              {buyerOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.book_title}</div>
                    <div className="mt-1 text-sm text-slate-500">璁㈠崟鍙凤細{order.order_no} / 妤兼爧锛歿order.delivery_building} / 锟Number(order.sale_price).toFixed(2)}</div>
                  </div>
                  <Badge variant={STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[order.status as keyof typeof BOOK_ORDER_STATUS_LABELS] || order.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鎴戝崠鍑虹殑鏃т功</CardTitle>
              <CardDescription>涔板纭鏀惰揣鍚庯紝鍒版墜浠锋墠浼氱湡姝ｈ鍏ユ牎鍥挶鍖呫€?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sellerOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">鏆傛棤鎴戝崠鍑虹殑鏃т功璁㈠崟銆?/div>}
              {sellerOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{order.book_title}</div>
                    <div className="mt-1 text-sm text-slate-500">璁㈠崟鍙凤細{order.order_no} / 涔板妤兼爧锛歿order.delivery_building} / 鍒版墜 锟Number(order.seller_income).toFixed(2)}</div>
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
