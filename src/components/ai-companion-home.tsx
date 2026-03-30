"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Bot, MessageCircle, Plus, Sparkles, Wand2 } from 'lucide-react'
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

const TEMPLATE_SURFACES = [
  'from-rose-50 via-white to-orange-50',
  'from-sky-50 via-white to-cyan-50',
  'from-slate-50 via-white to-zinc-50',
  'from-lime-50 via-white to-emerald-50',
  'from-fuchsia-50 via-white to-indigo-50',
  'from-amber-50 via-white to-cyan-50',
]

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
        throw new Error(data.error || '进入对话失败。')
      }

      router.push(`/ai-companion/conversations/${data.conversation.id}`)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '进入对话失败。')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.96),_rgba(34,197,94,0.88)_50%,_rgba(14,165,233,0.92))] text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
          <CardContent className="relative p-8 sm:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),transparent_46%,rgba(255,255,255,0.12))]" />
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-white/15 bg-white/18 text-white">AI 陪伴模块</Badge>
                <Badge className="border-white/20 bg-slate-950/15 text-white">单角色单会话</Badge>
              </div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">把更自然的 AI 陪伴接进轻创 Qintra</h1>
                <p className="max-w-3xl text-base leading-8 text-white/90 sm:text-lg">
                  角色设定、长期聊天、记忆摘要和语气微调都留在当前站点里。每个角色只保留一个持续对话窗口，历史消息会自动延续，回到聊天时就是上一次的状态。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/ai-companion/characters/new" className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950/85 px-6 text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-950">
                  创建角色
                </Link>
                <a
                  href="#ai-templates"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/35 bg-white/12 px-6 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  先挑模板
                </a>
              </div>
              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/12 bg-white/12 p-5 backdrop-blur">
                  <div className="text-sm text-white/70">支持模型</div>
                  <div className="mt-2 text-2xl font-semibold">glm-4.7-flash</div>
                </div>
                <div className="rounded-3xl border border-white/12 bg-white/12 p-5 backdrop-blur">
                  <div className="text-sm text-white/70">对话模式</div>
                  <div className="mt-2 text-2xl font-semibold">单窗口持续聊天</div>
                </div>
                <div className="rounded-3xl border border-white/12 bg-white/12 p-5 backdrop-blur">
                  <div className="text-sm text-white/70">记忆方式</div>
                  <div className="mt-2 text-2xl font-semibold">自动摘要沉淀</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <Badge variant="warning">接入之后</Badge>
            <CardTitle className="mt-3 text-2xl">这一版更适合长期陪伴</CardTitle>
            <CardDescription className="mt-2 leading-7">
              去掉多会话入口后，角色关系会更稳定，用户回到聊天时也不会被多条历史线打断。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-amber-50 p-5">
              <div className="flex items-center gap-3 text-sm font-semibold text-amber-900">
                <Sparkles className="h-4 w-4" />
                模板更丰富
              </div>
              <p className="mt-3 text-sm leading-7 text-amber-900/80">默认补充了男朋友、女朋友、治愈系、搭子、OC 等更明确的人设起点，减少空白创建时的阻力。</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-5">
              <div className="flex items-center gap-3 text-sm font-semibold text-emerald-900">
                <MessageCircle className="h-4 w-4" />
                只有一个持续对话
              </div>
              <p className="mt-3 text-sm leading-7 text-emerald-900/80">同一个角色始终复用一个对话窗口，消息不会散落到多个会话里，内容会持续保存。</p>
            </div>
            <div className="rounded-3xl bg-sky-50 p-5">
              <div className="flex items-center gap-3 text-sm font-semibold text-sky-900">
                <Wand2 className="h-4 w-4" />
                更干净的按钮和层级
              </div>
              <p className="mt-3 text-sm leading-7 text-sky-900/80">首页主按钮、模板卡片和角色卡片的动作层级重新梳理，避免主次按钮在大背景上发虚发白。</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="ai-templates" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge variant="warning">模板库</Badge>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">先选一个更接近的起点</h2>
            <p className="mt-2 max-w-3xl text-gray-600 leading-7">
              模板只是起始骨架。你可以先用更接近的关系和语气开局，再进入角色详情里慢慢微调，最后都会落到自己的专属设定上。
            </p>
          </div>
          <Link href="/ai-companion/characters/new">
            <Button variant="secondary"><Plus className="mr-2 h-4 w-4" />空白创建</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template, index) => (
            <Card key={template.id} className="border-none shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
              <CardContent className={`space-y-4 rounded-[1.75rem] bg-gradient-to-br p-6 ${TEMPLATE_SURFACES[index % TEMPLATE_SURFACES.length]}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xl font-bold text-gray-900">{template.name}</div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{template.blurb}</p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-gray-700 shadow-sm">
                    {template.avatarFallback.slice(0, 2)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
                <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-gray-600">
                  关系定位：{template.relationship || '自定义'}
                </div>
                <Link href={`/ai-companion/characters/new?template=${template.id}`}>
                  <Button className="w-full justify-between">
                    用这个模板创建
                    <ArrowRight className="h-4 w-4" />
                  </Button>
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
            <h2 className="mt-3 text-3xl font-bold text-gray-900">已创建角色与最近更新</h2>
          </div>
          <Link href="/ai-companion/characters/new">
            <Button><Plus className="mr-2 h-4 w-4" />新建角色</Button>
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent className="p-6 text-sm text-gray-500">正在加载你的 AI 角色...</CardContent>
          </Card>
        ) : characters.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="space-y-4 p-8 text-center">
              <Bot className="mx-auto h-10 w-10 text-sky-600" />
              <div className="text-xl font-semibold text-gray-900">你还没有创建角色</div>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-gray-600">
                建议先从模板开始。这样能更快得到一个关系明确、说话风格稳定的角色，然后再慢慢把它调整成更像你想要的样子。
              </p>
              <div className="flex justify-center">
                <Link href="/ai-companion/characters/new"><Button>现在创建</Button></Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {characters.map((character) => (
              <Card key={character.id} className="border-none shadow-lg transition-all duration-300 hover:shadow-xl">
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar
                        className="h-14 w-14 rounded-2xl"
                        src={character.avatarUrl || undefined}
                        alt={character.name}
                        fallback={buildInitials(character.name)}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-xl font-bold text-gray-900">{character.name}</div>
                        <div className="truncate text-sm text-gray-500">{character.relationship} · {character.modelName}</div>
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-xs text-gray-400">{formatTime(character.updatedAt)}</div>
                  </div>
                  <p className="text-sm leading-7 text-gray-600">{character.summary}</p>
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    每个角色只有一个持续对话窗口，点击进入会直接回到原来的聊天内容。
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button isLoading={pendingId === character.id} onClick={() => void startConversation(character.id)}>
                      <MessageCircle className="mr-2 h-4 w-4" />进入对话
                    </Button>
                    <Link href={`/ai-companion/characters/${character.id}`}>
                      <Button variant="outline">编辑设定</Button>
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