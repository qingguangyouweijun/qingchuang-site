"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LockKeyhole, Mail, MailCheck, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/UI/Card'
import { Input } from '@/components/UI/Input'
import { requestEmailCode, verifyEmailCode } from '@/lib/actions/auth'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'

type EmailAuthVariant = 'login' | 'register' | 'admin'

const CONFIG: Record<EmailAuthVariant, {
  title: string
  description: string
  sendLabel: string
  verifyLabel: string
  helper: string
  scope: 'user' | 'admin'
  mode: 'login' | 'register'
}> = {
  login: {
    title: '邮箱验证码登录',
    description: '先完成真人验证，再向你的邮箱发送登录验证码。',
    sendLabel: '发送登录验证码',
    verifyLabel: '进入轻创',
    helper: '登录继续使用邮箱验证码，不再使用旧的算术题验证。',
    scope: 'user',
    mode: 'login',
  },
  register: {
    title: '邮箱注册轻创',
    description: '输入邮箱和密码，先通过真人验证，再发送注册验证码。验证码通过后会完成注册并进入轻创。',
    sendLabel: '发送注册验证码',
    verifyLabel: '完成注册并进入',
    helper: '注册页保留密码，只移除旧的算术题验证。',
    scope: 'user',
    mode: 'register',
  },
  admin: {
    title: '管理员邮箱登录',
    description: '管理员使用独立入口登录，普通用户端不展示后台入口。',
    sendLabel: '发送管理员验证码',
    verifyLabel: '进入管理员网站',
    helper: '这里只校验管理员邮箱角色，不在普通用户首页公开展示。',
    scope: 'admin',
    mode: 'login',
  },
}

export function EmailAuthPanel({ variant }: { variant: EmailAuthVariant }) {
  const router = useRouter()
  const config = CONFIG[variant]
  const isRegister = variant === 'register'
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [code, setCode] = React.useState('')
  const [turnstileToken, setTurnstileToken] = React.useState('')
  const [codeSent, setCodeSent] = React.useState(false)
  const [notice, setNotice] = React.useState('')
  const [error, setError] = React.useState('')
  const [isSending, setIsSending] = React.useState(false)
  const [isVerifying, setIsVerifying] = React.useState(false)

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault()
    setIsSending(true)
    setError('')
    setNotice('')

    const formData = new FormData()
    formData.set('email', email)
    formData.set('mode', config.mode)
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
    setNotice(result.message || '验证码已发送，请查收邮箱。')
    setIsSending(false)
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault()
    setIsVerifying(true)
    setError('')
    setNotice('')

    const formData = new FormData()
    formData.set('email', email)
    formData.set('code', code)
    formData.set('scope', config.scope)
    formData.set('mode', config.mode)

    const result = await verifyEmailCode(formData)

    if (result.error) {
      setError(result.error)
      setIsVerifying(false)
      return
    }

    if (result.redirectTo) {
      router.push(result.redirectTo)
      return
    }

    setIsVerifying(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute left-8 top-8">
        <Link href="/" className="flex items-center text-slate-600 transition-colors hover:text-emerald-700">
          <ArrowLeft className="mr-2 h-5 w-5" />
          返回首页
        </Link>
      </div>

      <Card className="w-full max-w-lg border-none shadow-[0_22px_54px_rgba(15,23,42,0.08)] animate-slide-up">
        <CardHeader className="space-y-4 pb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            {variant === 'admin' ? <Shield className="h-7 w-7" /> : variant === 'register' ? <Sparkles className="h-7 w-7" /> : <MailCheck className="h-7 w-7" />}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-slate-900">{config.title}</CardTitle>
            <CardDescription className="text-base leading-7 text-slate-600">
              {config.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

          <form onSubmit={handleSendCode} className="space-y-4">
            <Input
              type="email"
              placeholder="输入你的邮箱地址"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              icon={<Mail className="h-4 w-4" />}
              disabled={codeSent}
              required
            />

            {isRegister && (
              <>
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
              </>
            )}

            {!codeSent && <TurnstileWidget onVerify={setTurnstileToken} />}

            <div className="flex flex-col gap-3 sm:flex-row">
              {!codeSent ? (
                <Button type="submit" className="w-full" size="lg" isLoading={isSending}>
                  {config.sendLabel}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      setCodeSent(false)
                      setCode('')
                      setNotice('')
                      setError('')
                      setTurnstileToken('')
                    }}
                  >
                    更换邮箱
                  </Button>
                  <Button type="submit" variant="secondary" className="w-full" size="lg" isLoading={isSending}>
                    重新发送验证码
                  </Button>
                </>
              )}
            </div>
          </form>

          {codeSent && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="输入邮箱中的 6 位验证码"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                icon={<MailCheck className="h-4 w-4" />}
                required
              />
              <Button type="submit" className="w-full" size="lg" isLoading={isVerifying}>
                {config.verifyLabel}
              </Button>
            </form>
          )}

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {config.helper}
          </div>
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