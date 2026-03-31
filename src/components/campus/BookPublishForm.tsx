"use client"

import * as React from 'react'
import { Button } from '@/components/UI/Button'

const PLATFORM_FEE = 2

export function BookPublishForm({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>
}) {
  const [salePrice, setSalePrice] = React.useState('')

  const numericPrice = Number.parseFloat(salePrice)
  const sellerIncome = Number.isFinite(numericPrice) ? Math.max(numericPrice - PLATFORM_FEE, 0) : 0
  const hasPrice = salePrice.trim().length > 0 && Number.isFinite(numericPrice)

  return (
    <form action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="space-y-2 text-sm text-slate-600">
        <span>{"书名"}</span>
        <input name="title" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder={"例如：高等数学（第七版）"} required />
      </label>
      <label className="space-y-2 text-sm text-slate-600">
        <span>{"分类"}</span>
        <input name="category" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder={"例如：考研 / 计算机 / 专业课"} required />
      </label>
      <label className="space-y-2 text-sm text-slate-600">
        <span>{"ISBN（可选）"}</span>
        <input name="isbn" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder={"可帮助买家识别版本"} />
      </label>
      <label className="space-y-2 text-sm text-slate-600">
        <span>{"成色"}</span>
        <input name="conditionLevel" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder={"例如：九成新 / 有少量划线"} required />
      </label>
      <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
        <span>{"售价"}</span>
        <input
          name="salePrice"
          type="number"
          min="2"
          step="0.01"
          value={salePrice}
          onChange={(event) => setSalePrice(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
          placeholder={"买家看到的价格"}
          required
        />
      </label>
      <div className="md:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
        <div className="text-sm text-emerald-700">{"预计卖家到手价"}</div>
        <div className="mt-2 text-3xl font-bold text-emerald-800">{"¥"}{hasPrice ? sellerIncome.toFixed(2) : '0.00'}</div>
        <div className="mt-2 text-xs leading-6 text-emerald-700/80">{"按平台固定手续费 ¥2.00 / 本估算，最终到账以买家确认收货后的结算记录为准。"}</div>
      </div>
      <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
        <span>{"描述"}</span>
        <textarea name="description" rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder={"例如：无缺页、无水渍，附带课堂笔记。"} />
      </label>
      <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
        {"发布后价格会直接同步展示到旧书广场。买家统一使用支付宝完成付款；平台统一收取 2 元 / 本手续费。"}
      </div>
      <div className="md:col-span-2">
        <Button type="submit">{"发布到旧书广场"}</Button>
      </div>
    </form>
  )
}
