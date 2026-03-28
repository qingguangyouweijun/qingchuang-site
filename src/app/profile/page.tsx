"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card"
import { Badge } from "@/components/UI/Badge"
import {
  Bot,
  Camera,
  HeartHandshake,
  LogOut,
  Package,
  Shield,
  Sparkles,
  SunMedium,
  Wallet,
} from "lucide-react"
import { getProfile, uploadAvatar } from "@/lib/actions/profile"
import { signOut } from "@/lib/actions/auth"
import { APPEARANCE_LABELS, GENDER_LABELS, IDENTITY_LABELS } from "@/lib/types"
import type { Profile } from "@/lib/types"

function formatDate(input: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(input))
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    const { profile: profileData } = await getProfile()
    setProfile(profileData || null)
    setIsLoading(false)
  }

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsUploadingAvatar(true)
    const formData = new FormData()
    formData.append("avatar", file)

    const result = await uploadAvatar(formData)
    if (!result.error && result.avatarUrl) {
      setProfile((current) => (current ? { ...current, avatar_url: result.avatarUrl } : current))
    }
    setIsUploadingAvatar(false)
  }

  async function handleLogout() {
    await signOut()
    router.push("/")
    router.refresh()
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

  if (!profile) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl py-20">
          <Card>
            <CardContent className="space-y-4 p-10 text-center">
              <h1 className="text-3xl font-bold text-slate-900">请先登录账号中心</h1>
              <p className="text-slate-600">
                登录后即可查看个人资料，并继续使用校园服务、晴窗与 AI 陪伴功能。
              </p>
              <Link href="/auth/login">
                <Button>去邮箱登录</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto space-y-8 pb-20 animate-fade-in max-w-5xl">
        <Card className="overflow-hidden border-none shadow-xl">
          <div className="h-36 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.35),transparent_30%),linear-gradient(120deg,#0f766e_0%,#10b981_45%,#38bdf8_100%)]" />
          <CardContent className="relative px-6 pb-8 pt-20 md:px-8">
            <div className="absolute left-1/2 top-[-48px] -translate-x-1/2 md:left-8 md:translate-x-0">
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="group relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg md:h-28 md:w-28"
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="头像" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-700">
                      <SunMedium className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                    {isUploadingAvatar ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                </button>
                <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-500" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:pl-36">
              <div className="flex-1 text-center md:text-left">
                <Badge variant="secondary">账号中心</Badge>
                <h1 className="mt-3 text-3xl font-bold text-slate-900">{profile.nickname || profile.account}</h1>
                <p className="mt-2 text-slate-500">轻创 Qintra</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  {profile.gender && <Badge variant="outline">{GENDER_LABELS[profile.gender]}</Badge>}
                  {profile.appearance && <Badge variant="outline">{APPEARANCE_LABELS[profile.appearance]}</Badge>}
                  {profile.identity && <Badge variant="outline">{IDENTITY_LABELS[profile.identity]}</Badge>}
                  {profile.is_verified && <Badge variant="success">已认证</Badge>}
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/profile/setup">
                  <Button variant="outline">编辑资料</Button>
                </Link>
                <Button variant="ghost" onClick={() => void handleLogout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>资料概览</CardTitle>
              <CardDescription>当前资料会在轻创各功能中复用，站内能力统一在主站完成配置。</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 text-sm text-slate-600 md:grid-cols-2">
              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="text-slate-500">邮箱</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{profile.account}</div>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                <div className="text-slate-500">昵称</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{profile.nickname || "未设置"}</div>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="text-slate-500">晴窗匹配范围</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">本校异性朋友</div>
              </div>
              <div className="rounded-2xl bg-lime-50 p-4">
                <div className="text-slate-500">注册时间</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{formatDate(profile.created_at)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>常用入口</CardTitle>
              <CardDescription>从这里进入当前主站里的主要模块。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/campus" className="block rounded-2xl bg-amber-50 px-4 py-4 transition-colors hover:bg-amber-100">
                <div className="flex items-center gap-3 font-semibold text-slate-900">
                  <Package className="h-5 w-5 text-amber-600" />
                  校园服务
                </div>
                <div className="mt-2 text-sm text-slate-600">快递代取、旧书广场与订单中心都在这里完成。</div>
              </Link>
              <Link href="/draw" className="block rounded-2xl bg-rose-50 px-4 py-4 transition-colors hover:bg-rose-100">
                <div className="flex items-center gap-3 font-semibold text-slate-900">
                  <HeartHandshake className="h-5 w-5 text-rose-500" />
                  晴窗
                </div>
                <div className="mt-2 text-sm text-slate-600">不看外表，只看真实资料与回响，进入一场更克制的浪漫盲盒。</div>
              </Link>
              <Link href="/campus/wallet" className="block rounded-2xl bg-emerald-50 px-4 py-4 transition-colors hover:bg-emerald-100">
                <div className="flex items-center gap-3 font-semibold text-slate-900">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                  校园钱包
                </div>
                <div className="mt-2 text-sm text-slate-600">查看校园余额、账本与结算申请。</div>
              </Link>
              <Link href="/ai-companion" className="block rounded-2xl bg-sky-50 px-4 py-4 transition-colors hover:bg-sky-100">
                <div className="flex items-center gap-3 font-semibold text-slate-900">
                  <Bot className="h-5 w-5 text-sky-600" />
                  AI 陪伴
                </div>
                <div className="mt-2 text-sm text-slate-600">创建角色、开启聊天，并查看长期记忆。</div>
              </Link>
              {profile.app_role === "admin" && (
                <Link href="/admin" className="block rounded-2xl bg-cyan-50 px-4 py-4 transition-colors hover:bg-cyan-100">
                  <div className="flex items-center gap-3 font-semibold text-slate-900">
                    <Shield className="h-5 w-5 text-cyan-600" />
                    管理员网站
                  </div>
                  <div className="mt-2 text-sm text-slate-600">处理订单、结算申请与用户角色。</div>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-3">
            <div className="rounded-2xl bg-rose-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">晴窗盲盒</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                我们不开放外貌与校区筛选，只保留最基础的真实资料，让每一次抽取更像一场克制的缘分实验。
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">更轻的表达</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                当你完善昵称、联系方式与基础偏好后，系统会把它们复用到整个轻创体验里，不需要重复维护。
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">主站统一管理</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                校园服务、晴窗与钱包能力共用同一份资料，你只需要维护一次，就能顺畅进入不同功能。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
