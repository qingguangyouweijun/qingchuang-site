import Link from 'next/link'
import { redirect } from 'next/navigation'
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
      redirect(messageUrl('/campus/books', 'notice', '旧书已发布并进入旧书广场。'))
    } catch (actionError) {
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
      redirect(messageUrl('/campus/books', 'notice', '旧书订单已创建，请完成支付。'))
    } catch (actionError) {
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
      const message = actionError instanceof Error ? actionError.message : '旧书订单操作失败。'
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
  const myPosts = resolveCollection(myPostsResult, warnings, '我的旧书帖子', (value) => value.posts)
  const buyerOrders = resolveCollection(buyerResult, warnings, '我买到的旧书', (value) => value.orders)
  const sellerOrders = resolveCollection(sellerResult, warnings, '我卖出的旧书', (value) => value.orders)

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <CampusSubnav />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">旧书广场</h1>
            <p className="mt-3 max-w-3xl text-slate-600 leading-7">
              旧书发布、广场浏览、买家下单、卖家送达和买家确认收货都放在这一页里，和校园服务其他模块保持同一套账号与支付流程。
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
            当前旧书服务数据还在同步中，{warnings.join('、')} 可能暂时为空，但主要入口已经保持可用。
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[0.96fr_1.04fr] gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>发布旧书</CardTitle>
              <CardDescription>卖家到手价 = 售价 - 2 元 / 本；到账时间为买家确认收货后。</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={publishAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="md:col-span-2 space-y-2 text-sm text-slate-600">
                  <span>售价</span>
                  <input name="salePrice" type="number" min="2" step="0.01" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="买家看到的价格" required />
                </label>
                <label className="md:col-span-2 space-y-2 text-sm text-slate-600">
                  <span>描述</span>
                  <textarea name="description" className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：无缺页、无水渍，附带课堂笔记。" />
                </label>
                <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 leading-7">
                  发布后价格会直接同步展示到旧书广场。买家支付支持微信支付和支付宝；平台统一手续费 2 元 / 本。
                </div>
                <div className="md:col-span-2 flex justify-end">
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
              {marketPosts.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">当前还没有在售旧书。</div>}
              {marketPosts.map((post) => (
                <div key={post.id} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{post.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{post.category} / {post.condition_level} / 卖家：{post.seller_label || '校园卖家'}</div>
                    </div>
                    <Badge variant={POST_VARIANTS[post.shelf_status as keyof typeof POST_VARIANTS] || 'outline'}>{BOOK_POST_STATUS_LABELS[post.shelf_status as keyof typeof BOOK_POST_STATUS_LABELS] || post.shelf_status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>售价：<span className="font-semibold text-slate-900">￥{Number(post.sale_price).toFixed(2)}</span></div>
                    <div>卖家到手：<span className="font-semibold text-emerald-700">￥{Number(post.seller_income).toFixed(2)}</span></div>
                    <div>ISBN：{post.isbn || '未填写'}</div>
                    <div>描述：{post.description || '暂无描述'}</div>
                  </div>
                  <form action={buyAction} className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto]">
                    <label className="space-y-2 text-sm text-slate-600">
                      <span>收货楼栋 / 楼层</span>
                      <input name="deliveryBuilding" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：6 号楼 4 层" required />
                    </label>
                    <input type="hidden" name="bookId" value={post.id} />
                    <Button type="submit">立即购买</Button>
                  </form>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我的旧书帖子</CardTitle>
              <CardDescription>已发布帖子会直接进入广场；锁定表示已经有人下单。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {myPosts.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">你还没有发布过旧书。</div>}
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
                    <div>广场售价：<span className="font-semibold text-slate-900">￥{Number(post.sale_price).toFixed(2)}</span></div>
                    <div>到手价：<span className="font-semibold text-emerald-700">￥{Number(post.seller_income).toFixed(2)}</span></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>我买到的旧书</CardTitle>
              <CardDescription>支付和确认收货都在这里继续完成。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {buyerOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">你还没有买过旧书。</div>}
              {buyerOrders.map((order) => (
                <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{order.book_title}</div>
                      <div className="mt-1 text-sm text-slate-500">订单号：{order.order_no} / 卖家：{order.seller_label || '校园卖家'}</div>
                    </div>
                    <Badge variant={ORDER_VARIANTS[order.status as keyof typeof ORDER_VARIANTS] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[order.status as keyof typeof BOOK_ORDER_STATUS_LABELS] || order.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>支付金额：<span className="font-semibold text-slate-900">￥{Number(order.sale_price).toFixed(2)}</span></div>
                    <div>支付方式：{order.pay_type ? PAY_TYPE_LABELS[order.pay_type as keyof typeof PAY_TYPE_LABELS] : '未支付'}</div>
                    <div>楼栋 / 楼层：{order.delivery_building}</div>
                    <div>状态：{BOOK_ORDER_STATUS_LABELS[order.status as keyof typeof BOOK_ORDER_STATUS_LABELS] || order.status}</div>
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
                  {(order.status === 'PENDING_PAYMENT' || order.status === 'WAITING_SELLER') && (
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
        </section>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>我卖出的旧书订单</CardTitle>
            <CardDescription>买家支付后，卖家送到买家楼栋 / 楼层；确认收货后余额增加到手价。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sellerOrders.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">你还没有卖出中的旧书订单。</div>}
            {sellerOrders.map((order) => (
              <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">{order.book_title}</div>
                    <div className="mt-1 text-sm text-slate-500">订单号：{order.order_no} / 买家：{order.buyer_label || '校园买家'}</div>
                  </div>
                  <Badge variant={ORDER_VARIANTS[order.status as keyof typeof ORDER_VARIANTS] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[order.status as keyof typeof BOOK_ORDER_STATUS_LABELS] || order.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div>买家支付：<span className="font-semibold text-slate-900">￥{Number(order.sale_price).toFixed(2)}</span></div>
                  <div>你到手：<span className="font-semibold text-emerald-700">￥{Number(order.seller_income).toFixed(2)}</span></div>
                  <div>送达楼栋 / 楼层：{order.delivery_building}</div>
                  <div>支付方式：{order.pay_type ? PAY_TYPE_LABELS[order.pay_type as keyof typeof PAY_TYPE_LABELS] : '未支付'}</div>
                </div>
                {order.status === 'WAITING_SELLER' && (
                  <form action={orderAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="intent" value="deliver" />
                    <Button type="submit" size="sm">标记已送达</Button>
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