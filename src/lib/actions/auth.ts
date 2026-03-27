"use server";

import { createHash, randomInt } from "node:crypto";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import {
  createSession,
  destroySession,
  getSession as getAuthSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import type { AppRole } from "@/lib/types";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstileToken(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // If secret key is not configured, skip verification (dev mode)
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "请完成人机验证。" };
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = (await response.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!data.success) {
      console.error("Turnstile verification failed:", data["error-codes"]);
      return { success: false, error: "人机验证失败，请重试。" };
    }

    return { success: true };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "人机验证服务异常，请稍后重试。" };
  }
}

type AuthScope = "user" | "admin";
type EmailCodePurpose = "register";

const REGISTER_CODE_PURPOSE: EmailCodePurpose = "register";
const REGISTER_CODE_LENGTH = 6;
const REGISTER_CODE_TTL_MS = 10 * 60 * 1000;
const REGISTER_CODE_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_REGISTER_VERIFY_ATTEMPTS = 5;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function resolveScope(value: string): AuthScope {
  return value === "admin" ? "admin" : "user";
}

function generateEmailCode() {
  return randomInt(0, 10 ** REGISTER_CODE_LENGTH)
    .toString()
    .padStart(REGISTER_CODE_LENGTH, "0");
}

function getVerificationSecret() {
  return (
    process.env.AUTH_CODE_SECRET ||
    process.env.AUTH_JWT_SECRET ||
    process.env.BREVO_API_KEY ||
    ""
  );
}

function hashVerificationCode(
  email: string,
  purpose: EmailCodePurpose,
  code: string,
) {
  return createHash("sha256")
    .update(
      `${normalizeEmail(email)}:${purpose}:${code}:${getVerificationSecret()}`,
    )
    .digest("hex");
}

function getBrevoApiKey() {
  return (
    process.env.BREVO_API_KEY ||
    process.env.BREVO_KEY ||
    process.env.SENDINBLUE_API_KEY ||
    process.env.SIB_API_KEY ||
    ""
  );
}

function getBrevoSenderEmail() {
  return (
    process.env.BREVO_SENDER_EMAIL ||
    process.env.BREVO_FROM_EMAIL ||
    process.env.SMTP_FROM_EMAIL ||
    ""
  );
}

function getBrevoSenderName() {
  return process.env.BREVO_SENDER_NAME || process.env.BREVO_FROM_NAME || "轻创";
}

function buildRegisterCodeEmail(code: string) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    "https://qingchuang.site";

  const logoUrl = `${appUrl}/qingchuang.jpg`;

  return {
    subject: "轻创注册验证码",
    text: `你的轻创注册验证码是 ${code}，10 分钟内有效。如非本人操作，请忽略本邮件。`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:32px;color:#0f172a;">
        <div style="max-width:560px;margin:0 auto;">

          <!-- Logo 头部 -->
          <div style="text-align:center;padding:28px 0 20px;">
            <img
              src="${logoUrl}"
              alt="轻创 Qintra"
              width="200"
              style="height:auto;max-width:200px;display:inline-block;"
            />
          </div>

          <!-- 正文卡片 -->
          <div style="background:#ffffff;border-radius:20px;padding:32px;border:1px solid #e2e8f0;">
            <div style="font-size:24px;font-weight:700;margin-bottom:12px;">轻创注册验证码</div>
            <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
              你正在注册轻创账号，请输入下面的 6 位验证码完成验证。验证码 10 分钟内有效。
            </div>
            <div style="font-size:32px;letter-spacing:10px;font-weight:700;color:#047857;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:16px;padding:18px 24px;text-align:center;margin-bottom:20px;">
              ${code}
            </div>
            <div style="font-size:14px;line-height:1.8;color:#64748b;">
              如非本人操作，请直接忽略这封邮件。<br />
              访问轻创：<a href="${appUrl}" style="color:#047857;">${appUrl}</a>
            </div>
          </div>

          <!-- 底部小字 -->
          <div style="text-align:center;padding:16px 0 8px;font-size:12px;color:#94a3b8;">
            © 轻创 Qintra &nbsp;·&nbsp; 让便捷融入生活
          </div>

        </div>
      </div>
    `.trim(),
  };
}

async function sendBrevoEmail(input: {
  toEmail: string;
  subject: string;
  textContent: string;
  htmlContent: string;
}) {
  const apiKey = getBrevoApiKey();
  const senderEmail = getBrevoSenderEmail();
  const senderName = getBrevoSenderName();

  if (!apiKey) {
    throw new Error("缺少 Brevo API Key，请在环境变量中配置 BREVO_API_KEY。");
  }

  if (!senderEmail) {
    throw new Error(
      "缺少 Brevo 发件邮箱，请在环境变量中配置 BREVO_SENDER_EMAIL。",
    );
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: input.toEmail }],
      subject: input.subject,
      textContent: input.textContent,
      htmlContent: input.htmlContent,
    }),
    cache: "no-store",
  });

  if (response.ok) {
    return;
  }

  let errorMessage = "Brevo 邮件发送失败，请稍后重试。";
  try {
    const payload = (await response.json()) as {
      message?: string;
      code?: string;
    };
    if (payload.message) {
      errorMessage = `Brevo 邮件发送失败：${payload.message}`;
    } else if (payload.code) {
      errorMessage = `Brevo 邮件发送失败：${payload.code}`;
    }
  } catch {
    // ignore malformed bodies
  }

  throw new Error(errorMessage);
}

function validateRegisterPassword(password: string, confirmPassword: string) {
  if (!password || password.length < 6) {
    return "注册密码至少需要 6 位。";
  }
  if (password !== confirmPassword) {
    return "两次输入的密码不一致。";
  }
  return null;
}

async function getRegisterVerificationRecord(email: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.emailVerificationCodes)
    .where(
      and(
        eq(schema.emailVerificationCodes.email, email),
        eq(schema.emailVerificationCodes.purpose, REGISTER_CODE_PURPOSE),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

async function removeRegisterVerificationRecord(email: string) {
  const db = getDb();
  await db
    .delete(schema.emailVerificationCodes)
    .where(
      and(
        eq(schema.emailVerificationCodes.email, email),
        eq(schema.emailVerificationCodes.purpose, REGISTER_CODE_PURPOSE),
      ),
    );
}

async function storeRegisterVerificationCode(email: string, code: string) {
  const db = getDb();
  const now = Date.now();
  const existing = await getRegisterVerificationRecord(email);

  if (
    existing?.sent_at &&
    now - new Date(existing.sent_at).getTime() <
      REGISTER_CODE_RESEND_COOLDOWN_MS
  ) {
    throw new Error("验证码发送过于频繁，请 60 秒后再试。");
  }

  const record = {
    email,
    purpose: REGISTER_CODE_PURPOSE,
    code_hash: hashVerificationCode(email, REGISTER_CODE_PURPOSE, code),
    expires_at: new Date(now + REGISTER_CODE_TTL_MS).toISOString(),
    sent_at: new Date(now).toISOString(),
    consumed_at: null,
    attempt_count: 0,
    updated_at: new Date(now).toISOString(),
  };

  if (existing) {
    await db
      .update(schema.emailVerificationCodes)
      .set(record)
      .where(eq(schema.emailVerificationCodes.id, existing.id));
  } else {
    await db.insert(schema.emailVerificationCodes).values({
      id: crypto.randomUUID(),
      ...record,
      created_at: new Date(now).toISOString(),
    });
  }
}

async function ensureRegisterEmailAvailable(email: string) {
  const db = getDb();
  const rows = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(eq(schema.profiles.account, email))
    .limit(1);

  if (rows.length > 0) {
    throw new Error("该邮箱已注册，请直接登录。");
  }
}

async function sendRegisterCodeByBrevo(email: string, code: string) {
  const mail = buildRegisterCodeEmail(code);
  await sendBrevoEmail({
    toEmail: email,
    subject: mail.subject,
    textContent: mail.text,
    htmlContent: mail.html,
  });
}

async function verifyRegisterCodeAndCreateUser(input: {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
  scope: AuthScope;
}) {
  const passwordError = validateRegisterPassword(
    input.password,
    input.confirmPassword,
  );
  if (passwordError) {
    return { error: passwordError };
  }

  const record = await getRegisterVerificationRecord(input.email);

  if (!record || record.consumed_at) {
    return { error: "请先获取注册验证码。" };
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await removeRegisterVerificationRecord(input.email);
    return { error: "验证码已过期，请重新获取。" };
  }

  const submittedHash = hashVerificationCode(
    input.email,
    REGISTER_CODE_PURPOSE,
    input.code,
  );
  if (submittedHash !== record.code_hash) {
    const db = getDb();
    const nextAttempts = Number(record.attempt_count || 0) + 1;

    await db
      .update(schema.emailVerificationCodes)
      .set({
        attempt_count: nextAttempts,
        updated_at: new Date().toISOString(),
      })
      .where(eq(schema.emailVerificationCodes.id, record.id));

    if (nextAttempts >= MAX_REGISTER_VERIFY_ATTEMPTS) {
      await removeRegisterVerificationRecord(input.email);
      return { error: "验证码输入错误次数过多，请重新获取。" };
    }

    return { error: "验证码无效或已过期，请重新输入。" };
  }

  const db = getDb();
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  const nickname = input.email.split("@")[0].slice(0, 24);
  const passwordHash = await hashPassword(input.password);

  await db.insert(schema.profiles).values({
    id: userId,
    account: input.email,
    password_hash: passwordHash,
    nickname,
    balance: 0,
    app_role: "user",
    campus_available_balance: 0,
    campus_pending_balance: 0,
    campus_settlement_applying_amount: 0,
    campus_settled_total: 0,
    created_at: now,
    updated_at: now,
  });

  await removeRegisterVerificationRecord(input.email);

  await createSession({
    userId,
    email: input.email,
    role: "user",
  });

  if (input.scope === "admin") {
    return { error: "当前邮箱不是管理员账号。" };
  }

  return { success: true, redirectTo: "/campus" };
}

export async function requestEmailCode(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") || ""));
  const mode = String(formData.get("mode") || "login");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const resend = String(formData.get("resend") || "") === "true";
  const turnstileToken = String(formData.get("turnstileToken") || "");

  if (!validateEmail(email)) {
    return { error: "请输入有效的邮箱地址。" };
  }

  const turnstileResult = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResult.success) {
    return { error: turnstileResult.error || "人机验证失败，请重试。" };
  }

  if (mode === "register") {
    const passwordError = validateRegisterPassword(password, confirmPassword);
    if (passwordError) {
      return { error: passwordError };
    }

    try {
      await ensureRegisterEmailAvailable(email);
      const code = generateEmailCode();
      await storeRegisterVerificationCode(email, code);

      try {
        await sendRegisterCodeByBrevo(email, code);
      } catch (error) {
        await removeRegisterVerificationRecord(email).catch(() => {});
        throw error;
      }

      return {
        success: true,
        message: resend
          ? "注册验证码已重新发送，请查收邮箱并完成验证。"
          : "注册验证码已发送到你的邮箱，请输入验证码完成注册。",
      };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "发送注册验证码失败，请稍后重试。",
      };
    }
  }

  // Login mode: password-based, no OTP
  return { error: "登录请使用邮箱和密码。" };
}

export async function verifyEmailCode(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") || ""));
  const code = String(formData.get("code") || "").trim();
  const scope = resolveScope(String(formData.get("scope") || "user"));
  const mode = String(formData.get("mode") || "login");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!validateEmail(email)) {
    return { error: "请输入有效的邮箱地址。" };
  }

  if (!/^\d{6}$/.test(code)) {
    return { error: "请输入 6 位邮箱验证码。" };
  }

  if (mode === "register") {
    try {
      return await verifyRegisterCodeAndCreateUser({
        email,
        code,
        password,
        confirmPassword,
        scope,
      });
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "注册验证失败，请稍后重试。",
      };
    }
  }

  return { error: "登录请使用邮箱和密码。" };
}

export async function loginWithPassword(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") || ""));
  const password = String(formData.get("password") || "");
  const scope = resolveScope(String(formData.get("scope") || "user"));
  const turnstileToken = String(formData.get("turnstileToken") || "");

  if (!validateEmail(email)) {
    return { error: "请输入有效的邮箱地址。" };
  }

  if (!password) {
    return { error: "请输入密码。" };
  }

  const turnstileResult = await verifyTurnstileToken(turnstileToken);
  if (!turnstileResult.success) {
    return { error: turnstileResult.error || "人机验证失败，请重试。" };
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.account, email))
    .limit(1);

  const profile = rows[0];
  if (!profile) {
    return { error: "该邮箱尚未注册，请先注册。" };
  }

  if (!profile.password_hash) {
    return { error: "该账号尚未设置密码，请联系管理员。" };
  }

  const valid = await verifyPassword(password, profile.password_hash);
  if (!valid) {
    return { error: "邮箱或密码错误。" };
  }

  const role = (profile.app_role as AppRole) || "user";

  if (scope === "admin" && role !== "admin") {
    return { error: "当前邮箱不是管理员账号。" };
  }

  await createSession({
    userId: profile.id,
    email,
    role,
  });

  const redirectTo =
    role === "admin" && scope === "admin" ? "/admin" : "/campus";
  return { success: true, redirectTo };
}

export async function signOut() {
  await destroySession();
  redirect("/auth/login");
}

export async function getSession() {
  return getAuthSession();
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  if (!session) {
    return null;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, session.userId))
    .limit(1);

  const profile = rows[0] ?? null;
  return {
    user: { id: session.userId, email: session.email },
    profile,
  };
}

export async function getProfileRole(userId: string) {
  const db = getDb();
  const rows = await db
    .select({ app_role: schema.profiles.app_role })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1);

  return (rows[0]?.app_role as AppRole) ?? "user";
}
