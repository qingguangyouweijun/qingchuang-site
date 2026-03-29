import Link from 'next/link'
import { ClipboardList, Users } from 'lucide-react'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/Badge'
import { getSession } from '@/lib/actions/auth'
import { listExpressOrders } from '@/lib/actions/campus'
import type { CampusExpressOrder } from '@/lib/types'

function resolveOrders(result: PromiseSettledResult<{ orders: CampusExpressOrder[] }>, warnings: string[], label: string) {
  if (result.status === 'fulfilled') {
    return result.value.orders
  }

  warnings.push(label)
  return [] as CampusExpressOrder[]
}

export default async function CampusExpressOverviewPage() {
  const session = await getSession()

  if (!session) {
    return (
      <Card>
        <CardContent className="space-y-4 p-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">请先登录后使用快递代取</h1>
          <p className="text-slate-600">登录后即可进入快递代取的下单与接单结构，完成支付、接单、配送和确认收货。</p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/login"><Button>去邮箱登录</Button></Link>
            <Link href="/auth/register"><Button variant="outline">邮箱注册</Button></Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const warnings: string[] = []
  const [squareResult, myResult, runnerResult] = await Promise.allSettled([
    listExpressOrders('square'),
    listExpressOrders('mine'),
    listExpressOrders('runner'),
  ])

  const squareOrders = resolveOrders(squareResult, warnings, '接单广场')
  const myOrders = resolveOrders(myResult, warnings, '快递代取下单')
  const runnerOrders = resolveOrders(runnerResult, warnings, '快递代取接单')

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <Card className="border-none shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
          <CardContent className="space-y-5 p-8">
            <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              快递代取结构升级
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-slate-900">快递代取</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-600">
                现在把原来的快递页拆成两条平级流程：一条是“快递代取下单”，集中处理创建面单、支付和查看我下的快递单；另一条是“快递代取接单”，集中处理接单广场和我接的快递单。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/campus/express/order">进入快递代取下单</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/campus/express/runner">进入快递代取接单</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle>当前统计</CardTitle>
            <CardDescription>快递代取的下单、待接单和接单情况会分别汇总到这里。</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
              <div className="text-sm text-slate-500">快递代取下单</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{myOrders.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
              <div className="text-sm text-slate-500">接单广场</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{squareOrders.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
              <div className="text-sm text-slate-500">快递代取接单</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{runnerOrders.length}</div>
            </div>
          </CardContent>
        </Card>
      </section>

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          当前快递数据还在同步中，{warnings.join('、')} 可能暂时为空，但结构入口已经可用。
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <Link href="/campus/express/order">
          <Card className="h-full border-none shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-transform duration-300 hover:-translate-y-1">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">快递代取下单</h2>
                  <Badge variant="outline">创建面单 + 我下的快递单</Badge>
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  在一个页面里完成创建快递面单、选择支付方式、同步支付状态，以及查看和确认你自己发起的快递订单。
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/campus/express/runner">
          <Card className="h-full border-none shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-transform duration-300 hover:-translate-y-1">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">快递代取接单</h2>
                  <Badge variant="outline">接单广场 + 我接的快递单</Badge>
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  在这里浏览待接单的快递任务，完成接单、标记已取件、标记已送达，并统一查看自己正在配送的快递订单。
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  )
}

