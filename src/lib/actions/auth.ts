'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import type { AppRole } from '@/lib/types'

type AuthMode = 'login' | 'register'
type AuthScope = 'user' | 'admin'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function mapAuthError(message: string) {
  if (message.includes('rate limit')) {
    return '验证码发送过于频繁，请稍后再试。'
  }

  if (message.includes('For security purposes')) {
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

  if (message.includes('Email not confirmed')) {
    return '请使用邮箱验证码完成登录。'
  }

  return message
}

async function verifyTurnstileToken(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  if (!secret || !siteKey) {
    return true
  }

  if (!token) {
    throw new Error('请先完成 Cloudflare 人机校验。')
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
    throw new Error('Cloudflare 人机校验暂时不可用，请稍后重试。')
  }

  const result = await response.json() as { success?: boolean }

  if (!result.success) {
    throw new Error('Cloudflare 人机校验未通过，请重试。')
  }

  return true
}

async function loadProfileRole(userId: string) {
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('app_role')
    .eq('id', userId)
    .maybeSingle()

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
  const { error: profileError } = await admin
    .from('profiles')
    .insert({
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
      throw new Error('当前数据库仍是旧版账号字段，请先执行最新 schema，把 profiles.account 改成邮箱可用长度。')
    }

    throw new Error('创建用户资料失败，请先执行最新 schema。')
  }

  return 'user' as AppRole
}

function resolveMode(value: string): AuthMode {
  return value === 'register' ? 'register' : 'login'
}

function resolveScope(value: string): AuthScope {
  return value === 'admin' ? 'admin' : 'user'
}

export async function requestEmailCode(formData: FormData) {
  const email = normalizeEmail(String(formData.get('email') || ''))
  const mode = resolveMode(String(formData.get('mode') || 'login'))
  const turnstileToken = String(formData.get('turnstileToken') || '')

  if (!validateEmail(email)) {
    return { error: '请输入有效的邮箱地址。' }
  }

  try {
    await verifyTurnstileToken(turnstileToken)
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Cloudflare 人机校验失败。' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: mode === 'register',
    },
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  return {
    success: true,
    message: mode === 'register'
      ? '验证码已发送到你的邮箱，验证后会自动创建并登录轻创账号。'
      : '验证码已发送到你的邮箱，请输入后继续登录。',
  }
}

export async function verifyEmailCode(formData: FormData) {
  const email = normalizeEmail(String(formData.get('email') || ''))
  const code = String(formData.get('code') || '').trim()
  const scope = resolveScope(String(formData.get('scope') || 'user'))

  if (!validateEmail(email)) {
    return { error: '请输入有效的邮箱地址。' }
  }

  if (!/^\d{6}$/.test(code)) {
    return { error: '请输入 6 位邮箱验证码。' }
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

    const redirectTo = role === 'admin' ? '/admin' : '/campus'
    return { success: true, redirectTo }
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
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile && user.email) {
    try {
      await ensureProfile(user.id, user.email)
      const { data: refreshedProfile } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

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