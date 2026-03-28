import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Gift,
  Sparkles,
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
import { getDrawHistory } from "@/lib/actions/draw";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function DrawHistoryPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/auth/login");
  }

  const { draws } = await getDrawHistory();

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl space-y-6 py-10">
        {/* 返回导航 */}
        <Link
          href="/draw"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-emerald-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回晴窗
        </Link>

        <div className="flex items-center gap-3">
          <Badge variant="secondary">抽取记录</Badge>
          <Badge variant="outline">{draws.length} 条</Badge>
        </div>

        <h1 className="text-3xl font-bold text-slate-900">抽取历史</h1>
        <p className="text-sm text-slate-500">
          所有已完成的抽取结果都可以在这里查看，永久保留。
        </p>

        {draws.length === 0 ? (
          <Card className="border-none shadow-xl">
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <Gift className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-600">暂无抽取记录</p>
              <p className="text-sm text-slate-400">
                前往晴窗开始你的第一次抽取
              </p>
              <Button asChild>
                <Link href="/draw">去抽取</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {draws.map((draw) => {
              const isPaid = draw.status === "PAID";
              const isPremium = draw.note === "PREMIUM";
              const TypeIcon = isPremium ? Sparkles : Gift;
              const typeLabel = isPremium ? "高级抽取" : "单次抽取";
              const typeBg = isPremium ? "bg-purple-50" : "bg-rose-50";
              const typeText = isPremium ? "text-purple-600" : "text-rose-600";

              return (
                <Card
                  key={draw.id}
                  className="border-none shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${typeBg} ${typeText}`}
                        >
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {typeLabel}
                            </span>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                已完成
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                <Clock className="h-3 w-3" />
                                待支付
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                            <span>{formatDate(draw.created_at)}</span>
                            <span>·</span>
                            <span>¥{Number(draw.amount).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 已支付：显示联系方式 */}
                    {isPaid && (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                          <h4 className="text-xs font-semibold text-emerald-800">
                            联系方式
                          </h4>
                          <div className="mt-2 space-y-1.5">
                            {draw.contact_wechat && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">微信：</span>
                                <span className="font-mono text-emerald-700">
                                  {draw.contact_wechat}
                                </span>
                              </div>
                            )}
                            {draw.contact_qq && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">QQ：</span>
                                <span className="font-mono text-emerald-700">
                                  {draw.contact_qq}
                                </span>
                              </div>
                            )}
                            {draw.contact_phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">手机：</span>
                                <span className="font-mono text-emerald-700">
                                  {draw.contact_phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 高级抽取：展示对方资料 */}
                        {isPremium && draw.targetProfile && (
                          <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                            <h4 className="text-xs font-semibold text-purple-800">
                              对方资料
                            </h4>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              {draw.targetProfile.gender && (
                                <div>
                                  <span className="text-slate-400">性别：</span>
                                  <span className="text-slate-700">
                                    {draw.targetProfile.gender === "male"
                                      ? "男"
                                      : "女"}
                                  </span>
                                </div>
                              )}
                              {draw.targetProfile.age && (
                                <div>
                                  <span className="text-slate-400">年龄：</span>
                                  <span className="text-slate-700">
                                    {draw.targetProfile.age} 岁
                                  </span>
                                </div>
                              )}
                              {draw.targetProfile.grade && (
                                <div>
                                  <span className="text-slate-400">年级：</span>
                                  <span className="text-slate-700">
                                    {draw.targetProfile.grade}
                                  </span>
                                </div>
                              )}
                              {draw.targetProfile.identity && (
                                <div>
                                  <span className="text-slate-400">身份：</span>
                                  <span className="text-slate-700">
                                    {draw.targetProfile.identity === "student"
                                      ? "学生"
                                      : "非学生"}
                                  </span>
                                </div>
                              )}
                              {draw.targetProfile.location && (
                                <div>
                                  <span className="text-slate-400">校区：</span>
                                  <span className="text-slate-700">
                                    {draw.targetProfile.location}
                                  </span>
                                </div>
                              )}
                            </div>
                            {draw.targetProfile.bio && (
                              <div className="mt-2 rounded-xl bg-white p-2.5 text-xs leading-5 text-slate-500">
                                {draw.targetProfile.bio}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 未支付 */}
                    {!isPaid && (
                      <div className="mt-4">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/draw/start?type=${isPremium ? "premium" : "basic"}`}
                          >
                            继续支付
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
