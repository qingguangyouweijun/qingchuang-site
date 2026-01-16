export type Gender = 'male' | 'female'
export type Appearance = 'normal' | 'good' | 'stunning'
export type Identity = 'student' | 'non_student'
export type DrawTier = 'basic' | 'advanced' | 'vip'
export type TransactionType = 'recharge' | 'draw' | 'refund'

export interface Profile {
  id: string
  account: string
  nickname: string | null
  gender: Gender | null
  age: number | null
  appearance: Appearance | null
  identity: Identity | null
  location: string | null
  grade: string | null
  bio: string | null
  avatar_url: string | null
  contact_visibility_limit: number
  balance: number
  is_verified: boolean
  is_profile_complete: boolean
  created_at: string
  updated_at: string
}

export interface ContactPool {
  id: string
  user_id: string
  wechat: string | null
  qq: string | null
  phone: string | null
  is_active: boolean
  drawn_count: number
  max_drawn_count: number
  created_at: string
  updated_at: string
}

export interface DrawHistory {
  id: string
  drawer_id: string
  target_id: string
  tier: DrawTier
  price: number
  contact_wechat: string | null
  contact_qq: string | null
  contact_phone: string | null
  note: string | null
  is_deleted: boolean
  created_at: string
  // Joined fields
  target?: Profile
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  balance_after: number
  description: string | null
  related_draw_id: string | null
  created_at: string
}

export interface DrawFilters {
  gender?: Gender
  ageMin?: number
  ageMax?: number
  identity?: Identity
  appearance?: Appearance
}

export interface DrawResult {
  success: boolean
  error?: string
  draw_id?: string
  target?: {
    id: string
    nickname: string
    gender: Gender
    age: number
    appearance: Appearance
    identity: Identity
    location: string
    grade: string
    bio: string
  }
  contact?: {
    wechat: string | null
    qq: string | null
    phone: string | null
  }
  new_balance?: number
}

// 价格配置
export const PRICING = {
  basic: { normal: 0.66, discount: 0.33 },
  advanced: { normal: 1.66, discount: 0.66 },
  vip: { normal: 2.66, discount: 1.66 },
} as const

// 相貌映射
export const APPEARANCE_LABELS: Record<Appearance, string> = {
  normal: '普通',
  good: '出众',
  stunning: '超级哇塞',
}

// 身份映射
export const IDENTITY_LABELS: Record<Identity, string> = {
  student: '学生',
  non_student: '非学生',
}

// 性别映射
export const GENDER_LABELS: Record<Gender, string> = {
  male: '男',
  female: '女',
}
