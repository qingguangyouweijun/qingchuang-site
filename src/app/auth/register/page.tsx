"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/UI/Button"
import { Input } from "@/components/UI/Input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/UI/Card"
import { Smartphone, Lock, ArrowLeft, ShieldCheck, Calculator } from "lucide-react"
import { signUp } from "@/lib/actions/auth"

// 生成随机数学题
function generateMathQuestion() {
  const num1 = Math.floor(Math.random() * 10) + 1
  const num2 = Math.floor(Math.random() * 10) + 1
  const operators = ['+', '-', '×']
  const operator = operators[Math.floor(Math.random() * operators.length)]
  
  let answer: number
  switch (operator) {
    case '+':
      answer = num1 + num2
      break
    case '-':
      answer = num1 - num2
      break
    case '×':
      answer = num1 * num2
      break
    default:
      answer = num1 + num2
  }
  
  return { question: `${num1} ${operator} ${num2} = ?`, answer }
}

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [account, setAccount] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [agreed, setAgreed] = React.useState(false)
  const [mathQuestion, setMathQuestion] = React.useState(() => generateMathQuestion())
  const [mathAnswer, setMathAnswer] = React.useState("")

  const refreshMathQuestion = () => {
    setMathQuestion(generateMathQuestion())
    setMathAnswer("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证数学题
    if (parseInt(mathAnswer) !== mathQuestion.answer) {
      setError("验证码错误，请重新计算")
      refreshMathQuestion()
      return
    }

    if (!agreed) {
      setError("请先同意用户服务协议和隐私政策")
      return
    }

    setIsLoading(true)
    setError("")

    const formData = new FormData()
    formData.set("account", account)
    formData.set("password", password)
    formData.set("confirmPassword", confirmPassword)

    const result = await signUp(formData)
    
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
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-200/30 rounded-full blur-[100px] animate-float" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[100px] animate-float" style={{ animationDelay: "2s" }} />
      
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
            创建账号
          </CardTitle>
          <CardDescription>
            开启您的浪漫校园之旅
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
              <p className="text-xs text-gray-400 ml-1">账号为11位数字，可使用手机号</p>
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="设置密码 (6位以上字母+数字)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="确认密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<ShieldCheck className="w-4 h-4" />}
                required
                minLength={6}
              />
            </div>

            {/* 数学验证 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="flex-1 flex items-center space-x-2 bg-gray-100 rounded-xl px-4 py-3">
                  <Calculator className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">{mathQuestion.question}</span>
                </div>
                <button
                  type="button"
                  onClick={refreshMathQuestion}
                  className="px-3 py-3 text-gray-500 hover:text-rose-500 transition-colors"
                  title="换一题"
                >
                  🔄
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
            
            <div className="space-y-2">
              <label className="flex items-start space-x-2 cursor-pointer text-sm text-gray-500">
                <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-rose-500 focus:ring-rose-500" 
                />
                <span>
                  我已阅读并同意
                  <Link href="#" className="text-rose-500 hover:text-rose-600 ml-1">《用户服务协议》</Link>
                  和
                  <Link href="#" className="text-rose-500 hover:text-rose-600 ml-1">《隐私政策》</Link>
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              立即注册
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-gray-500 pb-8">
          <div>
            已有账号?{" "}
            <Link href="/auth/login" className="text-rose-500 hover:text-rose-600 font-medium font-bold underline decoration-2 underline-offset-4">
              直接登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
