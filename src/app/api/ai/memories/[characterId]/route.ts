import { NextResponse } from 'next/server'
import { readAiDb, requireAiCurrentUser } from '@/lib/ai-companion'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ characterId: string }> },
) {
  try {
    const user = await requireAiCurrentUser()
    const { characterId } = await params
    const db = await readAiDb()

    const character = db.characters.find((entry) => entry.id === characterId && entry.userId === user.id)
    if (!character) {
      throw new Error('角色不存在。')
    }

    const memory = db.memories.find((entry) => entry.characterId === characterId && entry.userId === user.id) ?? null
    return NextResponse.json({ memory })
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载记忆失败。'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
