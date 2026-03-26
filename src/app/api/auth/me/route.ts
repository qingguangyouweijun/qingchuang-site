import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ user: null, profile: null })
  }

  const db = getDb()
  const rows = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, session.userId))
    .limit(1)

  const profile = rows[0] ?? null

  return NextResponse.json({
    user: { id: session.userId, email: session.email },
    profile,
  })
}
