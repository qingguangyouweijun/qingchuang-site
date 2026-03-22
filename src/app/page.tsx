import Link from 'next/link'
import { ArrowRight, BookOpen, Bot, HeartHandshake, Package, ShieldCheck, Sparkles, Wallet } from 'lucide-react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'

const modules = [
  {
    title: '校园服务',
    description: '把快递代取、旧书广场、订单中心和校园钱包放进同一个入口。',
    href: '/campus',
    icon: Package,
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: '晴窗',
    description: '轻创里的同频社交功能，保留独立氛围，但账户、资料和支付继续复用主站。',
    href: '/draw',
    icon: HeartHandshake,
    tone: 'bg-sky-50 text-sky-600',
  },
  {
    title: 'AI 陪伴',
    description: '创建角色、持续聊天、沉淀长期记忆，统一接入轻创账号体系。',
    href: '/ai-companion',
    icon: Bot,
    tone: 'bg-amber-50 text-amber-600',
  },
]

const highlights = [
  {
    title: '邮箱一键进入',
    description: '不再要求 11 位数字账号，用邮箱验证码就能完成注册和登录。',
    icon: Sparkles,
  },
  {
    title: '校园入口更直接',
    description: '首页和校园页都可以直接进入快递代取和旧书广场，不需要先读一堆规则。',
    icon: BookOpen,
  },
  {
    title: '账户与钱包统一',
    description: '订单、结算、AI 陪伴和晴窗都复用轻创主站，不再四处分散。',
    icon: Wallet,
  },
]

export default function Home() {
  return (
    <MainLayout>
      <section className="min-h-[76vh] flex flex-col justify-center py-14 space-y-12">
        <div className="grid gap-10 xl:grid-cols-[1.35fr_0.9fr] items-center">
          <div className="space-y-6 max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-sm text-emerald-700 shadow-sm">
              轻创 Qintra · 让便捷融入生活
            </div>
            <div className="space-y-5">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                把校园服务、晴窗和 AI 陪伴
                <span className="block text-gradient">收进一个更轻的入口里</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl leading-8">
                轻创是你进入校园代取、旧书流转、同频社交和数字陪伴的统一入口。首页只保留最核心的去向，真正的业务细节在对应模块里完成。
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <Link href="/auth/register"><Button size="lg">邮箱注册</Button></Link>
              <Link href="/auth/login"><Button size="lg" variant="outline">邮箱登录</Button></Link>
              <Link href="/campus/express"><Button size="lg" variant="secondary">快递代取</Button></Link>
              <Link href="/campus/books"><Button size="lg" variant="glass">旧书广场</Button></Link>
              <Link href="/admin/login"><Button size="lg" variant="glass">管理员入口</Button></Link>
            </div>
          </div>

          <Card className="border-none shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <CardHeader className="pb-4">
              <CardTitle>轻创现在能做什么</CardTitle>
              <CardDescription>不再展示大段规则，先把最重要的去向和能力告诉你。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-emerald-100/70 bg-white/90 px-4 py-4 flex gap-4 items-start">
                  <div className="mt-1 w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    <p className="text-sm text-slate-600 leading-6 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="border-none h-full hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl">
                <CardContent className="p-6 space-y-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.tone}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-600 leading-7">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <Card className="border-none shadow-lg">
            <CardContent className="p-7 space-y-4">
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                校园服务优先
              </div>
              <h3 className="text-2xl font-bold text-slate-900">先从快递代取和旧书广场开始</h3>
              <p className="text-slate-600 leading-7">
                轻创当前最核心的两条业务线是校园快递代取和旧书流转。登录后直接下单、接单、发布和购买，不需要跳转到额外的子系统。
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/campus/express"><Button>进入快递代取</Button></Link>
                <Link href="/campus/books"><Button variant="outline">进入旧书广场</Button></Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-7 space-y-4">
              <div className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                管理与风控
              </div>
              <h3 className="text-2xl font-bold text-slate-900">管理员站点独立存在</h3>
              <p className="text-slate-600 leading-7">
                普通用户只看服务入口，管理员通过单独页面处理用户角色、结算和订单状态，避免把后台信息暴露给普通访问者。
              </p>
              <Link href="/admin/login"><Button variant="secondary">进入管理员登录</Button></Link>
            </CardContent>
          </Card>
        </section>
      </section>
    </MainLayout>
  )
}