'use server'

import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeBookSettlement, computeExpressQuote, roundMoney } from '@/lib/campus/pricing'
import { createZPayOrder, queryZPayOrder, verifyZPayNotify } from '@/lib/campus/payment'
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

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assert(user, '请先登录。')

  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    throw new Error('未找到当前用户资料，请先执行最新 schema。')
  }

  return {
    admin,
    user,
    profile: profile as Profile,
  }
}

function ensureAdmin(profile: Profile) {
  assert(profile.app_role === 'admin', '当前账号不是管理员。')
}

async function getProfileLabelMap(admin: ReturnType<typeof createAdminClient>, ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!uniqueIds.length) {
    return {} as Record<string, string>
  }

  const { data } = await admin
    .from('profiles')
    .select('id, nickname, account')
    .in('id', uniqueIds)

  return Object.fromEntries(
    (data || []).map((item: { id: string; nickname: string | null; account: string }) => [item.id, item.nickname || item.account])
  )
}

async function getProfileById(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new Error('用户资料不存在。')
  }

  return data as Profile
}

async function updateCampusBalance(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  delta: {
    available?: number
    pending?: number
    applying?: number
    settled?: number
  }
) {
  const profile = await getProfileById(admin, userId)
  const next = {
    campus_available_balance: roundMoney(Number(profile.campus_available_balance || 0) + Number(delta.available || 0)),
    campus_pending_balance: roundMoney(Number(profile.campus_pending_balance || 0) + Number(delta.pending || 0)),
    campus_settlement_applying_amount: roundMoney(Number(profile.campus_settlement_applying_amount || 0) + Number(delta.applying || 0)),
    campus_settled_total: roundMoney(Number(profile.campus_settled_total || 0) + Number(delta.settled || 0)),
  }

  const { error } = await admin
    .from('profiles')
    .update(next)
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }

  return {
    before: profile,
    after: next,
  }
}

async function addBalanceLog(
  admin: ReturnType<typeof createAdminClient>,
  input: {
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
  }
) {
  await admin.from('campus_balance_logs').insert({
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
  })
}

async function findPaymentRecord(admin: ReturnType<typeof createAdminClient>, outTradeNo: string) {
  const { data, error } = await admin
    .from('campus_payment_records')
    .select('*')
    .eq('out_trade_no', outTradeNo)
    .single()

  if (error || !data) {
    throw new Error('支付记录不存在。')
  }

  return data as CampusPaymentRecord
}

async function markPaymentSuccess(
  admin: ReturnType<typeof createAdminClient>,
  payment: CampusPaymentRecord,
  gatewayMeta: { tradeStatus?: string; tradeNo?: string }
) {
  if (payment.status === 'SUCCESS') {
    return payment
  }

  const { error: paymentError } = await admin
    .from('campus_payment_records')
    .update({
      status: 'SUCCESS',
      trade_status: gatewayMeta.tradeStatus || 'TRADE_SUCCESS',
      gateway_trade_no: gatewayMeta.tradeNo || payment.gateway_trade_no,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  if (paymentError) {
    throw new Error(paymentError.message)
  }

  if (payment.biz_type === 'EXPRESS_ORDER') {
    const { error } = await admin
      .from('campus_express_orders')
      .update({
        status: EXPRESS_STATUS.OPEN,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.biz_id)
      .eq('status', EXPRESS_STATUS.PENDING_PAYMENT)

    if (error) {
      throw new Error(error.message)
    }
  }

  if (payment.biz_type === 'BOOK_ORDER') {
    const { error } = await admin
      .from('campus_book_orders')
      .update({
        status: BOOK_ORDER_STATUS.WAITING_SELLER,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.biz_id)
      .eq('status', BOOK_ORDER_STATUS.PENDING_PAYMENT)

    if (error) {
      throw new Error(error.message)
    }
  }

  return {
    ...payment,
    status: 'SUCCESS' as const,
    trade_status: gatewayMeta.tradeStatus || 'TRADE_SUCCESS',
    gateway_trade_no: gatewayMeta.tradeNo || payment.gateway_trade_no,
  } as CampusPaymentRecord
}

export async function getCampusDashboard() {
  const { admin, user, profile } = await getAuthContext()

  const [openExpress, myExpress, onSaleBooks, myBookOrders, pendingSettlements] = await Promise.all([
    admin.from('campus_express_orders').select('*', { count: 'exact', head: true }).eq('status', EXPRESS_STATUS.OPEN),
    admin.from('campus_express_orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('campus_book_posts').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('shelf_status', BOOK_POST_STATUS.ON_SALE),
    admin.from('campus_book_orders').select('*', { count: 'exact', head: true }).eq('buyer_id', user.id),
    admin.from('campus_settlement_applications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', SETTLEMENT_STATUS.PENDING),
  ])

  const data: CampusDashboardData = {
    profile,
    openExpressCount: openExpress.count || 0,
    myExpressCount: myExpress.count || 0,
    onSaleBookCount: onSaleBooks.count || 0,
    myBookOrderCount: myBookOrders.count || 0,
    pendingSettlementCount: pendingSettlements.count || 0,
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
  const { admin, user } = await getAuthContext()
  const quote = computeExpressQuote(input)

  assert(quote.totalCount > 0, '至少选择 1 件快递。')
  assert(input.pickupStation, '请填写取件点。')
  assert(input.pickupCodes?.length, '请填写取件码。')
  assert(input.deliveryBuilding, '请填写楼栋。')
  assert(input.deliveryAddress, '请填写详细地址。')
  assert(input.expectedTime, '请填写期望送达时间。')

  const payload = {
    user_id: user.id,
    order_no: createNo('EXP'),
    runner_id: null,
    small_count: quote.smallCount,
    medium_count: quote.mediumCount,
    large_count: quote.largeCount,
    xlarge_count: quote.xlargeCount,
    total_count: quote.totalCount,
    pickup_station: input.pickupStation,
    pickup_codes: input.pickupCodes,
    delivery_building: input.deliveryBuilding,
    delivery_address: input.deliveryAddress,
    expected_time: input.expectedTime,
    remark: input.remark || '',
    order_amount: quote.orderAmount,
    platform_fee: quote.platformFee,
    runner_income: quote.runnerIncome,
    status: EXPRESS_STATUS.PENDING_PAYMENT,
    pay_type: null,
  }

  const { data, error } = await admin
    .from('campus_express_orders')
    .insert(payload)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || '创建快递订单失败。')
  }

  return { order: data as CampusExpressOrder }
}

export async function listExpressOrders(view: 'square' | 'mine' | 'runner' = 'mine') {
  const { admin, user } = await getAuthContext()
  let query = admin.from('campus_express_orders').select('*').order('created_at', { ascending: false })

  if (view === 'square') {
    query = query.eq('status', EXPRESS_STATUS.OPEN)
  } else if (view === 'runner') {
    query = query.eq('runner_id', user.id)
  } else {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  return { orders: (data || []) as CampusExpressOrder[] }
}

export async function acceptExpressOrder(orderId: string) {
  const { admin, user } = await getAuthContext()
  const { data: order, error } = await admin
    .from('campus_express_orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    throw new Error('快递订单不存在。')
  }
  assert(order.status === EXPRESS_STATUS.OPEN, '该订单当前不可接单。')

  const balance = await updateCampusBalance(admin, user.id, { pending: Number(order.runner_income) })

  await admin
    .from('campus_express_orders')
    .update({
      runner_id: user.id,
      status: EXPRESS_STATUS.ACCEPTED,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  await addBalanceLog(admin, {
    userId: user.id,
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
  const { admin, user } = await getAuthContext()
  const { error } = await admin
    .from('campus_express_orders')
    .update({
      status: EXPRESS_STATUS.PICKED_UP,
      picked_up_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('runner_id', user.id)
    .eq('status', EXPRESS_STATUS.ACCEPTED)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

export async function deliverExpressOrder(orderId: string) {
  const { admin, user } = await getAuthContext()
  const { error } = await admin
    .from('campus_express_orders')
    .update({
      status: EXPRESS_STATUS.DELIVERED,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('runner_id', user.id)
    .in('status', [EXPRESS_STATUS.ACCEPTED, EXPRESS_STATUS.PICKED_UP])

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

export async function confirmExpressOrder(orderId: string) {
  const { admin, user } = await getAuthContext()
  const { data: order, error } = await admin
    .from('campus_express_orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (error || !order) {
    throw new Error('快递订单不存在。')
  }
  assert(order.status === EXPRESS_STATUS.DELIVERED, '订单当前不能确认收货。')
  assert(order.runner_id, '该订单还没有接单员。')

  const balance = await updateCampusBalance(admin, order.runner_id, {
    pending: -Number(order.runner_income),
    available: Number(order.runner_income),
  })

  await admin
    .from('campus_express_orders')
    .update({
      status: EXPRESS_STATUS.COMPLETED,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  await addBalanceLog(admin, {
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
  const { admin, user } = await getAuthContext()
  const settlement = computeBookSettlement(input.salePrice)
  assert(input.title, '请填写书名。')
  assert(input.category, '请填写分类。')
  assert(input.conditionLevel, '请填写成色。')
  assert(settlement.sellerIncome >= 0, '售价至少为 2 元。')

  const { data, error } = await admin
    .from('campus_book_posts')
    .insert({
      seller_id: user.id,
      title: input.title,
      category: input.category,
      isbn: input.isbn || '',
      condition_level: input.conditionLevel,
      sale_price: settlement.salePrice,
      platform_fee: settlement.platformFee,
      seller_income: settlement.sellerIncome,
      description: input.description || '',
      shelf_status: BOOK_POST_STATUS.ON_SALE,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || '发布旧书失败。')
  }

  return { post: data as CampusBookPost }
}

export async function listBookPosts(scope: 'market' | 'mine' = 'market') {
  const { admin, user } = await getAuthContext()
  let query = admin.from('campus_book_posts').select('*').order('created_at', { ascending: false })
  if (scope === 'mine') {
    query = query.eq('seller_id', user.id)
  } else {
    query = query.eq('shelf_status', BOOK_POST_STATUS.ON_SALE)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  const sellerLabels = await getProfileLabelMap(admin, (data || []).map((item: any) => item.seller_id))
  const posts = (data || []).map((item: any) => ({
    ...item,
    seller_label: sellerLabels[item.seller_id] || item.seller_id,
  }))

  return { posts: posts as (CampusBookPost & { seller_label?: string })[] }
}

export async function createBookOrder(input: { bookId: string; deliveryBuilding: string }) {
  const { admin, user } = await getAuthContext()
  assert(input.deliveryBuilding, '请填写楼栋/楼层。')

  const { data: post, error } = await admin
    .from('campus_book_posts')
    .select('*')
    .eq('id', input.bookId)
    .single()

  if (error || !post) {
    throw new Error('旧书帖子不存在。')
  }
  assert(post.seller_id !== user.id, '不能购买自己发布的旧书。')
  assert(post.shelf_status === BOOK_POST_STATUS.ON_SALE, '该旧书当前不可购买。')

  const orderNo = createNo('BKO')
  const { data, error: insertError } = await admin
    .from('campus_book_orders')
    .insert({
      order_no: orderNo,
      book_id: post.id,
      book_title: post.title,
      buyer_id: user.id,
      seller_id: post.seller_id,
      sale_price: post.sale_price,
      platform_fee: post.platform_fee,
      seller_income: post.seller_income,
      delivery_building: input.deliveryBuilding,
      pay_type: null,
      status: BOOK_ORDER_STATUS.PENDING_PAYMENT,
    })
    .select('*')
    .single()

  if (insertError || !data) {
    throw new Error(insertError?.message || '创建旧书订单失败。')
  }

  await admin
    .from('campus_book_posts')
    .update({ shelf_status: BOOK_POST_STATUS.LOCKED, updated_at: new Date().toISOString() })
    .eq('id', post.id)

  return { order: data as CampusBookOrder }
}

export async function listBookOrders(view: 'buyer' | 'seller' = 'buyer') {
  const { admin, user } = await getAuthContext()
  const { data, error } = await admin
    .from('campus_book_orders')
    .select('*')
    .eq(view === 'buyer' ? 'buyer_id' : 'seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const labels = await getProfileLabelMap(admin, (data || []).flatMap((item: any) => [item.buyer_id, item.seller_id]))
  const orders = (data || []).map((item: any) => ({
    ...item,
    buyer_label: labels[item.buyer_id] || item.buyer_id,
    seller_label: labels[item.seller_id] || item.seller_id,
  }))

  return { orders: orders as (CampusBookOrder & { buyer_label?: string; seller_label?: string })[] }
}

export async function deliverBookOrder(orderId: string) {
  const { admin, user } = await getAuthContext()
  const { error } = await admin
    .from('campus_book_orders')
    .update({
      status: BOOK_ORDER_STATUS.DELIVERED,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('seller_id', user.id)
    .eq('status', BOOK_ORDER_STATUS.WAITING_SELLER)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

export async function confirmBookOrder(orderId: string) {
  const { admin, user } = await getAuthContext()
  const { data: order, error } = await admin
    .from('campus_book_orders')
    .select('*')
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .single()

  if (error || !order) {
    throw new Error('旧书订单不存在。')
  }
  assert(order.status === BOOK_ORDER_STATUS.DELIVERED, '订单当前不能确认收货。')

  const balance = await updateCampusBalance(admin, order.seller_id, {
    available: Number(order.seller_income),
  })

  await admin
    .from('campus_book_orders')
    .update({
      status: BOOK_ORDER_STATUS.COMPLETED,
      received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  await admin
    .from('campus_book_posts')
    .update({ shelf_status: BOOK_POST_STATUS.SOLD, updated_at: new Date().toISOString() })
    .eq('id', order.book_id)

  await addBalanceLog(admin, {
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
  const { admin, user } = await getAuthContext()
  let amount = 0
  let orderName = ''
  let orderOwnerField = ''
  let orderTable = ''

  if (input.bizType === 'EXPRESS_ORDER') {
    const { data: order, error } = await admin
      .from('campus_express_orders')
      .select('*')
      .eq('id', input.bizId)
      .single()

    if (error || !order) {
      throw new Error('快递订单不存在。')
    }
    assert(order.user_id === user.id, '只有下单人可以支付。')
    assert(order.status === EXPRESS_STATUS.PENDING_PAYMENT, '当前订单已支付或状态已变更。')
    amount = Number(order.order_amount)
    orderName = `校园快递-${order.order_no}`
    orderOwnerField = 'user_id'
    orderTable = 'campus_express_orders'
  } else {
    const { data: order, error } = await admin
      .from('campus_book_orders')
      .select('*')
      .eq('id', input.bizId)
      .single()

    if (error || !order) {
      throw new Error('旧书订单不存在。')
    }
    assert(order.buyer_id === user.id, '只有买家可以支付。')
    assert(order.status === BOOK_ORDER_STATUS.PENDING_PAYMENT, '当前订单已支付或状态已变更。')
    amount = Number(order.sale_price)
    orderName = `旧书订单-${order.order_no}`
    orderOwnerField = 'buyer_id'
    orderTable = 'campus_book_orders'
  }

  const { data: existing } = await admin
    .from('campus_payment_records')
    .select('*')
    .eq('biz_type', input.bizType)
    .eq('biz_id', input.bizId)
    .neq('status', 'SUCCESS')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let payment = existing as CampusPaymentRecord | null
  if (!payment) {
    const { data: created, error } = await admin
      .from('campus_payment_records')
      .insert({
        out_trade_no: createNo('PAY'),
        biz_type: input.bizType,
        biz_id: input.bizId,
        user_id: user.id,
        amount,
        pay_type: input.payType,
        status: 'CREATED',
      })
      .select('*')
      .single()

    if (error || !created) {
      throw new Error(error?.message || '创建支付记录失败。')
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

  await admin
    .from('campus_payment_records')
    .update({
      pay_type: input.payType,
      gateway_trade_no: gateway.gatewayTradeNo,
      gateway_order_id: gateway.gatewayOrderId,
      pay_url: gateway.payUrl,
      qr_code: gateway.qrCode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  await admin
    .from(orderTable)
    .update({ pay_type: input.payType, updated_at: new Date().toISOString() })
    .eq('id', input.bizId)
    .eq(orderOwnerField, user.id)

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
  const { admin, user } = await getAuthContext()
  let payment: CampusPaymentRecord | null = null

  if (input.outTradeNo) {
    payment = await findPaymentRecord(admin, input.outTradeNo)
  } else {
    assert(input.bizType && input.bizId, '缺少待同步的支付记录。')
    const { data } = await admin
      .from('campus_payment_records')
      .select('*')
      .eq('biz_type', input.bizType)
      .eq('biz_id', input.bizId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    payment = data as CampusPaymentRecord
  }

  assert(payment, '支付记录不存在。')
  assert(payment.user_id === user.id, '只能同步自己的支付记录。')

  const gatewayPayload = await queryZPayOrder({
    outTradeNo: payment.out_trade_no,
    tradeNo: payment.gateway_trade_no || undefined,
  })

  if (Number(gatewayPayload.status) === 1) {
    payment = await markPaymentSuccess(admin, payment, {
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
  const { admin, user, profile } = await getAuthContext()
  const [settlements, logs] = await Promise.all([
    admin
      .from('campus_settlement_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('campus_balance_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return {
    profile,
    settlements: (settlements.data || []) as CampusSettlementApplication[],
    logs: (logs.data || []),
  }
}

export async function createSettlementApplication(amount: number) {
  const { admin, profile } = await getAuthContext()
  const applyAmount = roundMoney(Number(amount || 0))
  assert(applyAmount > 0, '请输入正确的结算金额。')

  const currentAvailable = Number(profile.campus_available_balance || 0)
  assert(currentAvailable >= applyAmount, '可结算余额不足。')

  const balance = await updateCampusBalance(admin, profile.id, {
    available: -applyAmount,
    applying: applyAmount,
  })

  const { data, error } = await admin
    .from('campus_settlement_applications')
    .insert({
      application_no: createNo('SET'),
      user_id: profile.id,
      amount: applyAmount,
      status: SETTLEMENT_STATUS.PENDING,
      user_role: profile.app_role || 'user',
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || '提交结算申请失败。')
  }

  await addBalanceLog(admin, {
    userId: profile.id,
    bizType: 'settlement',
    bizId: data.id,
    changeType: 'available_to_applying',
    amount: applyAmount,
    beforeAvailable: Number(balance.before.campus_available_balance || 0),
    afterAvailable: Number(balance.after.campus_available_balance || 0),
    beforePending: Number(balance.before.campus_pending_balance || 0),
    afterPending: Number(balance.after.campus_pending_balance || 0),
    remark: '发起结算申请。',
  })

  return { application: data as CampusSettlementApplication }
}

export async function getAdminDashboardData() {
  const { admin, profile } = await getAuthContext()
  ensureAdmin(profile)

  const [express, posts, bookOrders, settlements, users] = await Promise.all([
    admin.from('campus_express_orders').select('*').order('created_at', { ascending: false }).limit(20),
    admin.from('campus_book_posts').select('*').order('created_at', { ascending: false }).limit(20),
    admin.from('campus_book_orders').select('*').order('created_at', { ascending: false }).limit(20),
    admin.from('campus_settlement_applications').select('*').order('created_at', { ascending: false }).limit(20),
    admin.from('profiles').select('id, account, nickname, app_role, campus_available_balance, campus_pending_balance').order('created_at', { ascending: false }).limit(50),
  ])

  return {
    expressOrders: (express.data || []) as CampusExpressOrder[],
    bookPosts: (posts.data || []) as CampusBookPost[],
    bookOrders: (bookOrders.data || []) as CampusBookOrder[],
    settlementApplications: (settlements.data || []) as CampusSettlementApplication[],
    users: users.data || [],
  }
}

export async function approveSettlement(input: { applicationId: string; transferRef: string; note?: string }) {
  const { admin, profile } = await getAuthContext()
  ensureAdmin(profile)

  const { data: application, error } = await admin
    .from('campus_settlement_applications')
    .select('*')
    .eq('id', input.applicationId)
    .single()

  if (error || !application) {
    throw new Error('结算申请不存在。')
  }
  assert(application.status === SETTLEMENT_STATUS.PENDING, '该申请已经处理过。')

  const balance = await updateCampusBalance(admin, application.user_id, {
    applying: -Number(application.amount),
    settled: Number(application.amount),
  })

  await admin
    .from('campus_settlement_applications')
    .update({
      status: SETTLEMENT_STATUS.APPROVED,
      handled_by: profile.id,
      transfer_ref: input.transferRef,
      note: input.note || '管理员已线下打款。',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.applicationId)

  await addBalanceLog(admin, {
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
  const { admin, profile } = await getAuthContext()
  ensureAdmin(profile)

  const { data: application, error } = await admin
    .from('campus_settlement_applications')
    .select('*')
    .eq('id', input.applicationId)
    .single()

  if (error || !application) {
    throw new Error('结算申请不存在。')
  }
  assert(application.status === SETTLEMENT_STATUS.PENDING, '该申请已经处理过。')

  const balance = await updateCampusBalance(admin, application.user_id, {
    available: Number(application.amount),
    applying: -Number(application.amount),
  })

  await admin
    .from('campus_settlement_applications')
    .update({
      status: SETTLEMENT_STATUS.REJECTED,
      handled_by: profile.id,
      note: input.note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.applicationId)

  await addBalanceLog(admin, {
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
  const { admin, profile } = await getAuthContext()
  ensureAdmin(profile)
  assert(input.userId, '缺少目标用户。')
  assert(['admin', 'user'].includes(input.role), '角色参数错误。')
  assert(!(input.userId === profile.id && input.role === 'user'), '不能把当前管理员自己降为普通用户。')

  const { error } = await admin
    .from('profiles')
    .update({
      app_role: input.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.userId)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
export async function handleCampusPaymentNotify(params: Record<string, string>) {
  const admin = createAdminClient()
  assert(params.out_trade_no, 'out_trade_no is required.')
  assert(params.trade_status === 'TRADE_SUCCESS', 'trade_status must be TRADE_SUCCESS.')
  assert(verifyZPayNotify(params), 'Invalid notify signature.')

  const payment = await findPaymentRecord(admin, params.out_trade_no)
  assert(Number(payment.amount).toFixed(2) === Number(params.money).toFixed(2), 'Payment amount mismatch.')

  await markPaymentSuccess(admin, payment, {
    tradeStatus: params.trade_status,
    tradeNo: params.trade_no,
  })

  return { success: true }
}


