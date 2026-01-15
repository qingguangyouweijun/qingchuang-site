'use server'

import { createClient } from '@/lib/supabase/server'
import type { DrawTier, DrawFilters, DrawResult } from '@/lib/types'
import { PRICING } from '@/lib/types'

export async function performDraw(
  tier: DrawTier,
  filters: DrawFilters
): Promise<DrawResult> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: '请先登录' }
  }

  // 获取用户资料判断是否享受优惠价
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance, contact_visibility_limit')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { success: false, error: '获取用户信息失败' }
  }

  // 检查是否有有效的联系方式在池中
  const { data: contact } = await supabase
    .from('contact_pool')
    .select('is_active')
    .eq('user_id', user.id)
    .single()

  const hasActiveContact = contact?.is_active && profile.contact_visibility_limit > 0
  const price = hasActiveContact ? PRICING[tier].discount : PRICING[tier].normal

  // 检查余额
  if (profile.balance < price) {
    return { success: false, error: `余额不足，需要 ¥${price.toFixed(2)}，当前余额 ¥${profile.balance.toFixed(2)}` }
  }

  // 调用数据库函数进行抽取
  const { data, error } = await supabase.rpc('perform_draw', {
    p_drawer_id: user.id,
    p_tier: tier,
    p_price: price,
    p_gender: filters.gender || null,
    p_age_min: filters.ageMin || null,
    p_age_max: filters.ageMax || null,
    p_identity: filters.identity || null,
    p_appearance: filters.appearance || null,
  })

  if (error) {
    console.error('Draw error:', error)
    return { success: false, error: '抽取失败，请稍后重试' }
  }

  return data as DrawResult
}

export async function getDrawHistory(limit = 50) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  const { data: history, error } = await supabase
    .from('draw_history')
    .select(`
      *,
      target:target_id (
        nickname,
        gender,
        age,
        appearance,
        identity,
        location,
        grade,
        bio
      )
    `)
    .eq('drawer_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { error: '获取历史记录失败' }
  }

  return { history }
}

export async function updateDrawNote(drawId: string, note: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  const { error } = await supabase
    .from('draw_history')
    .update({ note })
    .eq('id', drawId)
    .eq('drawer_id', user.id)

  if (error) {
    return { error: '保存备注失败' }
  }

  return { success: true }
}

export async function deleteDrawRecord(drawId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  // 软删除
  const { error } = await supabase
    .from('draw_history')
    .update({ is_deleted: true })
    .eq('id', drawId)
    .eq('drawer_id', user.id)

  if (error) {
    return { error: '删除失败' }
  }

  return { success: true }
}
