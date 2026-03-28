import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock3, Gift, Sparkles } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Badge } from "@/components/UI/Badge"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card"
import { getCurrentUser } from "@/lib/actions/auth"
import { getDrawHistory } from "@/lib/actions/draw"

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

export default async function DrawHistoryPage() {
  const current = await getCurrentUser()
  if (!current) {
    redirect("/auth/login")
  }

  const { draws } = await getDrawHistory()

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6 py-10">
        <Link href="/draw" className="inline-flex items-center text-sm text-slate-500 transition-colors hover:text-emerald-600">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回晴窗
        </Link>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">礼盒记录</Badge>
            <Badge variant="outline">{draws.length} 条</Badge>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">晴窗抽取历史</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            每一次礼盒开启后的结果都会留存在这里。你可以回看联系方式、已展示的基础资料，以及当时完成支付的时间。
          </p>
        </div>

        {draws.length === 0 ? (
          <Card className="border-none shadow-xl">
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <Gift className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-700">还没有开启过礼盒</p>
              <p className="text-sm text-slate-400">前往晴窗，完成你的第一份随机回响。</p>
              <Button asChild>
                <Link href="/draw">去抽取</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {draws.map((draw) => {
              const isPaid = draw.status === "PAID"
              const isPremium = draw.note === "PREMIUM"
              const TypeIcon = isPremium ? Sparkles : Gift
              const typeLabel = isPremium ? "高级礼盒" : "单次礼盒"
              const typeBg = isPremium ? "bg-purple-50" : "bg-rose-50"
              const typeText = isPremium ? "text-purple-600" : "text-rose-600"

              return (
                <Card
                  key={draw.id}
                  className="border-none shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${typeBg} ${typeText}`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-900">{typeLabel}</span>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                已支付
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                <Clock3 className="h-3 w-3" />
                                待支付
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <span>{formatDate(draw.created_at)}</span>
                            <span>·</span>
                            <span>¥{Number(draw.amount).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isPaid ? (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                          <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">联系方式</h4>
                          <div className="mt-3 space-y-1.5 text-sm">
                            {draw.contact_wechat && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">微信：</span>
                                <span className="font-mono text-emerald-700">{draw.contact_wechat}</span>
                              </div>
                            )}
                            {draw.contact_qq && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">QQ：</span>
                                <span className="font-mono text-emerald-700">{draw.contact_qq}</span>
                              </div>
                            )}
                            {draw.contact_phone && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">手机号：</span>
                                <span className="font-mono text-emerald-700">{draw.contact_phone}</span>
                              </div>
                            )}
                            {!draw.contact_wechat && !draw.contact_qq && !draw.contact_phone && (
                              <p className="text-sm text-slate-500">对方暂未填写联系方式。</p>
                            )}
                          </div>
                        </div>

                        {isPremium && draw.targetProfile && (
                          <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                            <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-800">对方基础资料</h4>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                              {draw.targetProfile.gender && (
                                <div>
                                  <span className="text-slate-400">性别：</span>
                                  {draw.targetProfile.gender === "male" ? "男" : "女"}
                                </div>
                              )}
                              {draw.targetProfile.age !== null && draw.targetProfile.age !== undefined && (
                                <div>
                                  <span className="text-slate-400">年龄：</span>
                                  {draw.targetProfile.age} 岁
                                </div>
                              )}
                              {draw.targetProfile.grade && (
                                <div>
                                  <span className="text-slate-400">年级：</span>
                                  {draw.targetProfile.grade}
                                </div>
                              )}
                              {draw.targetProfile.identity && (
                                <div>
                                  <span className="text-slate-400">身份：</span>
                                  {draw.targetProfile.identity === "student" ? "学生" : "非学生"}
                                </div>
                              )}
                            </div>
                            {draw.targetProfile.bio && (
                              <div className="mt-3 rounded-xl bg-white p-3 text-xs leading-6 text-slate-500">
                                {draw.targetProfile.bio}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
                        该记录尚未完成支付，当前不会展示联系方式。你可以重新发起一次相同类型的礼盒抽取。
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Card className="border-none bg-slate-50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">晴窗说明</CardTitle>
            <CardDescription>我们不会在历史记录中展示相貌或校区偏好，只保留基础资料与联系方式。</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-slate-600">
            在这个被视觉与外貌裹挟的时代，在「晴窗」，我们坚持把缘分放回更朴素的判断里。每一次抽取，都是抛开视觉偏见后的认真相遇。
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
