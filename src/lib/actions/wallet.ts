'use server'

import { createClient } from '@/lib/supabase/server'

export async function getBalance() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single()

  if (error) {
    return { error: '获取余额失败' }
  }

  return { balance: profile.balance }
}

export async function recharge(amount: number) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  if (amount <= 0 || amount > 1000) {
    return { error: '充值金额无效' }
  }

  // 获取当前余额
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: '获取用户信息失败' }
  }

  const newBalance = Number(profile.balance) + amount

  // 更新余额
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', user.id)

  if (updateError) {
    return { error: '充值失败' }
  }

  // 创建交易记录
  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'recharge',
    amount: amount,
    balance_after: newBalance,
    description: `充值 ¥${amount.toFixed(2)}`,
  })

  return { success: true, newBalance }
}

export async function getTransactions(limit = 20) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '请先登录' }
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { error: '获取交易记录失败' }
  }

  return { transactions }
}
