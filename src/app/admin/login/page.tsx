"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Lock, Shield, Smartphone } from "lucide-react"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/UI/Card"
import { Input } from "@/components/UI/Input"
import { signInAdmin } from "@/lib/actions/auth"

export default function AdminLoginPage() {
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

    const result = await signInAdmin(formData)
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.push('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.2),transparent_35%)]" />
      <div className="absolute top-8 left-8 z-10">
        <Link href="/" className="flex items-center text-slate-300 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回首页
        </Link>
      </div>

      <Card className="w-full max-w-md border border-slate-800 bg-slate-900/90 text-white shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-3 pb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Shield className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl text-white">管理员网站登录</CardTitle>
          <CardDescription className="text-slate-300">
            仅允许 `profiles.app_role = admin` 的账号进入后台。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-xl text-red-300 text-sm">{error}</div>}
            <Input
              type="tel"
              placeholder="管理员账号（11 位数字）"
              maxLength={11}
              value={account}
              onChange={(e) => setAccount(e.target.value.replace(/\D/g, ''))}
              icon={<Smartphone className="w-4 h-4" />}
              required
            />
            <Input
              type="password"
              placeholder="管理员密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              进入管理员网站
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-sm text-slate-400">
          <div>普通用户请前往 <Link href="/auth/login" className="text-orange-300 hover:text-orange-200">普通登录</Link></div>
        </CardFooter>
      </Card>
    </div>
  )
}
