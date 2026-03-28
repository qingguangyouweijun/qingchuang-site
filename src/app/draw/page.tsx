import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Gift,
  History,
  Shield,
  Sparkles,
  Star,
  UserCheck,
} from "lucide-react";
import { BlindBoxDisplay } from "@/components/draw/BlindBoxDisplay";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card";
import { getCurrentUser } from "@/lib/actions/auth";
import { DRAW_PRICING } from "@/lib/draw";
import type { Profile } from "@/lib/types";

function isProfileComplete(profile: Profile | null): boolean {
  return Boolean(profile?.gender && profile?.grade);
}

const drawRules = [
  {
    step: "01",
    title: "完善基础资料",
    desc: "填写性别、年级和基础介绍，保留最真实的自己，作为开启缘分的钥匙。",
    icon: UserCheck,
  },
  {
    step: "02",
    title: "选择礼盒档位",
    desc: "单次礼盒解锁联系方式，高级礼盒会额外展示对方的基础资料。",
    icon: Gift,
  },
  {
    step: "03",
    title: "设置筛选条件",
    desc: "你可以按年龄与身份缩小范围，我们不会开放按相貌进行筛选。",
    icon: Sparkles,
  },
  {
    step: "04",
    title: "支付并查看结果",
    desc: "支付成功后即可开启礼盒。已完成的抽取记录会保留在历史列表中。",
    icon: History,
  },
] as const;

const manifesto =
  "在这个被视觉与外貌裹挟的时代，在「晴窗」，我们始终坚信，相貌从来不是定义一个人的唯一标准，更不该是被明码标价的筹码，每个人都是独一无二的宇宙。我们过滤掉外界对颜值的喧嚣，仅以最基础的真实资料，作为开启缘分的钥匙。我们没有赋予用户选择相貌的权利，每一次抽取，都是一场抛开了视觉偏见的浪漫盲盒，不看外表，只待回响。最后，祝愿你遇见一份真正触碰内心的纯净缘分。";

function PriceCard({
  icon: Icon,
  title,
  description,
  price,
  originalPrice,
  note,
  href,
  cta,
  accentClass,
  iconClass,
  profileComplete,
  badge,
}: {
  icon: typeof Gift;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  note: string;
  href: string;
  cta: string;
  accentClass: string;
  iconClass: string;
  profileComplete: boolean;
  badge?: string;
}) {
  return (
    <Card className="overflow-hidden border-none shadow-[0_18px_42px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-1">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                  {badge && <Badge variant="secondary">{badge}</Badge>}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${accentClass}`}>¥{price.toFixed(2)}</div>
            {originalPrice !== undefined ? <div className="mt-1 text-xs text-slate-400 line-through">¥{originalPrice.toFixed(2)}</div> : null}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">{note}</div>

        {profileComplete ? (
          <Button asChild size="lg" className="w-full">
            <Link href={href}>
              {cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button size="lg" variant="outline" className="w-full" disabled>
            完成资料后可开启礼盒
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DrawPage() {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/auth/login");
  }

  const profile = (current.profile as Profile | null) ?? null;
  const profileComplete = isProfileComplete(profile);
  const hasDiscount = (profile?.contact_visibility_limit ?? 0) >= 1;

  const basicPrice = hasDiscount ? DRAW_PRICING.BASIC.discounted : DRAW_PRICING.BASIC.normal;
  const premiumPrice = hasDiscount ? DRAW_PRICING.PREMIUM.discounted : DRAW_PRICING.PREMIUM.normal;

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-8 py-10">
        {!profileComplete && (
          <div className="flex flex-col items-start gap-4 rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">完善基础资料后才能进入晴窗礼盒抽取</p>
              <p className="mt-1 text-sm leading-6 text-amber-700">请先补充性别与年级，再开始你的第一份浪漫盲盒。</p>
            </div>
            <Button asChild size="sm" className="bg-amber-600 text-white hover:bg-amber-700">
              <Link href="/profile/setup">去完善资料</Link>
            </Button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <Card className="overflow-hidden border-none bg-[linear-gradient(145deg,#fffaf7_0%,#ffffff_42%,#f8fafc_100%)] shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
            <CardContent className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="success">晴窗礼盒</Badge>
                  <Badge variant="outline">不看外表，只待回响</Badge>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">晴窗</h1>
                  <p className="max-w-xl text-base leading-8 text-slate-600 md:text-lg">
                    完善资料、设置条件并支付后，系统会随机为你匹配一位符合条件的本校异性朋友。
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4">
                    <div className="text-sm font-semibold text-emerald-900">浪漫盲盒</div>
                    <p className="mt-1 text-sm leading-6 text-emerald-700">每一次抽取都避开颜值偏见，把注意力交还给真实资料与心动回响。</p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-4">
                    <div className="text-sm font-semibold text-sky-900">本校范围</div>
                    <p className="mt-1 text-sm leading-6 text-sky-700">晴窗只为你开启校内缘分，不再让关系被视觉与标签主导。</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {profileComplete ? (
                    <>
                      <Button asChild size="lg">
                        <Link href="/draw/start?type=basic">
                          开启礼盒抽取
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="outline">
                        <Link href="/draw/history">
                          <History className="mr-2 h-4 w-4" />
                          查看抽取记录
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild size="lg">
                        <Link href="/profile/setup">完善我的基础资料</Link>
                      </Button>
                      <Button size="lg" variant="outline" disabled>
                        完成资料后可开启礼盒
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top,#fff1f2_0%,#ffffff_55%,#f8fafc_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <BlindBoxDisplay mode="hero" label="本校异性朋友" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <PriceCard
              icon={Gift}
              title="单次礼盒"
              description="随机开启一位本校异性朋友的联系方式，适合先迈出第一步。"
              price={basicPrice}
              originalPrice={hasDiscount ? DRAW_PRICING.BASIC.normal : undefined}
              note={hasDiscount ? "你已开启晴窗展示，当前自动享受礼盒优惠价。" : "开启资料展示后，可享受更低礼盒价格。"}
              href="/draw/start?type=basic"
              cta="选择单次礼盒"
              accentClass="text-rose-600"
              iconClass="bg-rose-50 text-rose-600"
              profileComplete={profileComplete}
            />

            <PriceCard
              icon={Sparkles}
              title="高级礼盒"
              description="除了联系方式，还会展示对方的基础资料，适合更认真地了解彼此。"
              price={premiumPrice}
              originalPrice={hasDiscount ? DRAW_PRICING.PREMIUM.normal : undefined}
              note={hasDiscount ? "同样享受高级礼盒优惠价，适合更认真地认识对方。" : "开启资料展示后，高级礼盒也会同步享受折扣。"}
              href="/draw/start?type=premium"
              cta="选择高级礼盒"
              accentClass="text-purple-600"
              iconClass="bg-purple-50 text-purple-600"
              profileComplete={profileComplete}
              badge="推荐"
            />
          </div>
        </section>

        <section>
          <Card className="border-none shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle>抽取规则</CardTitle>
              <CardDescription>了解流程后，四步即可完成一次更纯粹的缘分匹配。</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {drawRules.map((rule) => (
                <div key={rule.step} className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5 transition-colors hover:bg-white hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-700">{rule.step}</div>
                    <rule.icon className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{rule.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{rule.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-none bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
            <CardContent className="space-y-5 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Shield className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold">晴窗的坚持</h3>
                <p className="mt-3 text-sm leading-8 text-slate-200">{manifesto}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
            <CardContent className="space-y-5 p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">为什么是礼盒抽取</h3>
                  <p className="mt-1 text-sm text-slate-500">我们希望每一次相遇，都从真实而不是外貌预设出发。</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-rose-50 px-4 py-4">
                  <div className="text-sm font-semibold text-rose-700">不公开照片</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">礼盒不会展示外貌图片，把第一印象交回给真实交流。</p>
                </div>
                <div className="rounded-2xl bg-amber-50 px-4 py-4">
                  <div className="text-sm font-semibold text-amber-700">不过度标签化</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">不开放按相貌挑选，只保留必要条件和基础资料。</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                  <div className="text-sm font-semibold text-emerald-700">只向本校开启</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">所有抽取默认限定为本校范围，让缘分落回真实校园生活。</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}
