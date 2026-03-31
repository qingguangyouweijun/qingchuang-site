import Link from 'next/link'
import { Button } from '@/components/UI/Button'
import { Badge } from '@/components/UI/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { buyBookOrderAction, confirmBookOrderAction, payBookOrderAction, syncBookOrderAction } from '@/app/campus/books/actions'
import { BOOK_ORDER_LABELS, BOOK_POST_LABELS, ORDER_VARIANTS, PAY_LABELS, POST_VARIANTS, getBooksPageState } from '@/app/campus/books/shared'

export default async function CampusBooksOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { session, notice, error, warnings, marketPosts, buyerOrders } = await getBooksPageState(searchParams)

  if (!session) {
    return (
      <Card>
        <CardContent className="space-y-4 p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">请先登录后再使用旧书下单</h1>
          <p className="text-slate-600">登录后即可浏览旧书广场、下单购买并继续处理支付和收货。</p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/login"><Button>去登录</Button></Link>
            <Link href="/auth/register"><Button variant="outline">邮箱注册</Button></Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingPaymentCount = buyerOrders.filter((order) => order.status === 'PENDING_PAYMENT').length
  const waitingConfirmCount = buyerOrders.filter((order) => order.status === 'DELIVERED').length

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">旧书下单</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            在这里浏览旧书广场、填写楼栋下单，并继续处理我买到的旧书订单，包括支付、同步支付状态和确认收货。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">广场在售</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{marketPosts.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">我买到的旧书</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{buyerOrders.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">待支付</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{pendingPaymentCount}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">待确认收货</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{waitingConfirmCount}</div>
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
          当前旧书服务数据还在同步中：{warnings.join('、')} 暂时为空，但旧书下单入口已经可用。
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.02fr_0.98fr]">
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
                        {post.category} / {post.condition_level} / 卖家：{post.seller_id}
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
                    <form action={buyBookOrderAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
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
                  <div>支付方式：{PAY_LABELS[(order.pay_type || 'alipay') as keyof typeof PAY_LABELS] || order.pay_type || '未选择'}</div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {order.status === 'PENDING_PAYMENT' && (
                    <>
                      <form action={payBookOrderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="payType" value="alipay" />
                        <Button type="submit" variant="outline">支付宝</Button>
                      </form>
                      <form action={syncBookOrderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <Button type="submit">同步支付状态</Button>
                      </form>
                    </>
                  )}
                  {order.status === 'DELIVERED' && (
                    <form action={confirmBookOrderAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <Button type="submit">确认收货</Button>
                    </form>
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
