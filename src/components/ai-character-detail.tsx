"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageCircle, PencilLine, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/UI/Avatar'
import { Badge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { AiCharacterForm } from '@/components/ai-character-form'
import type { AiCharacter, AiCharacterDraft, AiCharacterTemplate, AiConversation, AiMemory } from '@/lib/ai-companion'

interface CharacterResponse {
  character: AiCharacter
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
  const [memory, setMemory] = React.useState<AiMemory | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [characterResponse, memoryResponse] = await Promise.all([
        fetch(`/api/ai/characters/${characterId}`, { cache: 'no-store' }),
        fetch(`/api/ai/memories/${characterId}`, { cache: 'no-store' }),
      ])

      const [characterData, memoryData] = await Promise.all([
        characterResponse.json() as Promise<CharacterResponse & { error?: string }>,
        memoryResponse.json() as Promise<MemoryResponse & { error?: string }>,
      ])

      if (!characterResponse.ok) {
        throw new Error(characterData.error || '角色不存在。')
      }

      setCharacter(characterData.character)
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
        throw new Error(data.error || '进入对话失败。')
      }

      router.push(`/ai-companion/conversations/${data.conversation.id}`)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '进入对话失败。')
    } finally {
      setPending(false)
    }
  }

  async function deleteCharacter() {
    if (!window.confirm('确认删除这个角色吗？关联聊天记录和长期记忆也会一起删除。')) {
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
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="border-none shadow-xl">
          <CardContent className="space-y-6 p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="h-20 w-20 rounded-3xl" src={character.avatarUrl || undefined} fallback={buildInitials(character.name)} />
                <div className="min-w-0">
                  <Badge variant="secondary">角色详情</Badge>
                  <h1 className="mt-3 truncate text-4xl font-bold text-gray-900">{character.name}</h1>
                  <p className="mt-2 text-sm text-gray-500">{character.relationship} · {character.modelName}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button isLoading={pending} onClick={() => void startChat()}>
                  <MessageCircle className="mr-2 h-4 w-4" />进入对话
                </Button>
                <Button variant="outline" onClick={() => void deleteCharacter()}>
                  <Trash2 className="mr-2 h-4 w-4" />删除角色
                </Button>
              </div>
            </div>

            {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-gray-50 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">角色摘要</div>
                <p className="mt-3 text-sm leading-7 text-gray-600">{character.summary}</p>
              </div>
              <div className="rounded-3xl bg-gray-50 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-400">单一会话模式</div>
                <p className="mt-3 text-sm leading-7 text-gray-600">这个角色始终只有一个持续聊天窗口。再次点击“进入对话”时，会直接回到原来的聊天历史，不会再新建第二条会话。</p>
                <p className="mt-3 text-xs text-gray-400">最近更新于 {formatTime(character.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <Badge variant="warning">长期记忆</Badge>
              <CardTitle className="mt-3">角色会慢慢记住你</CardTitle>
              <CardDescription>聊天越多，这里的长期摘要越稳定。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-7 text-gray-700">
                {memory?.summary || '还没有长期记忆。等你们持续聊一段时间后，系统会自动把互动轨迹整理成长期摘要。'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <Badge>使用提示</Badge>
              <CardTitle className="mt-3">现在更适合长期陪伴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-gray-600">
              <div className="rounded-2xl bg-sky-50 p-4">不再区分“新建聊天”和“历史会话”。同一个角色只有一条持续消息流，回来时会接着上次的状态继续。</div>
              <div className="rounded-2xl bg-emerald-50 p-4">想改名字、关系、语气或开场白，直接在下方编辑；保存后不会丢失历史消息。</div>
              <div className="rounded-2xl bg-gray-50 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-gray-900">直接回到聊天</div>
                  <div className="text-xs text-gray-500 mt-1">继续当前唯一对话窗口</div>
                </div>
                <Button onClick={() => void startChat()} isLoading={pending}>
                  <PencilLine className="mr-2 h-4 w-4" />继续聊天
                </Button>
              </div>
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