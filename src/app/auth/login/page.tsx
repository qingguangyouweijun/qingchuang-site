"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, Smartphone } from "lucide-react"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/UI/Card"
import { Input } from "@/components/UI/Input"
import { signIn } from "@/lib/actions/auth"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [account, setAccount] = React.useState('')
  const [password, setPassword] = React.useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData()
    formData.set('account', account)
    formData.set('password', password)

    const result = await signIn(formData)
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    if (result.redirectTo) {
      router.push(result.redirectTo)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-200/30 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-200/30 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />

      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center text-gray-600 hover:text-rose-600 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回首页
        </Link>
      </div>

      <Card className="w-full max-w-md border-white/50 shadow-2xl animate-slide-up">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-400 to-rose-500 mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-orange-200">
            校
          </div>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-rose-600">
            普通用户登录
          </CardTitle>
          <CardDescription>登录后进入校园服务端；管理员请使用单独的管理员登录入口。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
            <Input
              type="tel"
              placeholder="请输入 11 位数字账号"
              maxLength={11}
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/\D/g, ''))}
              icon={<Smartphone className="w-4 h-4" />}
              required
            />
            <Input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              立即登录
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-gray-500 pb-8">
          <div>
            还没有账号？
            <Link href="/auth/register" className="text-rose-500 hover:text-rose-600 font-medium ml-1 underline decoration-2 underline-offset-4">
              立即注册
            </Link>
          </div>
          <div>
            管理员入口：
            <Link href="/admin/login" className="text-indigo-500 hover:text-indigo-600 font-medium ml-1">
              管理员登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
