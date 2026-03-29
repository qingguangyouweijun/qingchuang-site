import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
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
      redirect(messageUrl('/admin', 'notice', '鐢ㄦ埛瑙掕壊宸叉洿鏂般€?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '鏇存柊鐢ㄦ埛瑙掕壊澶辫触銆?
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
          note: String(formData.get('note') || '绠＄悊鍛樺凡椹冲洖鐢宠銆?),
        })
      }
      revalidatePath('/admin')
      redirect(messageUrl('/admin', 'notice', '缁撶畻鐢宠宸插鐞嗐€?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '澶勭悊缁撶畻鐢宠澶辫触銆?
      redirect(messageUrl('/admin', 'error', message))
    }
  }

  if (!current) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center space-y-4">
          <h1 className="text-3xl font-bold">璇峰厛鐧诲綍绠＄悊鍛樿处鍙?/h1>
          <p className="text-slate-300 leading-7">绠＄悊鍛樺拰鏅€氱敤鎴峰凡缁忓垎寮€銆傜鐞嗗憳蹇呴』閫氳繃鍗曠嫭鐨勭鐞嗗憳鐧诲綍鍏ュ彛杩涘叆鍚庡彴銆?/p>
          <div className="flex justify-center gap-4">
            <Link href="/admin/login"><Button variant="secondary">绠＄悊鍛樼櫥褰?/Button></Link>
            <Link href="/campus"><Button variant="outline">杩斿洖鏍″洯鏈嶅姟绔?/Button></Link>
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
                鏍″洯绠＄悊鍛樺悗鍙?
              </div>
              <h1 className="text-4xl font-bold mt-4">绠＄悊鍛樼綉绔?/h1>
              <p className="text-slate-300 mt-3 leading-7 max-w-3xl">
                杩欓噷鐙珛浜庢櫘閫氱敤鎴风锛岀敤浜庢煡鐪嬭鍗曘€佺鐞嗙敤鎴疯鑹层€佸鎵圭粨绠楃敵璇凤紝骞舵牳瀵瑰揩閫掑拰鏃т功浜ゆ槗鐘舵€併€?
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Link href="/campus"><Button variant="outline">鏌ョ湅鏅€氱敤鎴风</Button></Link>
              <form action={signOut}><Button type="submit" variant="secondary">閫€鍑虹櫥褰?/Button></form>
            </div>
          </header>

          {(notice || error) && (
            <div className={`rounded-2xl px-5 py-4 text-sm ${error ? 'bg-red-500/10 text-red-200 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30'}`}>
              {error || notice}
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">杩?20 鏉″揩閫掕鍗?/div>
              <div className="text-4xl font-bold mt-3">{data.expressOrders.length}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">杩?20 鏉℃棫涔﹀笘瀛?/div>
              <div className="text-4xl font-bold mt-3">{data.bookPosts.length}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">杩?20 鏉℃棫涔﹁鍗?/div>
              <div className="text-4xl font-bold mt-3">{data.bookOrders.length}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-slate-400">寰呭鐞嗙粨绠楃敵璇?/div>
              <div className="text-4xl font-bold mt-3">{data.settlementApplications.filter((item) => item.status === 'PENDING').length}</div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">鐢ㄦ埛涓庤鑹?/CardTitle>
                <CardDescription className="text-slate-400">缁熶竴韬唤宸茬粡鍒囧埌閭楠岃瘉鐮佺櫥褰曘€傝繖閲屽彲浠ユ妸鐢ㄦ埛鍒囨崲涓虹鐞嗗憳鎴栨櫘閫氱敤鎴枫€?/CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(data.users || []).map((user: any) => (
                  <div key={user.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{user.nickname || user.account}</div>
                        <div className="text-sm text-slate-400 mt-1">閭锛歿user.account}</div>
                      </div>
                      <Badge variant={user.app_role === 'admin' ? 'secondary' : 'outline'}>{APP_ROLE_LABELS[user.app_role === 'admin' ? 'admin' : 'user']}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <div>鍙粨绠椾綑棰濓細锟Number(user.campus_available_balance || 0).toFixed(2)}</div>
                      <div>寰呭畬鎴愭敹鍏ワ細锟Number(user.campus_pending_balance || 0).toFixed(2)}</div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <form action={roleAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value="user" />
                        <Button type="submit" size="sm" variant="outline">璁句负鏅€氱敤鎴?/Button>
                      </form>
                      <form action={roleAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value="admin" />
                        <Button type="submit" size="sm" variant="secondary">璁句负绠＄悊鍛?/Button>
                      </form>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">缁撶畻瀹℃壒</CardTitle>
                <CardDescription className="text-slate-400">绠＄悊鍛樼嚎涓嬫墦娆惧悗鎵瑰噯鐢宠锛屽苟濉啓鎵撴鍙傝€冨彿锛涗篃鍙互鐩存帴椹冲洖銆?/CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.settlementApplications.length === 0 && <div className="rounded-2xl bg-slate-900/70 px-4 py-5 text-sm text-slate-400">鏆傛棤缁撶畻鐢宠銆?/div>}
                {data.settlementApplications.map((item) => (
                  <form key={item.id} action={settlementAction} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-4">
                    <input type="hidden" name="applicationId" value={item.id} />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{item.application_no}</div>
                        <div className="text-sm text-slate-400 mt-1">鐢宠浜猴細{item.user_id} / 閲戦锛氾骏{Number(item.amount).toFixed(2)}</div>
                      </div>
                      <Badge variant={STATUS_VARIANTS[item.status] || 'outline'}>{SETTLEMENT_STATUS_LABELS[item.status]}</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <input name="transferRef" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" placeholder="鎵瑰噯鏃跺～鍐欐墦娆惧弬鑰冨彿 / 娴佹按鍙? defaultValue={item.transfer_ref || ''} />
                      <textarea name="note" className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white min-h-24" placeholder="绠＄悊鍛樺娉? defaultValue={item.note || ''} />
                    </div>
                    {item.status === 'PENDING' && (
                      <div className="flex flex-wrap gap-3">
                        <Button type="submit" name="decision" value="approve" size="sm">鎵瑰噯骞剁‘璁ゆ墦娆?/Button>
                        <Button type="submit" name="decision" value="reject" size="sm" variant="outline">椹冲洖鐢宠</Button>
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
                <CardTitle className="text-slate-100">蹇€掕鍗?/CardTitle>
                <CardDescription className="text-slate-400">鏈€鏂板揩閫掍唬鍙栬鍗曠姸鎬併€?/CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.expressOrders.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{item.order_no}</div>
                      <Badge variant={STATUS_VARIANTS[item.status] || 'outline'}>{EXPRESS_STATUS_LABELS[item.status]}</Badge>
                    </div>
                    <div>{item.pickup_station} 鈫?{item.delivery_building}</div>
                    <div>搴斾粯锛氾骏{Number(item.order_amount).toFixed(2)} / 鎺ュ崟鍙緱锛氾骏{Number(item.runner_income).toFixed(2)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">鏃т功甯栧瓙</CardTitle>
                <CardDescription className="text-slate-400">鏈€鏂版棫涔﹀彂甯冪姸鎬併€?/CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.bookPosts.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{item.title}</div>
                      <Badge variant={STATUS_VARIANTS[item.shelf_status] || 'outline'}>{BOOK_POST_STATUS_LABELS[item.shelf_status]}</Badge>
                    </div>
                    <div>{item.category} / {item.condition_level}</div>
                    <div>鍞环锛氾骏{Number(item.sale_price).toFixed(2)} / 鍗栧鍒版墜锛氾骏{Number(item.seller_income).toFixed(2)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-slate-100 shadow-none">
              <CardHeader>
                <CardTitle className="text-slate-100">鏃т功璁㈠崟</CardTitle>
                <CardDescription className="text-slate-400">鏈€鏂版棫涔︿氦鏄撶姸鎬併€?/CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.bookOrders.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{item.book_title}</div>
                      <Badge variant={STATUS_VARIANTS[item.status] || 'outline'}>{BOOK_ORDER_STATUS_LABELS[item.status]}</Badge>
                    </div>
                    <div>璁㈠崟鍙凤細{item.order_no}</div>
                    <div>鏀粯锛氾骏{Number(item.sale_price).toFixed(2)} / 鍗栧鍒版墜锛氾骏{Number(item.seller_income).toFixed(2)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    )
  } catch (loadError) {
    const message = loadError instanceof Error ? loadError.message : '绠＄悊鍛樺悗鍙板姞杞藉け璐ャ€?

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full rounded-3xl border border-white/10 bg-white/5 p-10 space-y-4">
          <h1 className="text-3xl font-bold">绠＄悊鍛樺悗鍙版殏鏃朵笉鍙敤</h1>
          <p className="text-slate-300 leading-7">{message}</p>
          <p className="text-sm text-slate-400 leading-7">濡傛灉褰撳墠璐﹀彿涓嶆槸绠＄悊鍛橈紝鍚庡彴椤甸潰浼氬姞杞藉け璐ャ€傝纭宸蹭娇鐢ㄧ鐞嗗憳璐﹀彿鐧诲綍銆?/p>
        </div>
      </div>
    )
  }
}


