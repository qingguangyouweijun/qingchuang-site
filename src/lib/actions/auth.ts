'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// 验证11位数字账号
function validateAccount(account: string): boolean {
  return /^\d{11}$/.test(account)
}

// 验证密码 (至少6位，包含字母和数字)
function validatePassword(password: string): boolean {
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password)
}

export async function signUp(formData: FormData) {
  const account = formData.get('account') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // 验证
  if (!validateAccount(account)) {
    return { error: '账号必须是11位数字' }
  }
  
  if (!validatePassword(password)) {
    return { error: '密码至少6位，且必须包含字母和数字' }
  }
  
  if (password !== confirmPassword) {
    return { error: '两次密码输入不一致' }
  }

  const supabase = await createClient()
  
  // 使用账号作为email前缀 (Supabase需要email格式)
  const email = `${account}@qingchuang.local`
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: '该账号已被注册' }
    }
    return { error: error.message }
  }

  if (data.user) {
    // 创建用户资料
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        account,
        balance: 10.00, // 新用户赠送10元
      })

    if (profileError) {
      console.error('Create profile error:', profileError)
      return { error: '创建用户资料失败' }
    }
  }

  return { success: true, redirectTo: '/profile/setup' }
}

export async function signIn(formData: FormData) {
  const account = formData.get('account') as string
  const password = formData.get('password') as string

  if (!validateAccount(account)) {
    return { error: '请输入正确的11位数字账号' }
  }

  const supabase = await createClient()
  const email = `${account}@qingchuang.local`

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: '账号或密码错误' }
    }
    return { error: error.message }
  }

  // 检查用户资料是否完善
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_profile_complete')
    .eq('id', data.user.id)
    .single()

  if (!profile?.is_profile_complete) {
    return { success: true, redirectTo: '/profile/setup' }
  }

  return { success: true, redirectTo: '/draw' }
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
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
    
  return { user, profile }
}
