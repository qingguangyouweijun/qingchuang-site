"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, LockKeyhole, Mail, MailCheck, Shield, Sparkles } from 'lucide-react'
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
    description: '输入邮箱并完成人机验证，我们会把 6 位验证码发送到你的邮箱。',
    sendLabel: '发送登录验证码',
    verifyLabel: '进入轻创',
    helper: '验证码一般会很快送达，如未收到，请检查垃圾邮件箱。',
    scope: 'user',
    mode: 'login',
  },
  register: {
    title: '邮箱注册轻创',
    description: '填写邮箱和登录密码，完成人机验证后发送验证码，再输入验证码完成注册。',
    sendLabel: '发送注册验证码',
    verifyLabel: '完成注册并进入',
    helper: '注册完成后即可继续使用校园服务、晴窗和 AI 陪伴。',
    scope: 'user',
    mode: 'register',
  },
  admin: {
    title: '管理员邮箱登录',
    description: '管理员使用独立入口完成邮箱验证后进入后台。',
    sendLabel: '发送管理员验证码',
    verifyLabel: '进入管理员网站',
    helper: '请输入管理员邮箱，完成验证码验证后继续。',
    scope: 'admin',
    mode: 'login',
  },
}

function StepLabel({ index, title, description }: { index: string; title: string; description: string }) {
  return (
    <div className="space-y-1">
      <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700">
        步骤 {index}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
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
    setNotice(result.message || '验证码已发送，请查收邮箱并输入 6 位验证码。')
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

      <Card className="w-full max-w-2xl border-none shadow-[0_24px_60px_rgba(15,23,42,0.08)] animate-slide-up">
        <CardHeader className="space-y-4 pb-6 text-center sm:pb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm">
            {variant === 'admin' ? <Shield className="h-7 w-7" /> : isRegister ? <Sparkles className="h-7 w-7" /> : <MailCheck className="h-7 w-7" />}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-slate-900">{config.title}</CardTitle>
            <CardDescription className="mx-auto max-w-xl text-base leading-7 text-slate-600">
              {config.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

          <div className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
            <form onSubmit={handleSendCode} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="space-y-5">
                <StepLabel
                  index="1"
                  title={isRegister ? '填写注册信息' : '填写登录邮箱'}
                  description={isRegister ? '先输入邮箱、登录密码并完成验证，再发送邮箱验证码。' : '先完成邮箱和人机验证，再发送登录验证码。'}
                />

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
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    先完成人机验证，再发送邮箱验证码
                  </div>
                  <TurnstileWidget onVerify={setTurnstileToken} />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {!codeSent ? (
                    <Button type="submit" className="w-full sm:flex-1" size="lg" isLoading={isSending}>
                      {config.sendLabel}
                    </Button>
                  ) : (
                    <>
                      <Button type="button" variant="outline" className="w-full sm:flex-1" size="lg" onClick={handleResetEmail}>
                        更换邮箱
                      </Button>
                      <Button type="submit" variant="secondary" className="w-full sm:flex-1" size="lg" isLoading={isSending}>
                        重新发送验证码
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </form>

            <form onSubmit={handleVerifyCode} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
              <div className="space-y-5">
                <StepLabel
                  index="2"
                  title="输入邮箱验证码"
                  description="收到 6 位验证码后，在这里输入并完成验证。"
                />

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

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                  {codeSent
                    ? `验证码已发送到 ${email || '你的邮箱'}，请输入验证码继续。`
                    : '先在左侧完成信息填写并发送验证码，然后再回到这里输入验证码。'}
                </div>

                <Button type="submit" className="w-full" size="lg" isLoading={isVerifying} disabled={!codeSent}>
                  {config.verifyLabel}
                </Button>
              </div>
            </form>
          </div>

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
