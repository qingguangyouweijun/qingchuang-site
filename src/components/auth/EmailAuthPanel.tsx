"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LockKeyhole, Mail, MailCheck, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/UI/Card'
import { Input } from '@/components/UI/Input'
import { requestEmailCode, verifyEmailCode, loginWithPassword } from '@/lib/actions/auth'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'

type EmailAuthVariant = 'login' | 'register' | 'admin'

const CONFIG: Record<EmailAuthVariant, {
  title: string
  description: string
  scope: 'user' | 'admin'
  mode: 'login' | 'register'
}> = {
  login: {
    title: '邮箱密码登录',
    description: '输入你的邮箱和密码，完成安全验证后即可登录。',
    scope: 'user',
    mode: 'login',
  },
  register: {
    title: '邮箱注册轻创',
    description: '填写邮箱、设置密码并完成安全验证，获取验证码后即可直接完成注册。',
    scope: 'user',
    mode: 'register',
  },
  admin: {
    title: '管理员登录',
    description: '使用管理员邮箱和密码登录后台。',
    scope: 'admin',
    mode: 'login',
  },
}

export function EmailAuthPanel({ variant }: { variant: EmailAuthVariant }) {
  const router = useRouter()
  const config = CONFIG[variant]
  const isRegister = variant === 'register'
  const isLogin = !isRegister

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [code, setCode] = React.useState('')
  const [turnstileToken, setTurnstileToken] = React.useState('')
  const [codeSent, setCodeSent] = React.useState(false)
  const [notice, setNotice] = React.useState('')
  const [error, setError] = React.useState('')
  const [isSending, setIsSending] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // --- Login (password-based) ---
  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setNotice('')

    const formData = new FormData()
    formData.set('email', email)
    formData.set('password', password)
    formData.set('scope', config.scope)
    formData.set('turnstileToken', turnstileToken)

    const result = await loginWithPassword(formData)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    if ('redirectTo' in result && result.redirectTo) {
      router.push(result.redirectTo)
      return
    }

    setIsSubmitting(false)
  }

  // --- Register: send verification code ---
  async function handleSendCode() {
    setIsSending(true)
    setError('')
    setNotice('')

    const formData = new FormData()
    formData.set('email', email)
    formData.set('mode', 'register')
    formData.set('turnstileToken', turnstileToken)
    formData.set('password', password)
    formData.set('confirmPassword', confirmPassword)
    formData.set('resend', codeSent ? 'true' : 'false')

    const result = await requestEmailCode(formData)

    if (result.error) {
      setError(result.error)
      setIsSending(false)
      return
    }

    setCodeSent(true)
    setNotice(result.message || '验证码已发送，请查收邮箱并输入 6 位验证码。')
    setIsSending(false)
  }

  // --- Register: verify code and create account ---
  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setNotice('')

    const formData = new FormData()
    formData.set('email', email)
    formData.set('code', code)
    formData.set('scope', config.scope)
    formData.set('mode', 'register')
    formData.set('password', password)
    formData.set('confirmPassword', confirmPassword)

    const result = await verifyEmailCode(formData)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    if ('redirectTo' in result && result.redirectTo) {
      router.push(result.redirectTo)
      return
    }

    setIsSubmitting(false)
  }

  function handleResetEmail() {
    setCodeSent(false)
    setCode('')
    setNotice('')
    setError('')
    setTurnstileToken('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="absolute left-6 top-6 sm:left-8 sm:top-8">
        <Link href="/" className="flex items-center text-sm text-slate-600 transition-colors hover:text-emerald-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Link>
      </div>

      <Card className="w-full max-w-xl border-none shadow-[0_24px_60px_rgba(15,23,42,0.08)] animate-slide-up">
        <CardHeader className="space-y-4 pb-6 text-center sm:pb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm">
            {variant === 'admin' ? <Shield className="h-7 w-7" /> : isRegister ? <Sparkles className="h-7 w-7" /> : <MailCheck className="h-7 w-7" />}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-slate-900">{config.title}</CardTitle>
            <CardDescription className="mx-auto max-w-lg text-base leading-7 text-slate-600">
              {config.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

          {isLogin ? (
            // --- Password login form ---
            <form onSubmit={handleLogin} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="space-y-5">
                <div className="space-y-4">
                  <Input
                    type="email"
                    placeholder="输入你的邮箱地址"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="输入密码"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    icon={<LockKeyhole className="h-4 w-4" />}
                    required
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <TurnstileWidget onVerify={setTurnstileToken} />
                </div>

                <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                  {variant === 'admin' ? '进入管理员网站' : '登录轻创'}
                </Button>
              </div>
            </form>
          ) : (
            // --- Register form (email code) ---
            <form onSubmit={handleVerifyCode} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="space-y-5">
                <div className="space-y-4">
                  <Input
                    type="email"
                    placeholder="输入你的邮箱地址"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    disabled={codeSent}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="设置登录密码"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    icon={<LockKeyhole className="h-4 w-4" />}
                    disabled={codeSent}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="再次输入密码"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    icon={<LockKeyhole className="h-4 w-4" />}
                    disabled={codeSent}
                    required
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <TurnstileWidget onVerify={setTurnstileToken} />
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="输入 6 位验证码"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    icon={<MailCheck className="h-4 w-4" />}
                    required
                  />
                  <Button type="button" size="lg" variant={codeSent ? 'secondary' : 'outline'} onClick={handleSendCode} isLoading={isSending}>
                    {codeSent ? '重新发送验证码' : '发送注册验证码'}
                  </Button>
                </div>

                {codeSent && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-700">
                    {`验证码已发送到 ${email || '你的邮箱'}，输入验证码后即可继续。`}
                  </div>
                )}

                {codeSent && (
                  <Button type="button" variant="outline" className="w-full" size="lg" onClick={handleResetEmail}>
                    更换邮箱
                  </Button>
                )}

                <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting} disabled={!codeSent || code.length !== 6}>
                  完成注册并进入
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-slate-500">
            {isRegister
              ? '注册完成后即可继续使用校园服务、晴窗和 AI 陪伴。'
              : variant === 'admin'
                ? '请使用管理员邮箱继续。'
                : '登录后即可使用校园服务、晴窗和 AI 陪伴。'}
          </p>
        </CardContent>

        <CardFooter className="pb-8 text-center text-sm text-slate-500">
          {variant === 'login' && (
            <div className="w-full">
              还没有账号？
              <Link href="/auth/register" className="ml-1 font-medium text-emerald-700 hover:text-emerald-800">
                去邮箱注册
              </Link>
            </div>
          )}
          {variant === 'register' && (
            <div className="w-full">
              已有账号？
              <Link href="/auth/login" className="ml-1 font-medium text-emerald-700 hover:text-emerald-800">
                去邮箱登录
              </Link>
            </div>
          )}
          {variant === 'admin' && (
            <div className="w-full">
              普通用户请前往
              <Link href="/auth/login" className="ml-1 font-medium text-emerald-700 hover:text-emerald-800">
                邮箱登录
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
