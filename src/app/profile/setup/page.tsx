"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  HeartHandshake,
  MessageSquare,
  Phone,
  Save,
  Shield,
  Sparkles,
} from "lucide-react";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Badge } from "@/components/UI/Badge";
import { Button } from "@/components/UI/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card";
import { Input } from "@/components/UI/Input";
import { Select } from "@/components/UI/Select";
import { getProfile, updateProfile } from "@/lib/actions/profile";
import { GRADE_OPTIONS } from "@/lib/types";
import type { Appearance, Gender, Profile } from "@/lib/types";

const GRADE_VALUES: string[] = GRADE_OPTIONS.map((option) => option.value);
const MANIFESTO =
  "在这个被视觉与外貌裹挟的时代，在「晴窗」，我们始终坚信，相貌从来不是定义一个人的唯一标准，更不该是被明码标价的筹码，每个人都是独一无二的宇宙。我们过滤掉外界对颜值的喧嚣，仅以最基础的真实资料，作为开启缘分的钥匙。我们没有赋予用户选择相貌的权利，每一次抽取，都是一场抛开了视觉偏见的浪漫盲盒，不看外表，只待回响。最后，祝愿你遇见一份真正触碰内心的纯净缘分。";

interface FormState {
  gender: Gender | "";
  grade: string;
  appearance: Appearance | "";
  visibilityLimit: string;
  bio: string;
  wechat: string;
  qq: string;
  phone: string;
}

function toFormState(profile: Profile | null): FormState {
  return {
    gender: profile?.gender ?? "",
    grade: profile?.grade ?? "",
    appearance: profile?.appearance ?? "",
    visibilityLimit: String(profile?.contact_visibility_limit ?? 0),
    bio: profile?.bio ?? "",
    wechat: "",
    qq: "",
    phone: "",
  };
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [formData, setFormData] = React.useState<FormState>(toFormState(null));
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    async function loadProfileData() {
      const result = await getProfile();
      if (result.error || !result.profile) {
        setError(result.error ?? "加载资料失败，请稍后重试。");
        setIsLoading(false);
        return;
      }

      setFormData(toFormState(result.profile));
      setIsLoading(false);
    }

    void loadProfileData();
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!formData.gender) {
      setError("请选择性别。");
      return;
    }

    if (!formData.grade || !GRADE_VALUES.includes(formData.grade)) {
      setError("请选择所在年级。");
      return;
    }

    const visibilityLimit = Number(formData.visibilityLimit);
    if (!Number.isFinite(visibilityLimit) || visibilityLimit < 0 || !Number.isInteger(visibilityLimit)) {
      setError("晴窗可见人数上限必须为 0 或正整数。");
      return;
    }

    if (formData.bio.length > 200) {
      setError("具体描述不能超过 200 字。");
      return;
    }

    if (visibilityLimit > 0 && !formData.wechat.trim() && !formData.qq.trim() && !formData.phone.trim()) {
      setError("当你开启晴窗展示时，请至少填写一种联系方式。");
      return;
    }

    setIsSaving(true);

    const result = await updateProfile({
      gender: formData.gender,
      grade: formData.grade,
      appearance: (formData.appearance as Appearance) || undefined,
      bio: formData.bio.trim() || undefined,
      contact_visibility_limit: visibilityLimit,
      wechat: formData.wechat.trim() || undefined,
      qq: formData.qq.trim() || undefined,
      phone: formData.phone.trim() || undefined,
    });

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/profile");
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6 py-10">
        <div>
          <Link href="/profile" className="inline-flex items-center text-sm text-slate-500 transition-colors hover:text-emerald-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回账号中心
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant="warning">资料设置</Badge>
            <Badge variant="outline">晴窗 · 真实资料</Badge>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">完善我的基础资料</h1>
          <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
            这份资料会同时服务账号中心与晴窗匹配流程。我们只保留必要且真实的内容，不开放校区与相貌筛选，把缘分交还给更克制的标准。
          </p>
        </div>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <Card className="border-none shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <CardHeader>
              <CardTitle>基础资料</CardTitle>
              <CardDescription>先维护你在轻创站内会被复用的基础信息，晴窗会默认把你视为本校用户参与匹配。</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-slate-500">正在加载资料...</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-800">
                    晴窗默认只匹配本校异性朋友，因此这里不再开放“所在校区”选择项。你的资料会以更克制、更统一的方式进入匹配流程。
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        性别 <span className="text-red-500">*</span>
                      </label>
                      <Select value={formData.gender} onChange={(event) => setField("gender", event.target.value as Gender | "")}> 
                        <option value="">请选择性别</option>
                        <option value="male">男生</option>
                        <option value="female">女生</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        年级 <span className="text-red-500">*</span>
                      </label>
                      <Select value={formData.grade} onChange={(event) => setField("grade", event.target.value)}>
                        <option value="">请选择年级</option>
                        <optgroup label="本科">
                          <option value="大一">大一</option>
                          <option value="大二">大二</option>
                          <option value="大三">大三</option>
                          <option value="大四">大四</option>
                        </optgroup>
                        <optgroup label="研究生">
                          <option value="研一">研一</option>
                          <option value="研二">研二</option>
                          <option value="研三">研三</option>
                        </optgroup>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      外在印象 <span className="ml-1 text-xs font-normal text-slate-400">选填，仅用于你自己保存</span>
                    </label>
                    <Select value={formData.appearance} onChange={(event) => setField("appearance", event.target.value as Appearance | "")}> 
                      <option value="">请选择外在印象</option>
                      <option value="normal">自然</option>
                      <option value="good">出众</option>
                      <option value="stunning">超级哇塞</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">晴窗资料可见人数上限</label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0 表示暂不开放晴窗展示"
                      value={formData.visibilityLimit}
                      onChange={(event) => setField("visibilityLimit", event.target.value)}
                      icon={<Sparkles className="h-4 w-4" />}
                    />
                    <p className="text-xs text-slate-500">填 0 表示暂不开放晴窗展示；填 1 及以上表示最多允许多少人查看你的资料。</p>
                    {Number(formData.visibilityLimit) === 0 ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                        <p className="font-medium">推荐设置为 1 及以上</p>
                        <p className="mt-1">开启后你的资料将进入晴窗展示池，让同校用户有机会认识你，同时你也可以享受晴窗抽取的优惠价格。</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                        已开启晴窗展示。请确保至少填写一种联系方式，方便系统在匹配后向对方展示。
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">
                      联系方式
                      <span className="ml-2 text-xs font-normal text-slate-400">至少填写一项，匹配成功后对方才可见</span>
                    </label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <Input placeholder="微信号" value={formData.wechat} onChange={(event) => setField("wechat", event.target.value)} icon={<MessageSquare className="h-4 w-4" />} />
                      <Input placeholder="QQ 号" value={formData.qq} onChange={(event) => setField("qq", event.target.value)} icon={<MessageSquare className="h-4 w-4" />} />
                      <Input placeholder="手机号" value={formData.phone} onChange={(event) => setField("phone", event.target.value)} icon={<Phone className="h-4 w-4" />} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      具体描述
                      <span className="ml-2 text-xs font-normal text-slate-400">选填，最多 200 字</span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-3 text-slate-400">
                        <FileText className="h-4 w-4" />
                      </span>
                      <textarea
                        maxLength={200}
                        rows={4}
                        placeholder="简单介绍一下自己，比如兴趣爱好、日常状态，或者你想认识怎样的朋友。"
                        value={formData.bio}
                        onChange={(event) => setField("bio", event.target.value)}
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white pb-3 pl-9 pr-4 pt-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <p className="text-right text-xs text-slate-400">{formData.bio.length} / 200</p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button type="submit" isLoading={isSaving}>
                      <Save className="mr-2 h-4 w-4" />
                      保存资料
                    </Button>
                    <Link href="/draw">
                      <Button type="button" variant="outline">查看晴窗功能</Button>
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
              <CardContent className="space-y-5 p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <HeartHandshake className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">晴窗的初心</h3>
                  <p className="mt-3 text-sm leading-8 text-slate-200">{MANIFESTO}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <CardTitle>资料会用到哪里</CardTitle>
                <CardDescription>这些资料会被轻创站内多个场景复用，但规则始终保持克制与透明。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
                <div className="rounded-2xl bg-amber-50 px-4 py-4">
                  <div className="flex items-center gap-2 font-semibold text-amber-900">
                    <Shield className="h-4 w-4" />
                    校园服务不会读取你的晴窗偏好
                  </div>
                  <p className="mt-2">校园服务会继续使用你的基础身份信息，不会把晴窗里的关系逻辑带进其他模块。</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                  <div className="flex items-center gap-2 font-semibold text-emerald-900">
                    <Sparkles className="h-4 w-4" />
                    晴窗只复用最基础的真实资料
                  </div>
                  <p className="mt-2">我们不会开放外貌筛选。礼盒抽取时，只会使用性别、年级、身份与联系方式等最基础信息。</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
