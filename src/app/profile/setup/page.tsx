"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  Save,
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
import { Input } from "@/components/UI/Input";
import { Select } from "@/components/UI/Select";
import { getProfile, updateProfile } from "@/lib/actions/profile";
import { GRADE_OPTIONS } from "@/lib/types";
import type { Appearance, Gender, Profile } from "@/lib/types";

const GRADE_VALUES: string[] = GRADE_OPTIONS.map((o) => o.value);

interface FormState {
  gender: Gender | "";
  grade: string;
  appearance: Appearance | "";
  location: string;
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
    location: profile?.location ?? "",
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
        setError(result.error ?? "加载资料失败。");
        setIsLoading(false);
        return;
      }
      setFormData(toFormState(result.profile));
      setIsLoading(false);
    }
    void loadProfileData();
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
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
    if (!formData.location) {
      setError("请选择所在校区情况。");
      return;
    }

    const visibilityLimit = Number(formData.visibilityLimit);
    if (
      !Number.isFinite(visibilityLimit) ||
      visibilityLimit < 0 ||
      !Number.isInteger(visibilityLimit)
    ) {
      setError("晴窗可见人数需为 0 或正整数。");
      return;
    }

    if (formData.bio.length > 200) {
      setError("具体描述不能超过 200 字。");
      return;
    }

    setIsSaving(true);

    const result = await updateProfile({
      gender: formData.gender,
      grade: formData.grade,
      appearance: (formData.appearance as Appearance) || undefined,
      location: formData.location,
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
      <div className="mx-auto max-w-4xl space-y-6 py-10">
        {/* Header */}
        <div>
          <Link
            href="/profile"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-emerald-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回账号中心
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <Badge variant="warning">资料设置</Badge>
            <Badge variant="outline">轻创 Qintra</Badge>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-gray-900">
            完善站内资料
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-gray-600">
            当前资料会同时服务校园模块和晴窗功能。晴窗后续若接入更完整的关系、解锁或支付能力，也会继续复用这套站内资料。
          </p>
        </div>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          {/* Form Card */}
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>基础资料</CardTitle>
              <CardDescription>
                先维护当前账号在轻创站内使用到的共用信息。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-gray-500">正在加载资料...</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* 性别 + 年级 */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        性别 <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.gender}
                        onChange={(e) =>
                          set("gender", e.target.value as Gender | "")
                        }
                      >
                        <option value="">请选择性别</option>
                        <option value="male">男生</option>
                        <option value="female">女生</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        年级 <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.grade}
                        onChange={(e) => set("grade", e.target.value)}
                      >
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

                  {/* 外在印象 + 所在校区 */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        外在印象 <span className="ml-1 text-xs font-normal text-gray-400">选填</span>
                      </label>
                      <Select
                        value={formData.appearance}
                        onChange={(e) =>
                          set("appearance", e.target.value as Appearance | "")
                        }
                      >
                        <option value="">请选择外在印象</option>
                        <option value="normal">自然</option>
                        <option value="good">出众</option>
                        <option value="stunning">超级哇塞</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        所在校区 <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.location}
                        onChange={(e) => set("location", e.target.value)}
                      >
                        <option value="">请选择校区情况</option>
                        <option value="本校">本校</option>
                        <option value="非本校">非本校</option>
                      </Select>
                    </div>
                  </div>

                  {/* 晴窗可见人数 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      晴窗资料可见人数上限
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0 表示暂不开放"
                      value={formData.visibilityLimit}
                      onChange={(e) => set("visibilityLimit", e.target.value)}
                      icon={<Sparkles className="h-4 w-4" />}
                    />
                    <p className="text-xs text-gray-500">
                      填 0 表示暂不开放晴窗展示；填 1
                      及以上表示最多允许多少人查看你的资料。
                    </p>
                    {Number(formData.visibilityLimit) === 0 && (
                      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 leading-6">
                        <p className="font-medium">💡 推荐设为 1 及以上</p>
                        <p className="mt-1">
                          开启后你的资料将进入晴窗展示池，让同校用户有机会认识你；同时你还可以享受晴窗抽取的
                          <strong>优惠价格</strong>。
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 联系方式 */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      联系方式
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        至少填一项，抽取匹配后对方可见
                      </span>
                    </label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <Input
                        placeholder="微信号"
                        value={formData.wechat}
                        onChange={(e) => set("wechat", e.target.value)}
                        icon={<MessageSquare className="h-4 w-4" />}
                      />
                      <Input
                        placeholder="QQ 号"
                        value={formData.qq}
                        onChange={(e) => set("qq", e.target.value)}
                        icon={<MessageSquare className="h-4 w-4" />}
                      />
                      <Input
                        placeholder="手机号"
                        value={formData.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        icon={<Phone className="h-4 w-4" />}
                      />
                    </div>
                  </div>

                  {/* 具体描述 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      具体描述
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        选填，最多 200 字
                      </span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-3 text-gray-400">
                        <FileText className="h-4 w-4" />
                      </span>
                      <textarea
                        maxLength={200}
                        rows={4}
                        placeholder="简单介绍一下自己，比如兴趣爱好、日常状态或想认识什么样的人……"
                        value={formData.bio}
                        onChange={(e) => set("bio", e.target.value)}
                        className="w-full resize-none rounded-2xl border border-gray-200 bg-white pl-9 pr-4 pt-3 pb-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                      />
                    </div>
                    <p className="text-right text-xs text-gray-400">
                      {formData.bio.length} / 200
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button type="submit" isLoading={isSaving}>
                      <Save className="mr-2 h-4 w-4" />
                      保存资料
                    </Button>
                    <Link href="/draw">
                      <Button type="button" variant="outline">
                        查看晴窗功能
                      </Button>
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* 右侧说明 */}
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>资料会用到哪里</CardTitle>
              <CardDescription>
                这部分文案直接按现在的产品边界收口。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-gray-600">
              <div className="rounded-2xl bg-amber-50 p-4">
                校园服务会复用你的统一账号资料、角色和站内身份，不再重复注册或重复维护。
              </div>
              <div className="rounded-2xl bg-lime-50 p-4">
                晴窗是轻创内的一个功能，不再单独承担总站品牌；资料展示、后续解锁和支付都会走主站流程。
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                管理员站和普通用户端依旧分开，后台只负责订单、结算、角色和站内规则。
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="font-medium text-emerald-800 mb-1">
                  💡 推荐开启晴窗展示
                </p>
                <p>将可见人数设为 1 以上并填写联系方式后：</p>
                <ul className="mt-2 space-y-1 text-xs text-emerald-700">
                  <li>· 你的资料会进入晴窗展示池，让同校用户有机会认识你</li>
                  <li>
                    · 你可以享受晴窗抽取的<strong>优惠定价</strong>
                  </li>
                  <li>· 所有支付统一通过在线支付完成，安全便捷</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}
