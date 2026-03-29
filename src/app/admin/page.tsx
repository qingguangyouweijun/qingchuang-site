import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { Badge } from "@/components/UI/Badge"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card"
import { getCurrentUser, signOut } from "@/lib/actions/auth"
import {
  approveSettlement,
  getAdminDashboardData,
  rejectSettlement,
  updateUserAppRole,
} from "@/lib/actions/campus"

const APP_ROLE_LABELS = {
  user: "普通用户",
  admin: "管理员",
} as const

const EXPRESS_STATUS_LABELS = {
  PENDING_PAYMENT: "待支付",
  OPEN: "待接单",
  ACCEPTED: "已接单",
  PICKED_UP: "已取件",
  DELIVERED: "已送达",
  COMPLETED: "已完成",
} as const

const BOOK_POST_STATUS_LABELS = {
  ON_SALE: "在售",
  LOCKED: "已锁定",
  SOLD: "已售出",
  OFF_SHELF: "已下架",
} as const

const BOOK_ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: "待支付",
  WAITING_SELLER: "待卖家送达",
  DELIVERED: "待确认收货",
  COMPLETED: "已完成",
} as const

const SETTLEMENT_STATUS_LABELS = {
  PENDING: "结算申请中",
  APPROVED: "已结算",
  REJECTED: "已驳回",
} as const

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "warning" | "success" | "outline" | "destructive"> = {
  PENDING_PAYMENT: "warning",
  OPEN: "default",
  ACCEPTED: "secondary",
  PICKED_UP: "secondary",
  DELIVERED: "warning",
  COMPLETED: "success",
  WAITING_SELLER: "secondary",
  ON_SALE: "success",
  LOCKED: "warning",
  SOLD: "secondary",
  OFF_SHELF: "outline",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
}

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : ""
}

function messageUrl(base: string, key: "notice" | "error", message: string) {
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
    "use server"

    try {
      await updateUserAppRole({
        userId: String(formData.get("userId") || ""),
        role: String(formData.get("role") || "user") as "user" | "admin",
      })
      revalidatePath("/admin")
      redirect(messageUrl("/admin", "notice", "用户角色已更新。"))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : "更新用户角色失败。"
      redirect(messageUrl("/admin", "error", message))
    }
  }

  async function settlementCompleteAction(formData: FormData) {
    "use server"

    try {
      await approveSettlement({
        applicationId: String(formData.get("applicationId") || ""),
        note: "管理员已完成结算。",
      })
      revalidatePath("/admin")
      redirect(messageUrl("/admin", "notice", "该申请已完成结算。"))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : "处理结算申请失败。"
      redirect(messageUrl("/admin", "error", message))
    }
  }

  async function settlementRejectAction(formData: FormData) {
    "use server"

    try {
      await rejectSettlement({
        applicationId: String(formData.get("applicationId") || ""),
        note: String(formData.get("note") || "管理员已驳回申请。"),
      })
      revalidatePath("/admin")
      redirect(messageUrl("/admin", "notice", "该申请已驳回。"))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : "驳回结算申请失败。"
      redirect(messageUrl("/admin", "error", message))
    }
  }

  if (!current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="w-full max-w-xl space-y-4 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <h1 className="text-3xl font-bold">请先登录管理员账号</h1>
          <p className="leading-7 text-slate-300">管理员后台与普通用户页面分离，请使用管理员账号单独登录后进入。</p>
          <div className="flex justify-center gap-4">
            <Link href="/admin/login">
              <Button variant="secondary">管理员登录</Button>
            </Link>
            <Link href="/campus">
              <Button variant="outline">返回校园服务</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  try {
    const data = await getAdminDashboardData()
    const userMap = new Map(
      (data.users || []).map((user: any) => [
        user.id,
        {
          name: user.nickname || user.account,
          account: user.account,
        },
      ]),
    )

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
          <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/15 px-4 py-2 text-sm text-indigo-200">
                校园管理员后台
              </div>
              <h1 className="mt-4 text-4xl font-bold">管理员网站</h1>
              <p className="mt-3 max-w-3xl leading-7 text-slate-300">
                这里集中查看用户角色、结算申请、快递代取订单和旧书交易状态。结算申请会展示金额与收款码，管理员线下打款后可直接点“完成结算”。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/campus">
                <Button variant="outline">查看普通用户端</Button>
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="secondary">退出登录</Button>
              </form>
            </div>
          </header>

          {(notice || error) && (
            <div
              className={`rounded-2xl px-5 py-4 text-sm ${
                error
                  ? "border border-red-500/30 bg-red-500/10 text-red-200"
                  : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {error || notice}
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">最近 20 条快递单</div>
              <div className="mt-3 text-4xl font-bold">{data.expressOrders.length}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">最近 20 条旧书帖子</div>
              <div className="mt-3 text-4xl font-bold">{data.bookPosts.length}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">最近 20 条旧书订单</div>
              <div className="mt-3 text-4xl font-bold">{data.bookOrders.length}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">待处理结算申请</div>
              <div className="mt-3 text-4xl font-bold">
                {data.settlementApplications.filter((item) => item.status === "PENDING").length}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">用户与角色</CardTitle>
                <CardDescription className="text-slate-400">可以在这里把用户切换为管理员或普通用户。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(data.users || []).map((user: any) => (
                  <div key={user.id} className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{user.nickname || user.account}</div>
                        <div className="mt-1 text-sm text-slate-400">邮箱：{user.account}</div>
                      </div>
                      <Badge variant={user.app_role === "admin" ? "secondary" : "outline"}>
                        {APP_ROLE_LABELS[user.app_role === "admin" ? "admin" : "user"]}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <div>可结算余额：¥{Number(user.campus_available_balance || 0).toFixed(2)}</div>
                      <div>待完成收入：¥{Number(user.campus_pending_balance || 0).toFixed(2)}</div>
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
                <CardTitle className="text-slate-100">结算申请</CardTitle>
                <CardDescription className="text-slate-400">
                  这里会展示申请金额与用户附带的收款码。线下打款完成后，直接点击“完成结算”。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.settlementApplications.length === 0 && (
                  <div className="rounded-2xl bg-slate-900/70 px-4 py-5 text-sm text-slate-400">暂时没有结算申请。</div>
                )}
                {data.settlementApplications.map((item) => {
                  const applicant = userMap.get(item.user_id)

                  return (
                    <div key={item.id} className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">{item.application_no}</div>
                          <div className="mt-1 text-sm text-slate-400">
                            申请人：{applicant?.name || item.user_id} {applicant?.account ? `(${applicant.account})` : ""}
                          </div>
                          <div className="mt-1 text-sm text-slate-300">
                            申请金额：<span className="text-lg font-bold text-white">¥{Number(item.amount).toFixed(2)}</span>
                          </div>
                        </div>
                        <Badge variant={STATUS_VARIANTS[item.status] || "outline"}>
                          {SETTLEMENT_STATUS_LABELS[item.status as keyof typeof SETTLEMENT_STATUS_LABELS] || item.status}
                        </Badge>
                      </div>

                      {item.payee_qr_code ? (
                        <div className="space-y-2">
                          <div className="text-xs uppercase tracking-wide text-slate-400">收款码</div>
                          <img
                            src={item.payee_qr_code}
                            alt="收款码"
                            className="h-48 w-48 rounded-2xl border border-white/10 bg-white object-contain p-2"
                          />
                        </div>
                      ) : (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                          用户没有附带收款码，请线下联系用户补充。
                        </div>
                      )}

                      {item.status === "PENDING" && (
                        <div className="flex flex-wrap gap-3">
                          <form action={settlementCompleteAction}>
                            <input type="hidden" name="applicationId" value={item.id} />
                            <Button type="submit" size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
                              完成结算
                            </Button>
                          </form>
                          <form action={settlementRejectAction} className="flex gap-2">
                            <input type="hidden" name="applicationId" value={item.id} />
                            <input
                              name="note"
                              className="w-44 rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white"
                              placeholder="驳回原因（选填）"
                              defaultValue=""
                            />
                            <Button type="submit" size="sm" variant="outline">驳回</Button>
                          </form>
                        </div>
                      )}

                      {item.status !== "PENDING" && item.note && (
                        <div className="text-sm text-slate-400">备注：{item.note}</div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">快递订单</CardTitle>
                <CardDescription className="text-slate-400">最近快递代取订单状态。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.expressOrders.map((item) => (
                  <div key={item.id} className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{item.order_no}</div>
                      <Badge variant={STATUS_VARIANTS[item.status] || "outline"}>
                        {EXPRESS_STATUS_LABELS[item.status as keyof typeof EXPRESS_STATUS_LABELS] || item.status}
                      </Badge>
                    </div>
                    <div>
                      {item.pickup_station} → {item.delivery_building}
                    </div>
                    <div>
                      应付：¥{Number(item.order_amount).toFixed(2)} / 接单可得：¥{Number(item.runner_income).toFixed(2)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">旧书帖子</CardTitle>
                <CardDescription className="text-slate-400">最近旧书发布状态。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.bookPosts.map((item) => (
                  <div key={item.id} className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{item.title}</div>
                      <Badge variant={STATUS_VARIANTS[item.shelf_status] || "outline"}>
                        {BOOK_POST_STATUS_LABELS[item.shelf_status as keyof typeof BOOK_POST_STATUS_LABELS] || item.shelf_status}
                      </Badge>
                    </div>
                    <div>
                      {item.category} / {item.condition_level}
                    </div>
                    <div>
                      售价：¥{Number(item.sale_price).toFixed(2)} / 卖家到手：¥{Number(item.seller_income).toFixed(2)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">旧书订单</CardTitle>
                <CardDescription className="text-slate-400">最近旧书交易状态。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.bookOrders.map((item) => (
                  <div key={item.id} className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{item.book_title}</div>
                      <Badge variant={STATUS_VARIANTS[item.status] || "outline"}>
                        {BOOK_ORDER_STATUS_LABELS[item.status as keyof typeof BOOK_ORDER_STATUS_LABELS] || item.status}
                      </Badge>
                    </div>
                    <div>订单号：{item.order_no}</div>
                    <div>
                      支付：¥{Number(item.sale_price).toFixed(2)} / 卖家到手：¥{Number(item.seller_income).toFixed(2)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    )
  } catch (loadError) {
    const message = loadError instanceof Error ? loadError.message : "管理员后台加载失败。"

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="w-full max-w-2xl space-y-4 rounded-3xl border border-white/10 bg-white/5 p-10">
          <h1 className="text-3xl font-bold">管理员后台暂时不可用</h1>
          <p className="leading-7 text-slate-300">{message}</p>
          <p className="text-sm leading-7 text-slate-400">
            如果当前账号不是管理员，或者管理员数据还未同步完成，后台页面可能会加载失败。
          </p>
        </div>
      </div>
    )
  }
}
