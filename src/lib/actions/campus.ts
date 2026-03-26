'use server'

import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { createZPayOrder, queryZPayOrder, verifyZPayNotify } from '@/lib/campus/payment'
import { computeBookSettlement, computeExpressQuote, roundMoney } from '@/lib/campus/pricing'
import { getDb, schema } from '@/lib/db'
import type {
  AppRole,
  CampusBizType,
  CampusBookOrder,
  CampusBookPost,
  CampusDashboardData,
  CampusExpressOrder,
  CampusPaymentRecord,
  CampusSettlementApplication,
  PayType,
  Profile,
} from '@/lib/types'

const EXPRESS_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  OPEN: 'OPEN',
  ACCEPTED: 'ACCEPTED',
  PICKED_UP: 'PICKED_UP',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
} as const

const BOOK_POST_STATUS = {
  ON_SALE: 'ON_SALE',
  LOCKED: 'LOCKED',
  SOLD: 'SOLD',
  OFF_SHELF: 'OFF_SHELF',
} as const

const BOOK_ORDER_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  WAITING_SELLER: 'WAITING_SELLER',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
} as const

const SETTLEMENT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function createNo(prefix: string) {
  const now = new Date()
  const body = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`
  const tail = Math.random().toString().slice(2, 6)
  return `${prefix}${body}${tail}`
}

function toCampusExpressOrder(order: typeof schema.campusExpressOrders.$inferSelect): CampusExpressOrder {
  return {
    ...order,
    pickup_codes: typeof order.pickup_codes === 'string'
      ? JSON.parse(order.pickup_codes)
      : order.pickup_codes,
  } as CampusExpressOrder
}

function toCampusExpressOrders(orders: typeof schema.campusExpressOrders.$inferSelect[]): CampusExpressOrder[] {
  return orders.map(toCampusExpressOrder)
}

async function getAuthContext() {
  const session = await getSession()
  if (!session) {
    throw new Error('请先登录。')
  }

  const db = getDb()
  const rows = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, session.userId))
    .limit(1)

  const profile = rows[0]
  if (!profile) {
    throw new Error('未找到当前用户资料，请先执行最新 schema。')
  }

  return {
    db,
    userId: session.userId,
    profile: profile as Profile,
  }
}

function ensureAdmin(profile: Profile) {
  assert(profile.app_role === 'admin', '当前账号不是管理员。')
}

async function getProfileLabelMap(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!uniqueIds.length) {
    return {} as Record<string, string>
  }

  const db = getDb()
  const rows = await db
    .select({
      id: schema.profiles.id,
      nickname: schema.profiles.nickname,
      account: schema.profiles.account,
    })
    .from(schema.profiles)
    .where(inArray(schema.profiles.id, uniqueIds))

  return Object.fromEntries(rows.map((item) => [item.id, item.nickname || item.account])) as Record<string, string>
}

async function getProfileById(userId: string) {
  const db = getDb()
  const rows = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, userId))
    .limit(1)

  const profile = rows[0]
  if (!profile) {
    throw new Error('用户资料不存在。')
  }

  return profile as Profile
}

async function updateCampusBalance(
  userId: string,
  delta: {
    available?: number
    pending?: number
    applying?: number
    settled?: number
  }
) {
  const db = getDb()
  const profile = await getProfileById(userId)
  const next = {
    campus_available_balance: roundMoney(Number(profile.campus_available_balance || 0) + Number(delta.available || 0)),
    campus_pending_balance: roundMoney(Number(profile.campus_pending_balance || 0) + Number(delta.pending || 0)),
    campus_settlement_applying_amount: roundMoney(Number(profile.campus_settlement_applying_amount || 0) + Number(delta.applying || 0)),
    campus_settled_total: roundMoney(Number(profile.campus_settled_total || 0) + Number(delta.settled || 0)),
  }

  await db
    .update(schema.profiles)
    .set(next)
    .where(eq(schema.profiles.id, userId))

  return {
    before: profile,
    after: next,
  }
}

async function addBalanceLog(input: {
  userId: string
  bizType: string
  bizId: string
  changeType: string
  amount: number
  beforeAvailable: number
  afterAvailable: number
  beforePending: number
  afterPending: number
  remark: string
}) {
  const db = getDb()
  await db.insert(schema.campusBalanceLogs).values({
    id: crypto.randomUUID(),
    user_id: input.userId,
    biz_type: input.bizType,
    biz_id: input.bizId,
    change_type: input.changeType,
    amount: roundMoney(input.amount),
    before_available: roundMoney(input.beforeAvailable),
    after_available: roundMoney(input.afterAvailable),
    before_pending: roundMoney(input.beforePending),
    after_pending: roundMoney(input.afterPending),
    remark: input.remark,
    created_at: new Date().toISOString(),
  })
}

async function findPaymentRecord(outTradeNo: string) {
  const db = getDb()
  const rows = await db
    .select()
    .from(schema.campusPaymentRecords)
    .where(eq(schema.campusPaymentRecords.out_trade_no, outTradeNo))
    .limit(1)

  const payment = rows[0]
  if (!payment) {
    throw new Error('支付记录不存在。')
  }

  return payment as CampusPaymentRecord
}

async function markPaymentSuccess(
  payment: CampusPaymentRecord,
  gatewayMeta: { tradeStatus?: string; tradeNo?: string }
) {
  if (payment.status === 'SUCCESS') {
    return payment
  }

  const db = getDb()
  const now = new Date().toISOString()

  await db
    .update(schema.campusPaymentRecords)
    .set({
      status: 'SUCCESS',
      trade_status: gatewayMeta.tradeStatus || 'TRADE_SUCCESS',
      gateway_trade_no: gatewayMeta.tradeNo || payment.gateway_trade_no,
      updated_at: now,
    })
    .where(eq(schema.campusPaymentRecords.id, payment.id))

  if (payment.biz_type === 'EXPRESS_ORDER') {
    await db
      .update(schema.campusExpressOrders)
      .set({
        status: EXPRESS_STATUS.OPEN,
        paid_at: now,
        updated_at: now,
      })
      .where(
        and(
          eq(schema.campusExpressOrders.id, payment.biz_id),
          eq(schema.campusExpressOrders.status, EXPRESS_STATUS.PENDING_PAYMENT),
        ),
      )
  }

  if (payment.biz_type === 'BOOK_ORDER') {
    await db
      .update(schema.campusBookOrders)
      .set({
        status: BOOK_ORDER_STATUS.WAITING_SELLER,
        paid_at: now,
        updated_at: now,
      })
      .where(
        and(
          eq(schema.campusBookOrders.id, payment.biz_id),
          eq(schema.campusBookOrders.status, BOOK_ORDER_STATUS.PENDING_PAYMENT),
        ),
      )
  }

  return {
    ...payment,
    status: 'SUCCESS' as const,
    trade_status: gatewayMeta.tradeStatus || 'TRADE_SUCCESS',
    gateway_trade_no: gatewayMeta.tradeNo || payment.gateway_trade_no,
  } as CampusPaymentRecord
}

export async function getCampusDashboard() {
  const { db, userId, profile } = await getAuthContext()

  const [openExpress, myExpress, onSaleBooks, myBookOrders, pendingSettlements] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)` })
      .from(schema.campusExpressOrders)
      .where(eq(schema.campusExpressOrders.status, EXPRESS_STATUS.OPEN)),
    db
      .select({ value: sql<number>`count(*)` })
      .from(schema.campusExpressOrders)
      .where(eq(schema.campusExpressOrders.user_id, userId)),
    db
      .select({ value: sql<number>`count(*)` })
      .from(schema.campusBookPosts)
      .where(
        and(
          eq(schema.campusBookPosts.seller_id, userId),
          eq(schema.campusBookPosts.shelf_status, BOOK_POST_STATUS.ON_SALE),
        ),
      ),
    db
      .select({ value: sql<number>`count(*)` })
      .from(schema.campusBookOrders)
      .where(eq(schema.campusBookOrders.buyer_id, userId)),
    db
      .select({ value: sql<number>`count(*)` })
      .from(schema.campusSettlementApplications)
      .where(
        and(
          eq(schema.campusSettlementApplications.user_id, userId),
          eq(schema.campusSettlementApplications.status, SETTLEMENT_STATUS.PENDING),
        ),
      ),
  ])

  const data: CampusDashboardData = {
    profile,
    openExpressCount: Number(openExpress[0]?.value || 0),
    myExpressCount: Number(myExpress[0]?.value || 0),
    onSaleBookCount: Number(onSaleBooks[0]?.value || 0),
    myBookOrderCount: Number(myBookOrders[0]?.value || 0),
    pendingSettlementCount: Number(pendingSettlements[0]?.value || 0),
  }

  return { data }
}

export async function createExpressOrder(input: {
  pickupStation: string
  pickupCodes: string[]
  deliveryBuilding: string
  deliveryAddress: string
  expectedTime: string
  remark?: string
  smallCount?: number
  mediumCount?: number
  largeCount?: number
  xlargeCount?: number
}) {
  const { db, userId } = await getAuthContext()
  const quote = computeExpressQuote(input)

  assert(quote.totalCount > 0, '至少选择 1 件快递。')
  assert(input.pickupStation, '请填写取件点。')
  assert(input.pickupCodes?.length, '请填写取件码。')
  assert(input.deliveryBuilding, '请填写楼栋。')
  assert(input.deliveryAddress, '请填写详细地址。')
  assert(input.expectedTime, '请填写期望送达时间。')

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.insert(schema.campusExpressOrders).values({
    id,
    user_id: userId,
    order_no: createNo('EXP'),
    runner_id: null,
    small_count: quote.smallCount,
    medium_count: quote.mediumCount,
    large_count: quote.largeCount,
    xlarge_count: quote.xlargeCount,
    total_count: quote.totalCount,
    pickup_station: input.pickupStation,
    pickup_codes: JSON.stringify(input.pickupCodes),
    delivery_building: input.deliveryBuilding,
    delivery_address: input.deliveryAddress,
    expected_time: input.expectedTime,
    remark: input.remark || '',
    order_amount: quote.orderAmount,
    platform_fee: quote.platformFee,
    runner_income: quote.runnerIncome,
    status: EXPRESS_STATUS.PENDING_PAYMENT,
    pay_type: null,
    created_at: now,
    updated_at: now,
  })

  const rows = await db
    .select()
    .from(schema.campusExpressOrders)
    .where(eq(schema.campusExpressOrders.id, id))
    .limit(1)

  const order = rows[0]
  if (!order) {
    throw new Error('创建快递订单失败。')
  }

  return { order: toCampusExpressOrder(order) }
}

export async function listExpressOrders(view: 'square' | 'mine' | 'runner' = 'mine') {
  const { db, userId } = await getAuthContext()

  const orders = view === 'square'
    ? await db
      .select()
      .from(schema.campusExpressOrders)
      .where(eq(schema.campusExpressOrders.status, EXPRESS_STATUS.OPEN))
      .orderBy(desc(schema.campusExpressOrders.created_at))
    : view === 'runner'
      ? await db
        .select()
        .from(schema.campusExpressOrders)
        .where(eq(schema.campusExpressOrders.runner_id, userId))
        .orderBy(desc(schema.campusExpressOrders.created_at))
      : await db
      .select()
      .from(schema.campusExpressOrders)
      .where(eq(schema.campusExpressOrders.user_id, userId))
      .orderBy(desc(schema.campusExpressOrders.created_at))

  return { orders: toCampusExpressOrders(orders) }
}

export async function acceptExpressOrder(orderId: string) {
  const { db, userId } = await getAuthContext()
  const rows = await db
    .select()
    .from(schema.campusExpressOrders)
    .where(eq(schema.campusExpressOrders.id, orderId))
    .limit(1)

  const order = rows[0]
  if (!order) {
    throw new Error('快递订单不存在。')
  }

  assert(order.status === EXPRESS_STATUS.OPEN, '该订单当前不可接单。')

  const balance = await updateCampusBalance(userId, { pending: Number(order.runner_income) })

  await db
    .update(schema.campusExpressOrders)
    .set({
      runner_id: userId,
      status: EXPRESS_STATUS.ACCEPTED,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.campusExpressOrders.id, orderId))

  await addBalanceLog({
    userId,
    bizType: 'express_order',
    bizId: orderId,
    changeType: 'income_pending',
    amount: Number(order.runner_income),
    beforeAvailable: Number(balance.before.campus_available_balance || 0),
    afterAvailable: Number(balance.after.campus_available_balance || 0),
    beforePending: Number(balance.before.campus_pending_balance || 0),
    afterPending: Number(balance.after.campus_pending_balance || 0),
    remark: '快递接单后进入待完成收入。',
  })

  return { success: true }
}

export async function pickupExpressOrder(orderId: string) {
  const { db, userId } = await getAuthContext()
  await db
    .update(schema.campusExpressOrders)
    .set({
      status: EXPRESS_STATUS.PICKED_UP,
      picked_up_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .where(
      and(
        eq(schema.campusExpressOrders.id, orderId),
        eq(schema.campusExpressOrders.runner_id, userId),
        eq(schema.campusExpressOrders.status, EXPRESS_STATUS.ACCEPTED),
      ),
    )

  return { success: true }
}

export async function deliverExpressOrder(orderId: string) {
  const { db, userId } = await getAuthContext()
  await db
    .update(schema.campusExpressOrders)
    .set({
      status: EXPRESS_STATUS.DELIVERED,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .where(
      and(
        eq(schema.campusExpressOrders.id, orderId),
        eq(schema.campusExpressOrders.runner_id, userId),
        inArray(schema.campusExpressOrders.status, [EXPRESS_STATUS.ACCEPTED, EXPRESS_STATUS.PICKED_UP]),
      ),
    )

  return { success: true }
}

export async function confirmExpressOrder(orderId: string) {
  const { db, userId } = await getAuthContext()
  const rows = await db
    .select()
    .from(schema.campusExpressOrders)
    .where(
      and(
        eq(schema.campusExpressOrders.id, orderId),
        eq(schema.campusExpressOrders.user_id, userId),
      ),
    )
    .limit(1)

  const order = rows[0]
  if (!order) {
    throw new Error('快递订单不存在。')
  }

  assert(order.status === EXPRESS_STATUS.DELIVERED, '订单当前不能确认收货。')
  assert(order.runner_id, '该订单还没有接单员。')

  const balance = await updateCampusBalance(order.runner_id, {
    pending: -Number(order.runner_income),
    available: Number(order.runner_income),
  })

  await db
    .update(schema.campusExpressOrders)
    .set({
      status: EXPRESS_STATUS.COMPLETED,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.campusExpressOrders.id, orderId))

  await addBalanceLog({
    userId: order.runner_id,
    bizType: 'express_order',
    bizId: orderId,
    changeType: 'pending_to_available',
    amount: Number(order.runner_income),
    beforeAvailable: Number(balance.before.campus_available_balance || 0),
    afterAvailable: Number(balance.after.campus_available_balance || 0),
    beforePending: Number(balance.before.campus_pending_balance || 0),
    afterPending: Number(balance.after.campus_pending_balance || 0),
    remark: '快递已完成，收入转入可结算余额。',
  })

  return { success: true }
}

export async function createBookPost(input: {
  title: string
  category: string
  isbn?: string
  conditionLevel: string
  salePrice: number
  description?: string
}) {
  const { db, userId } = await getAuthContext()
  const settlement = computeBookSettlement(input.salePrice)

  assert(input.title, '请填写书名。')
  assert(input.category, '请填写分类。')
  assert(input.conditionLevel, '请填写成色。')
  assert(settlement.sellerIncome >= 0, '售价至少为 2 元。')

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.insert(schema.campusBookPosts).values({
    id,
    seller_id: userId,
    title: input.title,
    category: input.category,
    isbn: input.isbn || '',
    condition_level: input.conditionLevel,
    sale_price: settlement.salePrice,
    platform_fee: settlement.platformFee,
    seller_income: settlement.sellerIncome,
    description: input.description || '',
    shelf_status: BOOK_POST_STATUS.ON_SALE,
    created_at: now,
    updated_at: now,
  })

  const rows = await db
    .select()
    .from(schema.campusBookPosts)
    .where(eq(schema.campusBookPosts.id, id))
    .limit(1)

  const post = rows[0]
  if (!post) {
    throw new Error('发布旧书失败。')
  }

  return { post: post as CampusBookPost }
}

export async function listBookPosts(scope: 'market' | 'mine' = 'market') {
  const { db, userId } = await getAuthContext()

  const rows = scope === 'mine'
    ? await db
      .select()
      .from(schema.campusBookPosts)
      .where(eq(schema.campusBookPosts.seller_id, userId))
      .orderBy(desc(schema.campusBookPosts.created_at))
    : await db
      .select()
      .from(schema.campusBookPosts)
      .where(eq(schema.campusBookPosts.shelf_status, BOOK_POST_STATUS.ON_SALE))
      .orderBy(desc(schema.campusBookPosts.created_at))

  const sellerLabels = await getProfileLabelMap(rows.map((item) => item.seller_id))
  const posts = rows.map((item) => ({
    ...item,
    seller_label: sellerLabels[item.seller_id] || item.seller_id,
  }))

  return { posts: posts as (CampusBookPost & { seller_label?: string })[] }
}

export async function createBookOrder(input: { bookId: string; deliveryBuilding: string }) {
  const { db, userId } = await getAuthContext()
  assert(input.deliveryBuilding, '请填写楼栋/楼层。')

  const postRows = await db
    .select()
    .from(schema.campusBookPosts)
    .where(eq(schema.campusBookPosts.id, input.bookId))
    .limit(1)

  const post = postRows[0]
  if (!post) {
    throw new Error('旧书帖子不存在。')
  }

  assert(post.seller_id !== userId, '不能购买自己发布的旧书。')
  assert(post.shelf_status === BOOK_POST_STATUS.ON_SALE, '该旧书当前不可购买。')

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.insert(schema.campusBookOrders).values({
    id,
    order_no: createNo('BKO'),
    book_id: post.id,
    book_title: post.title,
    buyer_id: userId,
    seller_id: post.seller_id,
    sale_price: post.sale_price,
    platform_fee: post.platform_fee,
    seller_income: post.seller_income,
    delivery_building: input.deliveryBuilding,
    pay_type: null,
    status: BOOK_ORDER_STATUS.PENDING_PAYMENT,
    paid_at: null,
    delivered_at: null,
    received_at: null,
    created_at: now,
    updated_at: now,
  })

  const rows = await db
    .select()
    .from(schema.campusBookOrders)
    .where(eq(schema.campusBookOrders.id, id))
    .limit(1)

  const order = rows[0]
  if (!order) {
    throw new Error('创建旧书订单失败。')
  }

  await db
    .update(schema.campusBookPosts)
    .set({
      shelf_status: BOOK_POST_STATUS.LOCKED,
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.campusBookPosts.id, post.id))

  return { order: order as CampusBookOrder }
}

export async function listBookOrders(view: 'buyer' | 'seller' = 'buyer') {
  const { db, userId } = await getAuthContext()

  const rows = view === 'buyer'
    ? await db
      .select()
      .from(schema.campusBookOrders)
      .where(eq(schema.campusBookOrders.buyer_id, userId))
      .orderBy(desc(schema.campusBookOrders.created_at))
    : await db
      .select()
      .from(schema.campusBookOrders)
      .where(eq(schema.campusBookOrders.seller_id, userId))
      .orderBy(desc(schema.campusBookOrders.created_at))

  const labels = await getProfileLabelMap(rows.flatMap((item) => [item.buyer_id, item.seller_id]))
  const orders = rows.map((item) => ({
    ...item,
    buyer_label: labels[item.buyer_id] || item.buyer_id,
    seller_label: labels[item.seller_id] || item.seller_id,
  }))

  return { orders: orders as (CampusBookOrder & { buyer_label?: string; seller_label?: string })[] }
}

export async function deliverBookOrder(orderId: string) {
  const { db, userId } = await getAuthContext()
  await db
    .update(schema.campusBookOrders)
    .set({
      status: BOOK_ORDER_STATUS.DELIVERED,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .where(
      and(
        eq(schema.campusBookOrders.id, orderId),
        eq(schema.campusBookOrders.seller_id, userId),
        eq(schema.campusBookOrders.status, BOOK_ORDER_STATUS.WAITING_SELLER),
      ),
    )

  return { success: true }
}

export async function confirmBookOrder(orderId: string) {
  const { db, userId } = await getAuthContext()
  const rows = await db
    .select()
    .from(schema.campusBookOrders)
    .where(
      and(
        eq(schema.campusBookOrders.id, orderId),
        eq(schema.campusBookOrders.buyer_id, userId),
      ),
    )
    .limit(1)

  const order = rows[0]
  if (!order) {
    throw new Error('旧书订单不存在。')
  }

  assert(order.status === BOOK_ORDER_STATUS.DELIVERED, '订单当前不能确认收货。')

  const balance = await updateCampusBalance(order.seller_id, {
    available: Number(order.seller_income),
  })

  await db
    .update(schema.campusBookOrders)
    .set({
      status: BOOK_ORDER_STATUS.COMPLETED,
      received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.campusBookOrders.id, orderId))

  await db
    .update(schema.campusBookPosts)
    .set({
      shelf_status: BOOK_POST_STATUS.SOLD,
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.campusBookPosts.id, order.book_id))

  await addBalanceLog({
    userId: order.seller_id,
    bizType: 'book_order',
    bizId: orderId,
    changeType: 'income_available',
    amount: Number(order.seller_income),
    beforeAvailable: Number(balance.before.campus_available_balance || 0),
    afterAvailable: Number(balance.after.campus_available_balance || 0),
    beforePending: Number(balance.before.campus_pending_balance || 0),
    afterPending: Number(balance.after.campus_pending_balance || 0),
    remark: '买家确认收货后，卖家余额增加。',
  })

  return { success: true }
}

export async function createCampusPayment(input: { bizType: CampusBizType; bizId: string; payType: PayType }) {
  const { db, userId } = await getAuthContext()
  let amount = 0
  let orderName = ''

  if (input.bizType === 'EXPRESS_ORDER') {
    const rows = await db
      .select()
      .from(schema.campusExpressOrders)
      .where(eq(schema.campusExpressOrders.id, input.bizId))
      .limit(1)

    const order = rows[0]
    if (!order) {
      throw new Error('快递订单不存在。')
    }

    assert(order.user_id === userId, '只有下单人可以支付。')
    assert(order.status === EXPRESS_STATUS.PENDING_PAYMENT, '当前订单已支付或状态已变更。')
    amount = Number(order.order_amount)
    orderName = `校园快递-${order.order_no}`
  } else {
    const rows = await db
      .select()
      .from(schema.campusBookOrders)
      .where(eq(schema.campusBookOrders.id, input.bizId))
      .limit(1)

    const order = rows[0]
    if (!order) {
      throw new Error('旧书订单不存在。')
    }

    assert(order.buyer_id === userId, '只有买家可以支付。')
    assert(order.status === BOOK_ORDER_STATUS.PENDING_PAYMENT, '当前订单已支付或状态已变更。')
    amount = Number(order.sale_price)
    orderName = `旧书订单-${order.order_no}`
  }

  const paymentRows = await db
    .select()
    .from(schema.campusPaymentRecords)
    .where(
      and(
        eq(schema.campusPaymentRecords.biz_type, input.bizType),
        eq(schema.campusPaymentRecords.biz_id, input.bizId),
        ne(schema.campusPaymentRecords.status, 'SUCCESS'),
      ),
    )
    .orderBy(desc(schema.campusPaymentRecords.created_at))
    .limit(1)

  let payment = paymentRows[0] as CampusPaymentRecord | undefined
  if (!payment) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await db.insert(schema.campusPaymentRecords).values({
      id,
      out_trade_no: createNo('PAY'),
      biz_type: input.bizType,
      biz_id: input.bizId,
      user_id: userId,
      amount,
      pay_type: input.payType,
      status: 'CREATED',
      trade_status: null,
      gateway_trade_no: null,
      gateway_order_id: null,
      pay_url: null,
      qr_code: null,
      created_at: now,
      updated_at: now,
    })

    const createdRows = await db
      .select()
      .from(schema.campusPaymentRecords)
      .where(eq(schema.campusPaymentRecords.id, id))
      .limit(1)

    const created = createdRows[0]
    if (!created) {
      throw new Error('创建支付记录失败。')
    }

    payment = created as CampusPaymentRecord
  }

  const gateway = await createZPayOrder({
    name: orderName,
    money: amount,
    outTradeNo: payment.out_trade_no,
    clientIp: '127.0.0.1',
    param: `${input.bizType}:${input.bizId}`,
    type: input.payType,
  })

  const now = new Date().toISOString()

  await db
    .update(schema.campusPaymentRecords)
    .set({
      pay_type: input.payType,
      gateway_trade_no: gateway.gatewayTradeNo,
      gateway_order_id: gateway.gatewayOrderId,
      pay_url: gateway.payUrl,
      qr_code: gateway.qrCode,
      updated_at: now,
    })
    .where(eq(schema.campusPaymentRecords.id, payment.id))

  if (input.bizType === 'EXPRESS_ORDER') {
    await db
      .update(schema.campusExpressOrders)
      .set({ pay_type: input.payType, updated_at: now })
      .where(
        and(
          eq(schema.campusExpressOrders.id, input.bizId),
          eq(schema.campusExpressOrders.user_id, userId),
        ),
      )
  } else {
    await db
      .update(schema.campusBookOrders)
      .set({ pay_type: input.payType, updated_at: now })
      .where(
        and(
          eq(schema.campusBookOrders.id, input.bizId),
          eq(schema.campusBookOrders.buyer_id, userId),
        ),
      )
  }

  return {
    payment: {
      ...payment,
      pay_type: input.payType,
      pay_url: gateway.payUrl,
      qr_code: gateway.qrCode,
      gateway_trade_no: gateway.gatewayTradeNo,
      gateway_order_id: gateway.gatewayOrderId,
    },
  }
}

export async function syncCampusPayment(input: { outTradeNo?: string; bizType?: CampusBizType; bizId?: string }) {
  const { db, userId } = await getAuthContext()
  let payment: CampusPaymentRecord | null = null

  if (input.outTradeNo) {
    payment = await findPaymentRecord(input.outTradeNo)
  } else {
    assert(input.bizType && input.bizId, '缺少待同步的支付记录。')
    const rows = await db
      .select()
      .from(schema.campusPaymentRecords)
      .where(
        and(
          eq(schema.campusPaymentRecords.biz_type, input.bizType),
          eq(schema.campusPaymentRecords.biz_id, input.bizId),
          eq(schema.campusPaymentRecords.user_id, userId),
        ),
      )
      .orderBy(desc(schema.campusPaymentRecords.created_at))
      .limit(1)

    payment = (rows[0] as CampusPaymentRecord | undefined) || null
  }

  assert(payment, '支付记录不存在。')
  assert(payment.user_id === userId, '只能同步自己的支付记录。')

  const gatewayPayload = await queryZPayOrder({
    outTradeNo: payment.out_trade_no,
    tradeNo: payment.gateway_trade_no || undefined,
  })

  if (Number(gatewayPayload.status) === 1) {
    payment = await markPaymentSuccess(payment, {
      tradeStatus: 'TRADE_SUCCESS',
      tradeNo: gatewayPayload.trade_no,
    })
  }

  return {
    payment,
    gateway: gatewayPayload,
  }
}

export async function getCampusWalletData() {
  const { db, userId, profile } = await getAuthContext()
  const [settlements, logs] = await Promise.all([
    db
      .select()
      .from(schema.campusSettlementApplications)
      .where(eq(schema.campusSettlementApplications.user_id, userId))
      .orderBy(desc(schema.campusSettlementApplications.created_at))
      .limit(20),
    db
      .select()
      .from(schema.campusBalanceLogs)
      .where(eq(schema.campusBalanceLogs.user_id, userId))
      .orderBy(desc(schema.campusBalanceLogs.created_at))
      .limit(20),
  ])

  return {
    profile,
    settlements: settlements as CampusSettlementApplication[],
    logs,
  }
}

export async function createSettlementApplication(amount: number) {
  const { db, profile } = await getAuthContext()
  const applyAmount = roundMoney(Number(amount || 0))

  assert(applyAmount > 0, '请输入正确的结算金额。')

  const currentAvailable = Number(profile.campus_available_balance || 0)
  assert(currentAvailable >= applyAmount, '可结算余额不足。')

  const balance = await updateCampusBalance(profile.id, {
    available: -applyAmount,
    applying: applyAmount,
  })

  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  await db.insert(schema.campusSettlementApplications).values({
    id,
    application_no: createNo('SET'),
    user_id: profile.id,
    amount: applyAmount,
    status: SETTLEMENT_STATUS.PENDING,
    user_role: profile.app_role || 'user',
    note: null,
    transfer_ref: null,
    handled_by: null,
    created_at: now,
    updated_at: now,
  })

  const rows = await db
    .select()
    .from(schema.campusSettlementApplications)
    .where(eq(schema.campusSettlementApplications.id, id))
    .limit(1)

  const application = rows[0]
  if (!application) {
    throw new Error('提交结算申请失败。')
  }

  await addBalanceLog({
    userId: profile.id,
    bizType: 'settlement',
    bizId: application.id,
    changeType: 'available_to_applying',
    amount: applyAmount,
    beforeAvailable: Number(balance.before.campus_available_balance || 0),
    afterAvailable: Number(balance.after.campus_available_balance || 0),
    beforePending: Number(balance.before.campus_pending_balance || 0),
    afterPending: Number(balance.after.campus_pending_balance || 0),
    remark: '发起结算申请。',
  })

  return { application: application as CampusSettlementApplication }
}

export async function getAdminDashboardData() {
  const { db, profile } = await getAuthContext()
  ensureAdmin(profile)

  const [express, posts, bookOrders, settlements, users] = await Promise.all([
    db.select().from(schema.campusExpressOrders).orderBy(desc(schema.campusExpressOrders.created_at)).limit(20),
    db.select().from(schema.campusBookPosts).orderBy(desc(schema.campusBookPosts.created_at)).limit(20),
    db.select().from(schema.campusBookOrders).orderBy(desc(schema.campusBookOrders.created_at)).limit(20),
    db.select().from(schema.campusSettlementApplications).orderBy(desc(schema.campusSettlementApplications.created_at)).limit(20),
    db
      .select({
        id: schema.profiles.id,
        account: schema.profiles.account,
        nickname: schema.profiles.nickname,
        app_role: schema.profiles.app_role,
        campus_available_balance: schema.profiles.campus_available_balance,
        campus_pending_balance: schema.profiles.campus_pending_balance,
      })
      .from(schema.profiles)
      .orderBy(desc(schema.profiles.created_at))
      .limit(50),
  ])

  return {
    expressOrders: toCampusExpressOrders(express),
    bookPosts: posts as CampusBookPost[],
    bookOrders: bookOrders as CampusBookOrder[],
    settlementApplications: settlements as CampusSettlementApplication[],
    users,
  }
}

export async function approveSettlement(input: { applicationId: string; transferRef: string; note?: string }) {
  const { db, profile } = await getAuthContext()
  ensureAdmin(profile)

  const rows = await db
    .select()
    .from(schema.campusSettlementApplications)
    .where(eq(schema.campusSettlementApplications.id, input.applicationId))
    .limit(1)

  const application = rows[0]
  if (!application) {
    throw new Error('结算申请不存在。')
  }

  assert(application.status === SETTLEMENT_STATUS.PENDING, '该申请已经处理过。')

  const balance = await updateCampusBalance(application.user_id, {
    applying: -Number(application.amount),
    settled: Number(application.amount),
  })

  await db
    .update(schema.campusSettlementApplications)
    .set({
      status: SETTLEMENT_STATUS.APPROVED,
      handled_by: profile.id,
      transfer_ref: input.transferRef,
      note: input.note || '管理员已线下打款。',
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.campusSettlementApplications.id, input.applicationId))

  await addBalanceLog({
    userId: application.user_id,
    bizType: 'settlement',
    bizId: input.applicationId,
    changeType: 'applying_to_settled',
    amount: Number(application.amount),
    beforeAvailable: Number(balance.before.campus_available_balance || 0),
    afterAvailable: Number(balance.after.campus_available_balance || 0),
    beforePending: Number(balance.before.campus_pending_balance || 0),
    afterPending: Number(balance.after.campus_pending_balance || 0),
    remark: '管理员已确认结算。',
  })

  return { success: true }
}

export async function rejectSettlement(input: { applicationId: string; note: string }) {
  const { db, profile } = await getAuthContext()
  ensureAdmin(profile)

  const rows = await db
    .select()
    .from(schema.campusSettlementApplications)
    .where(eq(schema.campusSettlementApplications.id, input.applicationId))
    .limit(1)

  const application = rows[0]
  if (!application) {
    throw new Error('结算申请不存在。')
  }

  assert(application.status === SETTLEMENT_STATUS.PENDING, '该申请已经处理过。')

  const balance = await updateCampusBalance(application.user_id, {
    available: Number(application.amount),
    applying: -Number(application.amount),
  })

  await db
    .update(schema.campusSettlementApplications)
    .set({
      status: SETTLEMENT_STATUS.REJECTED,
      handled_by: profile.id,
      note: input.note,
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.campusSettlementApplications.id, input.applicationId))

  await addBalanceLog({
    userId: application.user_id,
    bizType: 'settlement',
    bizId: input.applicationId,
    changeType: 'applying_to_available',
    amount: Number(application.amount),
    beforeAvailable: Number(balance.before.campus_available_balance || 0),
    afterAvailable: Number(balance.after.campus_available_balance || 0),
    beforePending: Number(balance.before.campus_pending_balance || 0),
    afterPending: Number(balance.after.campus_pending_balance || 0),
    remark: '管理员已驳回结算申请。',
  })

  return { success: true }
}

export async function updateUserAppRole(input: { userId: string; role: AppRole }) {
  const { db, profile } = await getAuthContext()
  ensureAdmin(profile)

  assert(input.userId, '缺少目标用户。')
  assert(['admin', 'user'].includes(input.role), '角色参数错误。')
  assert(!(input.userId === profile.id && input.role === 'user'), '不能把当前管理员自己降为普通用户。')

  await db
    .update(schema.profiles)
    .set({
      app_role: input.role,
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.profiles.id, input.userId))

  return { success: true }
}

export async function handleCampusPaymentNotify(params: Record<string, string>) {
  assert(params.out_trade_no, 'out_trade_no is required.')
  assert(params.trade_status === 'TRADE_SUCCESS', 'trade_status must be TRADE_SUCCESS.')
  assert(verifyZPayNotify(params), 'Invalid notify signature.')

  const payment = await findPaymentRecord(params.out_trade_no)
  assert(Number(payment.amount).toFixed(2) === Number(params.money).toFixed(2), 'Payment amount mismatch.')

  await markPaymentSuccess(payment, {
    tradeStatus: params.trade_status,
    tradeNo: params.trade_no,
  })

  return { success: true }
}
