"use client"

import * as React from "react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/UI/Button"
import { Card, CardContent } from "@/components/UI/Card"
import { Badge } from "@/components/UI/Badge"
import { Modal } from "@/components/UI/Modal"
import { Input } from "@/components/UI/Input"
import { Settings, CreditCard, Heart, Shield, LogOut, ChevronRight, Edit2, Camera } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getProfile, getProfileStats, uploadAvatar } from "@/lib/actions/profile"
import { getBalance, recharge } from "@/lib/actions/wallet"
import { signOut } from "@/lib/actions/auth"
import { GENDER_LABELS, APPEARANCE_LABELS, IDENTITY_LABELS } from "@/lib/types"
import type { Profile } from "@/lib/types"

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [stats, setStats] = React.useState({ liked: 0, matched: 0 })
  const [isLoading, setIsLoading] = React.useState(true)
  const [showRechargeModal, setShowRechargeModal] = React.useState(false)
  const [rechargeAmount, setRechargeAmount] = React.useState("")
  const [isRecharging, setIsRecharging] = React.useState(false)
  const [showQRCode, setShowQRCode] = React.useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    
    const { profile: profileData } = await getProfile()
    if (profileData) {
      setProfile(profileData)
    }

    const statsData = await getProfileStats()
    if (!statsData.error) {
      setStats({ liked: statsData.liked || 0, matched: statsData.matched || 0 })
    }

    setIsLoading(false)
  }

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount)
    if (isNaN(amount) || amount <= 0) {
      alert("请选择充值金额")
      return
    }
    // 显示对应金额的收款码
    setShowQRCode(true)
  }

  const handleConfirmPayment = async () => {
    const amount = parseFloat(rechargeAmount)
    setIsRecharging(true)
    const result = await recharge(amount)
    
    if (result.error) {
      alert(result.error)
    } else {
      setProfile(prev => prev ? { ...prev, balance: result.newBalance! } : null)
      setShowRechargeModal(false)
      setShowQRCode(false)
      setRechargeAmount("")
      alert("充值成功！")
    }
    setIsRecharging(false)
  }

  const getQRCodeImage = () => {
    const amount = parseFloat(rechargeAmount)
    if (amount === 0.66) return "/qr-066.jpg"
    if (amount === 1.66) return "/qr-166.jpg"
    if (amount === 2.66) return "/qr-266.jpg"
    return ""
  }

  const handleLogout = async () => {
    if (confirm("确定要退出登录吗？")) {
      await signOut()
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    const formData = new FormData()
    formData.append('avatar', file)

    const result = await uploadAvatar(formData)
    
    if (result.error) {
      alert(result.error)
    } else if (result.avatarUrl) {
      setProfile(prev => prev ? { ...prev, avatar_url: result.avatarUrl } : null)
    }
    setIsUploadingAvatar(false)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full" />
        </div>
      </MainLayout>
    )
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">请先登录</p>
          <Link href="/auth/login">
            <Button>去登录</Button>
          </Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
        {/* User Info Card */}
        <div className="relative">
          {/* Gradient Header */}
          <div className="h-36 bg-gradient-to-r from-rose-400 to-purple-500 rounded-3xl" />
          
          {/* Profile Card - overlapping the gradient */}
          <Card className="relative -mt-16 mx-4 border-none shadow-xl overflow-visible">
            <CardContent className="pt-20 pb-6 relative">
              {/* Avatar - positioned to overlap top of card */}
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
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-5xl">
                        {profile.gender === 'female' ? '👩' : '👨'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {isUploadingAvatar ? (
                        <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </button>
                  <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-3 border-white" />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-center md:items-start md:pl-36 mb-6 px-4">
                
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-2xl font-bold text-gray-800">{profile.nickname || profile.account}</h1>
                  <div className="flex items-center justify-center md:justify-start space-x-2 mt-2 text-gray-500 flex-wrap">
                    {profile.location && <span>{profile.location}</span>}
                    {profile.age && (
                      <>
                        <span>•</span>
                        <span>{profile.age}岁</span>
                      </>
                    )}
                    {profile.gender && (
                      <>
                        <span>•</span>
                        <span>{GENDER_LABELS[profile.gender]}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2 mt-3 flex-wrap gap-1">
                    {profile.is_verified && <Badge variant="secondary">已认证</Badge>}
                    {profile.appearance && <Badge variant="outline">{APPEARANCE_LABELS[profile.appearance]}</Badge>}
                    {profile.identity && <Badge variant="outline">{IDENTITY_LABELS[profile.identity]}</Badge>}
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <Link href="/profile/setup">
                    <Button variant="outline" className="rounded-full">
                      <Edit2 className="w-4 h-4 mr-2" /> 编辑资料
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.liked}</div>
                  <div className="text-sm text-gray-500">被喜欢</div>
                </div>
                <div className="text-center border-l border-r border-gray-100">
                  <div className="text-2xl font-bold text-gray-800">{stats.matched}</div>
                  <div className="text-sm text-gray-500">已匹配</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{profile.contact_visibility_limit}</div>
                  <div className="text-sm text-gray-500">可见上限</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Wallet Section */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-gray-400 text-sm font-medium">账户余额</h3>
                    <div className="text-4xl font-bold mt-2 font-mono">¥ {profile.balance.toFixed(2)}</div>
                  </div>
                  <CreditCard className="w-10 h-10 text-rose-400 opacity-80" />
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
                    onClick={() => setShowRechargeModal(true)}
                  >
                    充值
                  </Button>
                  <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">账单</Button>
                </div>
              </CardContent>
            </Card>

            <h3 className="font-bold text-lg text-gray-800 px-2">常用功能</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/history">
                <Card className="hover:bg-rose-50/50 cursor-pointer transition-colors border-none shadow-sm">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                      <Heart className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-gray-700">抽取记录</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/pool">
                <Card className="hover:bg-purple-50/50 cursor-pointer transition-colors border-none shadow-sm">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                      <Shield className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-gray-700">联系方式池</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Menu Section */}
          <div className="space-y-4">
            <Card className="border-none shadow-sm">
              <CardContent className="p-2">
                {[
                  { icon: Settings, label: "账号设置", href: "#" },
                  { icon: Shield, label: "实名认证", badge: profile.is_verified ? "已认证" : undefined, href: "#" },
                  { icon: Heart, label: "交友偏好", href: "#" },
                ].map((item, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
                      <span className="text-gray-700 font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">{item.badge}</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-2">
                <button 
                  className="w-full flex items-center space-x-3 p-4 hover:bg-red-50 rounded-xl transition-colors text-red-500 group"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">退出登录</span>
                </button>
              </CardContent>
            </Card>
            
            <p className="text-center text-xs text-gray-400 py-4">
              当前版本 v1.0.0
            </p>
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      <Modal isOpen={showRechargeModal} onClose={() => { setShowRechargeModal(false); setShowQRCode(false); setRechargeAmount(""); }} title="充值">
        <div className="space-y-6">
          {!showQRCode ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[0.66, 1.66, 2.66].map((amount) => (
                  <button
                    key={amount}
                    className={`p-4 rounded-xl border-2 font-bold transition-all ${
                      rechargeAmount === String(amount) 
                        ? 'border-rose-500 bg-rose-50 text-rose-600' 
                        : 'border-gray-200 hover:border-rose-300'
                    }`}
                    onClick={() => setRechargeAmount(String(amount))}
                  >
                    ¥{amount}
                  </button>
                ))}
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleRecharge}
                disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0}
              >
                立即充值 ¥{rechargeAmount || 0}
              </Button>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600 mb-2">推荐使用微信支付</p>
                <p className="text-2xl font-bold text-gray-800 mb-4">¥{rechargeAmount}</p>
                <div className="flex justify-center">
                  <img 
                    src={getQRCodeImage()} 
                    alt="收款码" 
                    className="w-64 h-64 object-contain rounded-lg border"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-4">请使用微信扫码支付</p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleConfirmPayment}
                  isLoading={isRecharging}
                >
                  我已支付完成
                </Button>
                <button 
                  className="w-full text-gray-500 text-sm hover:text-gray-700"
                  onClick={() => setShowQRCode(false)}
                >
                  返回选择金额
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </MainLayout>
  )
}
