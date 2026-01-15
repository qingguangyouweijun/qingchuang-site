"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/UI/Button"
import { Input } from "@/components/UI/Input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/UI/Card"
import { Smartphone, Lock, ArrowLeft } from "lucide-react"
import { signIn } from "@/lib/actions/auth"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [account, setAccount] = React.useState("")
  const [password, setPassword] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData()
    formData.set("account", account)
    formData.set("password", password)

    const result = await signIn(formData)
    
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else if (result.success && result.redirectTo) {
      router.push(result.redirectTo)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-rose-200/30 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
      
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center text-gray-600 hover:text-rose-600 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回首页
        </Link>
      </div>

      <Card className="w-full max-w-md border-white/50 shadow-2xl animate-slide-up">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-rose-200">
            晴
          </div>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-purple-600">
            欢迎回来
          </CardTitle>
          <CardDescription>
            登录您的晴窗葳蕤账号
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Input
                type="tel"
                placeholder="请输入11位数字账号"
                maxLength={11}
                value={account}
                onChange={(e) => setAccount(e.target.value.replace(/\D/g, ""))}
                icon={<Smartphone className="w-4 h-4" />}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-rose-500 focus:ring-rose-500" />
                <span className="text-gray-500">记住我</span>
              </label>
              <Link href="#" className="text-rose-500 hover:text-rose-600 font-medium">
                忘记密码?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              立即登录
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-gray-500 pb-8">
          <div>
            还没有账号?{" "}
            <Link href="/auth/register" className="text-rose-500 hover:text-rose-600 font-medium font-bold underline decoration-2 underline-offset-4">
              立即注册
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
