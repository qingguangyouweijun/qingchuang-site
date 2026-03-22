"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calculator, Lock, ShieldCheck, Smartphone } from "lucide-react"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/UI/Card"
import { Input } from "@/components/UI/Input"
import { signUp } from "@/lib/actions/auth"

function generateMathQuestion() {
  const num1 = Math.floor(Math.random() * 10) + 1
  const num2 = Math.floor(Math.random() * 10) + 1
  const operators = ['+', '-', '×'] as const
  const operator = operators[Math.floor(Math.random() * operators.length)]

  let answer = num1 + num2
  if (operator === '-') {
    answer = num1 - num2
  }
  if (operator === '×') {
    answer = num1 * num2
  }

  return {
    question: `${num1} ${operator} ${num2} = ?`,
    answer,
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [account, setAccount] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [agreed, setAgreed] = React.useState(false)
  const [mathQuestion, setMathQuestion] = React.useState(() => generateMathQuestion())
  const [mathAnswer, setMathAnswer] = React.useState('')

  function refreshMathQuestion() {
    setMathQuestion(generateMathQuestion())
    setMathAnswer('')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (Number(mathAnswer) !== mathQuestion.answer) {
      setError('验证码错误，请重新计算。')
      refreshMathQuestion()
      return
    }

    if (!agreed) {
      setError('请先同意用户协议和隐私政策。')
      return
    }

    setIsLoading(true)
    setError('')

    const formData = new FormData()
    formData.set('account', account)
    formData.set('password', password)
    formData.set('confirmPassword', confirmPassword)

    const result = await signUp(formData)
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
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-200/30 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-rose-200/30 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />

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
            创建校园账号
          </CardTitle>
          <CardDescription>
            使用统一 11 位数字账号注册，注册后默认进入普通用户端。
          </CardDescription>
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
              placeholder="设置密码（至少 6 位，含字母和数字）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
              minLength={6}
            />
            <Input
              type="password"
              placeholder="确认密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<ShieldCheck className="w-4 h-4" />}
              required
              minLength={6}
            />

            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="flex-1 flex items-center space-x-2 bg-gray-100 rounded-xl px-4 py-3">
                  <Calculator className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">{mathQuestion.question}</span>
                </div>
                <button type="button" onClick={refreshMathQuestion} className="px-3 py-3 text-gray-500 hover:text-rose-500 transition-colors">
                  换一题
                </button>
              </div>
              <Input
                type="number"
                placeholder="请输入计算结果"
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                required
              />
            </div>

            <label className="flex items-start space-x-2 cursor-pointer text-sm text-gray-500">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 rounded border-gray-300 text-rose-500 focus:ring-rose-500" />
              <span>我已阅读并同意《用户协议》和《隐私政策》。</span>
            </label>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              立即注册
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-gray-500 pb-8">
          <div>
            已有账号？
            <Link href="/auth/login" className="text-rose-500 hover:text-rose-600 font-medium ml-1 underline decoration-2 underline-offset-4">
              直接登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
