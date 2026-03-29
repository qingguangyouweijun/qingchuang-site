export type Gender = "male" | "female";
export type Appearance = "normal" | "good" | "stunning";
export type Identity = "student" | "non_student";

export type AppRole = "user" | "admin";
export type PayType = "wxpay" | "alipay";
export type CampusPaymentStatus = "CREATED" | "SUCCESS" | "FAILED";
export type ExpressOrderStatus =
  | "PENDING_PAYMENT"
  | "OPEN"
  | "ACCEPTED"
  | "PICKED_UP"
  | "DELIVERED"
  | "COMPLETED";
export type BookPostStatus = "ON_SALE" | "LOCKED" | "SOLD" | "OFF_SHELF";
export type BookOrderStatus =
  | "PENDING_PAYMENT"
  | "WAITING_SELLER"
  | "DELIVERED"
  | "COMPLETED";
export type SettlementStatus = "PENDING" | "APPROVED" | "REJECTED";
export type CampusBizType = "EXPRESS_ORDER" | "BOOK_ORDER" | "DRAW_ORDER";

export interface Profile {
  id: string;
  account: string;
  nickname: string | null;
  gender: Gender | null;
  age: number | null;
  appearance: Appearance | null;
  identity: Identity | null;
  location: string | null;
  grade: string | null;
  bio: string | null;
  avatar_url: string | null;
  contact_visibility_limit: number;
  balance: number;
  is_verified: boolean;
  is_profile_complete: boolean;
  app_role?: AppRole | null;
  campus_available_balance?: number | null;
  campus_pending_balance?: number | null;
  campus_settlement_applying_amount?: number | null;
  campus_settled_total?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ContactPool {
  id: string;
  user_id: string;
  wechat: string | null;
  qq: string | null;
  phone: string | null;
  is_active: boolean;
  drawn_count: number;
  max_drawn_count: number;
  created_at: string;
  updated_at: string;
}

export interface DrawHistory {
  id: string;
  drawer_id: string;
  target_id: string;
  amount: number;
  status: "PENDING_PAYMENT" | "PAID";
  contact_wechat: string | null;
  contact_qq: string | null;
  contact_phone: string | null;
  note: string | null;
  is_deleted: boolean;
  created_at: string;
  target?: Profile;
}



export interface DrawFilters {
  gender?: Gender;
  ageMin?: number;
  ageMax?: number;
  identity?: Identity;
  appearance?: Appearance;
}

export interface DrawResult {
  success: boolean;
  error?: string;
  draw_id?: string;
  target?: {
    id: string;
    nickname: string;
    gender: Gender;
    age: number;
    appearance: Appearance;
    identity: Identity;
    location: string;
    grade: string;
    bio: string;
  };
  contact?: {
    wechat: string | null;
    qq: string | null;
    phone: string | null;
  };
  new_balance?: number;
}

export interface ExpressQuoteInput {
  smallCount?: number;
  mediumCount?: number;
  largeCount?: number;
  xlargeCount?: number;
}

export interface ExpressQuoteResult {
  smallCount: number;
  mediumCount: number;
  largeCount: number;
  xlargeCount: number;
  totalCount: number;
  rawAmount: number;
  discountAmount: number;
  orderAmount: number;
  platformFee: number;
  runnerIncome: number;
}

export interface BookSettlementResult {
  salePrice: number;
  platformFee: number;
  sellerIncome: number;
}

export interface CampusExpressOrder {
  id: string;
  order_no: string;
  user_id: string;
  runner_id: string | null;
  small_count: number;
  medium_count: number;
  large_count: number;
  xlarge_count: number;
  total_count: number;
  pickup_station: string;
  pickup_codes: string[];
  delivery_building: string;
  delivery_address: string;
  expected_time: string;
  remark: string | null;
  order_amount: number;
  platform_fee: number;
  runner_income: number;
  pay_type: PayType | null;
  status: ExpressOrderStatus;
  paid_at: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampusBookPost {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  isbn: string | null;
  condition_level: string;
  sale_price: number;
  platform_fee: number;
  seller_income: number;
  description: string | null;
  shelf_status: BookPostStatus;
  created_at: string;
  updated_at: string;
}

export interface CampusBookOrder {
  id: string;
  order_no: string;
  book_id: string;
  book_title: string;
  buyer_id: string;
  seller_id: string;
  sale_price: number;
  platform_fee: number;
  seller_income: number;
  delivery_building: string;
  pay_type: PayType | null;
  status: BookOrderStatus;
  paid_at: string | null;
  delivered_at: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampusSettlementApplication {
  id: string;
  application_no: string;
  user_id: string;
  amount: number;
  status: SettlementStatus;
  user_role: string;
  payee_qr_code: string | null;
  note: string | null;
  transfer_ref: string | null;
  handled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampusBalanceLog {
  id: string;
  user_id: string;
  biz_type: string;
  biz_id: string;
  change_type: string;
  amount: number;
  before_available: number;
  after_available: number;
  before_pending: number;
  after_pending: number;
  remark: string | null;
  created_at: string;
}

export interface CampusPaymentRecord {
  id: string;
  out_trade_no: string;
  biz_type: CampusBizType;
  biz_id: string;
  user_id: string;
  amount: number;
  pay_type: PayType | null;
  status: CampusPaymentStatus;
  trade_status: string | null;
  gateway_trade_no: string | null;
  gateway_order_id: string | null;
  pay_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampusDashboardData {
  profile: Profile;
  openExpressCount: number;
  myExpressCount: number;
  onSaleBookCount: number;
  myBookOrderCount: number;
  pendingSettlementCount: number;
}



export const APPEARANCE_LABELS: Record<Appearance, string> = {
  normal: "自然",
  good: "出众",
  stunning: "超级哇塞",
};

export const GRADE_OPTIONS = [
  { value: "大一", label: "大一" },
  { value: "大二", label: "大二" },
  { value: "大三", label: "大三" },
  { value: "大四", label: "大四" },
  { value: "研一", label: "研一（研究生一年级）" },
  { value: "研二", label: "研二（研究生二年级）" },
  { value: "研三", label: "研三（研究生三年级）" },
] as const;

export type GradeValue = (typeof GRADE_OPTIONS)[number]["value"];

export const IDENTITY_LABELS: Record<Identity, string> = {
  student: "学生",
  non_student: "非学生",
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "男",
  female: "女",
};

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  user: "普通用户",
  admin: "管理员",
};

export const PAY_TYPE_LABELS: Record<PayType, string> = {
  wxpay: "微信支付",
  alipay: "支付宝",
};

export const EXPRESS_STATUS_LABELS: Record<ExpressOrderStatus, string> = {
  PENDING_PAYMENT: "待支付",
  OPEN: "待接单",
  ACCEPTED: "已接单",
  PICKED_UP: "已取件",
  DELIVERED: "已送达",
  COMPLETED: "已完成",
};

export const BOOK_POST_STATUS_LABELS: Record<BookPostStatus, string> = {
  ON_SALE: "在售",
  LOCKED: "锁定中",
  SOLD: "已售出",
  OFF_SHELF: "已下架",
};

export const BOOK_ORDER_STATUS_LABELS: Record<BookOrderStatus, string> = {
  PENDING_PAYMENT: "待支付",
  WAITING_SELLER: "待卖家送达",
  DELIVERED: "待确认收货",
  COMPLETED: "已完成",
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  PENDING: "结算申请中",
  APPROVED: "已结算",
  REJECTED: "已驳回",
};
