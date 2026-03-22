import Link from "next/link"
import { BookOpen, Bot, Package, ReceiptText, Shield, Wallet } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/UI/Button"
import { Card, CardContent } from "@/components/UI/Card"

const features = [
  {
    title: '校园快递代取',
    desc: '支持小件、中件、大件、超大件合单下单，支付后进入接单广场。',
    icon: Package,
  },
  {
    title: '旧书广场',
    desc: '卖家发布后直接进入旧书广场，买家下单后由卖家送到楼栋/楼层。',
    icon: BookOpen,
  },
  {
    title: 'AI 陪伴',
    desc: '创建专属角色、开启多条会话、自动生成长期记忆，并支持语气微调。',
    icon: Bot,
  },
  {
    title: '管理员网站',
    desc: '普通用户和管理员入口分离，管理员独立处理订单、结算和数据看板。',
    icon: Shield,
  },
]

export default function Home() {
  return (
    <MainLayout>
      <section className="min-h-[76vh] flex flex-col justify-center py-16 space-y-10">
        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center rounded-full bg-white/60 px-4 py-2 text-sm text-orange-700 border border-orange-100">
            校园快递代取 + 旧书售卖 + AI 陪伴 + 管理员网站
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
            一个账号，统一使用
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-rose-600">
              校园服务、AI 陪伴与管理员系统
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl leading-8">
            复用现在这套 11 位数字账号注册方式，普通用户进入校园服务端和 AI 陪伴模块，管理员进入独立后台。
            支持快递代取、旧书广场、订单流转、余额结算、AI 角色聊天和管理员审批。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link href="/auth/register"><Button size="lg">普通用户注册</Button></Link>
            <Link href="/auth/login"><Button size="lg" variant="outline">普通用户登录</Button></Link>
            <Link href="/ai-companion"><Button size="lg" variant="secondary">进入 AI 陪伴</Button></Link>
            <Link href="/admin/login"><Button size="lg" variant="glass">管理员登录</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pt-6">
          {features.map((item) => (
            <Card key={item.title} className="border-none hover:bg-white/80 transition-all duration-300">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
                  <p className="text-sm text-gray-600 leading-6 mt-2">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900">当前已整合的核心模块</h3>
              <p className="text-gray-600 mt-2 leading-7">普通用户端、AI 陪伴、管理员网站、统一注册登录、校园订单状态流、校园结算账本。</p>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-rose-50 p-5">
                <Package className="w-5 h-5 text-rose-600" />
                <div className="mt-3 font-semibold text-gray-900">快递代取</div>
                <div className="text-sm text-gray-600 mt-1">下单、支付、接单、确认收货</div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-5">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <div className="mt-3 font-semibold text-gray-900">旧书广场</div>
                <div className="text-sm text-gray-600 mt-1">发布、购买、送达、确认收货</div>
              </div>
              <div className="rounded-2xl bg-cyan-50 p-5">
                <Bot className="w-5 h-5 text-cyan-600" />
                <div className="mt-3 font-semibold text-gray-900">AI 陪伴</div>
                <div className="text-sm text-gray-600 mt-1">角色、聊天、记忆摘要</div>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-5">
                <ReceiptText className="w-5 h-5 text-indigo-600" />
                <div className="mt-3 font-semibold text-gray-900">管理员网站</div>
                <div className="text-sm text-gray-600 mt-1">订单、用户、结算申请处理</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </MainLayout>
  )
}
