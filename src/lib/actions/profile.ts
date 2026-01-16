'use server'

import { createClient } from '@/lib/supabase/server'
import type { Gender, Appearance, Identity } from '@/lib/types'

interface ProfileData {
  nickname?: string
  gender: Gender
  age: number
  appearance: Appearance
  identity: Identity
  location: string
  grade?: string
  bio?: string
  contact_visibility_limit: number
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  const file = formData.get('avatar') as File
  if (!file) {
    return { error: '请选择图片' }
  }

  // 检查文件大小 (最大 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { error: '图片大小不能超过 2MB' }
  }

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    return { error: '请上传图片文件' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`

  // 上传到 Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: '上传失败' }
  }

  // 获取公开 URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  // 更新用户头像
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    console.error('Update avatar error:', updateError)
    return { error: '更新头像失败' }
  }

  return { success: true, avatarUrl: publicUrl }
}

export async function updateProfile(data: ProfileData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...data,
      is_profile_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Update profile error:', error)
    return { error: '保存资料失败' }
  }

  // 如果设置了可见人数上限 > 0，同步到联系方式池
  if (data.contact_visibility_limit > 0) {
    const { data: existingContact } = await supabase
      .from('contact_pool')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingContact) {
      await supabase
        .from('contact_pool')
        .update({ max_drawn_count: data.contact_visibility_limit })
        .eq('user_id', user.id)
    }
  }

  return { success: true }
}

export async function getProfile() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return { error: '获取资料失败' }
  }

  return { profile }
}

export async function getProfileStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  // 获取被抽取次数 (被喜欢)
  const { count: likedCount } = await supabase
    .from('draw_history')
    .select('*', { count: 'exact', head: true })
    .eq('target_id', user.id)

  // 获取抽取次数 (已匹配)
  const { count: matchedCount } = await supabase
    .from('draw_history')
    .select('*', { count: 'exact', head: true })
    .eq('drawer_id', user.id)

  return {
    liked: likedCount || 0,
    matched: matchedCount || 0,
  }
}
