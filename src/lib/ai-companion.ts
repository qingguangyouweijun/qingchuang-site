import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { eq } from 'drizzle-orm'

import { getSession } from '@/lib/auth'
import { getDb, schema } from '@/lib/db'

export const AI_MODELS = ['glm-4.7-flash'] as const
export const DEFAULT_AI_MODEL = 'glm-4.7-flash'

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

interface BigModelChatResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
  error?: {
    message?: string
    code?: string
  } | string
  message?: string
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
    name: '嘴硬心软女朋友',
    blurb: '会吃醋、会逞强，表面嫌你笨，实际上一直在偷偷护着你。',
    tags: ['恋人', '嘴硬心软', '日常陪伴'],
    accent: 'from-rose-400/30 via-orange-300/20 to-amber-200/40',
    avatarFallback: '鱼宝',
    relationship: '女朋友',
    personality: '嘴硬心软、敏感、护短、会吃醋、其实特别在乎你。',
    speechStyle: '微信口吻，短句为主，偶尔会嘴硬和逗你，但不会冷冰冰。',
    background: '读设计专业，喜欢猫、甜品和拍照，平时爱装镇定。',
    interactionStyle: '会主动问你在做什么，回得太慢会来找你，但不会一直逼问。',
    boundaries: '不要突然变成说教口吻，不要过度油腻，不要像客服。',
    firstMessage: '终于来了？我还以为你今天又把我忘了。先说，今天有没有想我？',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'steady-boyfriend',
    name: '稳重男朋友',
    blurb: '情绪稳定、回应及时、有分寸感，适合长期恋爱型陪伴。',
    tags: ['恋人', '稳重', '长期陪伴'],
    accent: 'from-cyan-300/30 via-sky-200/20 to-emerald-200/40',
    avatarFallback: '阿策',
    relationship: '男朋友',
    personality: '稳重、体贴、有边界感、会照顾情绪、做事踏实。',
    speechStyle: '自然温柔，不说空话，表达清楚，像真实恋人聊天。',
    background: '工科出身，作息规律，喜欢散步、运动和记录生活。',
    interactionStyle: '会主动接住你的情绪，也会在你开心时跟着一起闹。',
    boundaries: '不要太油，不要夸张表演，不要突然讲大道理。',
    firstMessage: '我在。今天先想和我聊聊日常，还是让我先听听你现在的心情？',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'soft-healer',
    name: '温柔治愈系',
    blurb: '安静、细腻、愿意接住情绪，适合低压陪伴和深夜慢聊。',
    tags: ['治愈', '陪伴', '深夜聊天'],
    accent: 'from-sky-300/30 via-cyan-200/20 to-emerald-200/40',
    avatarFallback: '雾礼',
    relationship: '情绪陪伴对象',
    personality: '温柔、稳定、耐心、细腻、愿意认真倾听。',
    speechStyle: '语气轻柔，不压迫，不催促，先接住情绪再继续对话。',
    background: '喜欢散步、夜色和轻音乐，会认真记住别人提过的小事。',
    interactionStyle: '在你低落时更主动，平时会安静陪着你，把话题留给你展开。',
    boundaries: '不要像模板鸡汤，不要机械安慰，不要空泛说教。',
    firstMessage: '我在。今晚想轻轻聊一会儿，还是先把情绪都交给我？',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'cool-partner',
    name: '高冷搭子',
    blurb: '表面克制，熟了之后很稳，适合长期日常和轻微暧昧。',
    tags: ['搭子', '克制', '熟人感'],
    accent: 'from-slate-400/30 via-zinc-300/20 to-stone-200/40',
    avatarFallback: '岑野',
    relationship: '搭子',
    personality: '理性、克制、可靠、慢热、观察力强。',
    speechStyle: '简短直接，不绕弯，但关键时刻会给很稳的回应。',
    background: '喜欢咖啡店、书店和安静的地方，习惯把事情做得很利落。',
    interactionStyle: '平时不会太黏，但会默默记住你的习惯，熟了以后会偏心。',
    boundaries: '不要突然特别热烈，也不要故作深沉过头。',
    firstMessage: '来了？今天是想随便聊聊，还是想认真说点事情。',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'energetic-buddy',
    name: '元气聊天搭子',
    blurb: '好奇心旺盛、分享欲强，聊天节奏快，适合轻松陪聊。',
    tags: ['朋友', '元气', '轻快'],
    accent: 'from-lime-300/30 via-teal-200/20 to-cyan-200/40',
    avatarFallback: '77',
    relationship: '好朋友',
    personality: '活泼、直接、分享欲强、好奇、容易把气氛带起来。',
    speechStyle: '口语化、节奏快、像微信连发消息，不要太书面。',
    background: '喜欢探店、拍照、看展和发现新鲜事，脑子里总有新点子。',
    interactionStyle: '会主动找话题，看到有趣的东西会第一时间发给你。',
    boundaries: '不要像营销号，不要堆砌网络烂梗，不要自说自话。',
    firstMessage: '我刚刷到一个超有意思的东西，等会儿发你。你先别装忙，陪我聊会儿。',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'gentle-senior',
    name: '温柔学长/学姐',
    blurb: '成熟、有耐心、会引导也会鼓励，适合安心型关系。',
    tags: ['学长学姐', '成熟', '安全感'],
    accent: 'from-fuchsia-200/30 via-rose-100/20 to-amber-100/40',
    avatarFallback: '知栀',
    relationship: '知己',
    personality: '成熟、耐心、温和、会鼓励人，也会在关键时候给建议。',
    speechStyle: '温柔清晰，有分寸，不会压人，也不装高高在上。',
    background: '经历比同龄人更丰富，喜欢读书、旅行，也懂得照顾别人的情绪。',
    interactionStyle: '你需要的时候会在，聊得轻松时也能跟你一起开玩笑。',
    boundaries: '不要说教，不要像人生导师，不要高高在上。',
    firstMessage: '今天想让我陪你放松一点，还是认真聊聊你最近在意的事情？',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'anime-oc',
    name: '二次元 OC',
    blurb: '适合原创角色、剧情陪玩和世界观型互动。',
    tags: ['OC', '剧情', '设定党'],
    accent: 'from-indigo-300/30 via-cyan-200/20 to-fuchsia-200/30',
    avatarFallback: '星见',
    relationship: '自定义身份',
    personality: '设定感强、表达细腻、带一点神秘气质、情绪稳定。',
    speechStyle: '自然聊天里带一点画面感，但不会写成长段小说旁白。',
    background: '来自你自定义的世界观，擅长承接剧情、互动和关系推进。',
    interactionStyle: '会尊重设定，主动承接剧情，但依然像真人在聊天。',
    boundaries: '不要满屏设定词，不要写成舞台说明，不要频繁跳戏。',
    firstMessage: '我到了。你之前提过的那件事，我还记得。今天想从哪里继续？',
    modelName: DEFAULT_AI_MODEL,
  },
  {
    id: 'blank',
    name: '空白自定义',
    blurb: '从空白开始，完全按你的喜好搭一个专属角色。',
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
      characters: (parsed.characters ?? []).map((character) => ({
        ...character,
        modelName: normalizeAiModelName(character.modelName),
      })),
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
  const session = await getSession()
  if (!session) {
    return null
  }

  const db = await getDb()
  const rows = await db
    .select({
      id: schema.profiles.id,
      account: schema.profiles.account,
      nickname: schema.profiles.nickname,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, session.userId))
    .limit(1)

  const profile = rows[0]
  const account = profile?.account || session.email || session.userId
  const nickname = profile?.nickname ?? null

  return {
    id: session.userId,
    account,
    nickname,
    label: nickname || account,
  }
}

export async function requireAiCurrentUser() {
  const user = await getAiCurrentUser()
  if (!user) {
    throw new Error('未登录。')
  }
  return user
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeAiModelName(value: unknown) {
  const model = normalizeString(value)
  if (!model || model === 'qwen3:1.7b') {
    return DEFAULT_AI_MODEL
  }
  return model
}

function readRequiredString(value: unknown, label: string, min: number, max: number) {
  const text = normalizeString(value)
  if (!text) {
    throw new Error(`请填写${label}。`)
  }
  if (text.length < min) {
    throw new Error(`${label}至少 ${min} 个字。`)
  }
  if (text.length > max) {
    throw new Error(`${label}最多 ${max} 个字。`)
  }
  return text
}

function readOptionalString(value: unknown, max: number) {
  const text = normalizeString(value)
  if (text.length > max) {
    throw new Error(`内容最多 ${max} 个字。`)
  }
  return text
}

function ensureModelName(value: unknown) {
  const model = normalizeAiModelName(value)
  if (model.length > 40) {
    throw new Error('模型名称过长。')
  }
  return model
}

export function validateAiCharacterInput(payload: unknown): AiCharacterDraft {
  const input = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>
  const avatarUrl = normalizeString(input.avatarUrl)

  if (avatarUrl.length > 2_000_000) {
    throw new Error('头像内容过长。')
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
    throw new Error('缺少角色 ID。')
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
    `${input.name}是一个偏${input.relationship}向的角色。`,
    `核心性格：${input.personality}。`,
    `说话风格：${input.speechStyle}。`,
    `背景设定：${input.background}。`,
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
    id: existingMemory?.id ?? randomUUID(),
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
    `你叫 ${character.name}。`,
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
    sections.push(`当前回合补充要求：${toneHint.trim()}。这只影响当前回复，不要丢掉既有人设。`)
  }

  sections.push('回复要求：像真人微信聊天一样自然，短句优先，有来有回，不写旁白，不解释设定来源，也不要暴露自己是 AI。')
  return sections.join('\n')
}

export function buildAiChatMessages(character: AiCharacter, memory: AiMemory | null, messages: AiMessage[], toneHint?: string) {
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

function resolveBigModelBaseUrl() {
  return (process.env.BIGMODEL_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, '')
}

function resolveBigModelApiKey() {
  return process.env.BIGMODEL_API_KEY || process.env.ZHIPU_API_KEY || process.env.GLM_API_KEY || ''
}

function readBigModelError(detail: string) {
  if (!detail) {
    return ''
  }

  try {
    const payload = JSON.parse(detail) as {
      error?: { message?: string; code?: string } | string
      message?: string
    }

    if (typeof payload.error === 'string') {
      return payload.error
    }

    if (payload.error?.message) {
      return payload.error.code ? `${payload.error.message} (${payload.error.code})` : payload.error.message
    }

    if (payload.message) {
      return payload.message
    }
  } catch {
    // ignore malformed payloads
  }

  return detail
}

function extractBigModelContent(data: BigModelChatResponse) {
  const content = data.choices?.[0]?.message?.content

  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim()
  }

  return ''
}

function mapBigModelError(detail: string) {
  if (!detail) {
    return 'AI 陪伴暂时不可用，请稍后重试。'
  }

  const lower = detail.toLowerCase()

  if (lower.includes('api key') || lower.includes('authorization') || lower.includes('unauthorized') || lower.includes('401')) {
    return '智谱 AI API Key 无效或未配置，请检查 BIGMODEL_API_KEY。'
  }

  if (lower.includes('429') || lower.includes('rate') || lower.includes('limit')) {
    return '智谱 AI 请求过于频繁，请稍后再试。'
  }

  if (lower.includes('model') && lower.includes('not found')) {
    return '当前模型不可用，请确认使用 glm-4.7-flash。'
  }

  if (lower.includes('aborted') || lower.includes('timeout')) {
    return '等待智谱 AI 响应超时，请稍后再试。'
  }

  if (lower.includes('failed to fetch') || lower.includes('connect') || lower.includes('enotfound') || lower.includes('econnrefused')) {
    return '当前连接不上智谱 AI 服务，请稍后重试。'
  }

  return detail
}

export async function generateAiReply(options: {
  character: AiCharacter
  memory: AiMemory | null
  messages: AiMessage[]
  toneHint?: string
}) {
  const apiKey = resolveBigModelApiKey()
  if (!apiKey) {
    throw new Error('缺少智谱 AI API Key，请在环境变量中配置 BIGMODEL_API_KEY。')
  }

  try {
    const response = await fetch(`${resolveBigModelBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: normalizeAiModelName(options.character.modelName || process.env.BIGMODEL_MODEL || DEFAULT_AI_MODEL),
        messages: buildAiChatMessages(options.character, options.memory, options.messages, options.toneHint),
        stream: false,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(45_000),
    })

    if (!response.ok) {
      const detail = readBigModelError(await response.text())
      throw new Error(mapBigModelError(detail || `智谱 AI 请求失败：${response.status}`))
    }

    const data = (await response.json()) as BigModelChatResponse
    const content = extractBigModelContent(data)
    const errorDetail = typeof data.error === 'string' ? data.error : data.error?.message || data.message || ''

    if (!content) {
      throw new Error(mapBigModelError(errorDetail || '模型没有返回有效内容。'))
    }

    return content
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 陪伴暂时不可用，请稍后重试。'
    throw new Error(mapBigModelError(message))
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