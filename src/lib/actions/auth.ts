'use server'

import { createHash, randomInt } from 'node:crypto'
import nodemailer from 'nodemailer'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { AppRole } from '@/lib/types'

type AuthMode = 'login' | 'register'
type AuthScope = 'user' | 'admin'
type EmailCodePurpose = 'register'

type EmailVerificationCodeRecord = {
  id: string
  email: string
  purpose: EmailCodePurpose
  code_hash: string
  expires_at: string
  sent_at: string
  consumed_at: string | null
  attempt_count: number
}

const REGISTER_CODE_PURPOSE: EmailCodePurpose = 'register'
const REGISTER_CODE_LENGTH = 6
const REGISTER_CODE_TTL_MS = 10 * 60 * 1000
const REGISTER_CODE_RESEND_COOLDOWN_MS = 60 * 1000
const MAX_REGISTER_VERIFY_ATTEMPTS = 5

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function resolveMode(value: string): AuthMode {
  return value === 'register' ? 'register' : 'login'
}

function resolveScope(value: string): AuthScope {
  return value === 'admin' ? 'admin' : 'user'
}

function mapAuthError(message: string) {
  if (message.includes('rate limit') || message.includes('For security purposes')) {
    return '验证码发送过于频繁，请稍后再试。'
  }

  if (message.includes('Token has expired')) {
    return '验证码已过期，请重新获取。'
  }

  if (message.includes('invalid') || message.includes('Invalid')) {
    return '验证码无效或已过期，请重新输入。'
  }

  if (message.includes('User not found')) {
    return '该邮箱尚未注册，请先注册。'
  }

  if (message.includes('already registered') || message.includes('already been registered') || message.includes('already exists')) {
    return '该邮箱已注册，请直接登录。'
  }

  if (message.includes('Invalid login credentials')) {
    return '邮箱或密码错误。'
  }

  if (message.includes('Password should be at least')) {
    return '密码至少需要 6 位。'
  }

  if (message.includes('Email not confirmed')) {
    return '请先完成邮箱验证码验证。'
  }

  return message
}

function mapRegisterFlowError(message: string) {
  if (message.includes('email_verification_codes')) {
    return '缺少邮箱验证码数据表，请先执行 supabase 中新增的验证码 SQL。'
  }

  if (message.includes('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')) {
    return '缺少 SUPABASE_SERVICE_ROLE_KEY，注册验证码流程无法创建用户。'
  }

  return message
}

function validateRegisterPassword(password: string, confirmPassword: string) {
  if (!password || password.length < 6) {
    return '注册密码至少需要 6 位。'
  }

  if (password !== confirmPassword) {
    return '两次输入的密码不一致。'
  }

  return null
}

function generateEmailCode() {
  return randomInt(0, 10 ** REGISTER_CODE_LENGTH).toString().padStart(REGISTER_CODE_LENGTH, '0')
}

function getVerificationSecret() {
  return (
    process.env.AUTH_CODE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.BREVO_API_KEY ||
    process.env.BREVO_KEY ||
    process.env.SENDINBLUE_API_KEY ||
    process.env.SIB_API_KEY ||
    ''
  )
}

function hashVerificationCode(email: string, purpose: EmailCodePurpose, code: string) {
  return createHash('sha256')
    .update(`${normalizeEmail(email)}:${purpose}:${code}:${getVerificationSecret()}`)
    .digest('hex')
}

function getBrevoApiKey() {
  return (
    process.env.BREVO_API_KEY ||
    process.env.BREVO_KEY ||
    process.env.SENDINBLUE_API_KEY ||
    process.env.SIB_API_KEY ||
    process.env.BRAVE_API_KEY ||
    ''
  )
}

function getBrevoSmtpHost() {
  return process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com'
}

function getBrevoSmtpPort() {
  const value = Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || '587')
  return Number.isFinite(value) && value > 0 ? value : 587
}

function getBrevoSmtpUser() {
  return process.env.BREVO_SMTP_USER || process.env.SMTP_USER || ''
}

function getBrevoSmtpPass() {
  return process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS || ''
}

function hasBrevoSmtpConfig() {
  return Boolean(getBrevoSmtpUser() && getBrevoSmtpPass())
}

function getBrevoSenderEmail() {
  return process.env.BREVO_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || ''
}

function getBrevoSenderName() {
  return process.env.BREVO_SENDER_NAME || process.env.BREVO_FROM_NAME || '轻创'
}

function buildRegisterCodeEmail(code: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || 'https://qingchuang.site'

  return {
    subject: '轻创注册验证码',
    text: `你的轻创注册验证码是 ${code}，10 分钟内有效。如非本人操作，请忽略本邮件。`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:32px;color:#0f172a;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e2e8f0;">
          <div style="font-size:24px;font-weight:700;margin-bottom:12px;">轻创注册验证码</div>
          <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
            你正在注册轻创账号，请输入下面的 6 位验证码完成验证。验证码 10 分钟内有效。
          </div>
          <div style="font-size:32px;letter-spacing:10px;font-weight:700;color:#047857;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:16px;padding:18px 24px;text-align:center;margin-bottom:20px;">
            ${code}
          </div>
          <div style="font-size:14px;line-height:1.8;color:#64748b;">
            如非本人操作，请直接忽略这封邮件。<br />
            访问轻创：<a href="${appUrl}" style="color:#047857;">${appUrl}</a>
          </div>
        </div>
      </div>
    `.trim(),
  }
}

async function sendBrevoSmtpEmail(input: {
  toEmail: string
  subject: string
  textContent: string
  htmlContent: string
}) {
  const smtpUser = getBrevoSmtpUser()
  const smtpPass = getBrevoSmtpPass()
  const senderEmail = getBrevoSenderEmail()
  const senderName = getBrevoSenderName()
  const smtpPort = getBrevoSmtpPort()

  if (!smtpUser || !smtpPass) {
    throw new Error('缺少 Brevo SMTP 凭证，请在环境变量中配置 BREVO_SMTP_USER 和 BREVO_SMTP_PASS。')
  }

  if (!senderEmail) {
    throw new Error('缺少 Brevo 发件邮箱，请在环境变量中配置 BREVO_SENDER_EMAIL。')
  }

  const transporter = nodemailer.createTransport({
    host: getBrevoSmtpHost(),
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  await transporter.sendMail({
    from: `"${senderName}" <${senderEmail}>`,
    to: input.toEmail,
    subject: input.subject,
    text: input.textContent,
    html: input.htmlContent,
  })
}

async function sendBrevoEmail(input: {
  toEmail: string
  subject: string
  textContent: string
  htmlContent: string
}) {
  const apiKey = getBrevoApiKey()
  const senderEmail = getBrevoSenderEmail()
  const senderName = getBrevoSenderName()

  if (!apiKey) {
    throw new Error('缺少 Brevo API Key，请在环境变量中配置 BREVO_API_KEY。')
  }

  if (!senderEmail) {
    throw new Error('缺少 Brevo 发件邮箱，请在环境变量中配置 BREVO_SENDER_EMAIL。')
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: input.toEmail,
        },
      ],
      subject: input.subject,
      textContent: input.textContent,
      htmlContent: input.htmlContent,
    }),
    cache: 'no-store',
  })

  if (response.ok) {
    return
  }

  let errorMessage = 'Brevo 邮件发送失败，请稍后重试。'

  try {
    const payload = (await response.json()) as { message?: string; code?: string }
    if (payload.message) {
      errorMessage = `Brevo 邮件发送失败：${payload.message}`
    } else if (payload.code) {
      errorMessage = `Brevo 邮件发送失败：${payload.code}`
    }
  } catch {
    // ignore malformed response bodies
  }

  throw new Error(errorMessage)
}

async function verifyTurnstileToken(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  if (!secret || !siteKey) {
    return true
  }

  if (!token) {
    throw new Error('请先完成安全验证。')
  }

  const payload = new URLSearchParams()
  payload.set('secret', secret)
  payload.set('response', token)

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('安全验证暂时不可用，请稍后重试。')
  }

  const result = (await response.json()) as { success?: boolean }

  if (!result.success) {
    throw new Error('安全验证未通过，请重试。')
  }

  return true
}

async function loadProfileRole(userId: string) {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('app_role').eq('id', userId).maybeSingle()

  return (profile?.app_role as AppRole | null) ?? 'user'
}

async function ensureProfile(userId: string, email: string) {
  const admin = createAdminClient()
  const { data: existing, error: existingError } = await admin
    .from('profiles')
    .select('id, app_role')
    .eq('id', userId)
    .maybeSingle()

  if (existingError) {
    throw new Error('读取用户资料失败，请检查 Supabase 配置。')
  }

  if (existing) {
    return (existing.app_role as AppRole | null) ?? 'user'
  }

  const nickname = email.split('@')[0].slice(0, 24)
  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    account: email,
    nickname,
    balance: 0,
    app_role: 'user',
    campus_available_balance: 0,
    campus_pending_balance: 0,
    campus_settlement_applying_amount: 0,
    campus_settled_total: 0,
  })

  if (profileError) {
    console.error('Create profile error:', profileError)

    if (profileError.message.includes('character varying(11)') || profileError.message.includes('value too long')) {
      throw new Error('当前数据库仍是旧版账号字段，请先执行最新 schema，将 profiles.account 改成支持邮箱的长度。')
    }

    throw new Error('创建用户资料失败，请先执行最新 schema。')
  }

  return 'user' as AppRole
}

async function getRegisterVerificationRecord(email: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('email_verification_codes')
    .select('id, email, purpose, code_hash, expires_at, sent_at, consumed_at, attempt_count')
    .eq('email', email)
    .eq('purpose', REGISTER_CODE_PURPOSE)
    .maybeSingle()

  if (error) {
    throw new Error(mapRegisterFlowError(error.message))
  }

  return data as EmailVerificationCodeRecord | null
}

async function removeRegisterVerificationRecord(email: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('email_verification_codes')
    .delete()
    .eq('email', email)
    .eq('purpose', REGISTER_CODE_PURPOSE)

  if (error) {
    throw new Error(mapRegisterFlowError(error.message))
  }
}

async function storeRegisterVerificationCode(email: string, code: string) {
  const admin = createAdminClient()
  const now = Date.now()
  const existing = await getRegisterVerificationRecord(email)

  if (existing?.sent_at && now - new Date(existing.sent_at).getTime() < REGISTER_CODE_RESEND_COOLDOWN_MS) {
    throw new Error('验证码发送过于频繁，请 60 秒后再试。')
  }

  const { error } = await admin.from('email_verification_codes').upsert(
    {
      email,
      purpose: REGISTER_CODE_PURPOSE,
      code_hash: hashVerificationCode(email, REGISTER_CODE_PURPOSE, code),
      expires_at: new Date(now + REGISTER_CODE_TTL_MS).toISOString(),
      sent_at: new Date(now).toISOString(),
      consumed_at: null,
      attempt_count: 0,
      updated_at: new Date(now).toISOString(),
    },
    {
      onConflict: 'email,purpose',
    }
  )

  if (error) {
    throw new Error(mapRegisterFlowError(error.message))
  }
}

async function ensureRegisterEmailAvailable(email: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.from('profiles').select('id').eq('account', email).maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (data) {
    throw new Error('该邮箱已注册，请直接登录。')
  }
}

async function sendRegisterCodeByBrevo(email: string, code: string) {
  const mail = buildRegisterCodeEmail(code)

  if (hasBrevoSmtpConfig()) {
    await sendBrevoSmtpEmail({
      toEmail: email,
      subject: mail.subject,
      textContent: mail.text,
      htmlContent: mail.html,
    })
    return
  }

  await sendBrevoEmail({
    toEmail: email,
    subject: mail.subject,
    textContent: mail.text,
    htmlContent: mail.html,
  })
}

async function verifyRegisterCodeAndCreateUser(input: {
  email: string
  code: string
  password: string
  confirmPassword: string
  scope: AuthScope
}) {
  const passwordError = validateRegisterPassword(input.password, input.confirmPassword)
  if (passwordError) {
    return { error: passwordError }
  }

  const record = await getRegisterVerificationRecord(input.email)

  if (!record || record.consumed_at) {
    return { error: '请先获取注册验证码。' }
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await removeRegisterVerificationRecord(input.email)
    return { error: '验证码已过期，请重新获取。' }
  }

  const submittedHash = hashVerificationCode(input.email, REGISTER_CODE_PURPOSE, input.code)
  if (submittedHash !== record.code_hash) {
    const admin = createAdminClient()
    const nextAttempts = Number(record.attempt_count || 0) + 1

    const { error } = await admin
      .from('email_verification_codes')
      .update({
        attempt_count: nextAttempts,
        updated_at: new Date().toISOString(),
      })
      .eq('id', record.id)

    if (error) {
      throw new Error(mapRegisterFlowError(error.message))
    }

    if (nextAttempts >= MAX_REGISTER_VERIFY_ATTEMPTS) {
      await removeRegisterVerificationRecord(input.email)
      return { error: '验证码输入错误次数过多，请重新获取。' }
    }

    return { error: '验证码无效或已过期，请重新输入。' }
  }

  const admin = createAdminClient()
  const createUserResponse = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  })

  if (createUserResponse.error || !createUserResponse.data.user) {
    return {
      error: createUserResponse.error ? mapAuthError(createUserResponse.error.message) : '创建账号失败，请稍后再试。',
    }
  }

  const createdUser = createUserResponse.data.user

  try {
    const role = await ensureProfile(createdUser.id, input.email)
    const supabase = await createClient()
    const signInResult = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    await removeRegisterVerificationRecord(input.email)

    if (signInResult.error) {
      return { success: true, redirectTo: '/auth/login' }
    }

    if (input.scope === 'admin') {
      if (role !== 'admin') {
        await supabase.auth.signOut()
        return { error: '当前邮箱不是管理员账号。' }
      }

      return { success: true, redirectTo: '/admin' }
    }

    return { success: true, redirectTo: role === 'admin' ? '/admin' : '/campus' }
  } catch (error) {
    await admin.auth.admin.deleteUser(createdUser.id)
    return { error: error instanceof Error ? error.message : '注册完成，但初始化资料失败。' }
  }
}

export async function requestEmailCode(formData: FormData) {
  const email = normalizeEmail(String(formData.get('email') || ''))
  const mode = resolveMode(String(formData.get('mode') || 'login'))
  const turnstileToken = String(formData.get('turnstileToken') || '')
  const password = String(formData.get('password') || '')
  const confirmPassword = String(formData.get('confirmPassword') || '')
  const resend = String(formData.get('resend') || '') === 'true'

  if (!validateEmail(email)) {
    return { error: '请输入有效的邮箱地址。' }
  }

  try {
    await verifyTurnstileToken(turnstileToken)
  } catch (error) {
    return { error: error instanceof Error ? error.message : '安全验证失败。' }
  }

  if (mode === 'register') {
    const passwordError = validateRegisterPassword(password, confirmPassword)
    if (passwordError) {
      return { error: passwordError }
    }

    try {
      await ensureRegisterEmailAvailable(email)
      const code = generateEmailCode()
      await storeRegisterVerificationCode(email, code)

      try {
        await sendRegisterCodeByBrevo(email, code)
      } catch (error) {
        await removeRegisterVerificationRecord(email).catch(() => {})
        throw error
      }

      return {
        success: true,
        message: resend
          ? '注册验证码已重新发送，请查收邮箱并完成验证。'
          : '注册验证码已发送到你的邮箱，请输入验证码完成注册。',
      }
    } catch (error) {
      return { error: error instanceof Error ? mapRegisterFlowError(error.message) : '发送注册验证码失败，请稍后重试。' }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  return {
    success: true,
    message: '登录验证码已发送到你的邮箱，请输入验证码继续。',
  }
}

export async function verifyEmailCode(formData: FormData) {
  const email = normalizeEmail(String(formData.get('email') || ''))
  const code = String(formData.get('code') || '').trim()
  const scope = resolveScope(String(formData.get('scope') || 'user'))
  const mode = resolveMode(String(formData.get('mode') || 'login'))
  const password = String(formData.get('password') || '')
  const confirmPassword = String(formData.get('confirmPassword') || '')

  if (!validateEmail(email)) {
    return { error: '请输入有效的邮箱地址。' }
  }

  if (!/^\d{6}$/.test(code)) {
    return { error: '请输入 6 位邮箱验证码。' }
  }

  if (mode === 'register') {
    try {
      return await verifyRegisterCodeAndCreateUser({
        email,
        code,
        password,
        confirmPassword,
        scope,
      })
    } catch (error) {
      return { error: error instanceof Error ? mapRegisterFlowError(error.message) : '注册验证失败，请稍后重试。' }
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  })

  if (error || !data.user) {
    return { error: error ? mapAuthError(error.message) : '验证码无效或已过期。' }
  }

  try {
    const role = await ensureProfile(data.user.id, email)

    if (scope === 'admin') {
      if (role !== 'admin') {
        await supabase.auth.signOut()
        return { error: '当前邮箱不是管理员账号。' }
      }

      return { success: true, redirectTo: '/admin' }
    }

    return { success: true, redirectTo: role === 'admin' ? '/admin' : '/campus' }
  } catch (profileError) {
    await supabase.auth.signOut()
    return { error: profileError instanceof Error ? profileError.message : '登录完成，但初始化资料失败。' }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function getSession() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).maybeSingle()

  if (!profile && user.email) {
    try {
      await ensureProfile(user.id, user.email)
      const { data: refreshedProfile } = await admin.from('profiles').select('*').eq('id', user.id).maybeSingle()

      return { user, profile: refreshedProfile }
    } catch (error) {
      console.error('Ensure profile error:', error)
      return { user, profile: null }
    }
  }

  return { user, profile }
}

export async function getProfileRole(userId: string) {
  return loadProfileRole(userId)
}
