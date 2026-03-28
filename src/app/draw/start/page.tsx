"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { BlindBoxDisplay } from "@/components/draw/BlindBoxDisplay";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card";
import { Select } from "@/components/UI/Select";
import { createCampusPayment, syncCampusPayment } from "@/lib/actions/campus";
import { getDrawDetail, getDrawPricing, performDraw } from "@/lib/actions/draw";
import type { DrawType } from "@/lib/draw";
import type { Identity, PayType } from "@/lib/types";

const AGE_RANGES = [
  { value: "", label: "不限年龄" },
  { value: "18-20", label: "18 - 20 岁" },
  { value: "21-23", label: "21 - 23 岁" },
  { value: "24-26", label: "24 - 26 岁" },
  { value: "27-30", label: "27 - 30 岁" },
  { value: "31-99", label: "31 岁及以上" },
] as const;

const IDENTITY_OPTIONS = [
  { value: "", label: "不限身份" },
  { value: "student", label: "学生" },
  { value: "non_student", label: "非学生" },
] as const;

type Step = "filters" | "matching" | "found" | "paying" | "result" | "error";

interface DrawResultState {
  drawId: string;
  drawType: DrawType;
  amount: number;
}

interface PricingData {
  basic: { normal: number; discounted: number; actual: number; hasDiscount: boolean };
  premium: { normal: number; discounted: number; actual: number; hasDiscount: boolean };
}

interface PaymentState {
  payUrl: string;
  outTradeNo: string;
}

interface DrawDetail {
  status: string;
  note: string | null;
  contact_wechat: string | null;
  contact_qq: string | null;
  contact_phone: string | null;
  targetProfile: {
    gender: string | null;
    age: number | null;
    grade: string | null;
    bio: string | null;
    identity: string | null;
    location: string | null;
  } | null;
}

function DrawStartPageContent() {
  const searchParams = useSearchParams();
  const drawType: DrawType = searchParams.get("type") === "premium" ? "PREMIUM" : "BASIC";

  const [step, setStep] = React.useState<Step>("filters");
  const [ageRange, setAgeRange] = React.useState("");
  const [identity, setIdentity] = React.useState("");
  const [error, setError] = React.useState("");
  const [drawResult, setDrawResult] = React.useState<DrawResultState | null>(null);
  const [pricing, setPricing] = React.useState<PricingData | null>(null);
  const [payType, setPayType] = React.useState<PayType>("wxpay");
  const [payment, setPayment] = React.useState<PaymentState | null>(null);
  const [detail, setDetail] = React.useState<DrawDetail | null>(null);
  const [syncing, setSyncing] = React.useState(false);

  React.useEffect(() => {
    getDrawPricing()
      .then(setPricing)
      .catch(() => {
        setPricing(null);
      });
  }, []);

  const currentPricing = pricing ? (drawType === "PREMIUM" ? pricing.premium : pricing.basic) : null;
  const typeMeta =
    drawType === "PREMIUM"
      ? {
          badge: "高级礼盒",
          accent: "text-purple-600",
          badgeClass: "border-purple-200 text-purple-700",
          bgClass: "bg-purple-50 text-purple-700",
          tone: "purple" as const,
          description: "除联系方式外，还会同步展示对方的基础资料，适合更认真地了解彼此。",
        }
      : {
          badge: "单次礼盒",
          accent: "text-rose-600",
          badgeClass: "border-rose-200 text-rose-700",
          bgClass: "bg-rose-50 text-rose-700",
          tone: "rose" as const,
          description: "支付成功后展示一项联系方式，适合作为第一份轻盈而克制的浪漫盲盒。",
        };

  async function handleDraw() {
    setError("");
    setStep("matching");

    const [ageMin, ageMax] = ageRange ? ageRange.split("-").map(Number) : [undefined, undefined];

    try {
      const result = await performDraw({
        drawType,
        ageMin,
        ageMax,
        identity: identity ? (identity as Identity) : undefined,
      });

      if (result.error) {
        setError(result.error);
        setStep("error");
        return;
      }

      if (result.success && result.drawId) {
        setDrawResult({
          drawId: result.drawId,
          drawType: result.drawType,
          amount: result.amount,
        });
        setStep("found");
        return;
      }

      setError("未能创建抽取记录，请稍后重试。");
      setStep("error");
    } catch (err) {
      setError(err instanceof Error ? err.message : "抽取失败，请稍后重试。");
      setStep("error");
    }
  }

  async function handlePay() {
    if (!drawResult) return;

    setError("");
    setStep("paying");

    try {
      const result = await createCampusPayment({
        bizType: "DRAW_ORDER",
        bizId: drawResult.drawId,
        payType,
      });

      if (result.payment?.pay_url && result.payment.out_trade_no) {
        setPayment({
          payUrl: result.payment.pay_url,
          outTradeNo: result.payment.out_trade_no,
        });
        window.open(result.payment.pay_url, "_blank", "noopener,noreferrer");
        return;
      }

      setError("获取支付链接失败，请稍后重试。");
      setStep("found");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建支付失败，请稍后重试。");
      setStep("found");
    }
  }

  async function handleSyncPayment() {
    if (!payment || !drawResult) return;

    setSyncing(true);
    setError("");

    try {
      const result = await syncCampusPayment({ outTradeNo: payment.outTradeNo });

      if (result.payment?.status === "SUCCESS") {
        const detailResult = await getDrawDetail(drawResult.drawId);
        if (detailResult.draw) {
          setDetail(detailResult.draw as DrawDetail);
          setStep("result");
          return;
        }
      }

      setError("支付状态尚未完成同步，请完成支付后稍等片刻再试。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "同步支付状态失败，请稍后重试。");
    } finally {
      setSyncing(false);
    }
  }

  function handleRetry() {
    setStep("filters");
    setError("");
    setDrawResult(null);
    setPayment(null);
    setDetail(null);
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6 py-10">
        <Link href="/draw" className="inline-flex items-center text-sm text-slate-500 transition-colors hover:text-emerald-600">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回晴窗
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success">{typeMeta.badge}</Badge>
          {currentPricing && (
            <Badge variant="outline" className={typeMeta.badgeClass}>
              ¥{currentPricing.actual.toFixed(2)}
              {currentPricing.hasDiscount && <span className="ml-1 text-xs text-slate-400 line-through">¥{currentPricing.normal.toFixed(2)}</span>}
            </Badge>
          )}
        </div>

        {step === "filters" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.04fr_0.96fr]">
            <Card className="border-none shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-slate-400" />
                  设置筛选条件
                </CardTitle>
                <CardDescription>
                  晴窗会为你随机匹配一位符合条件的本校异性朋友。年龄与身份用于缩小范围，留空则表示不限。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">年龄范围</label>
                    <Select value={ageRange} onChange={(event) => setAgeRange(event.target.value)}>
                      {AGE_RANGES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">身份范围</label>
                    <Select value={identity} onChange={(event) => setIdentity(event.target.value)}>
                      {IDENTITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className={`rounded-2xl px-4 py-4 text-sm leading-7 ${typeMeta.bgClass}`}>
                  {typeMeta.description}
                  <br />
                  我们不会开放按相貌选择，也不会展示照片。每一次抽取，都是一场抛开视觉偏见的浪漫盲盒。
                </div>

                <Button onClick={handleDraw} size="lg" className="w-full">
                  开始抽取礼盒
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <BlindBoxDisplay
                tone={typeMeta.tone}
                caption={
                  drawType === "PREMIUM"
                    ? "高级礼盒会在开启后同步展示对方的基础资料，适合更认真地了解彼此。"
                    : "单次礼盒会为你开启一项联系方式，像一封被轻轻推开的缘分来信。"
                }
              />

              <Card className="border-none shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-4 p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">礼盒说明</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      完善资料、设置条件并支付后，系统会随机为你匹配一位符合条件的本校异性朋友。
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                    在「晴窗」，我们不过度包装相貌，也不让关系被颜值标价。你将拿到一份更真实、更克制的缘分盲盒。
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === "matching" && (
          <Card className="border-none shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <CardContent className="flex flex-col items-center gap-6 py-14">
              <BlindBoxDisplay tone={typeMeta.tone} caption="正在为你封存一份浪漫盲盒，请稍候片刻。" />
              <div className="space-y-2 text-center">
                <p className="text-xl font-semibold text-slate-900">正在为你匹配本校异性朋友...</p>
                <p className="text-sm text-slate-500">系统会优先遵循你的条件，并保留晴窗不看外表的匹配原则。</p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "error" && (
          <Card className="border-none shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <XCircle className="h-8 w-8 text-amber-500" />
              </div>
              <p className="text-lg font-semibold text-slate-900">这次还没有抽到合适的人选</p>
              <p className="max-w-md text-sm leading-7 text-slate-500">{error}</p>
              <Button onClick={handleRetry} variant="outline">
                <RefreshCcw className="mr-2 h-4 w-4" />
                调整条件后重试
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "found" && drawResult && (
          <Card className="border-none shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-6 py-8">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-xl font-semibold text-slate-900">已经为你准备好礼盒</p>
                <p className="text-sm leading-7 text-slate-500">
                  支付完成后即可查看{drawResult.drawType === "PREMIUM" ? "联系方式与基础资料" : "联系方式"}。
                </p>
              </div>

              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

              <div className="rounded-2xl bg-slate-50 p-5 text-center">
                <div className="text-sm text-slate-500">本次需支付</div>
                <div className={`mt-2 text-4xl font-bold ${typeMeta.accent}`}>¥{drawResult.amount.toFixed(2)}</div>
                <div className="mt-2 text-xs text-slate-400">{drawResult.drawType === "PREMIUM" ? "高级礼盒" : "单次礼盒"}</div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">选择支付方式</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayType("wxpay")}
                    className={`rounded-2xl border-2 p-4 text-center transition-all ${payType === "wxpay" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <div className="text-lg font-bold text-emerald-700">微信支付</div>
                    <div className="mt-1 text-xs text-slate-400">推荐微信完成付款</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayType("alipay")}
                    className={`rounded-2xl border-2 p-4 text-center transition-all ${payType === "alipay" ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <div className="text-lg font-bold text-blue-700">支付宝</div>
                    <div className="mt-1 text-xs text-slate-400">使用支付宝完成付款</div>
                  </button>
                </div>
              </div>

              <Button onClick={handlePay} size="lg" className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                确认支付 ¥{drawResult.amount.toFixed(2)}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "paying" && payment && (
          <Card className="border-none shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-6 py-8 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
              <div className="space-y-2">
                <p className="text-xl font-semibold text-slate-900">等待支付完成</p>
                <p className="text-sm leading-7 text-slate-500">支付页面已在新窗口打开。完成支付后，回到这里同步状态并开启礼盒。</p>
              </div>

              {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>}

              <div className="flex flex-col gap-3">
                <Button onClick={handleSyncPayment} size="lg" className="w-full" isLoading={syncing}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  我已完成支付
                </Button>
                <a href={payment.payUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sm text-emerald-600 hover:underline">
                  <ExternalLink className="h-4 w-4" />
                  重新打开支付页面
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "result" && detail && (
          <div className="space-y-6">
            <Card className="border-none shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  礼盒已开启
                </CardTitle>
                <CardDescription>{detail.note === "PREMIUM" ? "以下为对方的联系方式与基础资料。" : "以下为对方的联系方式。"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                  <h4 className="text-sm font-semibold text-emerald-800">联系方式</h4>
                  <div className="mt-3 space-y-2 text-sm">
                    {detail.contact_wechat && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">微信：</span>
                        <span className="rounded-lg bg-white px-3 py-1 font-mono text-emerald-700">{detail.contact_wechat}</span>
                      </div>
                    )}
                    {detail.contact_qq && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">QQ：</span>
                        <span className="rounded-lg bg-white px-3 py-1 font-mono text-emerald-700">{detail.contact_qq}</span>
                      </div>
                    )}
                    {detail.contact_phone && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">手机号：</span>
                        <span className="rounded-lg bg-white px-3 py-1 font-mono text-emerald-700">{detail.contact_phone}</span>
                      </div>
                    )}
                    {!detail.contact_wechat && !detail.contact_qq && !detail.contact_phone && <p className="text-slate-500">对方暂未填写可展示的联系方式。</p>}
                  </div>
                </div>

                {detail.note === "PREMIUM" && detail.targetProfile && (
                  <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-5">
                    <h4 className="text-sm font-semibold text-purple-800">对方基础资料</h4>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
                      {detail.targetProfile.gender && (
                        <div>
                          <span className="text-slate-500">性别：</span>
                          {detail.targetProfile.gender === "male" ? "男生" : "女生"}
                        </div>
                      )}
                      {detail.targetProfile.age !== null && detail.targetProfile.age !== undefined && (
                        <div>
                          <span className="text-slate-500">年龄：</span>
                          {detail.targetProfile.age} 岁
                        </div>
                      )}
                      {detail.targetProfile.grade && (
                        <div>
                          <span className="text-slate-500">年级：</span>
                          {detail.targetProfile.grade}
                        </div>
                      )}
                      {detail.targetProfile.identity && (
                        <div>
                          <span className="text-slate-500">身份：</span>
                          {detail.targetProfile.identity === "student" ? "学生" : "非学生"}
                        </div>
                      )}
                    </div>
                    {detail.targetProfile.bio && (
                      <div className="mt-3 rounded-xl bg-white p-3 text-sm leading-7 text-slate-600">
                        <span className="text-slate-400">个人简介：</span>
                        {detail.targetProfile.bio}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="rounded-2xl bg-sky-50 p-4 text-center text-xs leading-6 text-sky-700">
              晴窗不会展示照片，也不会赋予任何人按照相貌筛选的权利。愿这份礼盒带来的，是更真实也更干净的心动。
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/draw">继续抽取</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/draw/history">查看历史记录</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function DrawStartPageFallback() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl py-10">
        <Card className="border-none shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <CardContent className="flex items-center justify-center py-12 text-sm text-slate-500">页面加载中...</CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default function DrawStartPage() {
  return (
    <React.Suspense fallback={<DrawStartPageFallback />}>
      <DrawStartPageContent />
    </React.Suspense>
  );
}
