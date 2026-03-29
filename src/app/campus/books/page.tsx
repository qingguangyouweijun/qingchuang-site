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
  confirmBookOrder,
  createBookOrder,
  createBookPost,
  createCampusPayment,
  deliverBookOrder,
  listBookOrders,
  listBookPosts,
  syncCampusPayment,
} from '@/lib/actions/campus'
import { BOOK_ORDER_STATUS_LABELS, BOOK_POST_STATUS_LABELS, PAY_TYPE_LABELS } from '@/lib/types'

const ORDER_VARIANTS: Record<string, 'default' | 'secondary' | 'warning' | 'success' | 'outline'> = {
  PENDING_PAYMENT: 'warning',
  WAITING_SELLER: 'secondary',
  DELIVERED: 'warning',
  COMPLETED: 'success',
}

const POST_VARIANTS: Record<string, 'default' | 'secondary' | 'warning' | 'success' | 'outline'> = {
  ON_SALE: 'success',
  LOCKED: 'warning',
  SOLD: 'secondary',
  OFF_SHELF: 'outline',
}

function getParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}

function messageUrl(base: string, key: 'notice' | 'error', message: string) {
  return `${base}?${key}=${encodeURIComponent(message)}`
}

function resolveCollection<T>(result: PromiseSettledResult<T>, warnings: string[], label: string, picker: (value: T) => any[]) {
  if (result.status === 'fulfilled') {
    return picker(result.value)
  }

  warnings.push(label)
  return [] as any[]
}

export default async function CampusBooksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const notice = getParam(params.notice)
  const error = getParam(params.error)
  const session = await getSession()

  async function publishAction(formData: FormData) {
    'use server'

    try {
      await createBookPost({
        title: String(formData.get('title') || ''),
        category: String(formData.get('category') || ''),
        isbn: String(formData.get('isbn') || ''),
        conditionLevel: String(formData.get('conditionLevel') || ''),
        salePrice: Number(formData.get('salePrice') || 0),
        description: String(formData.get('description') || ''),
      })
      revalidatePath('/campus/books')
      redirect(messageUrl('/campus/books', 'notice', '鏃т功宸插彂甯冨苟杩涘叆鏃т功骞垮満銆?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '鍙戝竷鏃т功澶辫触銆?
      redirect(messageUrl('/campus/books', 'error', message))
    }
  }

  async function buyAction(formData: FormData) {
    'use server'

    try {
      await createBookOrder({
        bookId: String(formData.get('bookId') || ''),
        deliveryBuilding: String(formData.get('deliveryBuilding') || ''),
      })
      revalidatePath('/campus/books')
      redirect(messageUrl('/campus/books', 'notice', '鏃т功璁㈠崟宸插垱寤猴紝璇峰畬鎴愭敮浠樸€?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '鍒涘缓鏃т功璁㈠崟澶辫触銆?
      redirect(messageUrl('/campus/books', 'error', message))
    }
  }

  async function paymentAction(formData: FormData) {
    'use server'

    try {
      const { payment } = await createCampusPayment({
        bizType: 'BOOK_ORDER',
        bizId: String(formData.get('orderId') || ''),
        payType: String(formData.get('payType') || 'wxpay') as 'wxpay' | 'alipay',
      })
      revalidatePath('/campus/books')
      if (payment.pay_url) {
        redirect(payment.pay_url)
      }
      redirect(messageUrl('/campus/books', 'notice', '鏀粯閾炬帴宸茬敓鎴愶紝璇风户缁畬鎴愪粯娆俱€?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '鍙戣捣鏀粯澶辫触銆?
      redirect(messageUrl('/campus/books', 'error', message))
    }
  }

  async function syncAction(formData: FormData) {
    'use server'

    try {
      await syncCampusPayment({
        bizType: 'BOOK_ORDER',
        bizId: String(formData.get('orderId') || ''),
      })
      revalidatePath('/campus/books')
      redirect(messageUrl('/campus/books', 'notice', '宸插悓姝ユ棫涔﹁鍗曟敮浠樼姸鎬併€?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '鍚屾鏀粯鐘舵€佸け璐ャ€?
      redirect(messageUrl('/campus/books', 'error', message))
    }
  }

  async function orderAction(formData: FormData) {
    'use server'

    const orderId = String(formData.get('orderId') || '')
    const intent = String(formData.get('intent') || '')

    try {
      if (intent === 'deliver') {
        await deliverBookOrder(orderId)
      }
      if (intent === 'confirm') {
        await confirmBookOrder(orderId)
      }
      revalidatePath('/campus/books')
      redirect(messageUrl('/campus/books', 'notice', '鏃т功璁㈠崟鐘舵€佸凡鏇存柊銆?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '鏃т功璁㈠崟鎿嶄綔澶辫触銆?
      redirect(messageUrl('/campus/books', 'error', message))
    }
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto py-8 space-y-6">
          <CampusSubnav />
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <h1 className="text-3xl font-bold text-slate-900">璇峰厛鐧诲綍鍚庡啀浣跨敤鏃т功骞垮満</h1>
              <p className="text-slate-600">鐧诲綍鍚庡嵆鍙彂甯冩棫涔︺€佷笅鍗曡喘涔板拰璺熻繘鎴愪氦鐘舵€併€?/p>
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
  const [marketResult, myPostsResult, buyerResult, sellerResult] = await Promise.allSettled([
    listBookPosts('market'),
    listBookPosts('mine'),
    listBookOrders('buyer'),
    listBookOrders('seller'),
  ])

  const marketPosts = resolveCollection(marketResult, warnings, '鏃т功骞垮満', (value) => value.posts)
  const myPosts = resolveCollection(myPostsResult, warnings, '鎴戠殑鏃т功甯栧瓙', (value) => value.posts)
  const buyerOrders = resolveCollection(buyerResult, warnings, '鎴戜拱鍒扮殑鏃т功', (value) => value.orders)
  const sellerOrders = resolveCollection(sellerResult, warnings, '鎴戝崠鍑虹殑鏃т功', (value) => value.orders)

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <CampusSubnav />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">鏃т功骞垮満</h1>
            <p className="mt-3 max-w-3xl text-slate-600 leading-7">
              鏃т功鍙戝竷銆佸箍鍦烘祻瑙堛€佷拱瀹朵笅鍗曘€佸崠瀹堕€佽揪鍜屼拱瀹剁‘璁ゆ敹璐ч兘鏀惧湪杩欎竴椤甸噷锛屽拰鏍″洯鏈嶅姟鍏朵粬妯″潡淇濇寔鍚屼竴濂楄处鍙蜂笌鏀粯娴佺▼銆?
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-slate-500">骞垮満鍦ㄥ敭</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{marketPosts.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-slate-500">鎴戝彂甯?/div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{myPosts.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-slate-500">杩涜涓鍗?/div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{buyerOrders.length + sellerOrders.length}</div>
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
            褰撳墠鏃т功鏈嶅姟鏁版嵁杩樺湪鍚屾涓紝{warnings.join('銆?)} 鍙兘鏆傛椂涓虹┖锛屼絾涓昏鍏ュ彛宸茬粡淇濇寔鍙敤銆?
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[0.96fr_1.04fr] gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鍙戝竷鏃т功</CardTitle>
              <CardDescription>鍗栧鍒版墜浠?= 鍞环 - 2 鍏?/ 鏈紱鍒拌处鏃堕棿涓轰拱瀹剁‘璁ゆ敹璐у悗銆?/CardDescription>
            </CardHeader>
            <CardContent>
              <form action={publishAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm text-slate-600">
                  <span>涔﹀悕</span>
                  <input name="title" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="渚嬪锛氶珮绛夋暟瀛︼紙绗竷鐗堬級" required />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>鍒嗙被</span>
                  <input name="category" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="渚嬪锛氳€冪爺 / 璁＄畻鏈?/ 涓撲笟璇? required />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>ISBN锛堝彲閫夛級</span>
                  <input name="isbn" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="鍙府鍔╀拱瀹惰瘑鍒増鏈? />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>鎴愯壊</span>
                  <input name="conditionLevel" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="渚嬪锛氫節鎴愭柊 / 鏈夊皯閲忓垝绾? required />
                </label>
                <label className="md:col-span-2 space-y-2 text-sm text-slate-600">
                  <span>鍞环</span>
                  <input name="salePrice" type="number" min="2" step="0.01" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="涔板鐪嬪埌鐨勪环鏍? required />
                </label>
                <label className="md:col-span-2 space-y-2 text-sm text-slate-600">
                  <span>鎻忚堪</span>
                  <textarea name="description" className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="渚嬪锛氭棤缂洪〉銆佹棤姘存笉锛岄檮甯﹁鍫傜瑪璁般€? />
                </label>
                <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 leading-7">
                  鍙戝竷鍚庝环鏍间細鐩存帴鍚屾灞曠ず鍒版棫涔﹀箍鍦恒€備拱瀹舵敮浠樻敮鎸佸井淇℃敮浠樺拰鏀粯瀹濓紱骞冲彴缁熶竴鎵嬬画璐?2 鍏?/ 鏈€?
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit">鍙戝竷鍒版棫涔﹀箍鍦?/Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鏃т功骞垮満</CardTitle>
              <CardDescription>涔板涓嬪崟鏃跺彧濉啓妤兼爧 / 妤煎眰锛屼笉閲囬泦鐢佃瘽鍜屾洿缁嗙殑鍦板潃銆?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketPosts.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">褰撳墠杩樻病鏈夊湪鍞棫涔︺€?/div>}
              {marketPosts.map((post) => (
                <div key={post.id} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{post.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{post.category} / {post.condition_level} / 鍗栧锛歿post.seller_label || '鏍″洯鍗栧'}</div>
                    </div>
                    <Badge variant={POST_VARIANTS[post.shelf_status as keyof typeof POST_VARIANTS] || 'outline'}>{BOOK_POST_STATUS_LABELS[post.shelf_status as keyof typeof BOOK_POST_STATUS_LABELS] || post.shelf_status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>鍞环锛?span className="font-semibold text-slate-900">锟Number(post.sale_price).toFixed(2)}</span></div>
                    <div>鍗栧鍒版墜锛?span className="font-semibold text-emerald-700">锟Number(post.seller_income).toFixed(2)}</span></div>
                    <div>ISBN锛歿post.isbn || '鏈～鍐?}</div>
                    <div>鎻忚堪锛歿post.description || '鏆傛棤鎻忚堪'}</div>
                  </div>
                  <form action={buyAction} className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto]">
                    <label className="space-y-2 text-sm text-slate-600">
                      <span>鏀惰揣妤兼爧 / 妤煎眰</span>
                      <input name="deliveryBuilding" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="渚嬪锛? 鍙锋ゼ 4 灞? required />
                    </label>
                    <input type="hidden" name="bookId" value={post.id} />
                    <Button type="submit">绔嬪嵆璐拱</Button>
                  </form>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鎴戠殑鏃т功甯栧瓙</CardTitle>
              <CardDescription>宸插彂甯冨笘瀛愪細鐩存帴杩涘叆骞垮満锛涢攣瀹氳〃绀哄凡缁忔湁浜轰笅鍗曘€?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myPosts.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">浣犺繕娌℃湁鍙戝竷杩囨棫涔︺€?/div>}
              {myPosts.map((post) => (
                <div key={post.id} className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{post.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{post.category} / {post.condition_level}</div>
                    </div>
                    <Badge variant={POST_VARIANTS[post.shelf_status as keyof typeof POST_VARIANTS] || 'outline'}>{BOOK_POST_STATUS_LABELS[post.shelf_status as keyof typeof BOOK_POST_STATUS_LABELS] || post.shelf_status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>骞垮満鍞环锛?span className="font-semibold text-slate-900">锟Number(post.sale_price).toFixed(2)}</span></div>
                    <div>鍒版墜浠凤細<span className="font-semibold text-emerald-700">锟Number(post.seller_income).toFixed(2)}</span></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鎴戜拱鍒扮殑鏃т功</CardTitle>
              <CardDescription>鏀粯鍜岀‘璁ゆ敹璐ч兘鍦ㄨ繖閲岀户缁畬鎴愩€?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {buyerOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">浣犺繕娌℃湁涔拌繃鏃т功銆?/div>}
              {buyerOrders.map((order) => (
                <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{order.book_title}</div>
                      <div className="mt-1 text-sm text-slate-500">璁㈠崟鍙凤細{order.order_no} / 鍗栧锛歿order.seller_label || '鏍″洯鍗栧'}</div>
                    </div>
                    <Badge variant={ORDER_VARIANTS[order.status as keyof typeof ORDER_VARIANTS] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[order.status as keyof typeof BOOK_ORDER_STATUS_LABELS] || order.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>鏀粯閲戦锛?span className="font-semibold text-slate-900">锟Number(order.sale_price).toFixed(2)}</span></div>
                    <div>鏀粯鏂瑰紡锛歿order.pay_type ? PAY_TYPE_LABELS[order.pay_type as keyof typeof PAY_TYPE_LABELS] : '鏈敮浠?}</div>
                    <div>妤兼爧 / 妤煎眰锛歿order.delivery_building}</div>
                    <div>鐘舵€侊細{BOOK_ORDER_STATUS_LABELS[order.status as keyof typeof BOOK_ORDER_STATUS_LABELS] || order.status}</div>
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
                  {(order.status === 'PENDING_PAYMENT' || order.status === 'WAITING_SELLER') && (
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
        </section>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>鎴戝崠鍑虹殑鏃т功璁㈠崟</CardTitle>
            <CardDescription>涔板鏀粯鍚庯紝鍗栧閫佸埌涔板妤兼爧 / 妤煎眰锛涚‘璁ゆ敹璐у悗浣欓澧炲姞鍒版墜浠枫€?/CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sellerOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">浣犺繕娌℃湁鍗栧嚭涓殑鏃т功璁㈠崟銆?/div>}
            {sellerOrders.map((order) => (
              <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{order.book_title}</div>
                    <div className="mt-1 text-sm text-slate-500">璁㈠崟鍙凤細{order.order_no} / 涔板锛歿order.buyer_label || '鏍″洯涔板'}</div>
                  </div>
                  <Badge variant={ORDER_VARIANTS[order.status as keyof typeof ORDER_VARIANTS] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[order.status as keyof typeof BOOK_ORDER_STATUS_LABELS] || order.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>涔板鏀粯锛?span className="font-semibold text-slate-900">锟Number(order.sale_price).toFixed(2)}</span></div>
                  <div>浣犲埌鎵嬶細<span className="font-semibold text-emerald-700">锟Number(order.seller_income).toFixed(2)}</span></div>
                  <div>閫佽揪妤兼爧 / 妤煎眰锛歿order.delivery_building}</div>
                  <div>鏀粯鏂瑰紡锛歿order.pay_type ? PAY_TYPE_LABELS[order.pay_type as keyof typeof PAY_TYPE_LABELS] : '鏈敮浠?}</div>
                </div>
                {order.status === 'WAITING_SELLER' && (
                  <form action={orderAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="intent" value="deliver" />
                    <Button type="submit" size="sm">鏍囪宸查€佽揪</Button>
                  </form>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
