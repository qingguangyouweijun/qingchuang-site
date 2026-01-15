"use client"

import * as React from "react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/UI/Button"
import { Card, CardContent } from "@/components/UI/Card"
import { Select } from "@/components/UI/Select"
import { Modal } from "@/components/UI/Modal"
import { Badge } from "@/components/UI/Badge"
import { Sparkles, Filter, Lock, Gift, Zap, Crown, Copy, Phone, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { performDraw } from "@/lib/actions/draw"
import { getProfile } from "@/lib/actions/profile"
import { PRICING, APPEARANCE_LABELS, IDENTITY_LABELS, GENDER_LABELS } from "@/lib/types"
import type { DrawTier, DrawFilters, DrawResult, Gender, Appearance, Identity } from "@/lib/types"

export default function DrawPage() {
  const [selectedTier, setSelectedTier] = React.useState<DrawTier>('basic')
  const [isDrawing, setIsDrawing] = React.useState(false)
  const [showResult, setShowResult] = React.useState(false)
  const [result, setResult] = React.useState<DrawResult | null>(null)
  const [error, setError] = React.useState("")
  const [balance, setBalance] = React.useState<number>(0)
  const [hasDiscount, setHasDiscount] = React.useState(false)
  
  // Filters
  const [filterGender, setFilterGender] = React.useState<Gender | "">("")
  const [filterAgeRange, setFilterAgeRange] = React.useState<string>("")
  const [filterIdentity, setFilterIdentity] = React.useState<Identity | "">("")
  const [filterAppearance, setFilterAppearance] = React.useState<Appearance | "">("")

  React.useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { profile } = await getProfile()
    if (profile) {
      setBalance(profile.balance)
      setHasDiscount(profile.contact_visibility_limit > 0)
    }
  }

  const tiers = [
    {
      id: 'basic' as DrawTier,
      name: '单次邂逅',
      price: hasDiscount ? PRICING.basic.discount : PRICING.basic.normal,
      originalPrice: PRICING.basic.normal,
      icon: Gift,
      color: 'blue',
      features: ['随机匹配', '基础筛选'],
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      id: 'advanced' as DrawTier,
      name: '相貌优选',
      price: hasDiscount ? PRICING.advanced.discount : PRICING.advanced.normal,
      originalPrice: PRICING.advanced.normal,
      icon: Sparkles,
      color: 'rose',
      features: ['优先匹配颜值高', '解锁相貌筛选', '地域精准筛选'],
      gradient: 'from-rose-400 to-pink-500'
    },
    {
      id: 'vip' as DrawTier,
      name: '超级VIP',
      price: hasDiscount ? PRICING.vip.discount : PRICING.vip.normal,
      originalPrice: PRICING.vip.normal,
      icon: Crown,
      color: 'amber',
      features: ['AI智能推荐', '查看详细资料', '解锁全部筛选', 'VIP专属标识'],
      gradient: 'from-amber-400 to-orange-500'
    }
  ]

  const currentTier = tiers.find(t => t.id === selectedTier)!

  const handleDraw = async () => {
    setIsDrawing(true)
    setError("")

    // Parse age range
    let ageMin: number | undefined
    let ageMax: number | undefined
    if (filterAgeRange) {
      const [min, max] = filterAgeRange.split('-').map(Number)
      ageMin = min
      ageMax = max
    }

    const filters: DrawFilters = {
      gender: filterGender || undefined,
      ageMin,
      ageMax,
      identity: filterIdentity || undefined,
      appearance: (selectedTier !== 'basic' && filterAppearance) ? filterAppearance : undefined,
    }

    const drawResult = await performDraw(selectedTier, filters)
    
    setIsDrawing(false)
    
    if (drawResult.success) {
      setResult(drawResult)
      setShowResult(true)
      if (drawResult.new_balance !== undefined) {
        setBalance(drawResult.new_balance)
      }
    } else {
      setError(drawResult.error || "抽取失败")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">缘分抽取</h1>
          <p className="text-gray-500">选择您的心动方案，开启浪漫邂逅</p>
          <p className="text-sm text-rose-500">当前余额: ¥{balance.toFixed(2)}</p>
          {hasDiscount && (
            <Badge variant="secondary" className="ml-2">已投放联系方式，享优惠价</Badge>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={cn(
                "relative cursor-pointer rounded-3xl border-2 p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden group",
                selectedTier === tier.id 
                  ? "border-rose-400 bg-white shadow-xl" 
                  : "border-transparent bg-white/60 hover:bg-white border-white/50"
              )}
            >
              {selectedTier === tier.id && (
                <div className={`absolute top-0 right-0 px-3 py-1 bg-gradient-to-r ${tier.gradient} text-white text-xs font-bold rounded-bl-xl`}>
                  已选择
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                <tier.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-1">{tier.name}</h3>
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-3xl font-bold text-rose-600">¥{tier.price.toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">¥{tier.originalPrice.toFixed(2)}</span>
                )}
              </div>
              
              <ul className="space-y-2 mb-4">
                {tier.features.map((feature, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-none bg-white/40 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-800">筛选条件</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Select value={filterGender} onChange={(e) => setFilterGender(e.target.value as Gender | "")}>
                <option value="">性别: 不限</option>
                <option value="male">男生</option>
                <option value="female">女生</option>
              </Select>
              
              <Select value={filterAgeRange} onChange={(e) => setFilterAgeRange(e.target.value)}>
                <option value="">年龄: 不限</option>
                <option value="18-20">18-20岁</option>
                <option value="21-23">21-23岁</option>
                <option value="24-26">24-26岁</option>
                <option value="27-60">27岁以上</option>
              </Select>
              
              <Select value={filterIdentity} onChange={(e) => setFilterIdentity(e.target.value as Identity | "")}>
                <option value="">身份: 不限</option>
                <option value="student">在校学生</option>
                <option value="non_student">非学生</option>
              </Select>
              
              <div className="relative">
                <Select 
                  disabled={selectedTier === 'basic'} 
                  className={selectedTier === 'basic' ? "opacity-50" : ""}
                  value={filterAppearance}
                  onChange={(e) => setFilterAppearance(e.target.value as Appearance | "")}
                >
                  <option value="">相貌: 不限</option>
                  <option value="normal">普通</option>
                  <option value="good">出众</option>
                  <option value="stunning">超级哇塞</option>
                </Select>
                {selectedTier === 'basic' && (
                  <Lock className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Draw Button */}
        <div className="flex flex-col items-center pt-8 pb-20 space-y-4">
          <p className="text-gray-500">
            本次抽取需支付: <span className="text-rose-600 font-bold text-xl">¥{currentTier.price.toFixed(2)}</span>
          </p>
          <Button
            size="lg"
            className="w-full md:w-auto px-20 py-8 text-xl rounded-full shadow-rose-400/50 shadow-2xl animate-pulse-glow"
            onClick={handleDraw}
            isLoading={isDrawing}
            disabled={balance < currentTier.price}
          >
            {isDrawing ? "正在寻找有缘人..." : balance < currentTier.price ? "余额不足" : "立即抽取"}
            {!isDrawing && balance >= currentTier.price && <Zap className="ml-2 w-6 h-6 fill-current" />}
          </Button>
          {balance < currentTier.price && (
            <p className="text-red-500 text-sm">余额不足，请先充值</p>
          )}
        </div>
      </div>

      {/* Result Modal */}
      <Modal isOpen={showResult} onClose={() => setShowResult(false)} title="匹配成功！">
        {result?.target && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-300 to-purple-300 p-1">
                <div className="w-full h-full rounded-full bg-white overflow-hidden">
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl">
                    {result.target.gender === 'female' ? '👩‍🎓' : '👨‍🎓'}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-white" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {result.target.nickname || '神秘用户'}
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                {result.target.location && <Badge variant="secondary">{result.target.location}</Badge>}
                <Badge variant="outline">{result.target.age}岁</Badge>
                <Badge variant="default">{APPEARANCE_LABELS[result.target.appearance]}</Badge>
                <Badge variant="outline">{IDENTITY_LABELS[result.target.identity]}</Badge>
              </div>
              {result.target.bio && (
                <p className="text-gray-500 text-sm mt-3 max-w-xs">{result.target.bio}</p>
              )}
            </div>
            
            <div className="w-full bg-gray-50 rounded-2xl p-4 text-left space-y-3">
              {result.contact?.wechat && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                    <span>微信号</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-mono font-medium mr-2">{result.contact.wechat}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(result.contact!.wechat!)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              {result.contact?.qq && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <MessageCircle className="w-4 h-4 mr-2 text-blue-500" />
                    <span>QQ号</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-mono font-medium mr-2">{result.contact.qq}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(result.contact!.qq!)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              {result.contact?.phone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-rose-500" />
                    <span>手机号</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-mono font-medium mr-2">{result.contact.phone}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(result.contact!.phone!)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500">
              请礼貌打招呼，说明来自<span className="text-rose-500">晴窗葳蕤</span>哦~
            </p>
            
            <Button className="w-full" onClick={() => setShowResult(false)}>
              我知道了
            </Button>
          </div>
        )}
      </Modal>
    </MainLayout>
  )
}
