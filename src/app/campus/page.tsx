import Link from 'next/link'
import { BookOpen, Bot, HeartHandshake, Package, ReceiptText, Wallet } from 'lucide-react'
import { MainLayout } from '@/components/Layout/MainLayout'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { getCurrentUser } from '@/lib/actions/auth'

const campusEntries = [
  {
    href: '/campus/express',
    title: '快递代取',
    description: '下单、支付、接单和确认收货都在这一页里完成。',
    icon: Package,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    href: '/campus/books',
    title: '旧书广场',
    description: '卖家发布后直接进入广场，买家下单后走完整交易流程。',
    icon: BookOpen,
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    href: '/campus/orders',
    title: '订单中心',
    description: '统一查看我发起、我接单、我买到和我卖出的订单。',
    icon: ReceiptText,
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    href: '/campus/wallet',
    title: '校园钱包',
    description: '查看待完成收入、可结算余额和结算申请进度。',
    icon: Wallet,
    tone: 'bg-teal-50 text-teal-700',
  },
]

const extensionEntries = [
  {
    href: '/draw',
    title: '晴窗',
    description: '校园同频互动功能，继续使用同一套轻创账号。',
    icon: HeartHandshake,
    tone: 'bg-rose-50 text-rose-700',
  },
  {
    href: '/ai-companion',
    title: 'AI 陪伴',
    description: '创建角色、聊天和沉淀记忆，继续走统一账号体系。',
    icon: Bot,
    tone: 'bg-violet-50 text-violet-700',
  },
]

export default async function CampusPage() {
  let current = null as Awaited<ReturnType<typeof getCurrentUser>>
  let loadError = ''

  try {
    current = await getCurrentUser()
  } catch (error) {
    loadError = error instanceof Error ? error.message : '校园服务加载失败。'
  }

  const displayName = current?.profile?.nickname || current?.user?.email?.split('@')[0] || '轻创同学'

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl py-8 space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr] items-start">
          <Card className="border-none shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <CardContent className="space-y-5 p-8">
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                校园服务入口
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-slate-900">
                  {current ? `你好，${displayName}` : '校园服务放在这里'}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600">
                  这里不再堆统计和后台说明，只保留快递代取、旧书广场、订单中心和校园钱包这几个用户实际会点进去的入口。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {current ? (
                  <>
                    <Link href="/campus/express"><Button>进入快递代取</Button></Link>
                    <Link href="/campus/books"><Button variant="outline">进入旧书广场</Button></Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login"><Button>邮箱登录</Button></Link>
                    <Link href="/auth/register"><Button variant="outline">邮箱注册</Button></Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle>现在可以直接去</CardTitle>
              <CardDescription>把用户常用路径平铺出来，不需要先经过后台式首页。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...campusEntries.slice(0, 3), extensionEntries[0]].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 transition-colors hover:border-emerald-200 hover:bg-white"
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

        {loadError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            当前环境还有部分服务端配置未完成：{loadError}
          </div>
        )}

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