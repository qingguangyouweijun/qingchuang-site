import { NextResponse } from 'next/server'
import {
  validateAiConversationInput,
  withAiDb,
  type AiConversation,
  type AiMessage,
} from '@/lib/ai-companion'
import { readAiDb, requireAiCurrentUser } from '@/lib/ai-companion'

function sortByRecent(left: AiConversation, right: AiConversation) {
  return right.lastMessageAt.localeCompare(left.lastMessageAt)
}

function toCanonicalConversationList(conversations: AiConversation[]) {
  const grouped = new Map<string, AiConversation>()

  for (const conversation of conversations.sort(sortByRecent)) {
    if (!grouped.has(conversation.characterId)) {
      grouped.set(conversation.characterId, conversation)
    }
  }

  return Array.from(grouped.values()).sort(sortByRecent)
}

function mergeCharacterConversations(db: {
  conversations: AiConversation[]
  messages: AiMessage[]
}, userId: string, characterId: string) {
  const matched = db.conversations
    .filter((entry) => entry.userId === userId && entry.characterId === characterId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || right.lastMessageAt.localeCompare(left.lastMessageAt))

  if (matched.length <= 1) {
    return matched[0] ?? null
  }

  const canonical = matched[0]
  const staleIds = new Set(matched.slice(1).map((entry) => entry.id))

  db.messages = db.messages.map((message) => {
    if (!staleIds.has(message.conversationId)) {
      return message
    }

    return {
      ...message,
      conversationId: canonical.id,
    }
  })

  db.conversations = db.conversations.filter((entry) => !staleIds.has(entry.id))

  const lastMessageAt = db.messages
    .filter((message) => message.conversationId === canonical.id)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .at(-1)?.createdAt || canonical.lastMessageAt

  const canonicalIndex = db.conversations.findIndex((entry) => entry.id === canonical.id)
  if (canonicalIndex >= 0) {
    db.conversations[canonicalIndex] = {
      ...db.conversations[canonicalIndex],
      lastMessageAt,
      updatedAt: lastMessageAt,
    }
    return db.conversations[canonicalIndex]
  }

  return canonical
}

export async function GET(request: Request) {
  try {
    const user = await requireAiCurrentUser()
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get('characterId')
    const db = await readAiDb()

    const conversations = toCanonicalConversationList(
      db.conversations
        .filter((entry) => entry.userId === user.id)
        .filter((entry) => !characterId || entry.characterId === characterId),
    )

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

      const mergedConversation = mergeCharacterConversations(db, user.id, character.id)
      if (mergedConversation) {
        return mergedConversation
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