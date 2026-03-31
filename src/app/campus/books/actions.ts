'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  confirmBookOrder,
  createBookOrder,
  createBookPost,
  createCampusPayment,
  deliverBookOrder,
  syncCampusPayment,
} from '@/lib/actions/campus'

function messageUrl(base: string, key: 'notice' | 'error', message: string) {
  return `${base}?${key}=${encodeURIComponent(message)}`
}

function revalidateBookPaths() {
  revalidatePath('/campus/books')
  revalidatePath('/campus/books/sell')
  revalidatePath('/campus/books/order')
  revalidatePath('/profile/orders')
}

export async function publishBookSellAction(formData: FormData) {
  try {
    await createBookPost({
      title: String(formData.get('title') || ''),
      category: String(formData.get('category') || ''),
      isbn: String(formData.get('isbn') || ''),
      conditionLevel: String(formData.get('conditionLevel') || ''),
      salePrice: Number(formData.get('salePrice') || 0),
      description: String(formData.get('description') || ''),
    })
    revalidateBookPaths()
    redirect(messageUrl('/campus/books/sell', 'notice', '旧书已发布并进入旧书售卖。'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '发布旧书失败。'
    redirect(messageUrl('/campus/books/sell', 'error', message))
  }
}

export async function deliverBookSellAction(formData: FormData) {
  const orderId = String(formData.get('orderId') || '')

  try {
    await deliverBookOrder(orderId)
    revalidateBookPaths()
    redirect(messageUrl('/campus/books/sell', 'notice', '已标记为已送达，等待买家确认收货。'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '旧书订单操作失败。'
    redirect(messageUrl('/campus/books/sell', 'error', message))
  }
}

export async function buyBookOrderAction(formData: FormData) {
  try {
    await createBookOrder({
      bookId: String(formData.get('bookId') || ''),
      deliveryBuilding: String(formData.get('deliveryBuilding') || ''),
    })
    revalidateBookPaths()
    redirect(messageUrl('/campus/books/order', 'notice', '旧书订单已创建，请继续完成支付。'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建旧书订单失败。'
    redirect(messageUrl('/campus/books/order', 'error', message))
  }
}

export async function payBookOrderAction(formData: FormData) {
  try {
    const { payment } = await createCampusPayment({
      bizType: 'BOOK_ORDER',
      bizId: String(formData.get('orderId') || ''),
      payType: String(formData.get('payType') || 'alipay') as 'wxpay' | 'alipay',
    })
    revalidateBookPaths()
    if (payment.pay_url) {
      redirect(payment.pay_url)
    }
    redirect(messageUrl('/campus/books/order', 'notice', '支付链接已生成，请继续完成付款。'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '发起支付失败。'
    redirect(messageUrl('/campus/books/order', 'error', message))
  }
}

export async function syncBookOrderAction(formData: FormData) {
  try {
    await syncCampusPayment({
      bizType: 'BOOK_ORDER',
      bizId: String(formData.get('orderId') || ''),
    })
    revalidateBookPaths()
    redirect(messageUrl('/campus/books/order', 'notice', '已同步旧书订单支付状态。'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '同步支付状态失败。'
    redirect(messageUrl('/campus/books/order', 'error', message))
  }
}

export async function confirmBookOrderAction(formData: FormData) {
  const orderId = String(formData.get('orderId') || '')

  try {
    await confirmBookOrder(orderId)
    revalidateBookPaths()
    redirect(messageUrl('/campus/books/order', 'notice', '已确认收货，旧书订单完成。'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '旧书订单操作失败。'
    redirect(messageUrl('/campus/books/order', 'error', message))
  }
}
