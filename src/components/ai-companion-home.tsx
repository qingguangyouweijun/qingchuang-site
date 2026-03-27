"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bot, MessageCircle, Plus, Sparkles, SunMedium } from 'lucide-react'
import { Avatar } from '@/components/UI/Avatar'
import { Badge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import type { AiCharacter, AiCharacterTemplate, AiConversation } from '@/lib/ai-companion'

interface CharacterListResponse {
  characters: AiCharacter[]
}

interface ConversationCreateResponse {
  conversation: AiConversation
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

export function AiCompanionHomeClient({
  templates,
}: {
  templates: AiCharacterTemplate[]
}) {
  const router = useRouter()
  const [characters, setCharacters] = React.useState<AiCharacter[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pendingId, setPendingId] = React.useState<string | null>(null)

  const loadCharacters = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/characters', {
        cache: 'no-store',
      })
      const data = (await response.json()) as CharacterListResponse & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || '加载角色失败。')
      }

      setCharacters(data.characters)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '加载角色失败。')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadCharacters()
  }, [loadCharacters])

  async function startConversation(characterId: string) {
    setPendingId(characterId)
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
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="border-none shadow-xl bg-gradient-to-br from-amber-500 via-emerald-500 to-sky-600 text-white">
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-white/15 text-white hover:bg-white/15">AI 陪伴模块</Badge>
              <Badge variant="outline" className="border-white/20 text-white">复用当前账号登录</Badge>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">把 AI 陪伴接进轻创 Qintra</h1>
              <p className="text-white/85 mt-4 max-w-2xl leading-8">
                角色创建、长期聊天、记忆摘要、语气微调都放进当前站点。
                普通用户不再单独注册第二套账号，直接用现有登录态进入聊天模块。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/ai-companion/characters/new"><Button size="lg">创建角色</Button></Link>
              <Link href="#ai-templates"><Button size="lg" variant="glass" className="text-white hover:bg-white/20">先挑模板</Button></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-sm text-white/70">支持模型</div>
                <div className="text-xl font-semibold mt-2">glm-4.7-flash</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-sm text-white/70">数据存储</div>
                <div className="text-xl font-semibold mt-2">本地 JSON 账本</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-sm text-white/70">记忆方式</div>
                <div className="text-xl font-semibold mt-2">自动摘要更新</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SunMedium className="w-5 h-5 text-amber-600" />
              接入后的核心能力
            </CardTitle>
            <CardDescription>这部分不再独立部署，直接作为普通用户功能模块提供。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600 leading-7">
            <div className="rounded-2xl bg-amber-50 p-4">
              角色由你自定义：名字、关系、性格、语气、背景、相处方式、边界、开场白、默认模型。
            </div>
            <div className="rounded-2xl bg-lime-50 p-4">
              每个角色可以开多条会话，适合日常聊天、陪伴、剧情推进和人设实验。
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              聊天后自动生成长期记忆摘要，后续回复会把既有人设和互动历史一起带进模型提示词。
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="ai-templates" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge variant="warning">模板库</Badge>
            <h2 className="text-3xl font-bold text-gray-900 mt-3">先套模板，再慢慢调人设</h2>
            <p className="text-gray-600 mt-2 max-w-3xl leading-7">这些模板只是起点。你可以用模板开局，也可以从空白角色开始。</p>
          </div>
          <Link href="/ai-companion/characters/new"><Button variant="secondary"><Plus className="w-4 h-4 mr-2" />空白创建</Button></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {templates.map((template) => (
            <Card key={template.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-bold text-gray-900">{template.name}</div>
                    <p className="text-sm text-gray-600 leading-6 mt-2">{template.blurb}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-semibold">
                    {template.avatarFallback.slice(0, 2)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
                <div className="text-sm text-gray-500">关系：{template.relationship || '自由定义'}</div>
                <Link href={`/ai-companion/characters/new?template=${template.id}`}>
                  <Button className="w-full">使用这个模板</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge>我的角色</Badge>
            <h2 className="text-3xl font-bold text-gray-900 mt-3">已创建角色与最近更新</h2>
          </div>
          <Link href="/ai-companion/characters/new"><Button><Plus className="w-4 h-4 mr-2" />新建角色</Button></Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <Card><CardContent className="p-6 text-sm text-gray-500">正在加载你的 AI 角色...</CardContent></Card>
        ) : characters.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Bot className="w-10 h-10 mx-auto text-sky-600" />
              <div className="text-xl font-semibold text-gray-900">你还没有创建角色</div>
              <p className="text-sm text-gray-600 leading-7 max-w-2xl mx-auto">
                建议先从模板开始，这样更容易得到一个稳定、不容易跑偏的小模型角色。
              </p>
              <div className="flex justify-center">
                <Link href="/ai-companion/characters/new"><Button>现在创建</Button></Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {characters.map((character) => (
              <Card key={character.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <Avatar
                        className="h-14 w-14 rounded-2xl"
                        src={character.avatarUrl || undefined}
                        alt={character.name}
                        fallback={buildInitials(character.name)}
                      />
                      <div className="min-w-0">
                        <div className="text-xl font-bold text-gray-900 truncate">{character.name}</div>
                        <div className="text-sm text-gray-500 truncate">{character.relationship} · {character.modelName}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">{formatTime(character.updatedAt)}</div>
                  </div>
                  <p className="text-sm text-gray-600 leading-7">{character.summary}</p>
                  <div className="flex flex-wrap gap-3">
                    <Button isLoading={pendingId === character.id} onClick={() => void startConversation(character.id)}>
                      <MessageCircle className="w-4 h-4 mr-2" />开始聊天
                    </Button>
                    <Link href={`/ai-companion/characters/${character.id}`}>
                      <Button variant="outline">查看详情</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}


