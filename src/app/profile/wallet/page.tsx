"use client"

import * as React from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft, ImageUp } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Badge } from "@/components/UI/Badge"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card"
import { createSettlementApplication, getCampusWalletData } from "@/lib/actions/campus"
import { uploadPayeeQrCode } from "@/lib/actions/profile"
import type { CampusBalanceLog, CampusSettlementApplication } from "@/lib/types"

const SETTLEMENT_LABELS = {
  PENDING: "结算申请中",
  APPROVED: "已结算",
  REJECTED: "已驳回",
} as const

const SETTLEMENT_VARIANTS: Record<string, "default" | "secondary" | "warning" | "success" | "outline" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
}

const LOG_LABELS: Record<string, string> = {
  income_pending: "快递接单后进入待完成收入",
  pending_to_available: "快递已完成，收入转入可结算余额",
  income_available: "旧书交易完成，收入转入可结算余额",
  available_to_applying: "发起结算申请",
  applying_to_settled: "管理员已完成结算",
  applying_to_available: "结算申请被驳回，金额退回可结算余额",
}

interface WalletData {
  profile: {
    campus_available_balance?: number | null
    campus_pending_balance?: number | null
    campus_settlement_applying_amount?: number | null
    campus_settled_total?: number | null
  }
  settlements: CampusSettlementApplication[]
  logs: CampusBalanceLog[]
}

export default function CampusWalletPage() {
  const [data, setData] = React.useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const [qrPreview, setQrPreview] = React.useState<string | null>(null)
  const [qrFile, setQrFile] = React.useState<File | null>(null)
  const [notice, setNotice] = React.useState("")
  const [error, setError] = React.useState("")
  const qrInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    void loadData()
  }, [])

  React.useEffect(() => {
    return () => {
      if (qrPreview) {
        URL.revokeObjectURL(qrPreview)
      }
    }
  }, [qrPreview])

  async function loadData() {
    setIsLoading(true)
    setError("")

    try {
      const result = await getCampusWalletData()
      setData(result as WalletData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "校园钱包数据暂时不可用。")
    }

    setIsLoading(false)
  }

  function handleQrChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (qrPreview) {
      URL.revokeObjectURL(qrPreview)
    }

    setQrFile(file)
    setQrPreview(URL.createObjectURL(file))
  }

  function clearQrSelection() {
    if (qrPreview) {
      URL.revokeObjectURL(qrPreview)
    }
    setQrPreview(null)
    setQrFile(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setNotice("")

    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      setError("请输入正确的结算金额。")
      return
    }

    if (!qrFile) {
      setError("提交结算申请时必须附带收款码。")
      return
    }

    setIsSubmitting(true)

    try {
      const qrFormData = new FormData()
      qrFormData.append("qrcode", qrFile)

      const qrResult = await uploadPayeeQrCode(qrFormData)
      if (qrResult.error || !qrResult.url) {
        setError(qrResult.error || "收款码上传失败，请重试。")
        setIsSubmitting(false)
        return
      }

      await createSettlementApplication(amountNum, qrResult.url)
      setNotice("结算申请已提交，金额已转入“结算申请中”，请等待管理员线下打款并完成处理。")
      setAmount("")
      clearQrSelection()
      await loadData()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交结算申请失败。")
    }

    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      </MainLayout>
    )
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl py-20">
          <Card>
            <CardContent className="space-y-4 p-10 text-center">
              <h1 className="text-3xl font-bold text-slate-900">请先登录后查看校园钱包</h1>
              <p className="text-slate-600">校园钱包会展示代取与旧书收入、结算申请和余额流水。</p>
              <Link href="/auth/login">
                <Button>去邮箱登录</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const available = Number(data.profile.campus_available_balance || 0)
  const pendingIncome = Number(data.profile.campus_pending_balance || 0)
  const applying = Number(data.profile.campus_settlement_applying_amount || 0)
  const settled = Number(data.profile.campus_settled_total || 0)

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-8 py-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回我的
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-slate-900">校园钱包</h1>
          <p className="mt-3 max-w-3xl text-slate-600 leading-7">
            这里统一管理快递代取收入、旧书成交收入、结算申请和余额流水。提交结算时请附带收款码，管理员处理后状态会同步更新。
          </p>
        </div>

        {(notice || error) && (
          <div
            className={`flex items-start gap-3 rounded-2xl px-5 py-4 text-sm ${
              error
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error && <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
            {error || notice}
          </div>
        )}

        <section>
          <Card className="border-none bg-slate-900 text-white shadow-xl">
            <CardContent className="grid grid-cols-2 gap-4 p-8 xl:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-sm text-white/70">可结算余额</div>
                <div className="mt-3 text-3xl font-bold">¥{available.toFixed(2)}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-sm text-white/70">待完成收入</div>
                <div className="mt-3 text-3xl font-bold">¥{pendingIncome.toFixed(2)}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-sm text-white/70">结算申请中</div>
                <div className="mt-3 text-3xl font-bold">¥{applying.toFixed(2)}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-5">
                <div className="text-sm text-white/70">已结算</div>
                <div className="mt-3 text-3xl font-bold">¥{settled.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>发起结算申请</CardTitle>
              <CardDescription>
                提交后金额会先从可结算余额转入“结算申请中”，管理员确认打款后会标记为“已结算”。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">本次申请金额</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder={`请输入不大于 ¥${available.toFixed(2)} 的金额`}
                    required
                  />
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    当前可结算余额为 <span className="font-semibold text-slate-900">¥{available.toFixed(2)}</span>。提交后金额会先冻结到“结算申请中”。
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    收款码 <span className="text-red-500">*</span>
                  </label>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                    请上传微信或支付宝收款码。管理员在后台会看到你的申请金额和收款码，并在线下完成打款。
                  </div>

                  <input
                    ref={qrInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQrChange}
                    className="hidden"
                  />

                  {qrPreview ? (
                    <div className="space-y-3">
                      <img
                        src={qrPreview}
                        alt="收款码预览"
                        className="h-40 w-40 rounded-2xl border border-slate-200 object-cover shadow-sm"
                      />
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => qrInputRef.current?.click()}>
                          重新上传
                        </Button>
                        <Button type="button" variant="ghost" onClick={clearQrSelection}>
                          移除图片
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => qrInputRef.current?.click()}
                      className="flex h-28 w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <ImageUp className="h-5 w-5" />
                      点击上传收款码图片
                    </button>
                  )}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? "提交中..." : "提交结算申请"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>结算申请记录</CardTitle>
              <CardDescription>申请提交后会在这里看到状态变化，管理员完成后会变成“已结算”。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.settlements.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">暂时没有结算申请记录。</div>
              )}
              {data.settlements.map((item) => (
                <div key={item.id} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{item.application_no}</div>
                      <div className="mt-1 text-sm text-slate-500">申请金额 ¥{Number(item.amount).toFixed(2)}</div>
                    </div>
                    <Badge variant={SETTLEMENT_VARIANTS[item.status] || "outline"}>
                      {SETTLEMENT_LABELS[item.status as keyof typeof SETTLEMENT_LABELS] || item.status}
                    </Badge>
                  </div>

                  {item.payee_qr_code && (
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                      <img src={item.payee_qr_code} alt="收款码" className="h-14 w-14 rounded-xl border border-slate-200 object-cover" />
                      <div>本次申请已附带收款码，管理员可以直接在线下扫码打款。</div>
                    </div>
                  )}

                  {item.note && <div className="text-sm text-slate-600">备注：{item.note}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>余额流水</CardTitle>
              <CardDescription>记录代取收入、旧书收入和结算申请带来的余额变化。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.logs.length === 0 && (
                <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">暂时没有余额流水。</div>
              )}
              {data.logs.map((log) => (
                <div key={log.id} className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">{LOG_LABELS[log.change_type] || log.change_type}</div>
                    <div className={`font-semibold ${Number(log.amount) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {Number(log.amount) >= 0 ? "+" : ""}¥{Number(log.amount).toFixed(2)}
                    </div>
                  </div>
                  <div>可结算余额：¥{Number(log.before_available).toFixed(2)} → ¥{Number(log.after_available).toFixed(2)}</div>
                  <div>待完成收入：¥{Number(log.before_pending).toFixed(2)} → ¥{Number(log.after_pending).toFixed(2)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  )
}
