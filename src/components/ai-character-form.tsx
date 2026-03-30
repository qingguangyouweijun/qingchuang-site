"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/UI/Avatar'
import { Badge } from '@/components/UI/Badge'
import { Button } from '@/components/UI/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card'
import { Input } from '@/components/UI/Input'
import { Select } from '@/components/UI/Select'
import type { AiCharacter, AiCharacterDraft, AiCharacterTemplate } from '@/lib/ai-companion'

const MODEL_OPTIONS = ['glm-4.7-flash']
const RELATIONSHIP_OPTIONS = ['女朋友', '男朋友', '暧昧对象', '好朋友', '搭子', '知己', '学伴', '虚拟恋人', '自定义']
const QUICK_RELATIONSHIP_OPTIONS = ['女朋友', '男朋友', '暧昧对象', '好朋友']

const EMPTY_DRAFT: AiCharacterDraft = {
  avatarUrl: '',
  name: '',
  relationship: '',
  personality: '',
  speechStyle: '',
  background: '',
  interactionStyle: '',
  boundaries: '',
  firstMessage: '',
  modelName: 'glm-4.7-flash',
}

interface CharacterSaveResponse {
  character: AiCharacter
}

function buildInitials(name: string) {
  const normalized = name.trim()
  if (!normalized) {
    return 'AI'
  }

  return Array.from(normalized).slice(0, 2).join('').toUpperCase()
}

function templateToDraft(template: AiCharacterTemplate): AiCharacterDraft {
  return {
    avatarUrl: '',
    name: template.id === 'blank' ? '' : template.name,
    relationship: template.relationship,
    personality: template.personality,
    speechStyle: template.speechStyle,
    background: template.background,
    interactionStyle: template.interactionStyle,
    boundaries: template.boundaries,
    firstMessage: template.firstMessage,
    modelName: template.modelName || 'glm-4.7-flash',
  }
}

function buildSummary(form: AiCharacterDraft) {
  const name = form.name.trim() || '这个角色'
  const relationship = form.relationship.trim() || '自定义关系'
  const personality = form.personality.trim() || '待补充'
  const speechStyle = form.speechStyle.trim() || '待补充'
  const background = form.background.trim() || '待补充'
  const interactionStyle = form.interactionStyle.trim() || '待补充'

  return `${name}是一个偏${relationship}向的角色。核心性格：${personality}。说话风格：${speechStyle}。背景：${background}。相处方式：${interactionStyle}。`
}

export function AiCharacterForm({
  mode,
  templates,
  characterId,
  initialCharacter,
  onSaved,
}: {
  mode: 'create' | 'edit'
  templates: AiCharacterTemplate[]
  characterId?: string
  initialCharacter?: AiCharacterDraft
  onSaved?: (character: AiCharacter) => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = React.useState<AiCharacterDraft>(initialCharacter ?? EMPTY_DRAFT)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [appliedTemplateId, setAppliedTemplateId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (initialCharacter) {
      setForm(initialCharacter)
    }
  }, [initialCharacter])

  React.useEffect(() => {
    if (mode !== 'create') {
      return
    }

    const templateId = searchParams.get('template')
    if (!templateId || templateId === appliedTemplateId) {
      return
    }

    const template = templates.find((item) => item.id === templateId)
    if (!template) {
      return
    }

    setForm(templateToDraft(template))
    setAppliedTemplateId(templateId)
    setSuccess(`已套用模板：${template.name}`)
  }, [appliedTemplateId, mode, searchParams, templates])

  function updateField<K extends keyof AiCharacterDraft>(key: K, value: AiCharacterDraft[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function applyTemplate(template: AiCharacterTemplate) {
    setForm(templateToDraft(template))
    setAppliedTemplateId(template.id)
    setSuccess(`已套用模板：${template.name}`)
    setError(null)
  }

  function handleAvatarFile(file: File | null) {
    if (!file) {
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('头像请控制在 2MB 以内。')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      updateField('avatarUrl', String(reader.result || ''))
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(mode === 'create' ? '/api/ai/characters' : `/api/ai/characters/${characterId}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      const data = (await response.json()) as CharacterSaveResponse & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || '保存角色失败。')
      }

      onSaved?.(data.character)

      if (mode === 'create') {
        router.push(`/ai-companion/characters/${data.character.id}`)
      } else {
        setSuccess('角色设定已保存。')
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '保存角色失败。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-xl">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge variant="secondary">{mode === 'create' ? '创建角色' : '编辑角色'}</Badge>
                <CardTitle className="mt-3">{mode === 'create' ? '先把 TA 的基础轮廓定下来' : '继续调整这个角色'}</CardTitle>
                <CardDescription className="mt-2">
                  这里填写的是角色设定本身，不是模型提示词。保存后系统会自动整理成稳定的人设摘要，并且同一个角色只保留一个持续聊天窗口。
                </CardDescription>
              </div>
              <Link href="/ai-companion"><Button type="button" variant="outline">返回 AI 陪伴</Button></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

            <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-5">
              <Avatar className="h-16 w-16 rounded-2xl" src={form.avatarUrl || undefined} fallback={buildInitials(form.name)} />
              <div className="flex flex-wrap gap-3">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => handleAvatarFile(event.target.files?.[0] ?? null)} />
                  <span className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-900">上传头像</span>
                </label>
                <Button type="button" variant="outline" onClick={() => updateField('avatarUrl', '')}>清空头像</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">角色名字</label>
                <Input value={form.name} maxLength={10} onChange={(event) => updateField('name', event.target.value)} placeholder="例如：星野、阿湫、林深" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">默认模型</label>
                <Select value={form.modelName} onChange={(event) => updateField('modelName', event.target.value)}>
                  {MODEL_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </Select>
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">你们的关系</label>
                  <Select value={form.relationship} onChange={(event) => updateField('relationship', event.target.value)}>
                    <option value="">请选择</option>
                    {RELATIONSHIP_OPTIONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_RELATIONSHIP_OPTIONS.map((item) => {
                    const active = form.relationship === item
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => updateField('relationship', item)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700'}`}
                      >
                        {active && <Check className="h-4 w-4" />}
                        {item}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>核心性格</span><span className="text-xs text-gray-400">{form.personality.length}/80</span></label>
                <textarea value={form.personality} maxLength={80} onChange={(event) => updateField('personality', event.target.value)} rows={3} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-7 text-gray-900 outline-none focus:border-emerald-400" placeholder="例如：嘴硬心软、会吃醋、情绪细腻、认真又有点黏人" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>说话风格</span><span className="text-xs text-gray-400">{form.speechStyle.length}/80</span></label>
                <textarea value={form.speechStyle} maxLength={80} onChange={(event) => updateField('speechStyle', event.target.value)} rows={3} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-7 text-gray-900 outline-none focus:border-emerald-400" placeholder="例如：像微信聊天，短句为主，偶尔会撒娇或嘴硬，不要太像客服" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>背景设定</span><span className="text-xs text-gray-400">{form.background.length}/150</span></label>
                <textarea value={form.background} maxLength={150} onChange={(event) => updateField('background', event.target.value)} rows={4} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-7 text-gray-900 outline-none focus:border-emerald-400" placeholder="例如：在上海读设计，喜欢甜品和散步，最近在学摄影。" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>相处方式</span><span className="text-xs text-gray-400">{form.interactionStyle.length}/100</span></label>
                <textarea value={form.interactionStyle} maxLength={100} onChange={(event) => updateField('interactionStyle', event.target.value)} rows={4} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-7 text-gray-900 outline-none focus:border-emerald-400" placeholder="例如：平时会主动找话题，回得慢时会来问你是不是在忙，但不会咄咄逼人。" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>聊天边界</span><span className="text-xs text-gray-400">{form.boundaries.length}/80</span></label>
                <textarea value={form.boundaries} maxLength={80} onChange={(event) => updateField('boundaries', event.target.value)} rows={3} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-7 text-gray-900 outline-none focus:border-emerald-400" placeholder="例如：不要过度油腻，不要突然变成说教口吻，不要长篇大论。" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>开场白</span><span className="text-xs text-gray-400">{form.firstMessage.length}/60</span></label>
                <textarea value={form.firstMessage} maxLength={60} onChange={(event) => updateField('firstMessage', event.target.value)} rows={3} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-7 text-gray-900 outline-none focus:border-emerald-400" placeholder="例如：你终于来了，今天想先聊聊日常，还是让我陪你说说心事？" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" isLoading={saving}>{mode === 'create' ? '保存并进入角色页' : '保存修改'}</Button>
              <Link href="/ai-companion"><Button type="button" variant="ghost">取消</Button></Link>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="space-y-6">
        <Card className="border-none shadow-xl">
          <CardHeader>
            <Badge variant="warning">实时预览</Badge>
            <CardTitle className="mt-3">角色卡片预览</CardTitle>
            <CardDescription>保存前先看一下整体气质、关系和开场白是否顺眼。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-2xl" src={form.avatarUrl || undefined} fallback={buildInitials(form.name)} />
              <div>
                <div className="text-2xl font-bold text-gray-900">{form.name.trim() || '未命名角色'}</div>
                <div className="text-sm text-gray-500">{form.relationship.trim() || '自定义关系'} · {form.modelName}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 text-sm leading-7 text-gray-700">{buildSummary(form)}</div>
            <div className="rounded-2xl bg-slate-950 p-4 text-sm leading-7 text-white/85">
              开场白预览：{form.firstMessage.trim() || '这里会显示角色第一次主动对你说的话。'}
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-800">
              保存后，这个角色只会保留一个持续对话窗口，后续所有聊天内容都会沿着这一条历史继续保存。
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <Badge><Sparkles className="mr-1 h-3.5 w-3.5" />快速模板</Badge>
            <CardTitle className="mt-3">先用一个现成骨架</CardTitle>
            <CardDescription>点击后会直接把人设字段填进表单，你还可以继续手动修改。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {templates.map((template) => {
              const active = appliedTemplateId === template.id
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${active ? 'border-emerald-300 bg-emerald-50 shadow-sm' : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/60'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-gray-900">{template.name}</div>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-500 shadow-sm">{template.relationship || '自定义'}</span>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-gray-500">{template.blurb}</div>
                </button>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}