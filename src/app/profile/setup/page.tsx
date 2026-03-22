"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Save, Sparkles, UserRound } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Badge } from "@/components/UI/Badge"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card"
import { Input } from "@/components/UI/Input"
import { Select } from "@/components/UI/Select"
import { getProfile, updateProfile } from "@/lib/actions/profile"
import type { Appearance, Gender, Identity, Profile } from "@/lib/types"

interface FormState {
  gender: Gender | ""
  age: string
  appearance: Appearance | ""
  identity: Identity | ""
  location: string
  visibilityLimit: string
}

function toFormState(profile: Profile | null): FormState {
  return {
    gender: profile?.gender ?? "",
    age: profile?.age ? String(profile.age) : "",
    appearance: profile?.appearance ?? "",
    identity: profile?.identity ?? "",
    location: profile?.location ?? "",
    visibilityLimit: String(profile?.contact_visibility_limit ?? 0),
  }
}

export default function ProfileSetupPage() {
  const router = useRouter()
  const [formData, setFormData] = React.useState<FormState>(toFormState(null))
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    async function loadProfileData() {
      const result = await getProfile()

      if (result.error || !result.profile) {
        setError(result.error || "加载资料失败。")
        setIsLoading(false)
        return
      }

      setFormData(toFormState(result.profile))
      setIsLoading(false)
    }

    void loadProfileData()
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!formData.gender || !formData.appearance || !formData.identity || !formData.location.trim()) {
      setError("请把必填资料补全后再保存。")
      return
    }

    const age = Number(formData.age)
    const visibilityLimit = Number(formData.visibilityLimit)

    if (!Number.isFinite(age) || age < 18 || age > 60) {
      setError("年龄需填写 18 到 60 之间的数字。")
      return
    }

    if (!Number.isFinite(visibilityLimit) || visibilityLimit < 0 || visibilityLimit > 20) {
      setError("晴窗资料可见人数上限需在 0 到 20 之间。")
      return
    }

    setIsSaving(true)

    const result = await updateProfile({
      gender: formData.gender,
      age,
      appearance: formData.appearance,
      identity: formData.identity,
      location: formData.location.trim(),
      contact_visibility_limit: visibilityLimit,
    })

    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.push("/profile")
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/profile" className="inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回账号中心
            </Link>
            <div className="mt-3 flex items-center gap-3">
              <Badge variant="warning">资料设置</Badge>
              <Badge variant="outline">轻创 Qintra</Badge>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mt-4">完善站内资料</h1>
            <p className="text-gray-600 mt-3 leading-7 max-w-2xl">
              当前资料会同时服务校园模块和晴窗功能。晴窗后续若接入更完整的关系、解锁或支付能力，也会继续复用这套站内资料。
            </p>
          </div>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>基础资料</CardTitle>
              <CardDescription>先维护当前账号在轻创站内使用到的共用信息。</CardDescription>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">性别</label>
                      <Select value={formData.gender} onChange={(event) => setFormData((current) => ({ ...current, gender: event.target.value as Gender | "" }))}>
                        <option value="">请选择性别</option>
                        <option value="male">男生</option>
                        <option value="female">女生</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">年龄</label>
                      <Input
                        type="number"
                        min={18}
                        max={60}
                        placeholder="18 - 60"
                        value={formData.age}
                        onChange={(event) => setFormData((current) => ({ ...current, age: event.target.value }))}
                        icon={<UserRound className="w-4 h-4" />}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">外在印象</label>
                      <Select value={formData.appearance} onChange={(event) => setFormData((current) => ({ ...current, appearance: event.target.value as Appearance | "" }))}>
                        <option value="">请选择外在印象</option>
                        <option value="normal">自然</option>
                        <option value="good">出众</option>
                        <option value="stunning">非常亮眼</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">身份</label>
                      <Select value={formData.identity} onChange={(event) => setFormData((current) => ({ ...current, identity: event.target.value as Identity | "" }))}>
                        <option value="">请选择身份</option>
                        <option value="student">在校学生</option>
                        <option value="non_student">非学生</option>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">地区 / 校园信息</label>
                    <Input
                      placeholder="例如：西安 / 某大学雁塔校区"
                      value={formData.location}
                      onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))}
                      icon={<MapPin className="w-4 h-4" />}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">晴窗资料可见人数上限</label>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      placeholder="0 表示暂不开放"
                      value={formData.visibilityLimit}
                      onChange={(event) => setFormData((current) => ({ ...current, visibilityLimit: event.target.value }))}
                      icon={<Sparkles className="w-4 h-4" />}
                    />
                    <p className="text-xs text-gray-500">如暂时不准备开放晴窗资料展示，可以先填 0。后续若开放功能展示，再回这里调整。</p>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button type="submit" isLoading={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
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

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>资料会用到哪里</CardTitle>
              <CardDescription>这部分文案直接按现在的产品边界收口。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-600 leading-7">
              <div className="rounded-2xl bg-amber-50 p-4">
                校园服务会复用你的统一账号资料、角色和站内身份，不再重复注册或重复维护。
              </div>
              <div className="rounded-2xl bg-lime-50 p-4">
                晴窗是轻创内的一个功能，不再单独承担总站品牌；资料展示、后续解锁和支付都会走主站流程。
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                管理员站和普通用户端依旧分开，后台只负责订单、结算、角色和站内规则。
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  )
}

