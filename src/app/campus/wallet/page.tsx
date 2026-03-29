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
import { createSettlementApplication, getCampusWalletData } from '@/lib/actions/campus'
import { SETTLEMENT_STATUS_LABELS } from '@/lib/types'

const SETTLEMENT_VARIANTS: Record<string, 'default' | 'secondary' | 'warning' | 'success' | 'outline' | 'destructive'> = {
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

export default async function CampusWalletPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const notice = getParam(params.notice)
  const error = getParam(params.error)
  const session = await getSession()

  async function settlementAction(formData: FormData) {
    'use server'

    try {
      await createSettlementApplication(Number(formData.get('amount') || 0))
      revalidatePath('/campus/wallet')
      redirect(messageUrl('/campus/wallet', 'notice', '缁撶畻鐢宠宸叉彁浜わ紝绛夊緟绠＄悊鍛樺鐞嗐€?))
    } catch (actionError) {
      if (isRedirectError(actionError)) {
        throw actionError
      }
      const message = actionError instanceof Error ? actionError.message : '鎻愪氦缁撶畻鐢宠澶辫触銆?
      redirect(messageUrl('/campus/wallet', 'error', message))
    }
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto py-8 space-y-6">
          <CampusSubnav />
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <h1 className="text-3xl font-bold text-slate-900">璇峰厛鐧诲綍鍚庢煡鐪嬫牎鍥挶鍖?/h1>
              <p className="text-slate-600">鏍″洯閽卞寘璁板綍蹇€掓帴鍗曟敹鍏ャ€佹棫涔︽垚浜ゆ敹鍏ュ拰缁撶畻鐢宠銆?/p>
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

  let data: any = {
    profile: {
      campus_available_balance: 0,
      campus_pending_balance: 0,
      campus_settlement_applying_amount: 0,
      campus_settled_total: 0,
    },
    settlements: [] as any[],
    logs: [] as any[],
  }
  let loadWarning = ''

  try {
    data = await getCampusWalletData()
  } catch (loadError) {
    loadWarning = loadError instanceof Error ? loadError.message : '鏍″洯閽卞寘鏁版嵁鏆傛椂涓嶅彲鐢ㄣ€?
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <CampusSubnav />

        <div>
          <h1 className="text-4xl font-bold text-slate-900">鏍″洯閽卞寘</h1>
          <p className="mt-3 max-w-3xl text-slate-600 leading-7">
            杩欓噷缁熶竴绠＄悊蹇€掍唬鍙栨敹鍏ャ€佹棫涔︽垚浜ゆ敹鍏ャ€佺粨绠楃敵璇峰拰绠＄悊鍛樺鐞嗙粨鏋溿€傞〉闈細浼樺厛淇濊瘉鍏ュ彛鍙锛屽嵆浣挎暟鎹繕鍦ㄥ悓姝ヤ腑涔熶笉浼氱洿鎺ユ姤閿欍€?
          </p>
        </div>

        {(notice || error) && (
          <div className={`rounded-2xl px-5 py-4 text-sm ${error ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || notice}
          </div>
        )}

        {loadWarning && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            褰撳墠鏍″洯閽卞寘鏁版嵁杩樺湪鍚屾涓細{loadWarning}
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_0.92fr] gap-6">
          <Card className="border-none bg-slate-900 text-white shadow-xl">
            <CardContent className="grid grid-cols-2 gap-4 p-8">
              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-sm text-white/70">鍙粨绠椾綑棰?/div>
                <div className="mt-3 text-3xl font-bold">锟Number(data.profile.campus_available_balance || 0).toFixed(2)}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-sm text-white/70">寰呭畬鎴愭敹鍏?/div>
                <div className="mt-3 text-3xl font-bold">锟Number(data.profile.campus_pending_balance || 0).toFixed(2)}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-sm text-white/70">缁撶畻鐢宠涓?/div>
                <div className="mt-3 text-3xl font-bold">锟Number(data.profile.campus_settlement_applying_amount || 0).toFixed(2)}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-sm text-white/70">绱宸茬粨绠?/div>
                <div className="mt-3 text-3xl font-bold">锟Number(data.profile.campus_settled_total || 0).toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>鍙戣捣缁撶畻鐢宠</CardTitle>
              <CardDescription>绠＄悊鍛樼嚎涓嬫墦娆惧悗浼氬湪鍚庡彴瀹℃壒锛岄€氳繃鍚庤浆鍏ョ疮璁″凡缁撶畻銆?/CardDescription>
            </CardHeader>
            <CardContent>
              <form action={settlementAction} className="space-y-4">
                <label className="block space-y-2 text-sm text-slate-600">
                  <span>鏈鐢宠閲戦</span>
                  <input name="amount" type="number" min="0.01" step="0.01" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="璇疯緭鍏ヤ笉澶т簬鍙粨绠椾綑棰濈殑閲戦" required />
                </label>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 leading-7">
                  褰撳墠鍙粨绠椾綑棰濅负 锟Number(data.profile.campus_available_balance || 0).toFixed(2)}銆傛彁浜ゅ悗閲戦浼氬厛杞叆鈥滅粨绠楃敵璇蜂腑鈥濄€?
                </div>
                <Button type="submit">鎻愪氦缁撶畻鐢宠</Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>缁撶畻鐢宠璁板綍</CardTitle>
              <CardDescription>绠＄悊鍛樺鐞嗗悗浼氬啓鍏ョ姸鎬併€佸娉ㄥ拰鎵撴鍙傝€冨彿銆?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.settlements.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">鏆傛棤缁撶畻鐢宠璁板綍銆?/div>}
              {data.settlements.map((item: any) => (
                <div key={item.id} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{item.application_no}</div>
                      <div className="mt-1 text-sm text-slate-500">鐢宠閲戦 锟Number(item.amount).toFixed(2)}</div>
                    </div>
                    <Badge variant={SETTLEMENT_VARIANTS[item.status as keyof typeof SETTLEMENT_VARIANTS] || 'outline'}>{SETTLEMENT_STATUS_LABELS[item.status as keyof typeof SETTLEMENT_STATUS_LABELS] || item.status}</Badge>
                  </div>
                  <div className="text-sm text-slate-600 leading-7">
                    <div>澶囨敞锛歿item.note || '鏆傛棤澶囨敞'}</div>
                    <div>鎵撴鍙傝€冿細{item.transfer_ref || '寰呯鐞嗗憳濉啓'}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>浣欓娴佹按</CardTitle>
              <CardDescription>璁板綍蹇€掓敹鍏ャ€佹棫涔︽垚浜ゆ敹鍏ュ拰缁撶畻杞Щ鏄庣粏銆?/CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.logs.length === 0 && <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">鏆傛棤浣欓娴佹按銆?/div>}
              {data.logs.map((log: any) => (
                <div key={log.id} className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">{log.remark || log.change_type}</div>
                    <div className={`font-semibold ${Number(log.amount) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {Number(log.amount) >= 0 ? '+' : ''}锟Number(log.amount).toFixed(2)}
                    </div>
                  </div>
                  <div>涓氬姟绫诲瀷锛歿log.biz_type} / 鍙樺姩绫诲瀷锛歿log.change_type}</div>
                  <div>鍙粨绠楋細锟Number(log.before_available).toFixed(2)} 鈫?锟Number(log.after_available).toFixed(2)}</div>
                  <div>寰呭畬鎴愶細锟Number(log.before_pending).toFixed(2)} 鈫?锟Number(log.after_pending).toFixed(2)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  )
}
