'use server'

import { and, desc, eq, ne, notInArray, sql, gte, lte } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { getDb, schema } from '@/lib/db'
import type { Profile, Gender, Identity } from '@/lib/types'

/* ── 定价 ── */

export const DRAW_PRICING = {
  BASIC: { normal: 2.48, discounted: 1.68 },
  PREMIUM: { normal: 4.68, discounted: 3.48 },
} as const

export type DrawType = 'BASIC' | 'PREMIUM'

/* ── 内部工具 ── */

function getOppositeGender(gender: Gender): Gender {
  return gender === 'male' ? 'female' : 'male'
}

function getDrawPrice(drawType: DrawType, contactVisibilityLimit: number): number {
  const pricing = DRAW_PRICING[drawType]
  return contactVisibilityLimit >= 1 ? pricing.discounted : pricing.normal
}

async function getAuthContext() {
  const session = await getSession()
  if (!session) {
    throw new Error('请先登录。')
  }

  const db = getDb()
  const rows = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, session.userId))
    .limit(1)

  const profile = rows[0]
  if (!profile) {
    throw new Error('用户资料不存在。')
  }

  return { db, userId: session.userId, profile: profile as Profile }
}

/* ── 公共 API ── */

/** 获取当前用户的抽取定价（是否享受优惠） */
export async function getDrawPricing() {
  const { profile } = await getAuthContext()
  const hasDiscount = (profile.contact_visibility_limit ?? 0) >= 1

  return {
    basic: {
      normal: DRAW_PRICING.BASIC.normal,
      discounted: DRAW_PRICING.BASIC.discounted,
      actual: hasDiscount ? DRAW_PRICING.BASIC.discounted : DRAW_PRICING.BASIC.normal,
      hasDiscount,
    },
    premium: {
      normal: DRAW_PRICING.PREMIUM.normal,
      discounted: DRAW_PRICING.PREMIUM.discounted,
      actual: hasDiscount ? DRAW_PRICING.PREMIUM.discounted : DRAW_PRICING.PREMIUM.normal,
      hasDiscount,
    },
  }
}

/** 执行抽取：按筛选找到候选者，创建 PENDING_PAYMENT 记录 */
export async function performDraw(input: {
  drawType: DrawType
  ageMin?: number
  ageMax?: number
  identity?: Identity
  location?: string
}) {
  const { db, userId, profile } = await getAuthContext()

  if (!profile.gender || !profile.grade || !profile.location) {
    return { error: '请先完善资料（性别、年级、所在校区）后再使用抽取功能。' }
  }

  const oppositeGender = getOppositeGender(profile.gender as Gender)
  const price = getDrawPrice(input.drawType, profile.contact_visibility_limit ?? 0)

  // 获取当前用户已抽取过的 target_id 列表（去重）
  const drawnRows = await db
    .select({ target_id: schema.drawHistory.target_id })
    .from(schema.drawHistory)
    .where(
      and(
        eq(schema.drawHistory.drawer_id, userId),
        eq(schema.drawHistory.is_deleted, false),
      ),
    )

  const drawnTargetIds = drawnRows.map((r) => r.target_id)

  // 构建候选池查询条件
  const conditions = [
    eq(schema.contactPool.is_active, true),
    sql`${schema.contactPool.max_drawn_count} > 0`,
    sql`${schema.contactPool.drawn_count} < ${schema.contactPool.max_drawn_count}`,
    eq(schema.profiles.gender, oppositeGender),
    ne(schema.profiles.id, userId),
  ]

  if (drawnTargetIds.length > 0) {
    conditions.push(notInArray(schema.profiles.id, drawnTargetIds))
  }

  if (input.identity) {
    conditions.push(eq(schema.profiles.identity, input.identity))
  }

  if (input.location) {
    conditions.push(eq(schema.profiles.location, input.location))
  }

  if (input.ageMin !== undefined && input.ageMin > 0) {
    conditions.push(gte(schema.profiles.age, input.ageMin))
  }

  if (input.ageMax !== undefined && input.ageMax > 0) {
    conditions.push(lte(schema.profiles.age, input.ageMax))
  }

  const candidates = await db
    .select({
      userId: schema.profiles.id,
      contactPoolId: schema.contactPool.id,
    })
    .from(schema.contactPool)
    .innerJoin(schema.profiles, eq(schema.contactPool.user_id, schema.profiles.id))
    .where(and(...conditions))

  if (candidates.length === 0) {
    return { error: '暂无符合条件的用户，请修改筛选条件后重试。本次不扣费。' }
  }

  // 随机选 1 个
  const selected = candidates[Math.floor(Math.random() * candidates.length)]

  // 获取对方联系方式
  const contactRows = await db
    .select()
    .from(schema.contactPool)
    .where(eq(schema.contactPool.user_id, selected.userId))
    .limit(1)

  const contact = contactRows[0]
  if (!contact) {
    return { error: '匹配异常，请重试。' }
  }

  // 创建抽取记录（待支付）
  const drawId = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.insert(schema.drawHistory).values({
    id: drawId,
    drawer_id: userId,
    target_id: selected.userId,
    amount: price,
    status: 'PENDING_PAYMENT',
    contact_wechat: contact.wechat,
    contact_qq: contact.qq,
    contact_phone: contact.phone,
    note: input.drawType,
    is_deleted: false,
    created_at: now,
  })

  return {
    success: true,
    drawId,
    drawType: input.drawType,
    amount: price,
  }
}

/** 获取当前用户的抽取历史列表 */
export async function getDrawHistory() {
  const { db, userId } = await getAuthContext()

  const draws = await db
    .select()
    .from(schema.drawHistory)
    .where(
      and(
        eq(schema.drawHistory.drawer_id, userId),
        eq(schema.drawHistory.is_deleted, false),
      ),
    )
    .orderBy(desc(schema.drawHistory.created_at))

  // 为已支付的记录附加对方资料
  const enriched = await Promise.all(
    draws.map(async (draw) => {
      if (draw.status === 'PAID') {
        const profileRows = await db
          .select({
            gender: schema.profiles.gender,
            age: schema.profiles.age,
            grade: schema.profiles.grade,
            bio: schema.profiles.bio,
            identity: schema.profiles.identity,
            location: schema.profiles.location,
          })
          .from(schema.profiles)
          .where(eq(schema.profiles.id, draw.target_id))
          .limit(1)

        return { ...draw, targetProfile: profileRows[0] || null }
      }

      return { ...draw, targetProfile: null }
    }),
  )

  return { draws: enriched }
}

/** 获取单条抽取详情（已支付时含联系方式和对方资料） */
export async function getDrawDetail(drawId: string) {
  const { db, userId } = await getAuthContext()

  const rows = await db
    .select()
    .from(schema.drawHistory)
    .where(
      and(
        eq(schema.drawHistory.id, drawId),
        eq(schema.drawHistory.drawer_id, userId),
      ),
    )
    .limit(1)

  const draw = rows[0]
  if (!draw) {
    return { error: '抽取记录不存在。' }
  }

  let targetProfile = null

  if (draw.status === 'PAID') {
    const profileRows = await db
      .select({
        gender: schema.profiles.gender,
        age: schema.profiles.age,
        grade: schema.profiles.grade,
        bio: schema.profiles.bio,
        identity: schema.profiles.identity,
        location: schema.profiles.location,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.id, draw.target_id))
      .limit(1)

    targetProfile = profileRows[0] || null
  }

  return {
    draw: { ...draw, targetProfile },
  }
}
