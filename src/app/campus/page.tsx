import Link from 'next/link'
import { BookOpen, Bot, HeartHandshake, Package, ReceiptText, Wallet } from 'lucide-react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/UI/Card'
import { Badge } from '@/components/UI/Badge'
import { getCurrentUser } from '@/lib/actions/auth'
import { getCampusDashboard } from '@/lib/actions/campus'
import { APP_ROLE_LABELS } from '@/lib/types'

const quickLinks = [
  {
    href: '/campus/express',
    title: '快递代取',
    desc: '多件合单下单、接单广场、接单流程都在这里。',
    icon: Package,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    href: '/campus/books',
    title: '旧书广场',
    desc: '发布旧书、直接进入广场、买家下单和卖家送书。',
    icon: BookOpen,
    color: 'bg-lime-50 text-lime-600',
  },
  {
    href: '/campus/orders',
    title: '订单中心',
    desc: '查看我发起、我接单、我买到和我卖出的所有订单。',
    icon: ReceiptText,
    color: 'bg-sky-50 text-sky-600',
  },
  {
    href: '/campus/wallet',
    title: '校园钱包',
    desc: '查看余额、账本、结算申请和处理状态。',
    icon: Wallet,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    href: '/draw',
    title: '晴窗',
    desc: '轻创内的同频社交功能，资料与后续付费能力统一并到主站。',
    icon: HeartHandshake,
    color: 'bg-rose-50 text-rose-500',
  },
  {
    href: '/ai-companion',
    title: 'AI 陪伴',
    desc: '角色创建、聊天、长期记忆都已经并入轻创主站。',
    icon: Bot,
    color: 'bg-cyan-50 text-cyan-600',
  },
]

export default async function CampusPage() {
  const current = await getCurrentUser()

  if (!current) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-20">
          <Card>
            <CardContent className="p-10 text-center space-y-5">
              <h1 className="text-3xl font-bold text-gray-900">请先登录校园服务端</h1>
              <p className="text-gray-600">普通用户注册后会统一进入这里，管理员请走独立后台入口。</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/auth/login"><Button>普通用户登录</Button></Link>
                <Link href="/auth/register"><Button variant="outline">注册账号</Button></Link>
                <Link href="/admin/login"><Button variant="secondary">管理员登录</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  try {
    const { data } = await getCampusDashboard()

    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto py-8 space-y-8">
          <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
            <Card className="border-none shadow-xl bg-gradient-to-br from-amber-500 via-emerald-500 to-sky-500 text-white">
              <CardContent className="p-8 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="warning" className="bg-white/20 text-white hover:bg-white/20">校园服务端</Badge>
                  <Badge variant="outline" className="border-white/30 text-white">{APP_ROLE_LABELS[data.profile.app_role || 'user']}</Badge>
                </div>
                <div>
                  <h1 className="text-4xl font-bold">{data.profile.nickname || data.profile.account}</h1>
                  <p className="text-white/90 mt-3 leading-7 max-w-2xl">
                    轻创 Qintra 已经统一接入校园快递代取、旧书广场、校园钱包、晴窗、AI 陪伴和管理员独立后台。
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="rounded-2xl bg-white/15 p-4">
                    <div className="text-sm text-white/80">可结算余额</div>
                    <div className="text-2xl font-bold mt-2">￥{Number(data.profile.campus_available_balance || 0).toFixed(2)}</div>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-4">
                    <div className="text-sm text-white/80">待完成收入</div>
                    <div className="text-2xl font-bold mt-2">￥{Number(data.profile.campus_pending_balance || 0).toFixed(2)}</div>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-4">
                    <div className="text-sm text-white/80">结算申请中</div>
                    <div className="text-2xl font-bold mt-2">￥{Number(data.profile.campus_settlement_applying_amount || 0).toFixed(2)}</div>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-4">
                    <div className="text-sm text-white/80">累计已结算</div>
                    <div className="text-2xl font-bold mt-2">￥{Number(data.profile.campus_settled_total || 0).toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle>本账号当前概况</CardTitle>
                <CardDescription>这里聚合校园业务最常用的统计。</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl bg-amber-50 p-4">
                  <div className="text-gray-500">我发起的快递单</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{data.myExpressCount}</div>
                </div>
                <div className="rounded-2xl bg-lime-50 p-4">
                  <div className="text-gray-500">广场待接快递单</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{data.openExpressCount}</div>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4">
                  <div className="text-gray-500">我在售旧书</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{data.onSaleBookCount}</div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="text-gray-500">我的旧书订单</div>
                  <div className="text-3xl font-bold text-gray-900 mt-2">{data.myBookOrderCount}</div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="border-none h-full hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <CardContent className="p-6 space-y-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">{item.title}</div>
                      <p className="text-sm text-gray-600 mt-2 leading-6">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>当前业务规则</CardTitle>
              <CardDescription>页面和后端已经按这套规则统一。</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 leading-7">
              <div className="rounded-2xl bg-amber-50 p-5">
                快递代取按小件 2 元、中件 4 元、大件 6 元、超大件 8 元计费；同单满 3 件后每件减 1 元。
                用户只看到应付金额，平台手续费走内部账本，不在下单页对用户展示。
              </div>
              <div className="rounded-2xl bg-sky-50 p-5">
                旧书发布后直接进入旧书广场；买家支付后填写楼栋/楼层，卖家送达，买家确认收货后卖家余额增加。
                旧书统一手续费为每本 2 元。
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : '校园模块加载失败。'

    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-20">
          <Card>
            <CardContent className="p-10 space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">校园模块暂时无法加载</h1>
              <p className="text-gray-600 leading-7">{message}</p>
              <p className="text-sm text-gray-500 leading-7">通常是 Supabase 新 schema 还没执行，或者缺少 `SUPABASE_SERVICE_ROLE_KEY` 环境变量。</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }
}
