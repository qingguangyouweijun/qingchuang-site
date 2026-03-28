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
import { MainLayout } from "@/components/Layout/MainLayout";
import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card";
import { getCurrentUser } from "@/lib/actions/auth";
import { DRAW_PRICING } from "@/lib/draw";
import type { Profile } from "@/lib/types";

function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  return Boolean(profile.gender && profile.grade && profile.location);
}

const gameRules = [
  {
    step: "1",
    title: "完善个人资料",
    desc: "填写性别、年级和所在校区，并至少准备一种联系方式，方便系统在支付后直接展示。",
    icon: UserCheck,
  },
  {
    step: "2",
    title: "选择抽取档位",
    desc: "单次抽取获得联系方式，高级抽取会额外展示对方的基础资料。",
    icon: Star,
  },
  {
    step: "3",
    title: "设置筛选条件",
    desc: "你可以按年龄、身份和校区缩小范围；留空则表示不限。",
    icon: Sparkles,
  },
  {
    step: "4",
    title: "支付并查看结果",
    desc: "支付成功后即可查看结果，已完成的抽取记录会保留在历史列表中。",
    icon: History,
  },
] as const;

export default async function DrawPage() {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/auth/login");
  }

  const profile = (current.profile as Profile | null) ?? null;
  const profileComplete = isProfileComplete(profile);
  const hasDiscount = (profile?.contact_visibility_limit ?? 0) >= 1;

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-8 py-10">
        {!profileComplete && (
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">需要先完善资料才能使用晴窗抽取</p>
              <p className="mt-0.5 text-sm leading-6 text-amber-700">请先补充性别、年级和所在校区，再进入抽取流程。</p>
            </div>
            <Button asChild size="sm" className="shrink-0 bg-amber-600 text-white hover:bg-amber-700">
              <Link href="/profile/setup">去完善资料</Link>
            </Button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="relative overflow-hidden border-none shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
            <CardContent className="relative space-y-6 p-8">
              <div className="flex justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100">
                  <Gift className="h-14 w-14 text-rose-500" />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Badge variant="secondary">轻创功能</Badge>
                <Badge variant="outline">晴窗 · 随机抽取</Badge>
              </div>

              <div className="space-y-3 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">晴窗</h1>
                <p className="mx-auto max-w-lg text-base leading-8 text-slate-600 md:text-lg">
                  完善资料、设置条件并支付后，系统会随机为你匹配一位符合条件的异性联系人。
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {profileComplete ? (
                  <>
                    <Button asChild size="lg">
                      <Link href="/draw/start?type=basic">
                        <Gift className="mr-2 h-4 w-4" />
                        开始抽取
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link href="/draw/history">
                        <History className="mr-2 h-4 w-4" />
                        抽取记录
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link href="/profile/setup">完善我的资料</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" disabled>
                      <span className="cursor-not-allowed opacity-50">完成资料后才能开始抽取</span>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <Gift className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">单次抽取</h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">随机获得一位异性的联系方式。</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-rose-600">¥{hasDiscount ? DRAW_PRICING.BASIC.discounted : DRAW_PRICING.BASIC.normal}</div>
                    {hasDiscount ? (
                      <div className="text-xs text-slate-400 line-through">¥{DRAW_PRICING.BASIC.normal}</div>
                    ) : (
                      <div className="text-xs text-emerald-600">开放展示享 ¥{DRAW_PRICING.BASIC.discounted}</div>
                    )}
                  </div>
                </div>
                {profileComplete && (
                  <div className="mt-4">
                    <Button asChild size="sm" className="w-full">
                      <Link href="/draw/start?type=basic">
                        选择此档位
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="relative border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-0.5">
              <div className="absolute right-4 top-4">
                <Badge variant="secondary" className="bg-purple-50 text-purple-700">推荐</Badge>
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">高级抽取</h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">联系方式 + 对方基础资料，适合想更了解对方的人。</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">¥{hasDiscount ? DRAW_PRICING.PREMIUM.discounted : DRAW_PRICING.PREMIUM.normal}</div>
                    {hasDiscount ? (
                      <div className="text-xs text-slate-400 line-through">¥{DRAW_PRICING.PREMIUM.normal}</div>
                    ) : (
                      <div className="text-xs text-emerald-600">开放展示享 ¥{DRAW_PRICING.PREMIUM.discounted}</div>
                    )}
                  </div>
                </div>
                {profileComplete && (
                  <div className="mt-4">
                    <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                      <Link href="/draw/start?type=premium">
                        选择此档位
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <CardHeader>
              <CardTitle>抽取规则</CardTitle>
              <CardDescription>了解流程后，四步即可完成抽取。</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {gameRules.map((rule) => (
                <div key={rule.step} className="rounded-2xl bg-slate-50 p-5 transition-colors hover:bg-white hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700">{rule.step}</div>
                    <rule.icon className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-900">{rule.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500">{rule.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">关于资料展示</h3>
                <p className="text-sm leading-7 text-slate-600">晴窗不会展示照片，也不会利用相貌标签做盈利。抽取只基于基础资料和联系方式，尽量让连接回到真实交流本身。</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}
