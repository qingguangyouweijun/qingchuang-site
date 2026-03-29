"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Camera, Check, LogOut, Package, Pencil, SunMedium, Wallet, X } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/UI/Button"
import { Card, CardContent } from "@/components/UI/Card"
import { getProfile, updateNickname, uploadAvatar } from "@/lib/actions/profile"
import { signOut } from "@/lib/actions/auth"
import type { Profile } from "@/lib/types"

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [editNickname, setEditNickname] = React.useState("")
  const [isSavingNickname, setIsSavingNickname] = React.useState(false)
  const [editError, setEditError] = React.useState("")
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
    if (!file) return

    setIsUploadingAvatar(true)
    setEditError("")

    const formData = new FormData()
    formData.append("avatar", file)

    const result = await uploadAvatar(formData)
    if (result.error) {
      setEditError(result.error)
    } else if (result.avatarUrl) {
      setProfile((current) => (current ? { ...current, avatar_url: result.avatarUrl } : current))
    }

    setIsUploadingAvatar(false)
  }

  function openEditModal() {
    setEditNickname(profile?.nickname || "")
    setEditError("")
    setShowEditModal(true)
  }

  async function handleSaveNickname() {
    setIsSavingNickname(true)
    setEditError("")

    const result = await updateNickname(editNickname)
    if (result.error) {
      setEditError(result.error)
    } else {
      setProfile((current) => (current ? { ...current, nickname: editNickname.trim() } : current))
      setShowEditModal(false)
    }

    setIsSavingNickname(false)
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
              <h1 className="text-3xl font-bold text-slate-900">请先登录账号</h1>
              <p className="text-slate-600">登录后即可查看个人资料、校园钱包和订单中心。</p>
              <Link href="/auth/login">
                <Button>去邮箱登录</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const displayName = profile.nickname || "未设置名称"

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-20 animate-fade-in">
        <Card className="overflow-hidden border-none shadow-xl">
          <div className="h-32 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.35),transparent_30%),linear-gradient(120deg,#0f766e_0%,#10b981_45%,#38bdf8_100%)]" />
          <CardContent className="relative px-6 pb-8 pt-16 md:px-8">
            <div className="absolute left-1/2 top-[-40px] -translate-x-1/2 md:left-8 md:translate-x-0">
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
                  className="group relative h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg md:h-24 md:w-24"
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="头像" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-700">
                      <SunMedium className="h-9 w-9" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                    {isUploadingAvatar ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </div>
                </button>
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:pl-32">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">我的</div>
                <h1 className="mt-3 text-3xl font-bold text-slate-900">{displayName}</h1>
                <p className="mt-2 text-sm text-slate-500">这里只保留账号基础信息，以及校园钱包和订单中心入口。</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={openEditModal} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  编辑资料
                </Button>
                <Button variant="ghost" onClick={() => void handleLogout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <div className="rounded-2xl bg-amber-50 p-5">
              <div className="text-sm text-slate-500">个人邮箱</div>
              <div className="mt-2 break-all text-base font-semibold text-slate-900">{profile.account}</div>
            </div>
            <div className="rounded-2xl bg-sky-50 p-5">
              <div className="text-sm text-slate-500">名称</div>
              <div className="mt-2 text-base font-semibold text-slate-900">{displayName}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/profile/wallet" className="block">
            <div className="group rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                <Wallet className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">校园钱包</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                查看可结算余额、结算申请记录与余额流水。提交结算时需附带收款码。
              </p>
              <div className="mt-4 text-sm font-medium text-emerald-700 group-hover:underline">进入校园钱包</div>
            </div>
          </Link>

          <Link href="/profile/orders" className="block">
            <div className="group rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md">
                <Package className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">订单中心</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                统一查看快递代取和旧书交易的下单、接单、购买与卖出记录。
              </p>
              <div className="mt-4 text-sm font-medium text-amber-700 group-hover:underline">查看订单中心</div>
            </div>
          </Link>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-fade-in">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">编辑资料</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 flex flex-col items-center gap-3">
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="group relative h-20 w-20 overflow-hidden rounded-full border-4 border-slate-100 shadow"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="头像" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-600">
                    <SunMedium className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                  {isUploadingAvatar ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
              </button>
              <span className="text-xs text-slate-500">点击头像即可更换图片</span>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">名称</label>
              <input
                type="text"
                value={editNickname}
                onChange={(event) => setEditNickname(event.target.value)}
                maxLength={20}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="请输入名称，最多 20 个字"
              />
              {editError && <p className="text-xs text-red-500">{editError}</p>}
            </div>

            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowEditModal(false)}>
                取消
              </Button>
              <Button className="flex-1 gap-2" onClick={() => void handleSaveNickname()} disabled={isSavingNickname}>
                {isSavingNickname ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

