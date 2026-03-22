"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/UI/Avatar'
import { Badge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { AiCharacterForm } from '@/components/ai-character-form'
import type { AiCharacter, AiCharacterDraft, AiCharacterTemplate, AiConversation, AiMemory } from '@/lib/ai-companion'

interface CharacterResponse {
  character: AiCharacter
}

interface ConversationListResponse {
  conversations: AiConversation[]
}

interface MemoryResponse {
  memory: AiMemory | null
}

interface ConversationCreateResponse {
  conversation: AiConversation
}

function toDraft(character: AiCharacter): AiCharacterDraft {
  return {
    avatarUrl: character.avatarUrl,
    name: character.name,
    relationship: character.relationship,
    personality: character.personality,
    speechStyle: character.speechStyle,
    background: character.background,
    interactionStyle: character.interactionStyle,
    boundaries: character.boundaries,
    firstMessage: character.firstMessage,
    modelName: character.modelName,
  }
}

function buildInitials(name: string) {
  const normalized = name.trim()
  if (!normalized) {
    return 'AI'
  }
  return Array.from(normalized).slice(0, 2).join('').toUpperCase()
}

function formatTime(input: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(input))
}

export function AiCharacterDetailClient({
  characterId,
  templates,
}: {
  characterId: string
  templates: AiCharacterTemplate[]
}) {
  const router = useRouter()
  const [character, setCharacter] = React.useState<AiCharacter | null>(null)
  const [conversations, setConversations] = React.useState<AiConversation[]>([])
  const [memory, setMemory] = React.useState<AiMemory | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [characterResponse, conversationsResponse, memoryResponse] = await Promise.all([
        fetch(`/api/ai/characters/${characterId}`, { cache: 'no-store' }),
        fetch(`/api/ai/conversations?characterId=${characterId}`, { cache: 'no-store' }),
        fetch(`/api/ai/memories/${characterId}`, { cache: 'no-store' }),
      ])

      const [characterData, conversationsData, memoryData] = await Promise.all([
        characterResponse.json() as Promise<CharacterResponse & { error?: string }>,
        conversationsResponse.json() as Promise<ConversationListResponse & { error?: string }>,
        memoryResponse.json() as Promise<MemoryResponse & { error?: string }>,
      ])

      if (!characterResponse.ok) {
        throw new Error(characterData.error || '角色不存在。')
      }

      setCharacter(characterData.character)
      setConversations(conversationsData.conversations || [])
      setMemory(memoryData.memory || null)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '加载角色详情失败。')
    } finally {
      setLoading(false)
    }
  }, [characterId])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  async function startChat() {
    setPending(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ characterId }),
      })
      const data = (await response.json()) as ConversationCreateResponse & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || '创建会话失败。')
      }

      router.push(`/ai-companion/conversations/${data.conversation.id}`)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '创建会话失败。')
    } finally {
      setPending(false)
    }
  }

  async function deleteCharacter() {
    if (!window.confirm('确认删除这个角色吗？关联会话和记忆也会一起删除。')) {
      return
    }

    setPending(true)
    setError(null)

    try {
      const response = await fetch(`/api/ai/characters/${characterId}`, {
        method: 'DELETE',
      })
      const data = (await response.json()) as { success?: boolean; error?: string }

      if (!response.ok) {
        throw new Error(data.error || '删除角色失败。')
      }

      router.push('/ai-companion')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '删除角色失败。')
      setPending(false)
    }
  }

  if (loading) {
    return <Card><CardContent className="p-6 text-sm text-gray-500">正在加载角色详情...</CardContent></Card>
  }

  if (!character) {
    return <Card><CardContent className="p-6 text-sm text-red-600">{error || '角色不存在。'}</CardContent></Card>
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card className="border-none shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar className="h-20 w-20 rounded-3xl" src={character.avatarUrl || undefined} fallback={buildInitials(character.name)} />
                <div className="min-w-0">
                  <Badge variant="secondary">角色详情</Badge>
                  <h1 className="text-4xl font-bold text-gray-900 mt-3 truncate">{character.name}</h1>
                  <p className="text-sm text-gray-500 mt-2">{character.relationship} · {character.modelName}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button isLoading={pending} onClick={() => void startChat()}>新建聊天</Button>
                <Button variant="outline" onClick={() => void deleteCharacter()}>删除角色</Button>
              </div>
            </div>

            {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gray-50 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">角色摘要</div>
                <p className="text-sm text-gray-600 leading-7 mt-3">{character.summary}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">更新时间</div>
                <p className="text-sm text-gray-600 leading-7 mt-3">{formatTime(character.updatedAt)}</p>
                <p className="text-xs text-gray-400 mt-3">创建于 {formatTime(character.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <Badge variant="warning">长期记忆</Badge>
              <CardTitle className="mt-3">角色会慢慢记住你</CardTitle>
              <CardDescription>聊天越多，这里的摘要越稳定。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-gray-700 leading-7">
                {memory?.summary || '还没有长期记忆。等你们持续聊几轮后，系统会自动整理摘要。'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>历史会话</CardTitle>
              <CardDescription>{conversations.length} 条会话</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversations.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">还没有会话，先点击上面的“新建聊天”。</div>
              ) : (
                conversations.map((conversation) => (
                  <Link key={conversation.id} href={`/ai-companion/conversations/${conversation.id}`} className="block rounded-2xl border border-gray-200 bg-white px-4 py-4 transition hover:border-cyan-300 hover:bg-cyan-50">
                    <div className="font-semibold text-gray-900">{conversation.title}</div>
                    <div className="text-xs text-gray-500 mt-2">更新于 {formatTime(conversation.lastMessageAt)}</div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <AiCharacterForm
        mode="edit"
        characterId={character.id}
        templates={templates}
        initialCharacter={toDraft(character)}
        onSaved={(nextCharacter) => {
          setCharacter(nextCharacter)
          void loadData()
        }}
      />
    </div>
  )
}
