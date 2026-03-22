import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/UI/Button'
import { Badge } from '@/components/UI/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { getCurrentUser, signOut } from '@/lib/actions/auth'
import { approveSettlement, getAdminDashboardData, rejectSettlement, updateUserAppRole } from '@/lib/actions/campus'
import { APP_ROLE_LABELS, BOOK_ORDER_STATUS_LABELS, BOOK_POST_STATUS_LABELS, EXPRESS_STATUS_LABELS, SETTLEMENT_STATUS_LABELS } from '@/lib/types'

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'warning' | 'success' | 'outline' | 'destructive'> = {
  PENDING_PAYMENT: 'warning',
  OPEN: 'default',
  ACCEPTED: 'secondary',
  PICKED_UP: 'secondary',
  DELIVERED: 'warning',
  COMPLETED: 'success',
  WAITING_SELLER: 'secondary',
  ON_SALE: 'success',
  LOCKED: 'warning',
  SOLD: 'secondary',
  OFF_SHELF: 'outline',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
}

function getParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}

function messageUrl(base: string, key: 'notice' | 'error', message: string) {
  return `${base}?${key}=${encodeURIComponent(message)}`
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const notice = getParam(params.notice)
  const error = getParam(params.error)
  const current = await getCurrentUser()

  async function roleAction(formData: FormData) {
    'use server'

    try {
      await updateUserAppRole({
        userId: String(formData.get('userId') || ''),
        role: String(formData.get('role') || 'user') as 'user' | 'admin',
      })
      revalidatePath('/admin')
      redirect(messageUrl('/admin', 'notice', '用户角色已更新。'))
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : '更新用户角色失败。'
      redirect(messageUrl('/admin', 'error', message))
    }
  }

  async function settlementAction(formData: FormData) {
    'use server'

    const decision = String(formData.get('decision') || '')

    try {
      if (decision === 'approve') {
        await approveSettlement({
          applicationId: String(formData.get('applicationId') || ''),
          transferRef: String(formData.get('transferRef') || ''),
          note: String(formData.get('note') || ''),
        })
      } else {
        await rejectSettlement({
          applicationId: String(formData.get('applicationId') || ''),
          note: String(formData.get('note') || '管理员已驳回申请。'),
        })
      }
      revalidatePath('/admin')
      redirect(messageUrl('/admin', 'notice', '结算申请已处理。'))
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : '处理结算申请失败。'
      redirect(messageUrl('/admin', 'error', message))
    }
  }

  if (!current) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center space-y-4">
          <h1 className="text-3xl font-bold">请先登录管理员账号</h1>
          <p className="text-slate-300 leading-7">管理员和普通用户已经分开。管理员必须通过单独的管理员登录入口进入后台。</p>
          <div className="flex justify-center gap-4">
            <Link href="/admin/login"><Button variant="secondary">管理员登录</Button></Link>
            <Link href="/campus"><Button variant="outline">返回校园服务端</Button></Link>
          </div>
        </div>
      </div>
    )
  }

  try {
    const data = await getAdminDashboardData()

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
            <div>
              <div className="inline-flex items-center rounded-full bg-indigo-500/15 border border-indigo-400/30 px-4 py-2 text-sm text-indigo-200">
                校园管理员后台
              </div>
              <h1 className="text-4xl font-bold mt-4">管理员网站</h1>
              <p className="text-slate-300 mt-3 leading-7 max-w-3xl">
                这里独立于普通用户端，用于查看订单、管理用户角色、审批结算申请，并核对快递和旧书交易状态。
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Link href="/campus"><Button variant="outline">查看普通用户端</Button></Link>
              <form action={signOut}><Button type="submit" variant="secondary">退出登录</Button></form>
            </div>
          </header>

          {(notice || error) && (
            <div className={`rounded-2xl px-5 py-4 text-sm ${error ? 'bg-red-500/10 text-red-200 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30'}`}>
              {error || notice}
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">近 20 条快递订单</div>
              <div className="text-4xl font-bold mt-3">{data.expressOrders.length}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">近 20 条旧书帖子</div>
              <div className="text-4xl font-bold mt-3">{data.bookPosts.length}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">近 20 条旧书订单</div>
              <div className="text-4xl font-bold mt-3">{data.bookOrders.length}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">待处理结算申请</div>
              <div className="text-4xl font-bold mt-3">{data.settlementApplications.filter((item) => item.status === 'PENDING').length}</div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">用户与角色</CardTitle>
                <CardDescription className="text-slate-400">统一身份已经切到邮箱验证码登录。这里可以把用户切换为管理员或普通用户。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(data.users || []).map((user: any) => (
                  <div key={user.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{user.nickname || user.account}</div>
                        <div className="text-sm text-slate-400 mt-1">邮箱：{user.account}</div>
                      </div>
                      <Badge variant={user.app_role === 'admin' ? 'secondary' : 'outline'}>{APP_ROLE_LABELS[user.app_role === 'admin' ? 'admin' : 'user']}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <div>可结算余额：￥{Number(user.campus_available_balance || 0).toFixed(2)}</div>
                      <div>待完成收入：￥{Number(user.campus_pending_balance || 0).toFixed(2)}</div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <form action={roleAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value="user" />
                        <Button type="submit" size="sm" variant="outline">设为普通用户</Button>
                      </form>
                      <form action={roleAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value="admin" />
                        <Button type="submit" size="sm" variant="secondary">设为管理员</Button>
                      </form>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">结算审批</CardTitle>
                <CardDescription className="text-slate-400">管理员线下打款后批准申请，并填写打款参考号；也可以直接驳回。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.settlementApplications.length === 0 && <div className="rounded-2xl bg-slate-900/70 px-4 py-5 text-sm text-slate-400">暂无结算申请。</div>}
                {data.settlementApplications.map((item) => (
                  <form key={item.id} action={settlementAction} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-4">
                    <input type="hidden" name="applicationId" value={item.id} />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{item.application_no}</div>
                        <div className="text-sm text-slate-400 mt-1">申请人：{item.user_id} / 金额：￥{Number(item.amount).toFixed(2)}</div>
                      </div>
                      <Badge variant={STATUS_VARIANTS[item.status] || 'outline'}>{SETTLEMENT_STATUS_LABELS[item.status]}</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <input name="transferRef" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" placeholder="批准时填写打款参考号 / 流水号" defaultValue={item.transfer_ref || ''} />
                      <textarea name="note" className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white min-h-24" placeholder="管理员备注" defaultValue={item.note || ''} />
                    </div>
                    {item.status === 'PENDING' && (
                      <div className="flex flex-wrap gap-3">
                        <Button type="submit" name="decision" value="approve" size="sm">批准并确认打款</Button>
                        <Button type="submit" name="decision" value="reject" size="sm" variant="outline">驳回申请</Button>
                      </div>
                    )}
                  </form>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">快递订单</CardTitle>
                <CardDescription className="text-slate-400">最新快递代取订单状态。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.expressOrders.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{item.order_no}</div>
                      <Badge variant={STATUS_VARIANTS[item.status] || 'outline'}>{EXPRESS_STATUS_LABELS[item.status]}</Badge>
                    </div>
                    <div>{item.pickup_station} → {item.delivery_building}</div>
                    <div>应付：￥{Number(item.order_amount).toFixed(2)} / 接单可得：￥{Number(item.runner_income).toFixed(2)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">旧书帖子</CardTitle>
                <CardDescription className="text-slate-400">最新旧书发布状态。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.bookPosts.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{item.title}</div>
                      <Badge variant={STATUS_VARIANTS[item.shelf_status] || 'outline'}>{BOOK_POST_STATUS_LABELS[item.shelf_status]}</Badge>
                    </div>
                    <div>{item.category} / {item.condition_level}</div>
                    <div>售价：￥{Number(item.sale_price).toFixed(2)} / 卖家到手：￥{Number(item.seller_income).toFixed(2)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">旧书订单</CardTitle>
                <CardDescription className="text-slate-400">最新旧书交易状态。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.bookOrders.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{item.book_title}</div>
                      <Badge variant={STATUS_VARIANTS[item.status] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[item.status]}</Badge>
                    </div>
                    <div>订单号：{item.order_no}</div>
                    <div>支付：￥{Number(item.sale_price).toFixed(2)} / 卖家到手：￥{Number(item.seller_income).toFixed(2)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    )
  } catch (loadError) {
    const message = loadError instanceof Error ? loadError.message : '管理员后台加载失败。'

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full rounded-3xl border border-white/10 bg-white/5 p-10 space-y-4">
          <h1 className="text-3xl font-bold">管理员后台暂时不可用</h1>
          <p className="text-slate-300 leading-7">{message}</p>
          <p className="text-sm text-slate-400 leading-7">如果当前账号不是管理员，或缺少 `SUPABASE_SERVICE_ROLE_KEY`，后台页面会加载失败。</p>
        </div>
      </div>
    )
  }
}

