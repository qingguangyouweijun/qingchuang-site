"use server"

import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { revalidatePath } from "next/cache"
import {
  completeSnackOrder,
  createCampusPayment,
  createSnackOrder,
  syncCampusPayment,
} from "@/lib/actions/campus"

function messageUrl(base: string, key: "notice" | "error", message: string) {
  const joiner = base.includes("?") ? "&" : "?"
  return `${base}${joiner}${key}=${encodeURIComponent(message)}`
}

function revalidateSnackPaths() {
  revalidatePath("/campus")
  revalidatePath("/campus/snacks")
  revalidatePath("/profile/orders")
}

export async function createSnackOrderAction(formData: FormData) {
  const productId = String(formData.get("productId") || "")
  const category = String(formData.get("category") || "")
  const base = `/campus/snacks${category ? `?category=${encodeURIComponent(category)}` : ""}`

  try {
    await createSnackOrder({
      productId,
      quantity: Number(formData.get("quantity") || 1),
      contactName: String(formData.get("contactName") || ""),
      contactPhone: String(formData.get("contactPhone") || ""),
      deliveryLocation: String(formData.get("deliveryLocation") || ""),
      remark: String(formData.get("remark") || ""),
    })
    revalidateSnackPaths()
    const target = `${base}${base.includes("?") ? "&" : "?"}product=${encodeURIComponent(productId)}`
    redirect(messageUrl(target, "notice", "零食订单已创建，请继续完成支付。"))
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }
    const message = error instanceof Error ? error.message : "创建零食订单失败。"
    redirect(messageUrl(base, "error", message))
  }
}

export async function paySnackOrderAction(formData: FormData) {
  try {
    const { payment } = await createCampusPayment({
      bizType: "SNACK_ORDER",
      bizId: String(formData.get("orderId") || ""),
      payType: "alipay",
    })
    revalidateSnackPaths()
    if (payment.pay_url) {
      redirect(payment.pay_url)
    }
    redirect(messageUrl("/campus/snacks", "notice", "支付链接已生成，请继续完成付款。"))
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }
    const message = error instanceof Error ? error.message : "发起支付失败。"
    redirect(messageUrl("/campus/snacks", "error", message))
  }
}

export async function syncSnackOrderAction(formData: FormData) {
  try {
    await syncCampusPayment({
      bizType: "SNACK_ORDER",
      bizId: String(formData.get("orderId") || ""),
    })
    revalidateSnackPaths()
    redirect(messageUrl("/campus/snacks", "notice", "已同步零食订单支付状态。"))
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }
    const message = error instanceof Error ? error.message : "同步支付状态失败。"
    redirect(messageUrl("/campus/snacks", "error", message))
  }
}

export async function completeSnackOrderAction(formData: FormData) {
  try {
    await completeSnackOrder(String(formData.get("orderId") || ""))
    revalidateSnackPaths()
    redirect(messageUrl("/campus/snacks", "notice", "零食订单已完成。"))
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }
    const message = error instanceof Error ? error.message : "确认完成失败。"
    redirect(messageUrl("/campus/snacks", "error", message))
  }
}
