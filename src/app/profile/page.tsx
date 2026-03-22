"use client"

import * as React from "react"
import Link from "next/link"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card"
import { Badge } from "@/components/UI/Badge"
import { Camera, Bot, HeartHandshake, Package, Wallet, Shield, LogOut, SunMedium } from "lucide-react"
import { useRouter } from "next/navigation"
import { getProfile, uploadAvatar } from "@/lib/actions/profile"
import { GENDER_LABELS, APPEARANCE_LABELS, IDENTITY_LABELS } from "@/lib/types"
import type { Profile } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

function formatDate(input: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
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
    formData.append('avatar', file)

    const result = await uploadAvatar(formData)
    if (!result.error && result.avatarUrl) {
      setProfile((current) => (current ? { ...current, avatar_url: result.avatarUrl } : current))
    }
    setIsUploadingAvatar(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
        </div>
      </MainLayout>
    )
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-20">
          <Card>
            <CardContent className="p-10 text-center space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">请先登录账号中心</h1>
              <p className="text-gray-600">登录后可查看个人资料，并进入轻创的校园服务、晴窗和 AI 陪伴模块。</p>
              <Link href="/auth/login"><Button>去登录</Button></Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
        <Card className="border-none shadow-xl overflow-hidden">
          <div className="h-36 bg-gradient-to-r from-amber-400 via-emerald-500 to-sky-500" />
          <CardContent className="relative pt-20 pb-8 px-6 md:px-8">
            <div className="absolute -top-12 left-1/2 md:left-8 transform -translate-x-1/2 md:translate-x-0">
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
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden group relative"
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-amber-50 flex items-center justify-center text-4xl text-amber-600">
                      <SunMedium className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isUploadingAvatar ? (
                      <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                </button>
                <div className="absolute bottom-1 right-1 bg-emerald-500 w-5 h-5 rounded-full border-3 border-white" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start md:pl-36 gap-6">
              <div className="text-center md:text-left flex-1">
                <Badge variant="secondary">个人中心</Badge>
                <h1 className="text-3xl font-bold text-gray-900 mt-3">{profile.nickname || profile.account}</h1>
                <p className="text-gray-500 mt-2">轻创 Qintra</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                  {profile.gender && <Badge variant="outline">{GENDER_LABELS[profile.gender]}</Badge>}
                  {profile.appearance && <Badge variant="outline">{APPEARANCE_LABELS[profile.appearance]}</Badge>}
                  {profile.identity && <Badge variant="outline">{IDENTITY_LABELS[profile.identity]}</Badge>}
                  {profile.is_verified && <Badge variant="success">已认证</Badge>}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/profile/setup"><Button variant="outline">编辑资料</Button></Link>
                <Button variant="ghost" onClick={() => void handleLogout()}><LogOut className="w-4 h-4 mr-2" />退出登录</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>资料概览</CardTitle>
              <CardDescription>当前资料会在轻创各功能中复用，站内能力统一在主站完成。</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="rounded-2xl bg-amber-50 p-4">
                <div className="text-gray-500">邮箱</div>
                <div className="text-lg font-semibold text-gray-900 mt-2">{profile.account}</div>
              </div>
              <div className="rounded-2xl bg-sky-50 p-4">
                <div className="text-gray-500">昵称</div>
                <div className="text-lg font-semibold text-gray-900 mt-2">{profile.nickname || '未设置'}</div>
              </div>
              <div className="rounded-2xl bg-lime-50 p-4">
                <div className="text-gray-500">地区</div>
                <div className="text-lg font-semibold text-gray-900 mt-2">{profile.location || '未设置'}</div>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="text-gray-500">注册时间</div>
                <div className="text-lg font-semibold text-gray-900 mt-2">{formatDate(profile.created_at)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>常用入口</CardTitle>
              <CardDescription>从这里进入当前主要模块。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/campus" className="block rounded-2xl bg-amber-50 px-4 py-4 hover:bg-amber-100 transition-colors">
                <div className="flex items-center gap-3 text-gray-900 font-semibold"><Package className="w-5 h-5 text-amber-600" />校园服务</div>
                <div className="text-sm text-gray-600 mt-2">快递代取、旧书广场、订单中心。</div>
              </Link>
              <Link href="/draw" className="block rounded-2xl bg-rose-50 px-4 py-4 hover:bg-rose-100 transition-colors">
                <div className="flex items-center gap-3 text-gray-900 font-semibold"><HeartHandshake className="w-5 h-5 text-rose-500" />晴窗</div>
                <div className="text-sm text-gray-600 mt-2">轻创内的同频社交功能，资料和后续支付能力统一接入主站。</div>
              </Link>
              <Link href="/campus/wallet" className="block rounded-2xl bg-emerald-50 px-4 py-4 hover:bg-emerald-100 transition-colors">
                <div className="flex items-center gap-3 text-gray-900 font-semibold"><Wallet className="w-5 h-5 text-emerald-600" />校园钱包</div>
                <div className="text-sm text-gray-600 mt-2">查看校园余额、账本和结算申请。</div>
              </Link>
              <Link href="/ai-companion" className="block rounded-2xl bg-sky-50 px-4 py-4 hover:bg-sky-100 transition-colors">
                <div className="flex items-center gap-3 text-gray-900 font-semibold"><Bot className="w-5 h-5 text-sky-600" />AI 陪伴</div>
                <div className="text-sm text-gray-600 mt-2">创建角色、开启聊天、查看长期记忆。</div>
              </Link>
              {profile.app_role === 'admin' && (
                <Link href="/admin" className="block rounded-2xl bg-cyan-50 px-4 py-4 hover:bg-cyan-100 transition-colors">
                  <div className="flex items-center gap-3 text-gray-900 font-semibold"><Shield className="w-5 h-5 text-cyan-600" />管理员网站</div>
                  <div className="text-sm text-gray-600 mt-2">处理订单、结算申请和用户角色。</div>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

