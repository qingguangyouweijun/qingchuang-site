import Link from 'next/link'
import { BookOpen, Bot, HeartHandshake, Package, ReceiptText, Wallet } from 'lucide-react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { CampusSubnav } from '@/components/campus/CampusSubnav'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { getSession } from '@/lib/actions/auth'

const campusEntries = [
  {
    href: '/campus/express',
    title: '快递代取',
    description: '发布代取订单、完成支付、查看接单广场和确认收货。',
    icon: Package,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    href: '/campus/books',
    title: '旧书广场',
    description: '发布旧书、浏览书单、下单购买和跟进送达状态。',
    icon: BookOpen,
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    href: '/campus/orders',
    title: '订单中心',
    description: '统一查看快递和旧书的买家、卖家、接单和下单视角。',
    icon: ReceiptText,
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    href: '/campus/wallet',
    title: '校园钱包',
    description: '查看待完成收入、可结算余额和结算申请记录。',
    icon: Wallet,
    tone: 'bg-teal-50 text-teal-700',
  },
]

const extensionEntries = [
  {
    href: '/draw',
    title: '晴窗',
    description: '校园同频互动功能，继续复用轻创账号。',
    icon: HeartHandshake,
    tone: 'bg-rose-50 text-rose-700',
  },
  {
    href: '/ai-companion',
    title: 'AI 陪伴',
    description: '创建角色、持续聊天和保存长期记忆。',
    icon: Bot,
    tone: 'bg-cyan-50 text-cyan-700',
  },
]

export default async function CampusPage() {
  const session = await getSession()
  const displayName = session?.user?.email?.split('@')[0] || '轻创同学'

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl py-8 space-y-8">
        <CampusSubnav />

        <section className="grid gap-6 lg:grid-cols-[1.16fr_0.84fr] items-start">
          <Card className="border-none shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <CardContent className="space-y-5 p-8">
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                轻创核心功能
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-slate-900">
                  {session ? `${displayName}，校园服务从这里进入` : '校园服务是轻创的核心入口'}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600">
                  把快递代取、旧书广场、订单中心和校园钱包收在一条主线上，用户只需要从这里进去，不需要先读规则，也不需要跳来跳去找入口。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {session ? (
                  <>
                    <Link href="/campus/express"><Button>进入快递代取</Button></Link>
                    <Link href="/campus/books"><Button variant="outline">进入旧书广场</Button></Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/register"><Button>邮箱注册</Button></Link>
                    <Link href="/auth/login"><Button variant="outline">邮箱登录</Button></Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle>五个常用导航</CardTitle>
              <CardDescription>校园服务 4 个核心模块，加上晴窗与 AI 陪伴的扩展入口。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...campusEntries, ...extensionEntries].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-4 transition-colors hover:border-emerald-200 hover:bg-white"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.description}</div>
                  </div>
                  <item.icon className={`h-5 w-5 ${item.tone.split(' ').at(-1)}`} />
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {campusEntries.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full border-none shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-transform duration-300 hover:-translate-y-1">
                <CardContent className="space-y-4 p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
                    <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {extensionEntries.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="border-none shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-transform duration-300 hover:-translate-y-1">
                <CardContent className="flex items-center justify-between gap-4 p-6">
                  <div className="space-y-2">
                    <div className="text-xl font-bold text-slate-900">{item.title}</div>
                    <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </MainLayout>
  )
}