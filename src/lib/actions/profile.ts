"use server"

import { eq } from "drizzle-orm"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { getDb, schema } from "@/lib/db"
import { getSession } from "@/lib/auth"
import type { Appearance, Gender, Profile } from "@/lib/types"

interface ProfileData {
  nickname?: string
  gender: Gender
  grade: string
  appearance?: Appearance
  location?: string
  bio?: string
  contact_visibility_limit: number
  wechat?: string
  qq?: string
  phone?: string
}

export async function uploadAvatar(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: "请先登录。" }
  }

  const file = formData.get("avatar") as File
  if (!file) {
    return { error: "请选择头像图片后再上传。" }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "头像图片不能超过 2MB。" }
  }

  if (!file.type.startsWith("image/")) {
    return { error: "请上传图片文件。" }
  }

  const fileExt = file.name.split(".").pop() || "png"
  const fileName = `${session.userId}-${Date.now()}.${fileExt}`
  const uploadDir = join(process.cwd(), "public", "uploads", "avatars")

  await mkdir(uploadDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(uploadDir, fileName), buffer)

  const publicUrl = `/uploads/avatars/${fileName}`

  const db = getDb()
  await db
    .update(schema.profiles)
    .set({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .where(eq(schema.profiles.id, session.userId))

  return { success: true, avatarUrl: publicUrl }
}

export async function updateProfile(data: ProfileData) {
  const session = await getSession()
  if (!session) {
    return { error: "请先登录。" }
  }

  const db = getDb()
  const now = new Date().toISOString()
  const defaultLocation = data.location?.trim() || "本校"

  await db
    .update(schema.profiles)
    .set({
      nickname: data.nickname,
      gender: data.gender,
      grade: data.grade,
      appearance: data.appearance,
      location: defaultLocation,
      bio: data.bio,
      contact_visibility_limit: data.contact_visibility_limit,
      is_profile_complete: true,
      updated_at: now,
    })
    .where(eq(schema.profiles.id, session.userId))

  const existing = await db
    .select({ id: schema.contactPool.id })
    .from(schema.contactPool)
    .where(eq(schema.contactPool.user_id, session.userId))
    .limit(1)

  if (data.contact_visibility_limit > 0) {
    if (existing.length > 0) {
      await db
        .update(schema.contactPool)
        .set({
          is_active: true,
          max_drawn_count: data.contact_visibility_limit,
          wechat: data.wechat || null,
          qq: data.qq || null,
          phone: data.phone || null,
          updated_at: now,
        })
        .where(eq(schema.contactPool.user_id, session.userId))
    } else {
      await db.insert(schema.contactPool).values({
        user_id: session.userId,
        max_drawn_count: data.contact_visibility_limit,
        wechat: data.wechat || null,
        qq: data.qq || null,
        phone: data.phone || null,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
    }
  } else if (existing.length > 0) {
    await db
      .update(schema.contactPool)
      .set({
        is_active: false,
        max_drawn_count: 0,
        updated_at: now,
      })
      .where(eq(schema.contactPool.user_id, session.userId))
  }

  return { success: true }
}

export async function getProfile() {
  const session = await getSession()
  if (!session) {
    return { error: "请先登录。" }
  }

  const db = getDb()
  const rows = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, session.userId))
    .limit(1)

  if (!rows[0]) {
    return { error: "获取资料失败，请稍后重试。" }
  }

  const { password_hash: _passwordHash, ...profile } = rows[0]
  return { profile: profile as Profile }
}

export async function updateNickname(nickname: string) {
  const session = await getSession()
  if (!session) {
    return { error: "请先登录。" }
  }

  const trimmed = nickname.trim()
  if (!trimmed) {
    return { error: "名称不能为空。" }
  }
  if (trimmed.length > 20) {
    return { error: "名称最多 20 个字。" }
  }

  const db = getDb()
  await db
    .update(schema.profiles)
    .set({ nickname: trimmed, updated_at: new Date().toISOString() })
    .where(eq(schema.profiles.id, session.userId))

  return { success: true }
}

export async function uploadPayeeQrCode(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { error: "请先登录。" }
  }

  const file = formData.get("qrcode") as File
  if (!file) {
    return { error: "请选择收款码图片。" }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "收款码图片不能超过 5MB。" }
  }

  if (!file.type.startsWith("image/")) {
    return { error: "请上传图片文件。" }
  }

  const fileExt = file.name.split(".").pop() || "png"
  const fileName = `${session.userId}-${Date.now()}.${fileExt}`
  const uploadDir = join(process.cwd(), "public", "uploads", "qr-codes")

  await mkdir(uploadDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(uploadDir, fileName), buffer)

  const publicUrl = `/uploads/qr-codes/${fileName}`
  return { success: true, url: publicUrl }
}

export async function getProfileStats() {
  const session = await getSession()
  if (!session) {
    return { error: "请先登录。" }
  }

  const db = getDb()
  const likedRows = await db
    .select({ id: schema.drawHistory.id })
    .from(schema.drawHistory)
    .where(eq(schema.drawHistory.target_id, session.userId))

  const matchedRows = await db
    .select({ id: schema.drawHistory.id })
    .from(schema.drawHistory)
    .where(eq(schema.drawHistory.drawer_id, session.userId))

  return {
    liked: likedRows.length,
    matched: matchedRows.length,
  }
}
