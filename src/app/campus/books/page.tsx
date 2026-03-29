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

const BOOK_ORDER_LABELS = {
  PENDING_PAYMENT: '待支付',
  WAITING_SELLER: '待卖家送达',
  DELIVERED: '待确认收货',
  COMPLETED: '已完成',
} as const

const BOOK_POST_LABELS = {
  ON_SALE: '在售',
  LOCKED: '已锁定',
  SOLD: '已售出',
  OFF_SHELF: '已下架',
} as const

const PAY_LABELS = {
  wxpay: '微信支付',
  alipay: '支付宝',
} as const

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
      redirect(messageUrl('/campus/books', 'notice', '旧书已发布并进入旧书广场。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '发布旧书失败。'
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
      redirect(messageUrl('/campus/books', 'notice', '旧书订单已创建，请继续完成支付。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '创建旧书订单失败。'
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
      redirect(messageUrl('/campus/books', 'notice', '支付链接已生成，请继续完成付款。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '发起支付失败。'
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
      redirect(messageUrl('/campus/books', 'notice', '已同步旧书订单支付状态。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '同步支付状态失败。'
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
      redirect(messageUrl('/campus/books', 'notice', '旧书订单状态已更新。'))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '旧书订单操作失败。'
      redirect(messageUrl('/campus/books', 'error', message))
    }
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-5xl space-y-6 py-8">
          <CampusSubnav />
          <Card>
            <CardContent className="space-y-4 p-10 text-center">
              <h1 className="text-3xl font-bold text-slate-900">请先登录后再使用旧书广场</h1>
              <p className="text-slate-600">登录后即可发布旧书、下单购买和跟进成交状态。</p>
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
  const [marketResult, myPostsResult, buyerResult, sellerResult] = await Promise.allSettled([
    listBookPosts('market'),
    listBookPosts('mine'),
    listBookOrders('buyer'),
    listBookOrders('seller'),
  ])

  const marketPosts = resolveCollection(marketResult, warnings, '旧书广场', (value) => value.posts)
  const myPosts = resolveCollection(myPostsResult, warnings, '我发布的旧书', (value) => value.posts)
  const buyerOrders = resolveCollection(buyerResult, warnings, '我买到的旧书', (value) => value.orders)
  const sellerOrders = resolveCollection(sellerResult, warnings, '我卖出的旧书', (value) => value.orders)

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8 py-8">
        <CampusSubnav />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">旧书广场</h1>
            <p className="mt-3 max-w-3xl text-slate-600 leading-7">
              旧书发布、广场浏览、买家下单、卖家送达和买家确认收货都放在同一页里，
              与校园服务其他模块保持同一套账号与支付流程。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-slate-500">广场在售</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{marketPosts.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-slate-500">我发布</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{myPosts.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="text-slate-500">进行中订单</div>
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
            当前旧书服务数据还在同步中：{warnings.join('、')} 暂时为空，但主要入口已经保持可用。
          </div>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.96fr_1.04fr]">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>发布旧书</CardTitle>
              <CardDescription>卖家到手价 = 售价 - 2 元 / 本；到账时间为买家确认收货后。</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={publishAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-600">
                  <span>书名</span>
                  <input name="title" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：高等数学（第七版）" required />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>分类</span>
                  <input name="category" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：考研 / 计算机 / 专业课" required />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>ISBN（可选）</span>
                  <input name="isbn" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="可帮助买家识别版本" />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>成色</span>
                  <input name="conditionLevel" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：九成新 / 有少量划线" required />
                </label>
                <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
                  <span>售价</span>
                  <input name="salePrice" type="number" min="2" step="0.01" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="买家看到的价格" required />
                </label>
                <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
                  <span>描述</span>
                  <textarea name="description" rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：无缺页、无水渍，附带课堂笔记。" />
                </label>
                <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                  发布后价格会直接同步展示到旧书广场。买家支付支持微信支付和支付宝；平台统一收取 2 元 / 本手续费。
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">发布到旧书广场</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>旧书广场</CardTitle>
              <CardDescription>买家下单时只填写楼栋 / 楼层，不采集电话和更细的地址。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketPosts.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">当前还没有在售旧书。</div>
              )}
              {marketPosts.map((post) => {
                const isMine = post.seller_id === session.userId
                return (
                  <div key={post.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-slate-900">{post.title}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {post.category} / {post.condition_level} / 卖家：{post.seller_label || post.seller_id}
                        </div>
                      </div>
                      <Badge variant={POST_VARIANTS[post.shelf_status] || 'outline'}>
                        {BOOK_POST_LABELS[post.shelf_status as keyof typeof BOOK_POST_LABELS] || post.shelf_status}
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <div>售价：<span className="font-semibold text-slate-900">¥{Number(post.sale_price).toFixed(2)}</span></div>
                      <div>卖家到手：<span className="font-semibold text-emerald-700">¥{Number(post.seller_income).toFixed(2)}</span></div>
                      {post.isbn && <div className="md:col-span-2">ISBN：{post.isbn}</div>}
                    </div>
                    {post.description && <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">{post.description}</div>}

                    {!isMine && post.shelf_status === 'ON_SALE' && (
                      <form action={buyAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <input type="hidden" name="bookId" value={post.id} />
                        <input name="deliveryBuilding" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：3 号楼 4 层" required />
                        <Button type="submit">立即下单</Button>
                      </form>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我发布的旧书</CardTitle>
              <CardDescription>在这里查看自己发布的旧书当前是否仍在售卖。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myPosts.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">你还没有发布旧书。</div>
              )}
              {myPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-900">{post.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{post.category} / {post.condition_level} / 售价 ¥{Number(post.sale_price).toFixed(2)}</div>
                  </div>
                  <Badge variant={POST_VARIANTS[post.shelf_status] || 'outline'}>
                    {BOOK_POST_LABELS[post.shelf_status as keyof typeof BOOK_POST_LABELS] || post.shelf_status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我买到的旧书</CardTitle>
              <CardDescription>下单后在这里继续支付、同步支付状态和确认收货。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {buyerOrders.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">你还没有买过旧书。</div>
              )}
              {buyerOrders.map((order) => (
                <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{order.book_title}</div>
                      <div className="mt-1 text-sm text-slate-500">订单号：{order.order_no} / 楼栋：{order.delivery_building}</div>
                    </div>
                    <Badge variant={ORDER_VARIANTS[order.status] || 'outline'}>
                      {BOOK_ORDER_LABELS[order.status as keyof typeof BOOK_ORDER_LABELS] || order.status}
                    </Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div>支付金额：<span className="font-semibold text-slate-900">¥{Number(order.sale_price).toFixed(2)}</span></div>
                    <div>支付方式：{PAY_LABELS[(order.pay_type || 'wxpay') as keyof typeof PAY_LABELS] || order.pay_type || '未选择'}</div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {order.status === 'PENDING_PAYMENT' && (
                      <>
                        <form action={paymentAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="payType" value="wxpay" />
                          <Button type="submit" variant="outline">微信支付</Button>
                        </form>
                        <form action={paymentAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="payType" value="alipay" />
                          <Button type="submit" variant="outline">支付宝</Button>
                        </form>
                        <form action={syncAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <Button type="submit">同步支付状态</Button>
                        </form>
                      </>
                    )}
                    {order.status === 'DELIVERED' && (
                      <form action={orderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="intent" value="confirm" />
                        <Button type="submit">确认收货</Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我卖出的旧书</CardTitle>
              <CardDescription>卖家送达后等待买家确认，确认完成后收入会进入校园钱包。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sellerOrders.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">你还没有卖出中的旧书订单。</div>
              )}
              {sellerOrders.map((order) => (
                <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{order.book_title}</div>
                      <div className="mt-1 text-sm text-slate-500">订单号：{order.order_no} / 买家楼栋：{order.delivery_building}</div>
                    </div>
                    <Badge variant={ORDER_VARIANTS[order.status] || 'outline'}>
                      {BOOK_ORDER_LABELS[order.status as keyof typeof BOOK_ORDER_LABELS] || order.status}
                    </Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div>买家支付：<span className="font-semibold text-slate-900">¥{Number(order.sale_price).toFixed(2)}</span></div>
                    <div>卖家到手：<span className="font-semibold text-emerald-700">¥{Number(order.seller_income).toFixed(2)}</span></div>
                  </div>
                  {order.status === 'WAITING_SELLER' && (
                    <form action={orderAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="intent" value="deliver" />
                      <Button type="submit">标记为已送达</Button>
                    </form>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  )
}
