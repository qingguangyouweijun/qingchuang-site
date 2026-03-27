"use server";

import { eq } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Gender, Appearance, Profile } from "@/lib/types";

interface ProfileData {
  nickname?: string;
  gender: Gender;
  grade: string;
  appearance: Appearance;
  location: string;
  bio?: string;
  contact_visibility_limit: number;
  wechat?: string;
  qq?: string;
  phone?: string;
}

export async function uploadAvatar(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "请先登录" };
  }

  const file = formData.get("avatar") as File;
  if (!file) {
    return { error: "请选择图片" };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "图片大小不能超过 2MB" };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "请上传图片文件" };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${session.userId}-${Date.now()}.${fileExt}`;
  const uploadDir = join(process.cwd(), "public", "uploads", "avatars");

  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, fileName), buffer);

  const publicUrl = `/uploads/avatars/${fileName}`;

  const db = getDb();
  await db
    .update(schema.profiles)
    .set({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .where(eq(schema.profiles.id, session.userId));

  return { success: true, avatarUrl: publicUrl };
}

export async function updateProfile(data: ProfileData) {
  const session = await getSession();
  if (!session) {
    return { error: "请先登录" };
  }

  const db = getDb();
  await db
    .update(schema.profiles)
    .set({
      nickname: data.nickname,
      gender: data.gender,
      grade: data.grade,
      appearance: data.appearance,
      location: data.location,
      bio: data.bio,
      contact_visibility_limit: data.contact_visibility_limit,
      is_profile_complete: true,
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.profiles.id, session.userId));

  if (data.contact_visibility_limit > 0) {
    const existing = await db
      .select({ id: schema.contactPool.id })
      .from(schema.contactPool)
      .where(eq(schema.contactPool.user_id, session.userId))
      .limit(1);

    const now = new Date().toISOString();
    if (existing.length > 0) {
      await db
        .update(schema.contactPool)
        .set({
          max_drawn_count: data.contact_visibility_limit,
          wechat: data.wechat || null,
          qq: data.qq || null,
          phone: data.phone || null,
          updated_at: now,
        })
        .where(eq(schema.contactPool.user_id, session.userId));
    } else {
      await db.insert(schema.contactPool).values({
        user_id: session.userId,
        max_drawn_count: data.contact_visibility_limit,
        wechat: data.wechat || null,
        qq: data.qq || null,
        phone: data.phone || null,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return { success: true };
}

export async function getProfile() {
  const session = await getSession();
  if (!session) {
    return { error: "请先登录" };
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, session.userId))
    .limit(1);

  if (!rows[0]) {
    return { error: "获取资料失败" };
  }

  const { password_hash: _, ...profile } = rows[0];
  return { profile: profile as Profile };
}

export async function getProfileStats() {
  const session = await getSession();
  if (!session) {
    return { error: "请先登录" };
  }

  const db = getDb();
  const likedRows = await db
    .select({ id: schema.drawHistory.id })
    .from(schema.drawHistory)
    .where(eq(schema.drawHistory.target_id, session.userId));

  const matchedRows = await db
    .select({ id: schema.drawHistory.id })
    .from(schema.drawHistory)
    .where(eq(schema.drawHistory.drawer_id, session.userId));

  return {
    liked: likedRows.length,
    matched: matchedRows.length,
  };
}
