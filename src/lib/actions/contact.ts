'use server'

import { createClient } from '@/lib/supabase/server'

interface ContactData {
  wechat?: string
  qq?: string
  phone?: string
}

export async function getMyContact() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  const { data: contact, error } = await supabase
    .from('contact_pool')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    return { error: '获取联系方式失败' }
  }

  return { contact }
}

export async function saveContact(data: ContactData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  // 获取用户的可见人数上限
  const { data: profile } = await supabase
    .from('profiles')
    .select('contact_visibility_limit')
    .eq('id', user.id)
    .single()

  const maxDrawnCount = profile?.contact_visibility_limit || 0

  // 检查是否已有联系方式记录
  const { data: existing } = await supabase
    .from('contact_pool')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // 更新
    const { error } = await supabase
      .from('contact_pool')
      .update({
        ...data,
        max_drawn_count: maxDrawnCount,
        is_active: maxDrawnCount > 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) {
      return { error: '保存联系方式失败' }
    }
  } else {
    // 新建
    const { error } = await supabase
      .from('contact_pool')
      .insert({
        user_id: user.id,
        ...data,
        max_drawn_count: maxDrawnCount,
        is_active: maxDrawnCount > 0,
      })

    if (error) {
      return { error: '保存联系方式失败' }
    }
  }

  return { success: true }
}

export async function toggleContactActive(isActive: boolean) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  const { error } = await supabase
    .from('contact_pool')
    .update({ is_active: isActive })
    .eq('user_id', user.id)

  if (error) {
    return { error: '操作失败' }
  }

  return { success: true }
}

export async function withdrawContact() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  const { error } = await supabase
    .from('contact_pool')
    .update({ 
      is_active: false,
      drawn_count: 0, // 重置抽取次数
    })
    .eq('user_id', user.id)

  // 同时更新profile的可见人数为0
  await supabase
    .from('profiles')
    .update({ contact_visibility_limit: 0 })
    .eq('id', user.id)

  if (error) {
    return { error: '撤回失败' }
  }

  return { success: true }
}
