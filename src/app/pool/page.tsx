"use client"

import * as React from "react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/UI/Card"
import { Input } from "@/components/UI/Input"
import { Toggle } from "@/components/UI/Toggle"
import { Slider } from "@/components/UI/Slider"
import { Badge } from "@/components/UI/Badge"
import { MessageCircle, Phone, Globe, Eye, Save, Shield, AlertCircle } from "lucide-react"
import { getMyContact, saveContact, toggleContactActive } from "@/lib/actions/contact"
import { getProfile, updateProfile } from "@/lib/actions/profile"

export default function PoolPage() {
  const [isInPool, setIsInPool] = React.useState(false)
  const [visibilityLimit, setVisibilityLimit] = React.useState(5)
  const [drawnCount, setDrawnCount] = React.useState(0)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [wechat, setWechat] = React.useState("")
  const [qq, setQq] = React.useState("")
  const [phone, setPhone] = React.useState("")

  React.useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    
    // 获取用户资料
    const { profile } = await getProfile()
    if (profile) {
      setVisibilityLimit(profile.contact_visibility_limit)
    }

    // 获取联系方式
    const { contact } = await getMyContact()
    if (contact) {
      setWechat(contact.wechat || "")
      setQq(contact.qq || "")
      setPhone(contact.phone || "")
      setIsInPool(contact.is_active)
      setDrawnCount(contact.drawn_count)
    }

    setIsLoading(false)
  }

  const handleTogglePool = async (checked: boolean) => {
    const result = await toggleContactActive(checked)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setIsInPool(checked)
      setMessage({ type: 'success', text: checked ? '已开启被抽取' : '已暂停被抽取' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSave = async () => {
    if (!wechat && !qq && !phone) {
      setMessage({ type: 'error', text: '请至少填写一种联系方式' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    // 保存联系方式
    const contactResult = await saveContact({ wechat, qq, phone })
    if (contactResult.error) {
      setMessage({ type: 'error', text: contactResult.error })
      setIsSaving(false)
      return
    }

    // 更新可见人数上限
    const profileResult = await updateProfile({
      contact_visibility_limit: visibilityLimit,
    } as any)
    
    if (profileResult.error) {
      setMessage({ type: 'error', text: profileResult.error })
    } else {
      setMessage({ type: 'success', text: '保存成功！' })
      // 如果设置了上限>0且有联系方式，自动开启
      if (visibilityLimit > 0) {
        setIsInPool(true)
      }
    }
    
    setIsSaving(false)
    setTimeout(() => setMessage(null), 3000)
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

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6 py-8 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">联系方式池</h1>
            <p className="text-gray-500">管理您的联系方式，掌控社交节奏</p>
          </div>
          <Badge 
            variant={isInPool ? "default" : "secondary"} 
            className="text-sm px-3 py-1"
          >
            {isInPool ? "● 在池中" : "○ 已下架"}
          </Badge>
        </div>

        {message && (
          <div className={`p-4 rounded-xl flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            <AlertCircle className="w-5 h-5 mr-2" />
            {message.text}
          </div>
        )}

        {/* Status Card */}
        <Card className="border-l-4 border-l-rose-500 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield className="w-32 h-32 rotate-12" />
          </div>
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-lg font-bold text-gray-800">开启被抽取</h3>
              <p className="text-sm text-gray-500">关闭后，其他用户将无法抽取到您的联系方式</p>
              {drawnCount > 0 && (
                <p className="text-xs text-rose-500 mt-1">已被抽取 {drawnCount}/{visibilityLimit} 次</p>
              )}
            </div>
            <Toggle checked={isInPool} onCheckedChange={handleTogglePool} />
          </CardContent>
        </Card>

        {/* Contact Info Form */}
        <Card>
          <CardHeader>
            <CardTitle>联系方式设置</CardTitle>
            <CardDescription>请至少填写一种联系方式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2 text-green-500" /> 微信 (WeChat)
                </label>
                <Input 
                  placeholder="请输入微信号" 
                  value={wechat}
                  onChange={(e) => setWechat(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-blue-500" /> QQ
                </label>
                <Input 
                  placeholder="请输入QQ号"
                  value={qq}
                  onChange={(e) => setQq(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-indigo-500" /> 手机号
                </label>
                <Input 
                  placeholder="请输入手机号" 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-gray-500" /> 可见人数上限
                </label>
                <span className="font-mono font-bold text-rose-500">{visibilityLimit}人</span>
              </div>
              <Slider 
                min={0}
                max={20} 
                value={visibilityLimit} 
                onValueChange={setVisibilityLimit}
              />
              <p className="text-xs text-gray-400">
                设置为0表示不投放联系方式。设置大于0可享受抽取优惠价！达到上限后自动下架。
              </p>
            </div>

            <Button className="w-full" onClick={handleSave} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" /> 保存设置
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
