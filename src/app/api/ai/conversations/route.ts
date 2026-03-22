import { NextResponse } from 'next/server'
import {
  readAiDb,
  requireAiCurrentUser,
  validateAiConversationInput,
  withAiDb,
  type AiConversation,
  type AiMessage,
} from '@/lib/ai-companion'

export async function GET(request: Request) {
  try {
    const user = await requireAiCurrentUser()
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get('characterId')
    const db = await readAiDb()

    const conversations = db.conversations
      .filter((entry) => entry.userId === user.id)
      .filter((entry) => !characterId || entry.characterId === characterId)
      .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt))

    return NextResponse.json({ conversations })
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载会话失败。'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAiCurrentUser()
    const { characterId } = validateAiConversationInput(await request.json())

    const conversation = await withAiDb((db) => {
      const character = db.characters.find((entry) => entry.id === characterId && entry.userId === user.id)
      if (!character) {
        throw new Error('角色不存在。')
      }

      const now = new Date().toISOString()
      const nextConversation: AiConversation = {
        id: crypto.randomUUID(),
        userId: user.id,
        characterId: character.id,
        title: `${character.name} 的聊天`,
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      }

      db.conversations.unshift(nextConversation)

      if (character.firstMessage.trim()) {
        const firstMessage: AiMessage = {
          id: crypto.randomUUID(),
          conversationId: nextConversation.id,
          role: 'assistant',
          content: character.firstMessage.trim(),
          createdAt: now,
        }
        db.messages.push(firstMessage)
      }

      return nextConversation
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建会话失败。'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
