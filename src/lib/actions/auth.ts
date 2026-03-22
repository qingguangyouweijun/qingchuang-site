'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AppRole } from '@/lib/types'

function validateAccount(account: string) {
  return /^\d{11}$/.test(account)
}

function validatePassword(password: string) {
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password)
}

function toEmail(account: string) {
  return `${account}@qingchuang.local`
}

async function loadProfileRole(userId: string) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('app_role')
    .eq('id', userId)
    .single()

  return (profile?.app_role as AppRole | null) ?? 'user'
}

export async function signUp(formData: FormData) {
  const account = String(formData.get('account') || '')
  const password = String(formData.get('password') || '')
  const confirmPassword = String(formData.get('confirmPassword') || '')

  if (!validateAccount(account)) {
    return { error: '账号必须是 11 位数字。' }
  }

  if (!validatePassword(password)) {
    return { error: '密码至少 6 位，且必须同时包含字母和数字。' }
  }

  if (password !== confirmPassword) {
    return { error: '两次输入的密码不一致。' }
  }

  const supabase = await createClient()
  const email = toEmail(account)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: '该账号已经注册。' }
    }
    return { error: error.message }
  }

  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      account,
      balance: 10,
      app_role: 'user',
      campus_available_balance: 0,
      campus_pending_balance: 0,
      campus_settlement_applying_amount: 0,
      campus_settled_total: 0,
    })

    if (profileError) {
      console.error('Create profile error:', profileError)
      return { error: '创建用户资料失败，请先执行最新 schema。' }
    }
  }

  return { success: true, redirectTo: '/campus' }
}

export async function signIn(formData: FormData) {
  const account = String(formData.get('account') || '')
  const password = String(formData.get('password') || '')

  if (!validateAccount(account)) {
    return { error: '请输入正确的 11 位数字账号。' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toEmail(account),
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: '账号或密码错误。' }
    }
    return { error: error.message }
  }

  const role = await loadProfileRole(data.user.id)
  return { success: true, redirectTo: role === 'admin' ? '/admin' : '/campus' }
}

export async function signInAdmin(formData: FormData) {
  const result = await signIn(formData)
  if (result.error || !result.redirectTo) {
    return result
  }

  if (result.redirectTo !== '/admin') {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return { error: '当前账号不是管理员。' }
  }

  return result
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}
