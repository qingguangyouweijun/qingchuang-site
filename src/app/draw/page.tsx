import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Clock,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/UI/Card";
import { getCurrentUser } from "@/lib/actions/auth";
import { DRAW_PRICING } from "@/lib/actions/draw";
import type { Profile } from "@/lib/types";

function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  return Boolean(profile.gender && profile.grade && profile.location);
}

const gameRules = [
  {
    step: "1",
    title: "完善个人资料",
    desc: "填写性别、年级和所在校区，并留下至少一个联系方式（微信 / QQ / 手机）。",
    icon: UserCheck,
  },
  {
    step: "2",
    title: "选择抽取档位",
    desc: "单次抽取获取一个异性联系方式；高级抽取还可查看对方完整资料。",
    icon: Star,
  },
  {
    step: "3",
    title: "设置筛选条件",
    desc: "按年龄段、身份（学生 / 非学生）、所在校区来缩小范围。",
    icon: Sparkles,
  },
  {
    step: "4",
    title: "付费并查看结果",
    desc: "确认支付后，系统随机匹配一位异性，结果永久保留在历史记录中。",
    icon: Clock,
  },
];

export default async function DrawPage() {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/auth/login");
  }

  const profileComplete = isProfileComplete(current.profile as Profile | null);
  const hasDiscount =
    ((current.profile as Profile | null)?.contact_visibility_limit ?? 0) >= 1;

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-8 py-10">
        {/* ── 资料未完善提示 ── */}
        {!profileComplete && (
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">
                需要先完善资料才能使用晴窗抽取功能
              </p>
              <p className="mt-0.5 text-sm leading-6 text-amber-700">
                请填写性别、年级和所在校区后，即可解锁晴窗的全部互动能力。
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="shrink-0 bg-amber-600 text-white hover:bg-amber-700"
            >
              <Link href="/profile/setup">去完善资料</Link>
            </Button>
          </div>
        )}

        {/* ── 礼盒英雄区 ── */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="relative overflow-hidden border-none shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
            <CardContent className="relative space-y-6 p-8">
              {/* 动画礼盒 */}
              <div className="flex justify-center">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full blur-3xl"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(244,114,182,0.2) 0%, rgba(168,85,247,0.15) 50%, transparent 70%)",
                      animation: "giftPulse 3s ease-in-out infinite",
                    }}
                  />
                  <div
                    className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100"
                    style={{ animation: "giftFloat 4s ease-in-out infinite" }}
                  >
                    <Gift className="h-14 w-14 text-rose-500" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Badge variant="secondary">轻创功能</Badge>
                <Badge variant="outline">晴窗 · 随机抽取</Badge>
              </div>

              <div className="space-y-3 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                  晴窗
                </h1>
                <p className="mx-auto max-w-lg text-base leading-8 text-slate-600 md:text-lg">
                  完善资料、选择档位、付费后随机获得一位异性的联系方式。
                  每个人都是独一无二的，缘分从一次抽取开始。
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
                      <span className="cursor-not-allowed opacity-50">
                        开始抽取（需先完善资料）
                      </span>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── 档位卡片 ── */}
          <div className="space-y-4">
            {/* 单次抽取 */}
            <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <Gift className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        单次抽取
                      </h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">
                      随机获得一位异性的联系方式（微信 / QQ / 手机）
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-rose-600">
                      ¥{hasDiscount ? DRAW_PRICING.BASIC.discounted : DRAW_PRICING.BASIC.normal}
                    </div>
                    {hasDiscount && (
                      <div className="text-xs text-slate-400 line-through">
                        ¥{DRAW_PRICING.BASIC.normal}
                      </div>
                    )}
                    {!hasDiscount && (
                      <div className="text-xs text-emerald-600">
                        开放展示享 ¥{DRAW_PRICING.BASIC.discounted}
                      </div>
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

            {/* 高级抽取 */}
            <Card className="relative border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-0.5">
              <div className="absolute right-4 top-4">
                <Badge
                  variant="secondary"
                  className="bg-purple-50 text-purple-700"
                >
                  推荐
                </Badge>
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        高级抽取
                      </h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">
                      获得联系方式 + 查看对方完整资料（性别、年龄、年级、个人介绍等）
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      ¥{hasDiscount ? DRAW_PRICING.PREMIUM.discounted : DRAW_PRICING.PREMIUM.normal}
                    </div>
                    {hasDiscount && (
                      <div className="text-xs text-slate-400 line-through">
                        ¥{DRAW_PRICING.PREMIUM.normal}
                      </div>
                    )}
                    {!hasDiscount && (
                      <div className="text-xs text-emerald-600">
                        开放展示享 ¥{DRAW_PRICING.PREMIUM.discounted}
                      </div>
                    )}
                  </div>
                </div>
                {profileComplete && (
                  <div className="mt-4">
                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
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

        {/* ── 游戏规则 ── */}
        <section>
          <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <CardHeader>
              <CardTitle>抽取规则</CardTitle>
              <CardDescription>
                了解抽取流程，四步即可完成
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {gameRules.map((rule) => (
                <div
                  key={rule.step}
                  className="rounded-2xl bg-slate-50 p-5 transition-colors hover:bg-white hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-sm font-bold">
                      {rule.step}
                    </div>
                    <rule.icon className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-900">
                    {rule.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500">
                    {rule.desc}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* ── 关于相貌的声明 ── */}
        <section>
          <Card className="border-none shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  我们的态度
                </h3>
                <p className="text-sm leading-7 text-slate-600">
                  每个人生来就是与众不同、独一无二的。真正可贵的不是相貌。
                  <strong className="text-slate-800">
                    本站不会利用相貌进行盈利，也不会向你展示他人的相貌照片。
                  </strong>
                  晴窗的抽取完全基于基础资料匹配，让缘分回归最纯粹的相遇。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── 附加说明 ── */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-rose-50 p-5 text-sm leading-7 text-rose-800">
            <p className="font-medium">🎁 同一联系方式不重复</p>
            <p className="mt-1 text-rose-600">
              同一个用户已经抽取过的联系方式不会再次出现，每次都是新的相遇。
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-5 text-sm leading-7 text-emerald-800">
            <p className="font-medium">💰 筛选无结果不扣费</p>
            <p className="mt-1 text-emerald-600">
              如果按你的筛选条件暂无合适人选，可以修改后重试，本次不扣费。
            </p>
          </div>
          <div className="rounded-2xl bg-purple-50 p-5 text-sm leading-7 text-purple-800">
            <p className="font-medium">📜 结果永久保留</p>
            <p className="mt-1 text-purple-600">
              每次成功抽取的结果都会永久保留在你的历史记录中，随时可以回看。
            </p>
          </div>
        </section>
      </div>

      {/* ── 动画样式 ── */}
      <style>{`
        @keyframes giftFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes giftPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </MainLayout>
  );
}
