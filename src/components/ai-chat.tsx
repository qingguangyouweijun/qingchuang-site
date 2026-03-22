"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/UI/Avatar'
import { Badge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import type { AiCharacter, AiConversation, AiMemory, AiMessage } from '@/lib/ai-companion'

const toneOptions = ['更温柔一点', '更黏一点', '更毒舌一点', '更主动一点', '少一点废话']
const loadingPhrases = ['正在整理语气...', '正在匹配角色风格...', '正在生成回复...', '正在结合聊天记忆...', '正在让 TA 说得更自然一点...']

interface ConversationBundleResponse {
  conversation: AiConversation
  character: AiCharacter
  messages: AiMessage[]
  memory: AiMemory | null
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
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(input))
}

export function AiChatClient({ conversationId }: { conversationId: string }) {
  const router = useRouter()
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  const [conversation, setConversation] = React.useState<AiConversation | null>(null)
  const [character, setCharacter] = React.useState<AiCharacter | null>(null)
  const [messages, setMessages] = React.useState<AiMessage[]>([])
  const [memory, setMemory] = React.useState<AiMemory | null>(null)
  const [composer, setComposer] = React.useState('')
  const [toneHint, setToneHint] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [loadingIndex, setLoadingIndex] = React.useState(0)

  const loadConversation = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}/messages`, {
        cache: 'no-store',
      })
      const data = (await response.json()) as ConversationBundleResponse & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || '加载会话失败。')
      }

      setConversation(data.conversation)
      setCharacter(data.character)
      setMessages(data.messages || [])
      setMemory(data.memory || null)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '加载会话失败。')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  React.useEffect(() => {
    void loadConversation()
  }, [loadConversation])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, sending])

  React.useEffect(() => {
    if (!sending) {
      setLoadingIndex(0)
      return
    }

    const timer = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % loadingPhrases.length)
    }, 1200)

    return () => window.clearInterval(timer)
  }, [sending])

  async function handleSend() {
    const content = composer.trim()
    if (!content || sending) {
      return
    }

    setSending(true)
    setError(null)
    setComposer('')

    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, toneHint }),
      })
      const data = (await response.json()) as ConversationBundleResponse & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || '发送消息失败。')
      }

      setConversation(data.conversation)
      setCharacter(data.character)
      setMessages(data.messages || [])
      setMemory(data.memory || null)
      setToneHint('')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '发送消息失败。')
      setComposer(content)
      await loadConversation()
    } finally {
      setSending(false)
    }
  }

  async function copyMessage(content: string) {
    await navigator.clipboard.writeText(content)
  }

  if (loading) {
    return <Card><CardContent className="p-6 text-sm text-gray-500">正在加载聊天...</CardContent></Card>
  }

  if (!conversation || !character) {
    return <Card><CardContent className="p-6 text-sm text-red-600">{error || '会话不存在。'}</CardContent></Card>
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.06fr_0.94fr] gap-6">
      <section className="flex min-h-[72vh] flex-col rounded-3xl border border-white/50 bg-white/85 p-6 shadow-xl backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="h-16 w-16 rounded-2xl" src={character.avatarUrl || undefined} fallback={buildInitials(character.name)} />
            <div className="min-w-0">
              <div className="text-3xl font-bold text-gray-900 truncate">{character.name}</div>
              <div className="text-sm text-gray-500 mt-1 truncate">{conversation.title}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => router.push(`/ai-companion/characters/${character.id}`)}>角色详情</Button>
            <Link href="/ai-companion"><Button variant="ghost">返回列表</Button></Link>
          </div>
        </div>

        <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((message) => {
            const isAssistant = message.role === 'assistant'
            return (
              <article key={message.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-[1.75rem] px-5 py-4 shadow-sm ${isAssistant ? 'border border-gray-200 bg-white text-gray-800' : 'bg-slate-950 text-white shadow-slate-900/10'}`}>
                  <div className="text-sm leading-7 whitespace-pre-wrap">{message.content}</div>
                  <div className={`mt-3 flex items-center justify-between gap-3 text-xs ${isAssistant ? 'text-gray-400' : 'text-white/60'}`}>
                    <span>{formatTime(message.createdAt)}</span>
                    {isAssistant && (
                      <button type="button" onClick={() => void copyMessage(message.content)} className="underline-offset-4 hover:underline">
                        复制
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}

          {sending && (
            <div className="max-w-[85%] rounded-[1.75rem] border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
              {loadingPhrases[loadingIndex]}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-6 border-t border-gray-200 pt-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {toneOptions.map((option) => {
              const active = toneHint === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setToneHint(active ? '' : option)}
                  className={`rounded-full px-3 py-2 text-xs font-medium transition ${active ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-200' : 'border border-gray-200 bg-white text-gray-600 hover:border-cyan-300 hover:text-cyan-700'}`}
                >
                  {option}
                </button>
              )
            })}
          </div>
          {error && <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="rounded-[1.75rem] border border-gray-200 bg-white p-3 shadow-sm">
            <textarea
              value={composer}
              onChange={(event) => setComposer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void handleSend()
                }
              }}
              rows={3}
              className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-7 text-gray-900 outline-none"
              placeholder={`给 ${character.name} 发条消息...`}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-2 pb-1">
              <span className="text-xs text-gray-400">Shift + Enter 换行，Enter 发送</span>
              <Button isLoading={sending} onClick={() => void handleSend()} disabled={!composer.trim()}>发送</Button>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <Card className="border-none shadow-xl">
          <CardHeader>
            <Badge variant="secondary">当前角色</Badge>
            <CardTitle className="mt-3">{character.name}</CardTitle>
            <CardDescription>{character.relationship} · {character.modelName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 leading-7">{character.summary}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <Badge variant="warning">长期记忆</Badge>
            <CardTitle className="mt-3">系统会自动整理摘要</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl bg-amber-50 p-4 text-sm text-gray-700 leading-7">
              {memory?.summary || '还没有长期记忆。继续聊一段时间后，这里会自动形成稳定摘要。'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>本轮语气微调</CardTitle>
            <CardDescription>这里只影响当前一轮回复，不会修改角色长期设定。</CardDescription>
          </CardHeader>
          <CardContent>
            {toneHint ? (
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">当前已选：{toneHint}</div>
            ) : (
              <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">未启用额外语气偏好。</div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
