import Link from 'next/link'
import { BookOpen, Bot, HeartHandshake, Package, ReceiptText, Wallet } from 'lucide-react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { Badge } from '@/components/UI/Badge'
import { getCurrentUser } from '@/lib/actions/auth'
import { getCampusDashboard } from '@/lib/actions/campus'
import { APP_ROLE_LABELS } from '@/lib/types'

const serviceLinks = [
  {
    href: '/campus/express',
    title: '快递代取',
    description: '直接下单、进入接单广场、跟进取件和送达。',
    icon: Package,
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    href: '/campus/books',
    title: '旧书广场',
    description: '发布旧书、浏览广场、下单购买和确认收货。',
    icon: BookOpen,
    tone: 'bg-amber-50 text-amber-600',
  },
  {
    href: '/campus/orders',
    title: '订单中心',
    description: '把我发起、我接单、我买到和我卖出的订单放在一起查看。',
    icon: ReceiptText,
    tone: 'bg-sky-50 text-sky-600',
  },
  {
    href: '/campus/wallet',
    title: '校园钱包',
    description: '查看待结算收入、申请结算并跟踪处理状态。',
    icon: Wallet,
    tone: 'bg-teal-50 text-teal-600',
  },
  {
    href: '/draw',
    title: '晴窗',
    description: '轻创里的独立同频功能，资料、支付和账号继续复用主站。',
    icon: HeartHandshake,
    tone: 'bg-white text-emerald-700 border border-emerald-100',
  },
  {
    href: '/ai-companion',
    title: 'AI 陪伴',
    description: '创建角色、开启会话、沉淀记忆，用同一个轻创账号进入。',
    icon: Bot,
    tone: 'bg-white text-sky-700 border border-sky-100',
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
              <h1 className="text-3xl font-bold text-slate-900">先登录，再进入校园服务</h1>
              <p className="text-slate-600 leading-7">现在统一使用邮箱验证码登录，登录后就可以直接使用快递代取、旧书广场和校园钱包。</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/auth/login"><Button>邮箱登录</Button></Link>
                <Link href="/auth/register"><Button variant="outline">邮箱注册</Button></Link>
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
    const displayName = data.profile.nickname || current.user.email || data.profile.account

    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto py-8 space-y-8">
          <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.9fr] gap-6">
            <Card className="border-none shadow-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 text-white">
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="warning" className="bg-white/15 text-white hover:bg-white/15">校园服务</Badge>
                  <Badge variant="outline" className="border-white/30 text-white">{APP_ROLE_LABELS[data.profile.app_role || 'user']}</Badge>
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold">欢迎回来，{displayName}</h1>
                  <p className="text-white/90 leading-7 max-w-2xl">
                    这里不再重复展示一大堆规则。你现在可以直接进入快递代取、旧书广场、订单中心和校园钱包，所有服务都在同一个入口里完成。
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/campus/express"><Button size="sm" className="!bg-white !text-emerald-700 hover:!bg-white/90">去快递代取</Button></Link>
                  <Link href="/campus/books"><Button size="sm" variant="glass" className="!text-white !border-white/30 !bg-white/10 hover:!bg-white/15">去旧书广场</Button></Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle>账户状态</CardTitle>
                <CardDescription>直接看最关键的余额和当前业务概况。</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="text-slate-500">可结算余额</div>
                  <div className="text-3xl font-bold text-slate-900 mt-2">￥{Number(data.profile.campus_available_balance || 0).toFixed(2)}</div>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4">
                  <div className="text-slate-500">待完成收入</div>
                  <div className="text-3xl font-bold text-slate-900 mt-2">￥{Number(data.profile.campus_pending_balance || 0).toFixed(2)}</div>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <div className="text-slate-500">待接快递单</div>
                  <div className="text-3xl font-bold text-slate-900 mt-2">{data.openExpressCount}</div>
                </div>
                <div className="rounded-2xl bg-teal-50 p-4">
                  <div className="text-slate-500">在售旧书</div>
                  <div className="text-3xl font-bold text-slate-900 mt-2">{data.onSaleBookCount}</div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {serviceLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="border-none h-full hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <CardContent className="p-6 space-y-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.tone}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-900">{item.title}</div>
                      <p className="text-sm text-slate-600 mt-2 leading-6">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>快递代取</CardTitle>
                <CardDescription>现在可以直接进入接单广场和我的快递单。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <div>我发起的快递单：<span className="font-semibold text-slate-900">{data.myExpressCount}</span></div>
                <div>当前广场待接单：<span className="font-semibold text-slate-900">{data.openExpressCount}</span></div>
                <Link href="/campus/express" className="inline-flex pt-3 text-emerald-700 font-medium hover:text-emerald-800">直接去快递代取</Link>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>旧书广场</CardTitle>
                <CardDescription>卖家发布、买家购买和确认收货已经接到同一套订单流。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <div>我在售的旧书：<span className="font-semibold text-slate-900">{data.onSaleBookCount}</span></div>
                <div>我的旧书订单：<span className="font-semibold text-slate-900">{data.myBookOrderCount}</span></div>
                <Link href="/campus/books" className="inline-flex pt-3 text-emerald-700 font-medium hover:text-emerald-800">直接去旧书广场</Link>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>结算与钱包</CardTitle>
                <CardDescription>只保留结果和入口，不再在首页塞大段费用规则。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <div>结算申请中：<span className="font-semibold text-slate-900">￥{Number(data.profile.campus_settlement_applying_amount || 0).toFixed(2)}</span></div>
                <div>累计已结算：<span className="font-semibold text-slate-900">￥{Number(data.profile.campus_settled_total || 0).toFixed(2)}</span></div>
                <Link href="/campus/wallet" className="inline-flex pt-3 text-emerald-700 font-medium hover:text-emerald-800">进入校园钱包</Link>
              </CardContent>
            </Card>
          </section>
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
              <h1 className="text-3xl font-bold text-slate-900">校园服务暂时无法加载</h1>
              <p className="text-slate-600 leading-7">{message}</p>
              <p className="text-sm text-slate-500 leading-7">通常是 Supabase schema 还没执行完整，或服务器环境变量还没有同步。</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }
}