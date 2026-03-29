import Link from "next/link"
import { BookOpen, Bot, HeartHandshake, Package } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { CampusSubnav } from "@/components/campus/CampusSubnav"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card"
import { getSession } from "@/lib/actions/auth"

const campusEntries = [
  {
    href: "/campus/express",
    title: "快递代取",
    description: "在这里完成下单、支付、接单、配送和确认收货。",
    icon: Package,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    href: "/campus/books",
    title: "旧书广场",
    description: "在这里发布旧书、浏览书单、下单购买和确认送达。",
    icon: BookOpen,
    tone: "bg-amber-50 text-amber-700",
  },
]

const extensionEntries = [
  {
    href: "/draw",
    title: "晴窗",
    description: "校园互动功能，继续复用轻创账号。",
    icon: HeartHandshake,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    href: "/ai-companion",
    title: "AI 陪伴",
    description: "创建角色、持续聊天和保存长期记忆。",
    icon: Bot,
    tone: "bg-cyan-50 text-cyan-700",
  },
]

export default async function CampusPage() {
  const session = await getSession().catch(() => null)
  const displayName = session?.email?.split("@")[0] || "轻创同学"

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-8 py-8">
        <CampusSubnav />

        <section className="grid items-start gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <Card className="border-none shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <CardContent className="space-y-5 p-8">
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                校园主线入口
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-slate-900 md:text-[2.75rem]">
                  {session ? `${displayName}，校园服务从这里进入` : "校园服务是轻创的主线入口"}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600">
                  校园服务主线现在只保留快递代取和旧书广场。订单中心与校园钱包已经收进“我的”页面，
                  方便你统一查看自己的收入、订单和结算状态。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {session ? (
                  <>
                    <Button asChild>
                      <Link href="/campus/express">进入快递代取</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/campus/books">进入旧书广场</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild>
                      <Link href="/auth/register">邮箱注册</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/auth/login">邮箱登录</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle>功能分区</CardTitle>
              <CardDescription>
                校园主线负责校园交易与代取；订单中心和校园钱包请从“我的”进入。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {campusEntries.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/85 px-4 py-4 transition-colors hover:border-emerald-200 hover:bg-white"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.description}</div>
                  </div>
                  <item.icon className={`h-5 w-5 ${item.tone.split(" ").at(-1)}`} />
                </Link>
              ))}
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                订单中心、校园钱包：请从顶部“我的”进入，避免校园主线入口过多。
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
