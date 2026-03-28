"use server";

import { and, desc, eq, gte, lte, ne, notInArray, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { DRAW_PRICING, type DrawType } from "@/lib/draw";
import type { Gender, Identity, Profile } from "@/lib/types";

function getOppositeGender(gender: Gender): Gender {
  return gender === "male" ? "female" : "male";
}

function getDrawPrice(drawType: DrawType, contactVisibilityLimit: number): number {
  const pricing = DRAW_PRICING[drawType];
  return contactVisibilityLimit >= 1 ? pricing.discounted : pricing.normal;
}

async function getAuthContext() {
  const session = await getSession();
  if (!session) {
    throw new Error("请先登录。");
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, session.userId))
    .limit(1);

  const profile = rows[0];
  if (!profile) {
    throw new Error("用户资料不存在。");
  }

  return {
    db,
    userId: session.userId,
    profile: profile as Profile,
  };
}

export async function getDrawPricing() {
  const { profile } = await getAuthContext();
  const hasDiscount = (profile.contact_visibility_limit ?? 0) >= 1;

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
  };
}

export async function performDraw(input: {
  drawType: DrawType;
  ageMin?: number;
  ageMax?: number;
  identity?: Identity;
}) {
  const { db, userId, profile } = await getAuthContext();

  if (!profile.gender || !profile.grade) {
    return {
      error: "请先完善基础资料（性别、年级）后再使用晴窗抽取功能。",
    };
  }

  const oppositeGender = getOppositeGender(profile.gender as Gender);
  const price = getDrawPrice(input.drawType, profile.contact_visibility_limit ?? 0);

  const drawnRows = await db
    .select({ target_id: schema.drawHistory.target_id })
    .from(schema.drawHistory)
    .where(and(eq(schema.drawHistory.drawer_id, userId), eq(schema.drawHistory.is_deleted, false)));

  const drawnTargetIds = drawnRows.map((row) => row.target_id);

  const conditions = [
    eq(schema.contactPool.is_active, true),
    sql`${schema.contactPool.max_drawn_count} > 0`,
    sql`${schema.contactPool.drawn_count} < ${schema.contactPool.max_drawn_count}`,
    eq(schema.profiles.gender, oppositeGender),
    eq(schema.profiles.location, "本校"),
    ne(schema.profiles.id, userId),
  ];

  if (drawnTargetIds.length > 0) {
    conditions.push(notInArray(schema.profiles.id, drawnTargetIds));
  }

  if (input.identity) {
    conditions.push(eq(schema.profiles.identity, input.identity));
  }

  if (input.ageMin !== undefined && input.ageMin > 0) {
    conditions.push(gte(schema.profiles.age, input.ageMin));
  }

  if (input.ageMax !== undefined && input.ageMax > 0) {
    conditions.push(lte(schema.profiles.age, input.ageMax));
  }

  const candidates = await db
    .select({
      userId: schema.profiles.id,
      contactPoolId: schema.contactPool.id,
    })
    .from(schema.contactPool)
    .innerJoin(schema.profiles, eq(schema.contactPool.user_id, schema.profiles.id))
    .where(and(...conditions));

  if (candidates.length === 0) {
    return {
      error: "暂时没有符合条件的本校异性朋友，请调整筛选条件后再试。本次不会扣费。",
    };
  }

  const selected = candidates[Math.floor(Math.random() * candidates.length)];

  const contactRows = await db
    .select()
    .from(schema.contactPool)
    .where(eq(schema.contactPool.user_id, selected.userId))
    .limit(1);

  const contact = contactRows[0];
  if (!contact) {
    return { error: "匹配结果异常，请稍后重试。" };
  }

  const drawId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(schema.drawHistory).values({
    id: drawId,
    drawer_id: userId,
    target_id: selected.userId,
    amount: price,
    status: "PENDING_PAYMENT",
    contact_wechat: contact.wechat,
    contact_qq: contact.qq,
    contact_phone: contact.phone,
    note: input.drawType,
    is_deleted: false,
    created_at: now,
  });

  return {
    success: true,
    drawId,
    drawType: input.drawType,
    amount: price,
  };
}

export async function getDrawHistory() {
  const { db, userId } = await getAuthContext();

  const draws = await db
    .select()
    .from(schema.drawHistory)
    .where(and(eq(schema.drawHistory.drawer_id, userId), eq(schema.drawHistory.is_deleted, false)))
    .orderBy(desc(schema.drawHistory.created_at));

  const enriched = await Promise.all(
    draws.map(async (draw) => {
      if (draw.status !== "PAID") {
        return { ...draw, targetProfile: null };
      }

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
        .limit(1);

      return { ...draw, targetProfile: profileRows[0] || null };
    }),
  );

  return { draws: enriched };
}

export async function getDrawDetail(drawId: string) {
  const { db, userId } = await getAuthContext();

  const rows = await db
    .select()
    .from(schema.drawHistory)
    .where(and(eq(schema.drawHistory.id, drawId), eq(schema.drawHistory.drawer_id, userId)))
    .limit(1);

  const draw = rows[0];
  if (!draw) {
    return { error: "抽取记录不存在。" };
  }

  let targetProfile = null;

  if (draw.status === "PAID") {
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
      .limit(1);

    targetProfile = profileRows[0] || null;
  }

  return {
    draw: {
      ...draw,
      targetProfile,
    },
  };
}
