"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/UI/Button"
import { Input } from "@/components/UI/Input"
import { Slider } from "@/components/UI/Slider"
import { Card, CardContent } from "@/components/UI/Card"
import { MainLayout } from "@/components/Layout/MainLayout"
import { ArrowLeft, ArrowRight, Check, User, School, MapPin, Sparkles, Smile, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateProfile } from "@/lib/actions/profile"
import type { Gender, Appearance, Identity } from "@/lib/types"

export default function ProfileSetupPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const totalSteps = 6
  
  const [formData, setFormData] = React.useState({
    gender: "" as Gender | "",
    age: 20,
    appearance: "" as Appearance | "",
    identity: "student" as Identity,
    school: "",
    location: "",
    visibilityLimit: 5
  })

  const canProceed = () => {
    switch(step) {
      case 1: return !!formData.gender
      case 2: return formData.age >= 18 && formData.age <= 60
      case 3: return !!formData.appearance
      case 4: return !!formData.identity
      case 5: return !!formData.location || !!formData.school
      case 6: return true
      default: return false
    }
  }

  const nextStep = async () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // 提交表单
      setIsLoading(true)
      setError("")
      
      const result = await updateProfile({
        gender: formData.gender as Gender,
        age: formData.age,
        appearance: formData.appearance as Appearance,
        identity: formData.identity,
        location: formData.school || formData.location,
        contact_visibility_limit: formData.visibilityLimit,
      })
      
      if (result.error) {
        setError(result.error)
        setIsLoading(false)
      } else {
        router.push("/draw")
      }
    }
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-center">首先，请问您的性别是？</h2>
            <div className="grid grid-cols-2 gap-4">
              {[{id: 'male', label: '男生'}, {id: 'female', label: '女生'}].map((g) => (
                <div
                  key={g.id}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center justify-center space-y-4 transition-all hover:scale-105",
                    formData.gender === g.id 
                      ? "border-rose-500 bg-rose-50 shadow-lg" 
                      : "border-gray-100 bg-white hover:border-rose-200"
                  )}
                  onClick={() => setFormData({...formData, gender: g.id as Gender})}
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center text-3xl",
                    g.id === 'male' ? "bg-blue-100 text-blue-500" : "bg-pink-100 text-pink-500"
                  )}>
                    {g.id === 'male' ? '♂' : '♀'}
                  </div>
                  <span className="font-medium text-gray-700">{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-center">您今年多大了？</h2>
            <div className="bg-white/50 p-8 rounded-3xl border border-white/60">
              <div className="text-center text-5xl font-bold text-rose-500 mb-8 font-mono">
                {formData.age} <span className="text-lg text-gray-400 font-sans">岁</span>
              </div>
              <Slider
                min={18}
                max={60}
                value={formData.age}
                onValueChange={(val) => setFormData({...formData, age: val})}
                className="mb-8"
              />
              <p className="text-center text-gray-400 text-sm">拖动滑块调整年龄 (18-60岁)</p>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-center">您如何评价自己的相貌？</h2>
            <p className="text-center text-gray-500 text-sm mb-4">诚实的评价有助于更精准的匹配哦</p>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'normal' as Appearance, label: '普通', icon: Smile, desc: '自信就是最美的' },
                { id: 'good' as Appearance, label: '出众', icon: Sparkles, desc: '经常被夸赞长得好看' },
                { id: 'stunning' as Appearance, label: '超级哇塞', icon: Star, desc: '回头率爆表，校花/校草级别' }
              ].map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-4 flex items-center space-x-4 transition-all",
                    formData.appearance === item.id 
                      ? "border-rose-500 bg-rose-50 ring-1 ring-rose-500" 
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  )}
                  onClick={() => setFormData({...formData, appearance: item.id})}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                    formData.appearance === item.id ? "bg-rose-200 text-rose-600" : "bg-gray-100 text-gray-500"
                  )}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.label}</h3>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  {formData.appearance === item.id && <Check className="w-5 h-5 text-rose-500" />}
                </div>
              ))}
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-center">您的当前身份？</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'student' as Identity, label: '在校学生', icon: School },
                { id: 'non_student' as Identity, label: '非学生', icon: User }
              ].map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "cursor-pointer rounded-2xl border-2 p-6 flex flex-col items-center justify-center space-y-4 transition-all hover:scale-105",
                    formData.identity === item.id 
                      ? "border-purple-500 bg-purple-50 shadow-lg" 
                      : "border-gray-100 bg-white hover:border-purple-200"
                  )}
                  onClick={() => setFormData({...formData, identity: item.id})}
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center text-3xl",
                    formData.identity === item.id ? "bg-purple-200 text-purple-600" : "bg-gray-100 text-gray-500"
                  )}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <span className="font-medium text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )
      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-center">您在哪里？</h2>
            <div className="space-y-4">
              {formData.identity === 'student' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">所在学校</label>
                  <Input 
                    placeholder="请输入您的学校名称" 
                    icon={<School className="w-4 h-4" />}
                    value={formData.school}
                    onChange={(e) => setFormData({...formData, school: e.target.value})}
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">所在城市</label>
                <Input 
                  placeholder="请输入所在城市" 
                  icon={<MapPin className="w-4 h-4" />}
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
          </div>
        )
      case 6:
        return (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-center">联系方式可见人数上限</h2>
            <p className="text-center text-gray-500 text-sm max-w-xs mx-auto">
              设置您的联系方式最多被多少人获取。
              <br/>设置为0则不投放，设置大于0可享受抽取优惠价！
            </p>
            <div className="bg-white/50 p-8 rounded-3xl border border-white/60">
              <div className="text-center text-5xl font-bold text-purple-600 mb-8 font-mono">
                {formData.visibilityLimit} <span className="text-lg text-gray-400 font-sans">人</span>
              </div>
              <Slider
                min={0}
                max={20}
                value={formData.visibilityLimit}
                onValueChange={(val) => setFormData({...formData, visibilityLimit: val})}
                className="mb-8"
              />
              <div className="flex justify-between text-xs text-gray-400 px-1">
                <span>0 (不投放)</span>
                <span>20 (最大)</span>
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <MainLayout>
      <div className="max-w-xl mx-auto py-10">
        <div className="mb-8">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-rose-400 to-purple-500 transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
            <span>开始</span>
            <span>步骤 {step}/{totalSteps}</span>
            <span>完成</span>
          </div>
        </div>

        <Card className="min-h-[400px] flex flex-col justify-between shadow-xl">
          <CardContent className="pt-8 flex-1 flex flex-col justify-center">
            {renderStep()}
          </CardContent>
          <div className="p-6 border-t border-gray-100 flex justify-between bg-white/50">
            <Button 
              variant="ghost" 
              onClick={prevStep} 
              disabled={step === 1}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> 上一步
            </Button>
            <Button 
              onClick={nextStep}
              disabled={!canProceed()}
              isLoading={isLoading}
              className="px-8 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700"
            >
              {step === totalSteps ? '完成设置' : '下一步'} 
              {step !== totalSteps && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
