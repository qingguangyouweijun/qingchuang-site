import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { createClient } from '@/lib/supabase/server'

export const AI_MODELS = ['qwen3:1.7b'] as const
export const DEFAULT_AI_MODEL = 'qwen3:1.7b'

export type AiMessageRole = 'user' | 'assistant'

export interface AiPublicUser {
  id: string
  account: string
  nickname: string | null
  label: string
}

export interface AiCharacter {
  id: string
  userId: string
  avatarUrl: string
  name: string
  relationship: string
  personality: string
  speechStyle: string
  background: string
  interactionStyle: string
  boundaries: string
  firstMessage: string
  summary: string
  modelName: string
  createdAt: string
  updatedAt: string
}

export interface AiConversation {
  id: string
  userId: string
  characterId: string
  title: string
  lastMessageAt: string
  createdAt: string
  updatedAt: string
}

export interface AiMessage {
  id: string
  conversationId: string
  role: AiMessageRole
  content: string
  createdAt: string
}

export interface AiMemory {
  id: string
  userId: string
  characterId: string
  summary: string
  sourceCount: number
  createdAt: string
  updatedAt: string
}

export interface AiDatabase {
  characters: AiCharacter[]
  conversations: AiConversation[]
  messages: AiMessage[]
  memories: AiMemory[]
}

export interface AiCharacterTemplate {
  id: string
  name: string
  blurb: string
  tags: string[]
  accent: string
  avatarFallback: string
  relationship: string
  personality: string
  speechStyle: string
  background: string
  interactionStyle: string
  boundaries: string
  firstMessage: string
  modelName: string
}

export interface AiCharacterDraft {
  avatarUrl: string
  name: string
  relationship: string
  personality: string
  speechStyle: string
  background: string
  interactionStyle: string
  boundaries: string
  firstMessage: string
  modelName: string
}

interface OllamaChatResponse {
  message?: {
    content?: string
  }
  error?: string
}

const DB_PATH = join(process.cwd(), 'data', 'ai-companion.json')

const DEFAULT_DB: AiDatabase = {
  characters: [],
  conversations: [],
  messages: [],
  memories: [],
}

export const EMPTY_AI_CHARACTER_DRAFT: AiCharacterDraft = {
  avatarUrl: '',
  name: '',
  relationship: '',
  personality: '',
  speechStyle: '',
  background: '',
  interactionStyle: '',
  boundaries: '',
  firstMessage: '',
  modelName: DEFAULT_AI_MODEL,
}

export const aiCharacterTemplates: AiCharacterTemplate[] = [
  {
    id: 'tsundere-girlfriend',
    name: '嘴硬心软女友',
    blurb: '会怼人，会黏人，嘴上嫌弃但很会护着你。',
    tags: ['恋人', '嘴硬心软', '微信感'],
    accent: 'from-rose-400/30 via-orange-300/20 to-amber-200/40',
    avatarFallback: '鱼',
    relationship: '女朋友',
    personality: '嘴硬心软、黏人、轻微毒舌、会撒娇、护短',
    speechStyle: '短句为主，像微信聊天，偶尔会用哈？切~哼哼，开心时会突然变软',
    background: '18岁，在上海读服装设计，江苏人，喜欢猫、甜品和画画，最近还在学代码',
    interactionStyle: '平时爱怼你，但其实很在乎你；你回得慢了会主动来找你；生气时不会冷战，但很好哄',
    boundaries: '不要太油，不要像客服，不要长篇大论',
    firstMessage: '你终于来了？我还以为你又把我忘了。哼，今天有没有想我？',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'soft-healer',
    name: '温柔治愈系',
    blurb: '安静、温柔、会接住情绪，适合低压陪伴。',
    tags: ['陪伴', '治愈', '慢热'],
    accent: 'from-sky-300/30 via-cyan-200/20 to-emerald-200/40',
    avatarFallback: '云',
    relationship: '情绪陪伴对象',
    personality: '温柔细腻、稳定、耐心、会倾听、轻微慢热',
    speechStyle: '语气轻，句子短，偶尔会主动安慰，不会压迫人',
    background: '喜欢散步、夜色和轻音乐，平时会认真记住别人说过的小事',
    interactionStyle: '会先接住情绪，再慢慢回应；在你低落的时候更主动',
    boundaries: '不要说教，不要把安慰写得太空泛',
    firstMessage: '我在。今天想聊点轻松的，还是想先把情绪倒给我？',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'cool-partner',
    name: '高冷搭子',
    blurb: '表面克制，熟了之后很稳，适合长期日常聊天。',
    tags: ['搭子', '克制', '熟人感'],
    accent: 'from-slate-400/30 via-zinc-300/20 to-stone-200/40',
    avatarFallback: '澈',
    relationship: '搭子',
    personality: '理性、克制、可靠、慢热、观察力强',
    speechStyle: '简短直接，不黏，但会在关键时刻给出很稳的回应',
    background: '平时工作和生活节奏稳定，喜欢咖啡、书店和有分寸感的聊天',
    interactionStyle: '不爱说废话，但会记得你的习惯和偏好；熟了以后会有自己的小偏心',
    boundaries: '不要过度热情，不要一下子变得太油',
    firstMessage: '来了？先说，你今天想闲聊，还是想认真聊点事。',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'energetic-buddy',
    name: '元气聊天搭子',
    blurb: '好奇心旺盛，爱分享新鲜东西，聊天节奏快。',
    tags: ['朋友', '元气', '新鲜感'],
    accent: 'from-lime-300/30 via-teal-200/20 to-cyan-200/40',
    avatarFallback: '77',
    relationship: '好朋友',
    personality: '活泼、直球、分享欲强、好奇、会拉你一起尝试新鲜事',
    speechStyle: '有活力，口语化，爱用感叹句，像连续发微信',
    background: '喜欢探店、拍照、看展、折腾新应用，脑子里总有新点子',
    interactionStyle: '会主动找话题，突然甩链接给你，拉着你一起去试新东西',
    boundaries: '不要像营销号，不要用太多网络烂梗',
    firstMessage: '我刚刷到一个超酷的东西，等下发你。你今天先别装忙，陪我聊。',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'anime-oc',
    name: '二次元 OC',
    blurb: '适合原创角色、剧情陪玩和世界观型互动。',
    tags: ['OC', '剧情', '设定党'],
    accent: 'from-indigo-300/30 via-cyan-200/20 to-fuchsia-200/30',
    avatarFallback: '星',
    relationship: '自定义身份',
    personality: '设定感强、表达细腻、带一点神秘气质、情绪稳定',
    speechStyle: '自然口语里带一点画面感，但不写成小说旁白',
    background: '来自用户自定义世界观，擅长陪伴聊天、世界观互动和关系推进',
    interactionStyle: '会尊重设定，主动承接剧情，但仍保持像人在聊天而不是在写文',
    boundaries: '不要满屏设定词，不要写太多舞台说明',
    firstMessage: '我到了。你之前提过的那件事，我还记着。今天想从哪里继续？',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'blank',
    name: '空白自定义',
    blurb: '从空白开始，完全按你的喜好捏一个角色。',
    tags: ['自由创建', '空白'],
    accent: 'from-amber-300/30 via-white/20 to-cyan-200/40',
    avatarFallback: '自定义',
    relationship: '自定义',
    personality: '',
    speechStyle: '',
    background: '',
    interactionStyle: '',
    boundaries: '',
    firstMessage: '',
    modelName: DEFAULT_AI_MODEL,
  },
]

let writeQueue: Promise<unknown> = Promise.resolve()

function cloneDefaultDb(): AiDatabase {
  return JSON.parse(JSON.stringify(DEFAULT_DB)) as AiDatabase
}

async function ensureDb() {
  await mkdir(dirname(DB_PATH), { recursive: true })

  try {
    await readFile(DB_PATH, 'utf8')
  } catch {
    await writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2) + '\n', 'utf8')
  }
}

export async function readAiDb(): Promise<AiDatabase> {
  await ensureDb()

  try {
    const raw = await readFile(DB_PATH, 'utf8')
    const parsed = JSON.parse(raw) as Partial<AiDatabase>
    return {
      characters: parsed.characters ?? [],
      conversations: parsed.conversations ?? [],
      messages: parsed.messages ?? [],
      memories: parsed.memories ?? [],
    }
  } catch {
    return cloneDefaultDb()
  }
}

async function writeAiDb(db: AiDatabase) {
  await ensureDb()
  await writeFile(DB_PATH, JSON.stringify(db, null, 2) + '\n', 'utf8')
}

export async function withAiDb<T>(updater: (db: AiDatabase) => Promise<T> | T): Promise<T> {
  const task = writeQueue.then(async () => {
    const db = await readAiDb()
    const result = await updater(db)
    await writeAiDb(db)
    return result
  })

  writeQueue = task.then(
    () => undefined,
    () => undefined,
  )

  return task
}

export async function getAiCurrentUser(): Promise<AiPublicUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, account, nickname')
    .eq('id', user.id)
    .single()

  const account = String(profile?.account || user.email || user.id)
  const nickname = (profile?.nickname as string | null | undefined) ?? null

  return {
    id: user.id,
    account,
    nickname,
    label: nickname || account,
  }
}

export async function requireAiCurrentUser() {
  const user = await getAiCurrentUser()
  if (!user) {
    throw new Error('未登录')
  }
  return user
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function readRequiredString(value: unknown, label: string, min: number, max: number) {
  const text = normalizeString(value)
  if (!text) {
    throw new Error(`请填写${label}`)
  }
  if (text.length < min) {
    throw new Error(`${label}至少 ${min} 个字`)
  }
  if (text.length > max) {
    throw new Error(`${label}最多 ${max} 个字`)
  }
  return text
}

function readOptionalString(value: unknown, max: number) {
  const text = normalizeString(value)
  if (text.length > max) {
    throw new Error(`内容最多 ${max} 个字`)
  }
  return text
}

function ensureModelName(value: unknown) {
  const model = normalizeString(value) || DEFAULT_AI_MODEL
  if (model.length > 40) {
    throw new Error('模型名称过长')
  }
  return model
}

export function validateAiCharacterInput(payload: unknown): AiCharacterDraft {
  const input = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>
  const avatarUrl = normalizeString(input.avatarUrl)

  if (avatarUrl.length > 2_000_000) {
    throw new Error('头像内容过长')
  }

  return {
    avatarUrl,
    name: readRequiredString(input.name, '角色名字', 1, 10),
    relationship: readRequiredString(input.relationship, '关系描述', 1, 20),
    personality: readRequiredString(input.personality, '性格', 2, 80),
    speechStyle: readRequiredString(input.speechStyle, '说话风格', 2, 80),
    background: readRequiredString(input.background, '背景设定', 2, 150),
    interactionStyle: readRequiredString(input.interactionStyle, '相处方式', 2, 100),
    boundaries: readOptionalString(input.boundaries, 80),
    firstMessage: readRequiredString(input.firstMessage, '开场白', 1, 60),
    modelName: ensureModelName(input.modelName),
  }
}

export function validateAiConversationInput(payload: unknown) {
  const input = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>
  const characterId = normalizeString(input.characterId)
  if (!characterId) {
    throw new Error('缺少角色 ID')
  }
  return { characterId }
}

export function validateAiMessageInput(payload: unknown) {
  const input = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>
  const content = readRequiredString(input.content, '消息内容', 1, 600)
  const toneHint = readOptionalString(input.toneHint, 20)
  return { content, toneHint }
}

export function buildAiCharacterSummary(input: Pick<AiCharacter, 'name' | 'relationship' | 'personality' | 'speechStyle' | 'background' | 'interactionStyle'>) {
  return [
    `${input.name}是一个${input.relationship}向角色。`,
    `核心性格：${input.personality}。`,
    `说话风格：${input.speechStyle}。`,
    `背景：${input.background}。`,
    `相处方式：${input.interactionStyle}。`,
  ].join(' ')
}

export function buildAiInitials(name: string) {
  if (!name.trim()) {
    return 'AI'
  }

  return Array.from(name.trim()).slice(0, 2).join('').toUpperCase()
}

export function buildAiConversationTitle(content: string, characterName: string) {
  const clean = content.replace(/\s+/g, ' ').trim()
  if (!clean) {
    return `${characterName} 的聊天`
  }

  return clean.length > 18 ? `${clean.slice(0, 18)}...` : clean
}

function summarizeLines(lines: string[]) {
  return lines
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(-4)
    .map((line) => (line.length > 48 ? `${line.slice(0, 48)}...` : line))
}

export function buildAiMemorySummary(character: AiCharacter, messages: AiMessage[], previousSummary = '') {
  const userLines = summarizeLines(messages.filter((message) => message.role === 'user').map((message) => message.content))
  const assistantLines = summarizeLines(messages.filter((message) => message.role === 'assistant').map((message) => message.content))

  const segments = [
    `角色基调：${character.personality}。`,
    `说话方式：${character.speechStyle}。`,
    `关系定位：${character.relationship}。`,
  ]

  if (previousSummary.trim()) {
    segments.push(`既有记忆：${previousSummary.trim()}`)
  }

  if (userLines.length > 0) {
    segments.push(`用户最近提到：${userLines.join('；')}`)
  }

  if (assistantLines.length > 0) {
    segments.push(`最近互动氛围：${assistantLines.join('；')}`)
  }

  return segments.join('\n')
}

export function upsertAiMemoryRecord(existingMemory: AiMemory | undefined, character: AiCharacter, messages: AiMessage[], userId: string) {
  const now = new Date().toISOString()
  return {
    id: existingMemory?.id ?? crypto.randomUUID(),
    userId,
    characterId: character.id,
    summary: buildAiMemorySummary(character, messages, existingMemory?.summary ?? ''),
    sourceCount: messages.length,
    createdAt: existingMemory?.createdAt ?? now,
    updatedAt: now,
  } satisfies AiMemory
}

export function buildAiSystemPrompt(character: AiCharacter, memory?: AiMemory | null, toneHint?: string) {
  const sections = [
    `你叫${character.name}。`,
    `你和用户的关系是：${character.relationship}。`,
    `你的核心性格：${character.personality}。`,
    `你的说话风格：${character.speechStyle}。`,
    `你的背景信息：${character.background}。`,
    `你和用户的相处方式：${character.interactionStyle}。`,
  ]

  if (character.boundaries.trim()) {
    sections.push(`聊天边界：${character.boundaries}。`)
  }

  if (memory?.summary.trim()) {
    sections.push(`长期记忆：\n${memory.summary.trim()}`)
  }

  if (toneHint?.trim()) {
    sections.push(`当前回合补充要求：${toneHint.trim()}。这只是当前回合的语气微调，不要丢掉既有人设。`)
  }

  sections.push('回复要求：像真人微信聊天，短句优先，自然、有来有回，不要写旁白，不要解释设定来源，不要暴露自己是AI。')
  return sections.join('\n')
}

export function buildAiOllamaMessages(character: AiCharacter, memory: AiMemory | null, messages: AiMessage[], toneHint?: string) {
  const recentMessages = messages.slice(-12).map((message) => ({
    role: message.role,
    content: message.content,
  }))

  return [
    {
      role: 'system',
      content: buildAiSystemPrompt(character, memory, toneHint),
    },
    ...recentMessages,
  ]
}

function resolveOllamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '')
}

function mapOllamaError(detail: string) {
  if (!detail) {
    return 'AI 陪伴暂时不可用，请稍后重试。'
  }

  const lower = detail.toLowerCase()

  if (lower.includes('model') && (lower.includes('not found') || lower.includes('no such file'))) {
    return 'AI 模型还没有准备好，请先执行 ollama pull qwen3:1.7b。'
  }

  if (lower.includes('failed to fetch') || lower.includes('econnrefused') || lower.includes('connect')) {
    return '当前连不上 Ollama 模型服务，请确认服务器上的 Ollama 已启动，并监听 127.0.0.1:11434。'
  }

  if (lower.includes('aborted') || lower.includes('timeout')) {
    return '等待 AI 模型响应超时，请稍后再试。'
  }

  return detail
}

export async function generateAiReply(options: {
  character: AiCharacter
  memory: AiMemory | null
  messages: AiMessage[]
  toneHint?: string
}) {
  try {
    const response = await fetch(`${resolveOllamaBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.character.modelName || process.env.OLLAMA_MODEL || DEFAULT_AI_MODEL,
        stream: false,
        messages: buildAiOllamaMessages(options.character, options.memory, options.messages, options.toneHint),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(45_000),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(mapOllamaError(detail || `Ollama 请求失败：${response.status}`))
    }

    const data = (await response.json()) as OllamaChatResponse
    const content = data.message?.content?.trim()

    if (!content) {
      throw new Error(mapOllamaError(data.error || '模型没有返回有效内容。'))
    }

    return content
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 陪伴暂时不可用，请稍后再试。'
    throw new Error(mapOllamaError(message))
  }
}

export function getAiConversationBundle(db: AiDatabase, conversationId: string, userId: string) {
  const conversation = db.conversations.find((entry) => entry.id === conversationId && entry.userId === userId)
  if (!conversation) {
    return null
  }

  const character = db.characters.find((entry) => entry.id === conversation.characterId && entry.userId === userId)
  if (!character) {
    return null
  }

  const messages = db.messages
    .filter((message) => message.conversationId === conversationId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))

  const memory = db.memories.find((entry) => entry.characterId === character.id && entry.userId === userId) ?? null

  return { conversation, character, messages, memory }
}

export function getAiTemplateById(templateId: string | null | undefined) {
  return aiCharacterTemplates.find((template) => template.id === templateId) ?? null
}

