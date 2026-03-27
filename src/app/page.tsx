import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Bot,
  HeartHandshake,
  LayoutGrid,
  Package,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/UI/Button";
import { Card, CardContent } from "@/components/UI/Card";

const mainFeatures = [
  {
    title: "校园服务",
    description: "把快递代取、旧书广场、订单中心和校园钱包收进同一个入口。",
    href: "/campus",
    icon: LayoutGrid,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "快递代取",
    description: "下单、支付、接单和确认收货都在一个流程里完成。",
    href: "/campus/express",
    icon: Package,
    tone: "bg-teal-50 text-teal-700",
  },
  {
    title: "旧书广场",
    description: "发布旧书、浏览在售书籍、直接下单购买。",
    href: "/campus/books",
    icon: BookOpen,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "晴窗",
    description: "校园互动与资料展示功能，适合做同校交流。",
    href: "/draw",
    icon: HeartHandshake,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    title: "AI 陪伴",
    description: "创建角色、继续聊天，并把对话留在自己的账户里。",
    href: "/ai-companion",
    icon: Bot,
    tone: "bg-sky-50 text-sky-700",
  },
];

const campusHighlights = [
  {
    title: "订单中心",
    description: "统一查看我发起、我接单、我购买和我售出的记录。",
    href: "/campus/orders",
    icon: ReceiptText,
  },
  {
    title: "校园钱包",
    description: "查看待结算收入、可结算余额和结算申请记录。",
    href: "/campus/wallet",
    icon: Wallet,
  },
];

export default function Home() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-6xl space-y-10 py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className="space-y-2">
              <Image
                src="/qintra-logo.png"
                alt="轻创 Qintra"
                width={420}
                height={112}
                priority
                className="h-16 w-auto sm:h-20"
              />
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-3xl font-bold tracking-tight leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                校园服务为主线，
                <span className="block text-emerald-700">
                  把常用入口收进一个更清晰的站点里。
                </span>
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                想下快递代取、逛旧书广场、看订单、聊 AI
                或进入晴窗，都可以从轻创直接开始。
                不用在多个站点之间来回找入口，也不用先翻一大堆说明页。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/campus">进入校园服务</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/register">邮箱注册</Link>
              </Button>
              <Button asChild size="lg" variant="glass">
                <Link href="/auth/login">邮箱登录</Link>
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
            <CardContent className="space-y-3 p-6">
              <div>
                <div className="text-sm font-semibold text-emerald-700">
                  常用功能
                </div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  五个常用入口
                </h2>
              </div>
              <div className="space-y-3">
                {mainFeatures.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 transition-colors hover:border-emerald-200 hover:bg-white"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900">
                        {item.title}
                      </div>
                      <div className="text-sm text-slate-500">
                        {item.description}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
          {mainFeatures.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="h-full border-none shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1">
                <CardContent className="space-y-4 p-6">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}
                  >
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xl font-bold text-slate-900">
                        {item.title}
                      </h2>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {campusHighlights.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-colors hover:border-emerald-200">
                <CardContent className="flex items-center justify-between gap-4 p-6">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-slate-900">
                      {item.title}
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
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
  );
}
