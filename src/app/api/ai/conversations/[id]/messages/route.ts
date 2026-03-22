import { NextResponse } from 'next/server'
import {
  buildAiConversationTitle,
  generateAiReply,
  getAiConversationBundle,
  readAiDb,
  requireAiCurrentUser,
  upsertAiMemoryRecord,
  validateAiMessageInput,
  withAiDb,
  type AiMessage,
} from '@/lib/ai-companion'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAiCurrentUser()
    const { id } = await params
    const db = await readAiDb()
    const bundle = getAiConversationBundle(db, id, user.id)

    if (!bundle) {
      throw new Error('会话不存在。')
    }

    return NextResponse.json(bundle)
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载会话失败。'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAiCurrentUser()
    const { id } = await params
    const payload = validateAiMessageInput(await request.json())

    const result = await withAiDb(async (db) => {
      const bundle = getAiConversationBundle(db, id, user.id)
      if (!bundle) {
        throw new Error('会话不存在。')
      }

      const firstUserTurn = bundle.messages.filter((entry) => entry.role === 'user').length === 0
      const userMessage: AiMessage = {
        id: crypto.randomUUID(),
        conversationId: id,
        role: 'user',
        content: payload.content,
        createdAt: new Date().toISOString(),
      }

      db.messages.push(userMessage)

      const messagesForModel = [...bundle.messages, userMessage]
      const replyContent = await generateAiReply({
        character: bundle.character,
        memory: bundle.memory,
        messages: messagesForModel,
        toneHint: payload.toneHint,
      })

      const assistantMessage: AiMessage = {
        id: crypto.randomUUID(),
        conversationId: id,
        role: 'assistant',
        content: replyContent,
        createdAt: new Date().toISOString(),
      }

      db.messages.push(assistantMessage)
      const allMessages = [...messagesForModel, assistantMessage]

      const conversationIndex = db.conversations.findIndex((entry) => entry.id === id && entry.userId === user.id)
      if (conversationIndex < 0) {
        throw new Error('会话不存在。')
      }

      const updatedConversation = {
        ...bundle.conversation,
        title: firstUserTurn ? buildAiConversationTitle(payload.content, bundle.character.name) : bundle.conversation.title,
        lastMessageAt: assistantMessage.createdAt,
        updatedAt: assistantMessage.createdAt,
      }
      db.conversations[conversationIndex] = updatedConversation

      const nextMemory = upsertAiMemoryRecord(bundle.memory ?? undefined, bundle.character, allMessages, user.id)
      const memoryIndex = db.memories.findIndex((entry) => entry.characterId === bundle.character.id && entry.userId === user.id)
      if (memoryIndex >= 0) {
        db.memories[memoryIndex] = nextMemory
      } else {
        db.memories.push(nextMemory)
      }

      return {
        conversation: updatedConversation,
        character: bundle.character,
        messages: allMessages,
        memory: nextMemory,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送消息失败。'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
