import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { MainLayout } from '@/components/Layout/MainLayout'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/Badge'
import { getCurrentUser } from '@/lib/actions/auth'
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

export default async function CampusBooksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const notice = getParam(params.notice)
  const error = getParam(params.error)
  const current = await getCurrentUser()

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
      redirect(messageUrl('/campus/books', 'notice', '旧书已发布并直接进入旧书广场。'))
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

  if (!current) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-20">
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">请先登录后再使用旧书广场</h1>
              <p className="text-gray-600">统一账号登录后即可发布旧书、购买旧书和查看成交进度。</p>
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
    const [{ posts: marketPosts }, { posts: myPosts }, { orders: buyerOrders }, { orders: sellerOrders }] = await Promise.all([
      listBookPosts('market'),
      listBookPosts('mine'),
      listBookOrders('buyer'),
      listBookOrders('seller'),
    ])

    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto py-8 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">旧书广场</h1>
            <p className="text-gray-600 mt-3 leading-7 max-w-3xl">
              卖家发布后直接进入广场，不走审核。买家付款后只填写楼栋/楼层，卖家送达后由买家确认收货，卖家到手价在确认收货时入账。
            </p>
          </div>

          {(notice || error) && (
            <div className={`rounded-2xl px-5 py-4 text-sm ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {error || notice}
            </div>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>发布旧书</CardTitle>
                <CardDescription>卖家到手价 = 售价 - 2 元 / 本；到账时间为买家确认收货后。</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={publishAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>书名</span>
                    <input name="title" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" placeholder="例如：高等数学（第七版）" required />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>分类</span>
                    <input name="category" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" placeholder="例如：考研 / 计算机 / 专业课" required />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>ISBN（可选）</span>
                    <input name="isbn" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" placeholder="书号可帮助买家识别版本" />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600">
                    <span>成色</span>
                    <input name="conditionLevel" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" placeholder="例如：九成新 / 有少量划线" required />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600 md:col-span-2">
                    <span>售价</span>
                    <input name="salePrice" type="number" min="2" step="0.01" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" placeholder="买家看到的价格" required />
                  </label>
                  <label className="space-y-2 text-sm text-gray-600 md:col-span-2">
                    <span>描述</span>
                    <textarea name="description" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 min-h-28" placeholder="例如：无缺页，无水渍，附带课堂笔记。" />
                  </label>
                  <div className="md:col-span-2 rounded-2xl bg-amber-50 px-4 py-4 text-sm text-gray-700 leading-7">
                    发布后价格会直接同步展示到旧书广场。买家支付支持微信支付和支付宝；平台统一手续费 2 元 / 本，不向买家展示内部收益拆分。
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
                <CardDescription>买家下单时只填写收货楼栋 / 楼层，不采集电话和详细地址。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {marketPosts.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">当前还没有在售旧书。</div>}
                {marketPosts.map((post) => (
                  <div key={post.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500 mt-1">{post.category} / {post.condition_level} / 卖家：{(post as { seller_label?: string }).seller_label || '校园卖家'}</div>
                      </div>
                      <Badge variant={POST_VARIANTS[post.shelf_status] || 'outline'}>{BOOK_POST_STATUS_LABELS[post.shelf_status]}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>售价：<span className="font-semibold text-gray-900">￥{Number(post.sale_price).toFixed(2)}</span></div>
                      <div>卖家到手：<span className="font-semibold text-orange-600">￥{Number(post.seller_income).toFixed(2)}</span></div>
                      <div>ISBN：{post.isbn || '未填写'}</div>
                      <div>描述：{post.description || '暂无描述'}</div>
                    </div>
                    <form action={buyAction} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                      <label className="space-y-2 text-sm text-gray-600">
                        <span>买家收货楼栋 / 楼层</span>
                        <input name="deliveryBuilding" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" placeholder="例如：6 号楼 4 层" required />
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
                <CardDescription>已发布的帖子会直接进入旧书广场；锁定表示已经有人下单待完成交易。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myPosts.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">你还没有发布过旧书。</div>}
                {myPosts.map((post) => (
                  <div key={post.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{post.title}</div>
                        <div className="text-sm text-gray-500 mt-1">{post.category} / {post.condition_level}</div>
                      </div>
                      <Badge variant={POST_VARIANTS[post.shelf_status] || 'outline'}>{BOOK_POST_STATUS_LABELS[post.shelf_status]}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>广场售价：<span className="font-semibold text-gray-900">￥{Number(post.sale_price).toFixed(2)}</span></div>
                      <div>到手价：<span className="font-semibold text-orange-600">￥{Number(post.seller_income).toFixed(2)}</span></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>我买到的旧书</CardTitle>
                <CardDescription>下单后先支付，支付成功后等待卖家送达；确认收货后交易完成。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {buyerOrders.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">你还没有买过旧书。</div>}
                {buyerOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{order.book_title}</div>
                        <div className="text-sm text-gray-500 mt-1">订单号：{order.order_no} / 卖家：{(order as { seller_label?: string }).seller_label || '校园卖家'}</div>
                      </div>
                      <Badge variant={ORDER_VARIANTS[order.status] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[order.status]}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>支付金额：<span className="font-semibold text-gray-900">￥{Number(order.sale_price).toFixed(2)}</span></div>
                      <div>支付方式：{order.pay_type ? PAY_TYPE_LABELS[order.pay_type] : '未支付'}</div>
                      <div>楼栋 / 楼层：{order.delivery_building}</div>
                      <div>状态：{BOOK_ORDER_STATUS_LABELS[order.status]}</div>
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
              <CardDescription>买家支付后，卖家送到买家所在楼栋 / 楼层；买家确认收货后卖家余额增加到手价。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sellerOrders.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">你还没有卖出中的旧书订单。</div>}
              {sellerOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{order.book_title}</div>
                      <div className="text-sm text-gray-500 mt-1">订单号：{order.order_no} / 买家：{(order as { buyer_label?: string }).buyer_label || '校园买家'}</div>
                    </div>
                    <Badge variant={ORDER_VARIANTS[order.status] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[order.status]}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>买家支付：<span className="font-semibold text-gray-900">￥{Number(order.sale_price).toFixed(2)}</span></div>
                    <div>你到手：<span className="font-semibold text-orange-600">￥{Number(order.seller_income).toFixed(2)}</span></div>
                    <div>送达楼栋 / 楼层：{order.delivery_building}</div>
                    <div>支付方式：{order.pay_type ? PAY_TYPE_LABELS[order.pay_type] : '未支付'}</div>
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
  } catch (loadError) {
    const message = loadError instanceof Error ? loadError.message : '旧书模块加载失败。'

    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-20">
          <Card>
            <CardContent className="p-10 space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">旧书模块暂时不可用</h1>
              <p className="text-gray-600 leading-7">{message}</p>
              <p className="text-sm text-gray-500 leading-7">如果你刚执行过代码更新，请确认 Supabase 已执行最新 schema，并且环境变量里已经补上 `SUPABASE_SERVICE_ROLE_KEY`。</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }
}
