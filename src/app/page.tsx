import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Building2,
  LayoutGrid,
  Package,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/UI/Button"
import { Card, CardContent } from "@/components/UI/Card"

const serviceCards = [
  {
    title: "快递代取",
    description: "围绕校园收件场景，提供下单、接单、履约和订单追踪的一体化流程。",
    icon: Package,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "旧书流转",
    description: "为校园二手教材和闲置书籍提供统一展示、交易和订单管理入口。",
    icon: BookOpen,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    title: "零食快递",
    description: "面向宿舍和校园日常场景，承接轻量零食售卖与即时配送需求。",
    icon: ShoppingBag,
    tone: "bg-amber-50 text-amber-700",
  },
]

const processSteps = [
  {
    title: "官网展示",
    description: "统一对外展示平台定位、服务范围、运营说明和合规信息。",
    icon: Building2,
  },
  {
    title: "业务承接",
    description: "通过统一账户体系承接校园用户下单、履约、售后与订单查看。",
    icon: LayoutGrid,
  },
  {
    title: "订单与支付",
    description: "围绕轻量订单场景完成支付、状态同步、记录归档与后续查询。",
    icon: ScrollText,
  },
  {
    title: "持续运营",
    description: "结合后台管理、数据沉淀和服务反馈，逐步完善正式运营能力。",
    icon: Users,
  },
]

const trustPoints = [
  "统一账户、订单与支付链路",
  "面向校园场景的轻量本地生活服务",
  "备案完成后可继续承接官网与小程序入口",
]

export default function Home() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-6xl space-y-10 py-8">
        <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#14532d_52%,#0f766e_100%)] shadow-[0_28px_70px_rgba(15,23,42,0.16)]">
          <div className="grid gap-8 px-6 py-10 text-white sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-14">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3 text-sm font-semibold">
                <span className="rounded-full bg-white/14 px-4 py-2 backdrop-blur">轻创 Qintra</span>
                <span className="rounded-full bg-emerald-300/18 px-4 py-2 text-emerald-50 backdrop-blur">企业官网</span>
              </div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                  面向校园场景的轻量生活服务平台
                </h1>
                <p className="max-w-3xl text-base leading-8 text-slate-100/88 sm:text-lg">
                  轻创围绕快递代取、旧书流转、零食快递等校园高频需求，构建统一的服务入口、订单体系与运营后台。
                  现阶段官网以企业展示、服务介绍与正式上线准备为主，业务能力将按备案与接入节奏逐步开放。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/#services">了解服务能力</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/#contact">查看联系与说明</Link>
                </Button>
                <Button asChild size="lg" variant="glass">
                  <Link href="/auth/login">用户登录</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 self-stretch sm:grid-cols-2 lg:grid-cols-1">
              <Card className="border border-white/10 bg-white/10 text-white shadow-none backdrop-blur">
                <CardContent className="space-y-2 p-6">
                  <div className="text-sm font-medium text-slate-100/70">核心能力</div>
                  <div className="text-3xl font-bold">3 条业务主线</div>
                  <p className="text-sm leading-7 text-slate-100/76">快递代取、旧书流转、零食配送均以统一平台能力承接。</p>
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-white/10 text-white shadow-none backdrop-blur">
                <CardContent className="space-y-2 p-6">
                  <div className="text-sm font-medium text-slate-100/70">当前状态</div>
                  <div className="text-3xl font-bold">官网化收敛</div>
                  <p className="text-sm leading-7 text-slate-100/76">主站当前以对外展示、备案准备和后续接入说明为主。</p>
                </CardContent>
              </Card>
              <Card className="border border-white/10 bg-white/10 text-white shadow-none backdrop-blur sm:col-span-2 lg:col-span-1">
                <CardContent className="space-y-3 p-6">
                  <div className="text-sm font-medium text-slate-100/70">对外说明</div>
                  <ul className="space-y-2 text-sm leading-7 text-slate-100/80">
                    {trustPoints.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-200" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <section id="services" className="scroll-mt-28 space-y-5">
          <div className="space-y-2">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">服务能力</div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">轻创当前聚焦的校园服务</h2>
            <p className="max-w-4xl text-base leading-8 text-slate-600">
              官网展示围绕平台定位与业务结构展开，正式运营期将以校园用户场景为核心，逐步开放完整交易与服务能力。
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {serviceCards.map((item) => (
              <Card key={item.title} className="border-none shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-4 p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="text-sm leading-7 text-slate-600">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="process" className="scroll-mt-28 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-none shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
            <CardContent className="space-y-4 p-6 sm:p-8">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">合作流程</div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">从官网展示到正式运营的推进路径</h2>
              <p className="text-base leading-8 text-slate-600">
                当前官网先承接品牌展示、服务说明和备案所需基础信息。业务系统与后端能力已按模块拆分，后续会在合规和接入完成后逐步开放到正式入口。
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/auth/login">查看登录入口</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/#contact">查看上线说明</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {processSteps.map((step, index) => (
              <Card key={step.title} className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold text-emerald-700">0{index + 1}</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                    <p className="text-sm leading-7 text-slate-600">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="compliance" className="scroll-mt-28 space-y-5">
          <div className="space-y-2">
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">上线说明</div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">备案、部署与正式对外信息</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-3 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">备案准备中</h3>
                <p className="text-sm leading-7 text-slate-600">当前官网以企业展示为主，ICP备案、公安联网备案等信息将在正式通过后统一公示。</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-3 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">官网先行</h3>
                <p className="text-sm leading-7 text-slate-600">现阶段官网优先承接对外介绍、服务结构与后续业务接入说明，避免过重的动态展示压力。</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-3 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <ScrollText className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">正式业务分步开放</h3>
                <p className="text-sm leading-7 text-slate-600">具体服务、支付和运营能力将随部署、备案和业务准备情况逐步开放，不在备案阶段对外过度承诺。</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="contact" className="scroll-mt-28">
          <Card className="overflow-hidden border-none shadow-[0_20px_42px_rgba(15,23,42,0.08)]">
            <CardContent className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div className="space-y-3">
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">联系与说明</div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">当前以官网展示与部署准备为主</h2>
                <p className="text-base leading-8 text-slate-600">
                  若你正在对接部署、备案、校园合作或后续业务接入，可以先通过现有平台入口了解结构。正式客服邮箱、备案号与公示信息将在主站正式上线后统一展示。
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 px-5 py-5">
                  <div className="text-sm font-semibold text-slate-500">平台域名</div>
                  <div className="mt-2 text-lg font-bold text-slate-900">qingchuang.store</div>
                </div>
                <div className="rounded-3xl bg-slate-50 px-5 py-5">
                  <div className="text-sm font-semibold text-slate-500">部署形态</div>
                  <div className="mt-2 text-lg font-bold text-slate-900">官网展示 + 业务系统</div>
                </div>
                <div className="rounded-3xl bg-slate-50 px-5 py-5 sm:col-span-2">
                  <div className="text-sm font-semibold text-slate-500">当前重点</div>
                  <div className="mt-2 text-base leading-7 text-slate-700">
                    先完成官网展示、主站部署与备案准备，再逐步开放正式服务入口与小程序接入。
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/auth/login">
                      进入平台登录入口
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </section>
    </MainLayout>
  )
}
