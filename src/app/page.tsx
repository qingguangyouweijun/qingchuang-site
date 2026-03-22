import Link from 'next/link'
import { ArrowRight, BookOpen, Bot, HeartHandshake, Package, ReceiptText, Wallet } from 'lucide-react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { Button } from '@/components/UI/Button'
import { Card, CardContent } from '@/components/UI/Card'

const primaryLinks = [
  {
    title: '快递代取',
    description: '下单、支付、接单和确认收货都在这一页完成。',
    href: '/campus/express',
    icon: Package,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: '旧书广场',
    description: '发布旧书、浏览在售书籍并直接下单购买。',
    href: '/campus/books',
    icon: BookOpen,
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    title: '订单中心',
    description: '统一查看我发起、我接单、我买到和我卖出的订单。',
    href: '/campus/orders',
    icon: ReceiptText,
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    title: '晴窗',
    description: '校园同频互动入口，延续独立氛围但共用同一账号。',
    href: '/draw',
    icon: HeartHandshake,
    tone: 'bg-rose-50 text-rose-700',
  },
  {
    title: 'AI 陪伴',
    description: '创建角色、持续聊天，把陪伴能力接入同一站点。',
    href: '/ai-companion',
    icon: Bot,
    tone: 'bg-violet-50 text-violet-700',
  },
]

const secondaryLinks = [
  {
    title: '校园钱包',
    description: '查看待结算余额、流水和结算申请进度。',
    href: '/campus/wallet',
    icon: Wallet,
  },
  {
    title: '校园服务总览',
    description: '不看统计，只保留用户真正会点击的服务入口。',
    href: '/campus',
    icon: ArrowRight,
  },
]

export default function Home() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-6xl py-8 space-y-12">
        <div className="grid gap-10 lg:grid-cols-[1.18fr_0.82fr] items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              轻创 Qintra · 让便捷融入生活
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                把校园服务、晴窗和 AI 陪伴
                <span className="block text-gradient">收进一个更轻、更清晰的入口里</span>
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600">
                轻创只展示用户真正要点进去的内容。快递代取、旧书广场、订单中心、校园钱包、晴窗和 AI 陪伴都在同一站点内完成，不再先看一大堆说明页。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register"><Button size="lg">邮箱注册</Button></Link>
              <Link href="/auth/login"><Button size="lg" variant="outline">邮箱登录</Button></Link>
              <Link href="/campus/express"><Button size="lg" variant="secondary">快递代取</Button></Link>
              <Link href="/campus/books"><Button size="lg" variant="glass">旧书广场</Button></Link>
            </div>
          </div>

          <Card className="border-none shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="text-sm font-semibold text-emerald-700">常用入口</div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">直接进去，不先看规则</h2>
              </div>
              <div className="space-y-3">
                {primaryLinks.slice(0, 4).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 transition-colors hover:border-emerald-200 hover:bg-white"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{item.description}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
          {primaryLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full border-none shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {secondaryLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-colors hover:border-emerald-200">
                <CardContent className="flex items-center justify-between gap-4 p-6">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-slate-900">{item.title}</div>
                    <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <item.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </section>
    </MainLayout>
  )
}