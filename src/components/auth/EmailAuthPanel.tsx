"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, MailCheck, Shield, Sparkles } from 'lucide-react'
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
  accentClass: string
}> = {
  login: {
    title: '邮箱验证码登录',
    description: '输入你的邮箱地址，收取验证码后即可登录轻创。',
    sendLabel: '发送登录验证码',
    verifyLabel: '登录轻创',
    helper: '验证码会发送到你当前配置的邮箱通道，可直接用 Brevo / Supabase SMTP 发信。',
    scope: 'user',
    mode: 'login',
    accentClass: 'from-emerald-500 to-sky-500',
  },
  register: {
    title: '邮箱注册轻创',
    description: '只需邮箱地址和验证码，验证成功后会自动创建账号并进入轻创。',
    sendLabel: '发送注册验证码',
    verifyLabel: '完成注册并进入',
    helper: '我们不再要求 11 位数字账号，也不再使用算术题验证码。',
    scope: 'user',
    mode: 'register',
    accentClass: 'from-sky-500 to-emerald-500',
  },
  admin: {
    title: '管理员邮箱登录',
    description: '管理员与普通用户入口分离，请使用管理员邮箱验证码登录。',
    sendLabel: '发送管理员验证码',
    verifyLabel: '进入管理员网站',
    helper: '验证通过后会检查管理员角色，普通用户邮箱无法进入后台。',
    scope: 'admin',
    mode: 'login',
    accentClass: 'from-sky-600 to-indigo-600',
  },
}

export function EmailAuthPanel({ variant }: { variant: EmailAuthVariant }) {
  const router = useRouter()
  const config = CONFIG[variant]
  const [email, setEmail] = React.useState('')
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[46%] h-[46%] bg-emerald-200/40 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[46%] h-[46%] bg-sky-200/35 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />

      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center text-slate-600 hover:text-emerald-700 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回首页
        </Link>
      </div>

      <Card className="w-full max-w-lg border-white/60 shadow-2xl animate-slide-up">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${config.accentClass} mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-200/60`}>
            {variant === 'admin' ? <Shield className="w-7 h-7" /> : variant === 'register' ? <Sparkles className="w-7 h-7" /> : <MailCheck className="w-7 h-7" />}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-slate-900">{config.title}</CardTitle>
            <CardDescription className="text-base leading-7 text-slate-600">
              {config.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
          {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

          <form onSubmit={handleSendCode} className="space-y-4">
            <Input
              type="email"
              placeholder="输入你的邮箱地址"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              icon={<Mail className="w-4 h-4" />}
              disabled={codeSent}
              required
            />
            {!codeSent && <TurnstileWidget onVerify={setTurnstileToken} />}
            <div className="flex flex-col sm:flex-row gap-3">
              {!codeSent ? (
                <Button type="submit" className="w-full" size="lg" isLoading={isSending}>
                  {config.sendLabel}
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" className="w-full" size="lg" onClick={() => { setCodeSent(false); setCode(''); setNotice(''); setError(''); setTurnstileToken('') }}>
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
                icon={<MailCheck className="w-4 h-4" />}
                required
              />
              <Button type="submit" className="w-full" size="lg" isLoading={isVerifying}>
                {config.verifyLabel}
              </Button>
            </form>
          )}

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 leading-6">
            {config.helper}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-sm text-slate-500 pb-8 text-center">
          {variant === 'login' && (
            <>
              <div>
                还没有账号？
                <Link href="/auth/register" className="ml-1 font-medium text-emerald-700 hover:text-emerald-800">
                  去邮箱注册
                </Link>
              </div>
              <div>
                管理员入口：
                <Link href="/admin/login" className="ml-1 font-medium text-sky-700 hover:text-sky-800">
                  管理员邮箱登录
                </Link>
              </div>
            </>
          )}
          {variant === 'register' && (
            <div>
              已有账号？
              <Link href="/auth/login" className="ml-1 font-medium text-emerald-700 hover:text-emerald-800">
                去邮箱登录
              </Link>
            </div>
          )}
          {variant === 'admin' && (
            <div>
              普通用户请前往
              <Link href="/auth/login" className="ml-1 font-medium text-emerald-700 hover:text-emerald-800">
                普通用户登录
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}