import { NextResponse } from 'next/server'
import {
  buildAiCharacterSummary,
  readAiDb,
  requireAiCurrentUser,
  validateAiCharacterInput,
  withAiDb,
  type AiCharacter,
} from '@/lib/ai-companion'

export async function GET() {
  try {
    const user = await requireAiCurrentUser()
    const db = await readAiDb()
    const characters = db.characters
      .filter((entry) => entry.userId === user.id)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

    return NextResponse.json({ characters })
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载角色失败。'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAiCurrentUser()
    const draft = validateAiCharacterInput(await request.json())
    const now = new Date().toISOString()

    const character: AiCharacter = {
      id: crypto.randomUUID(),
      userId: user.id,
      avatarUrl: draft.avatarUrl,
      name: draft.name,
      relationship: draft.relationship,
      personality: draft.personality,
      speechStyle: draft.speechStyle,
      background: draft.background,
      interactionStyle: draft.interactionStyle,
      boundaries: draft.boundaries,
      firstMessage: draft.firstMessage,
      summary: buildAiCharacterSummary({
        name: draft.name,
        relationship: draft.relationship,
        personality: draft.personality,
        speechStyle: draft.speechStyle,
        background: draft.background,
        interactionStyle: draft.interactionStyle,
      }),
      modelName: draft.modelName,
      createdAt: now,
      updatedAt: now,
    }

    await withAiDb((db) => {
      db.characters.unshift(character)
    })

    return NextResponse.json({ character })
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建角色失败。'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
