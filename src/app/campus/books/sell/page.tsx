import Link from 'next/link'
import { BookPublishForm } from '@/components/campus/BookPublishForm'
import { Button } from '@/components/UI/Button'
import { Badge } from '@/components/UI/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { deliverBookSellAction, publishBookSellAction } from '@/app/campus/books/actions'
import { BOOK_ORDER_LABELS, BOOK_POST_LABELS, ORDER_VARIANTS, POST_VARIANTS, getBooksPageState } from '@/app/campus/books/shared'

export default async function CampusBooksSellPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { session, notice, error, warnings, myPosts, sellerOrders } = await getBooksPageState(searchParams)

  if (!session) {
    return (
      <Card>
        <CardContent className="space-y-4 p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">请先登录后再使用旧书售卖</h1>
          <p className="text-slate-600">登录后即可发布旧书、管理自己发布的旧书，并跟进卖出订单。</p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/login"><Button>去登录</Button></Link>
            <Link href="/auth/register"><Button variant="outline">邮箱注册</Button></Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const onSaleCount = myPosts.filter((post) => post.shelf_status === 'ON_SALE').length
  const pendingDeliveryCount = sellerOrders.filter((order) => order.status === 'WAITING_SELLER').length
  const waitingConfirmCount = sellerOrders.filter((order) => order.status === 'DELIVERED').length

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">旧书售卖</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            在这里发布旧书、维护我发布的旧书，并跟进我卖出的旧书订单。卖家到手金额会按照平台手续费自动结算。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">我发布</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{myPosts.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">当前在售</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{onSaleCount}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-slate-500">待卖家送达</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{pendingDeliveryCount}</div>
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
          当前旧书服务数据还在同步中：{warnings.join('、')} 暂时为空，但旧书售卖入口已经可用。
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>发布旧书</CardTitle>
            <CardDescription>卖家到手价 = 售价 - 2 元 / 本；到账时间为买家确认收货后。</CardDescription>
          </CardHeader>
          <CardContent>
            <BookPublishForm action={publishBookSellAction} />
          </CardContent>
        </Card>

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
                  <form action={deliverBookSellAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <Button type="submit">标记为已送达</Button>
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
