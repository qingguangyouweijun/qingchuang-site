import Link from "next/link"
import { HeartHandshake, ReceiptText, ShieldCheck, UserRound } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Badge } from "@/components/UI/Badge"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card"

const highlights = [
  {
    title: "统一账号资料",
    desc: "晴窗不再单独注册账号，直接复用轻创 Qintra 的统一资料、登录态和身份信息。",
    icon: UserRound,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "统一支付与收款",
    desc: "后续如有解锁、特权或订单类付费，会复用 qingchuang.site 站内的统一支付、回调和账本流程。",
    icon: ReceiptText,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "统一规则与风控",
    desc: "账号资料、订单能力和管理员审核都会放在同一套规则下，减少孤立页面和旧链路残留。",
    icon: ShieldCheck,
    color: "bg-sky-50 text-sky-600",
  },
]

export default function DrawPage() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-10 space-y-8">
        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <Card className="border-none shadow-xl bg-gradient-to-br from-amber-500 via-emerald-500 to-sky-600 text-white">
            <CardContent className="p-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-white/15 text-white hover:bg-white/15">轻创功能模块</Badge>
                <Badge variant="outline" className="border-white/25 text-white">晴窗</Badge>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">晴窗</h1>
                <p className="text-white/90 mt-4 max-w-2xl leading-8">
                  晴窗现在是轻创 Qintra 里的一个独立功能，不再承担总站品牌。
                  资料、支付、订单和后续收款能力都会并到 qingchuang.site 主站体系里。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/profile/setup"><Button size="lg">完善我的资料</Button></Link>
                <Link href="/campus"><Button size="lg" variant="glass" className="text-white hover:bg-white/20">先看主站服务</Button></Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>当前整理结果</CardTitle>
              <CardDescription>这次已经把旧交友链路里明显不适合继续保留的部分收掉了。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-600 leading-7">
              <div className="rounded-2xl bg-amber-50 p-4">
                旧的抽卡页和分散页面已经移除，不再保留一套和主站平行的付费路径。
              </div>
              <div className="rounded-2xl bg-lime-50 p-4">
                后续如果你继续做晴窗的会员、解锁或订单能力，建议直接挂到主站订单体系和统一支付回调里。
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                当前入口先保留为功能页，方便后续继续往里接资料、内容、关系和支付规则，而不是留一堆失效旧页。
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((item) => (
            <Card key={item.title} className="border-none shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{item.title}</h2>
                  <p className="text-sm text-gray-600 mt-2 leading-7">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>下一步建议</CardTitle>
            <CardDescription>如果你继续扩展晴窗，建议沿用主站已有能力，而不是再起一套独立系统。</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 leading-7">
            <div className="rounded-2xl bg-amber-50 p-5">
              资料侧复用当前账号、头像、身份和地区信息，避免多套资料反复维护。
            </div>
            <div className="rounded-2xl bg-emerald-50 p-5">
              交易侧复用站内支付和账本，后续如有解锁、会员或陪伴订单，不再做独立收款页。
            </div>
            <div className="rounded-2xl bg-sky-50 p-5">
              管理侧复用管理员后台，统一处理内容、订单、结算和用户角色。
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

