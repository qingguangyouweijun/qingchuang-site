import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { MainLayout } from '@/components/Layout/MainLayout'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/Badge'
import { getCurrentUser } from '@/lib/actions/auth'
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
  const current = await getCurrentUser()

  async function settlementAction(formData: FormData) {
    'use server'

    try {
      await createSettlementApplication(Number(formData.get('amount') || 0))
      revalidatePath('/campus/wallet')
      redirect(messageUrl('/campus/wallet', 'notice', '结算申请已提交，等待管理员处理。'))
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : '提交结算申请失败。'
      redirect(messageUrl('/campus/wallet', 'error', message))
    }
  }

  if (!current) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-20">
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">请先登录后查看校园钱包</h1>
              <p className="text-gray-600">校园钱包记录快递接单收入、旧书成交收入和结算申请。</p>
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
    const data = await getCampusWalletData()

    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto py-8 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">校园钱包</h1>
            <p className="text-gray-600 mt-3 leading-7 max-w-3xl">
              这里统一管理快递代取收入、旧书成交收入、结算申请和管理员处理结果。平台采用内部账本，不对普通用户展示内部手续费拆分。
            </p>
          </div>

          {(notice || error) && (
            <div className={`rounded-2xl px-5 py-4 text-sm ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {error || notice}
            </div>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-[1fr_0.9fr] gap-6">
            <Card className="border-none shadow-xl bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <CardContent className="p-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/10 p-5">
                  <div className="text-white/70 text-sm">可结算余额</div>
                  <div className="text-3xl font-bold mt-3">￥{Number(data.profile.campus_available_balance || 0).toFixed(2)}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-5">
                  <div className="text-white/70 text-sm">待完成收入</div>
                  <div className="text-3xl font-bold mt-3">￥{Number(data.profile.campus_pending_balance || 0).toFixed(2)}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-5">
                  <div className="text-white/70 text-sm">结算申请中</div>
                  <div className="text-3xl font-bold mt-3">￥{Number(data.profile.campus_settlement_applying_amount || 0).toFixed(2)}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-5">
                  <div className="text-white/70 text-sm">累计已结算</div>
                  <div className="text-3xl font-bold mt-3">￥{Number(data.profile.campus_settled_total || 0).toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>发起结算申请</CardTitle>
                <CardDescription>管理员线下打款后会在后台审批，通过后可结算余额转为已结算金额。</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={settlementAction} className="space-y-4">
                  <label className="space-y-2 text-sm text-gray-600 block">
                    <span>本次申请金额</span>
                    <input name="amount" type="number" min="0.01" step="0.01" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3" placeholder="请输入不大于可结算余额的金额" required />
                  </label>
                  <div className="rounded-2xl bg-orange-50 px-4 py-4 text-sm text-gray-700 leading-7">
                    当前可结算余额为 ￥{Number(data.profile.campus_available_balance || 0).toFixed(2)}。
                    提交后金额会先转入“结算申请中”，管理员批准后计入“累计已结算”。
                  </div>
                  <Button type="submit">提交结算申请</Button>
                </form>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>结算申请记录</CardTitle>
                <CardDescription>管理员处理后会写入结算状态、备注和打款参考号。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.settlements.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">暂无结算申请记录。</div>}
                {data.settlements.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{item.application_no}</div>
                        <div className="text-sm text-gray-500 mt-1">申请金额 ￥{Number(item.amount).toFixed(2)}</div>
                      </div>
                      <Badge variant={SETTLEMENT_VARIANTS[item.status] || 'outline'}>{SETTLEMENT_STATUS_LABELS[item.status]}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 leading-7">
                      <div>备注：{item.note || '暂无备注'}</div>
                      <div>打款参考：{item.transfer_ref || '待管理员填写'}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>余额流水</CardTitle>
                <CardDescription>记录快递收入、旧书成交收入和结算转移明细。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.logs.length === 0 && <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">暂无余额流水。</div>}
                {data.logs.map((log: any) => (
                  <div key={log.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-2 text-sm text-gray-600">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-semibold text-gray-900">{log.remark || log.change_type}</div>
                      <div className={`font-semibold ${Number(log.amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {Number(log.amount) >= 0 ? '+' : ''}￥{Number(log.amount).toFixed(2)}
                      </div>
                    </div>
                    <div>业务类型：{log.biz_type} / 变动类型：{log.change_type}</div>
                    <div>可结算：￥{Number(log.before_available).toFixed(2)} → ￥{Number(log.after_available).toFixed(2)}</div>
                    <div>待完成：￥{Number(log.before_pending).toFixed(2)} → ￥{Number(log.after_pending).toFixed(2)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      </MainLayout>
    )
  } catch (loadError) {
    const message = loadError instanceof Error ? loadError.message : '校园钱包加载失败。'

    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-20">
          <Card>
            <CardContent className="p-10 space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">校园钱包暂时不可用</h1>
              <p className="text-gray-600 leading-7">{message}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }
}

