import crypto from 'node:crypto'
import type { PayType } from '@/lib/types'

function getEnv(name: string, fallback = '') {
  return process.env[name] ?? fallback
}

function getPaymentKey() {
  return getEnv('ZPAY_PKEY', getEnv('ZPAY_KEY', getEnv('PAY_PKEY', getEnv('PAY_KEY'))))
}

function md5(content: string) {
  return crypto.createHash('md5').update(content, 'utf8').digest('hex')
}

export function createZPaySign(params: Record<string, string | number | null | undefined>, key: string) {
  const signString = Object.keys(params)
    .filter((name) => name !== 'sign' && name !== 'sign_type' && params[name] !== '' && params[name] !== undefined && params[name] !== null)
    .sort()
    .map((name) => `${name}=${params[name]}`)
    .join('&')

  return md5(`${signString}${key}`)
}

export function verifyZPayNotify(params: Record<string, string>) {
  const key = getPaymentKey()
  if (!key) {
    return false
  }

  return createZPaySign(params, key) === params.sign
}

function buildBaseUrl() {
  return getEnv('APP_BASE_URL', getEnv('NEXT_PUBLIC_APP_URL', 'http://127.0.0.1:3000'))
}

export async function createZPayOrder(input: {
  name: string
  money: number
  outTradeNo: string
  clientIp: string
  param: string
  type: PayType
}) {
  const gatewayBaseUrl = getEnv('ZPAY_GATEWAY_BASE_URL', getEnv('PAY_GATEWAY_BASE_URL', 'https://zpayz.cn'))
  const pid = getEnv('ZPAY_PID', getEnv('PAY_PID'))
  const pkey = getPaymentKey()
  const cid = getEnv('ZPAY_CID', getEnv('PAY_CID'))

  if (!pid || !pkey) {
    throw new Error('Missing ZPAY_PID / ZPAY_PKEY configuration.')
  }

  const params: Record<string, string> = {
    pid,
    type: input.type,
    out_trade_no: input.outTradeNo,
    notify_url: `${buildBaseUrl()}/api/campus/payments/notify`,
    name: input.name,
    money: Number(input.money).toFixed(2),
    clientip: input.clientIp || '127.0.0.1',
    device: 'mobile',
    param: input.param,
    sign_type: 'MD5',
  }

  if (cid) {
    params.cid = cid
  }

  params.sign = createZPaySign(params, pkey)

  const formData = new FormData()
  Object.entries(params).forEach(([key, value]) => {
    formData.append(key, value)
  })

  const response = await fetch(`${gatewayBaseUrl}/mapi.php`, {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json()
  if (Number(payload.code) !== 1) {
    throw new Error(payload.msg || 'Failed to create zpay order.')
  }

  return {
    gatewayOrderId: payload.O_id || '',
    gatewayTradeNo: payload.trade_no || '',
    payUrl: payload.payurl || '',
  }
}

export async function queryZPayOrder(input: { outTradeNo?: string; tradeNo?: string }) {
  const gatewayBaseUrl = getEnv('ZPAY_GATEWAY_BASE_URL', getEnv('PAY_GATEWAY_BASE_URL', 'https://zpayz.cn'))
  const pid = getEnv('ZPAY_PID', getEnv('PAY_PID'))
  const pkey = getPaymentKey()

  if (!pid || !pkey) {
    throw new Error('Missing ZPAY_PID / ZPAY_PKEY configuration.')
  }

  const url = new URL(`${gatewayBaseUrl}/api.php`)
  url.searchParams.set('act', 'order')
  url.searchParams.set('pid', pid)
  url.searchParams.set('key', pkey)
  if (input.outTradeNo) {
    url.searchParams.set('out_trade_no', input.outTradeNo)
  }
  if (input.tradeNo) {
    url.searchParams.set('trade_no', input.tradeNo)
  }

  const response = await fetch(url)
  return response.json()
}
