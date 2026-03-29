import Link from "next/link"
import { ArrowRight, Bot, Gift, LayoutGrid, Package, ReceiptText, UserRound, Wallet } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/UI/Button"
import { Card, CardContent } from "@/components/UI/Card"

const mainFeatures = [
  {
    title: "校园服务",
    description: "快递代取和旧书广场统一收进校园服务主线入口。",
    href: "/campus",
    icon: LayoutGrid,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "快递代取",
    description: "下单、支付、接单和确认收货都在同一条流程里完成。",
    href: "/campus/express",
    icon: Package,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    title: "晴窗",
    description: "完善资料后参与随机抽取，在校园里认识一位本校异性朋友。",
    href: "/draw",
    icon: Gift,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    title: "AI 陪伴",
    description: "创建角色、持续聊天，并把对话记忆留在自己的账号里。",
    href: "/ai-companion",
    icon: Bot,
    tone: "bg-sky-50 text-sky-700",
  },
]

const personalEntries = [
  {
    title: "订单中心",
    description: "统一查看我下的快递单、我接的快递单，以及旧书买卖记录。",
    href: "/profile/orders",
    icon: ReceiptText,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "校园钱包",
    description: "查看可结算余额、结算申请记录和余额流水，提交结算时需附带收款码。",
    href: "/profile/wallet",
    icon: Wallet,
    tone: "bg-cyan-50 text-cyan-700",
  },
]

export default function Home() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-6xl space-y-10 py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">轻创 Qintra</div>
              <div className="text-2xl font-medium tracking-[0.08em] text-slate-500">让便捷融入生活</div>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-3xl font-bold tracking-tight leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                校园服务是主线入口，
                <span className="block text-emerald-700">“我的”专门承接订单中心和校园钱包。</span>
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                想下快递代取、逛旧书广场、查看订单中心、管理校园钱包、体验晴窗或 AI 陪伴，
                现在都能在更清晰的结构里找到入口。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/campus">进入校园服务</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/profile">进入我的</Link>
              </Button>
              <Button asChild size="lg" variant="glass">
                <Link href="/auth/login">邮箱登录</Link>
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
            <CardContent className="space-y-3 p-6">
              <div>
                <div className="text-sm font-semibold text-emerald-700">常用功能</div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">主线入口 + 我的入口</h2>
              </div>
              <div className="space-y-3">
                {[...mainFeatures, {
                  title: "我的",
                  description: "在这里查看个人邮箱、名称、订单中心和校园钱包。",
                  href: "/profile",
                  icon: UserRound,
                  tone: "bg-slate-100 text-slate-700",
                }].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 transition-colors hover:border-emerald-200 hover:bg-white"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-sm text-slate-500">{item.description}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {mainFeatures.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full border-none shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1">
                <CardContent className="space-y-4 p-6">
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

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {personalEntries.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-colors hover:border-emerald-200">
                <CardContent className="flex items-center justify-between gap-4 p-6">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-slate-900">{item.title}</div>
                    <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
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
