import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const profiles = sqliteTable(
  'profiles',
  {
    id: text('id').primaryKey(),
    account: text('account').notNull(),
    password_hash: text('password_hash').notNull().default(''),
    nickname: text('nickname'),
    gender: text('gender'),
    age: integer('age'),
    appearance: text('appearance'),
    identity: text('identity'),
    location: text('location'),
    grade: text('grade'),
    bio: text('bio'),
    avatar_url: text('avatar_url'),
    contact_visibility_limit: integer('contact_visibility_limit').notNull().default(0),
    balance: real('balance').notNull().default(0),
    is_verified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
    is_profile_complete: integer('is_profile_complete', { mode: 'boolean' }).notNull().default(false),
    app_role: text('app_role').notNull().default('user'),
    campus_available_balance: real('campus_available_balance').notNull().default(0),
    campus_pending_balance: real('campus_pending_balance').notNull().default(0),
    campus_settlement_applying_amount: real('campus_settlement_applying_amount').notNull().default(0),
    campus_settled_total: real('campus_settled_total').notNull().default(0),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex('idx_profiles_account').on(table.account),
    index('idx_profiles_gender').on(table.gender),
    index('idx_profiles_age').on(table.age),
    index('idx_profiles_identity').on(table.identity),
    index('idx_profiles_appearance').on(table.appearance),
  ],
)

export const contactPool = sqliteTable(
  'contact_pool',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    wechat: text('wechat'),
    qq: text('qq'),
    phone: text('phone'),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    drawn_count: integer('drawn_count').notNull().default(0),
    max_drawn_count: integer('max_drawn_count').notNull().default(0),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex('idx_contact_pool_user_id').on(table.user_id),
    index('idx_contact_pool_active').on(table.is_active),
  ],
)

export const drawHistory = sqliteTable(
  'draw_history',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    drawer_id: text('drawer_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    target_id: text('target_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    tier: text('tier').notNull(),
    price: real('price').notNull(),
    contact_wechat: text('contact_wechat'),
    contact_qq: text('contact_qq'),
    contact_phone: text('contact_phone'),
    note: text('note'),
    is_deleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index('idx_draw_history_drawer').on(table.drawer_id),
    index('idx_draw_history_created').on(table.created_at),
  ],
)

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    amount: real('amount').notNull(),
    balance_after: real('balance_after').notNull(),
    description: text('description'),
    related_draw_id: text('related_draw_id'),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
)

export const emailVerificationCodes = sqliteTable(
  'email_verification_codes',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    purpose: text('purpose').notNull(),
    code_hash: text('code_hash').notNull(),
    expires_at: text('expires_at').notNull(),
    sent_at: text('sent_at').notNull().$defaultFn(() => new Date().toISOString()),
    consumed_at: text('consumed_at'),
    attempt_count: integer('attempt_count').notNull().default(0),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex('idx_email_verification_email_purpose').on(table.email, table.purpose),
    index('idx_email_verification_email').on(table.email),
  ],
)

export const campusExpressOrders = sqliteTable(
  'campus_express_orders',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    order_no: text('order_no').notNull(),
    user_id: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    runner_id: text('runner_id'),
    small_count: integer('small_count').notNull().default(0),
    medium_count: integer('medium_count').notNull().default(0),
    large_count: integer('large_count').notNull().default(0),
    xlarge_count: integer('xlarge_count').notNull().default(0),
    total_count: integer('total_count').notNull().default(0),
    pickup_station: text('pickup_station').notNull(),
    pickup_codes: text('pickup_codes').notNull().default('[]'),
    delivery_building: text('delivery_building').notNull(),
    delivery_address: text('delivery_address').notNull(),
    expected_time: text('expected_time').notNull(),
    remark: text('remark'),
    order_amount: real('order_amount').notNull(),
    platform_fee: real('platform_fee').notNull(),
    runner_income: real('runner_income').notNull(),
    pay_type: text('pay_type'),
    status: text('status').notNull().default('PENDING_PAYMENT'),
    paid_at: text('paid_at'),
    accepted_at: text('accepted_at'),
    picked_up_at: text('picked_up_at'),
    delivered_at: text('delivered_at'),
    confirmed_at: text('confirmed_at'),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex('idx_express_order_no').on(table.order_no),
    index('idx_express_user_id').on(table.user_id),
    index('idx_express_runner_id').on(table.runner_id),
    index('idx_express_status').on(table.status),
  ],
)

export const campusBookPosts = sqliteTable(
  'campus_book_posts',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    seller_id: text('seller_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    category: text('category').notNull(),
    isbn: text('isbn'),
    condition_level: text('condition_level').notNull(),
    sale_price: real('sale_price').notNull(),
    platform_fee: real('platform_fee').notNull().default(2),
    seller_income: real('seller_income').notNull(),
    description: text('description'),
    shelf_status: text('shelf_status').notNull().default('ON_SALE'),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index('idx_book_posts_seller_id').on(table.seller_id),
    index('idx_book_posts_shelf_status').on(table.shelf_status),
  ],
)

export const campusBookOrders = sqliteTable(
  'campus_book_orders',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    order_no: text('order_no').notNull(),
    book_id: text('book_id').notNull().references(() => campusBookPosts.id, { onDelete: 'cascade' }),
    book_title: text('book_title').notNull(),
    buyer_id: text('buyer_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    seller_id: text('seller_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    sale_price: real('sale_price').notNull(),
    platform_fee: real('platform_fee').notNull(),
    seller_income: real('seller_income').notNull(),
    delivery_building: text('delivery_building').notNull(),
    pay_type: text('pay_type'),
    status: text('status').notNull().default('PENDING_PAYMENT'),
    paid_at: text('paid_at'),
    delivered_at: text('delivered_at'),
    received_at: text('received_at'),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex('idx_book_order_no').on(table.order_no),
    index('idx_book_orders_buyer_id').on(table.buyer_id),
    index('idx_book_orders_seller_id').on(table.seller_id),
    index('idx_book_orders_status').on(table.status),
  ],
)

export const campusPaymentRecords = sqliteTable(
  'campus_payment_records',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    out_trade_no: text('out_trade_no').notNull(),
    biz_type: text('biz_type').notNull(),
    biz_id: text('biz_id').notNull(),
    user_id: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    amount: real('amount').notNull(),
    pay_type: text('pay_type'),
    status: text('status').notNull().default('CREATED'),
    trade_status: text('trade_status'),
    gateway_trade_no: text('gateway_trade_no'),
    gateway_order_id: text('gateway_order_id'),
    pay_url: text('pay_url'),
    qr_code: text('qr_code'),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex('idx_payment_out_trade_no').on(table.out_trade_no),
    index('idx_payment_user_id').on(table.user_id),
  ],
)

export const campusSettlementApplications = sqliteTable(
  'campus_settlement_applications',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    application_no: text('application_no').notNull(),
    user_id: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    amount: real('amount').notNull(),
    status: text('status').notNull().default('PENDING'),
    user_role: text('user_role').notNull().default('user'),
    note: text('note'),
    transfer_ref: text('transfer_ref'),
    handled_by: text('handled_by'),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    uniqueIndex('idx_settlement_application_no').on(table.application_no),
    index('idx_settlement_user_id').on(table.user_id),
    index('idx_settlement_status').on(table.status),
  ],
)

export const campusBalanceLogs = sqliteTable(
  'campus_balance_logs',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
    biz_type: text('biz_type').notNull(),
    biz_id: text('biz_id').notNull(),
    change_type: text('change_type').notNull(),
    amount: real('amount').notNull(),
    before_available: real('before_available').notNull().default(0),
    after_available: real('after_available').notNull().default(0),
    before_pending: real('before_pending').notNull().default(0),
    after_pending: real('after_pending').notNull().default(0),
    remark: text('remark'),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index('idx_balance_logs_user_id').on(table.user_id),
  ],
)
