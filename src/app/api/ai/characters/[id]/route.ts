import { NextResponse } from 'next/server'
import {
  buildAiCharacterSummary,
  readAiDb,
  requireAiCurrentUser,
  validateAiCharacterInput,
  withAiDb,
} from '@/lib/ai-companion'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAiCurrentUser()
    const { id } = await params
    const db = await readAiDb()
    const character = db.characters.find((entry) => entry.id === id && entry.userId === user.id)

    if (!character) {
      throw new Error('角色不存在。')
    }

    return NextResponse.json({ character })
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载角色失败。'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAiCurrentUser()
    const { id } = await params
    const draft = validateAiCharacterInput(await request.json())

    const character = await withAiDb((db) => {
      const index = db.characters.findIndex((entry) => entry.id === id && entry.userId === user.id)
      if (index < 0) {
        throw new Error('角色不存在。')
      }

      const current = db.characters[index]
      const next = {
        ...current,
        ...draft,
        summary: buildAiCharacterSummary({
          name: draft.name,
          relationship: draft.relationship,
          personality: draft.personality,
          speechStyle: draft.speechStyle,
          background: draft.background,
          interactionStyle: draft.interactionStyle,
        }),
        updatedAt: new Date().toISOString(),
      }

      db.characters[index] = next
      return next
    })

    return NextResponse.json({ character })
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新角色失败。'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAiCurrentUser()
    const { id } = await params

    await withAiDb((db) => {
      const character = db.characters.find((entry) => entry.id === id && entry.userId === user.id)
      if (!character) {
        throw new Error('角色不存在。')
      }

      const conversationIds = db.conversations
        .filter((entry) => entry.characterId === id && entry.userId === user.id)
        .map((entry) => entry.id)

      db.characters = db.characters.filter((entry) => !(entry.id === id && entry.userId === user.id))
      db.conversations = db.conversations.filter((entry) => !conversationIds.includes(entry.id))
      db.messages = db.messages.filter((entry) => !conversationIds.includes(entry.conversationId))
      db.memories = db.memories.filter((entry) => !(entry.characterId === id && entry.userId === user.id))
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除角色失败。'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
