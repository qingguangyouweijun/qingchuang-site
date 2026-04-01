import Link from "next/link"
import { Badge } from "@/components/UI/Badge"
import { Button } from "@/components/UI/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/UI/Card"
import {
  completeSnackOrderAction,
  createSnackOrderAction,
  paySnackOrderAction,
  syncSnackOrderAction,
} from "@/app/campus/snacks/actions"
import {
  ORDER_VARIANTS,
  PAY_LABELS,
  PRODUCT_VARIANTS,
  SNACK_ORDER_LABELS,
  SNACK_PRODUCT_LABELS,
  getParam,
  getSnacksPageState,
} from "@/app/campus/snacks/shared"

export default async function CampusSnacksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const category = getParam(params.category)
  const { session, notice, error, warnings, selectedProduct, products, orders } = await getSnacksPageState(Promise.resolve(params))

  const categories = ["全部", ...new Set(products.map((item) => item.category))]
  const filteredProducts = category && category !== "全部"
    ? products.filter((item) => item.category === category)
    : products

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-300 via-lime-300 to-cyan-400 px-8 py-10 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_35%)]" />
        <div className="relative z-10 max-w-4xl space-y-5 text-white">
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
            <span className="rounded-full bg-white/20 px-3 py-1">校园服务模块</span>
            <span className="rounded-full bg-white/20 px-3 py-1">支付宝支付</span>
            <span className="rounded-full bg-white/20 px-3 py-1">面向普通用户</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">零食快递</h1>
            <p className="max-w-3xl text-base leading-8 text-white/92 sm:text-lg">
              参考旧商城的货架逻辑，这里把校园内常买的零食、饮料和夜宵补给收成一个单页入口。先看货架，再直接下单，订单会自动沉淀到你的订单中心。
            </p>
          </div>
          <div className="grid max-w-3xl grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-white/15 px-4 py-4 backdrop-blur-sm">
              <div className="text-white/75">当前货架</div>
              <div className="mt-2 text-3xl font-bold">{products.filter((item) => item.shelf_status === "ON_SALE").length}</div>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-4 backdrop-blur-sm">
              <div className="text-white/75">零食分类</div>
              <div className="mt-2 text-3xl font-bold">{new Set(products.map((item) => item.category)).size}</div>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-4 backdrop-blur-sm">
              <div className="text-white/75">我的订单</div>
              <div className="mt-2 text-3xl font-bold">{session ? orders.length : 0}</div>
            </div>
          </div>
        </div>
      </section>

      {(notice || error) && (
        <div className={`rounded-2xl px-5 py-4 text-sm ${error ? "border border-red-200 bg-red-50 text-red-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error || notice}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          当前零食数据还在同步中：{warnings.join("、")} 暂时为空。
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {categories.map((item) => {
            const active = (category || "全部") === item
            return (
              <Link
                key={item}
                href={item === "全部" ? "/campus/snacks" : `/campus/snacks?category=${encodeURIComponent(item)}`}
                className={active
                  ? "rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-emerald-200 hover:text-slate-900"
                }
              >
                {item}
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>零食货架</CardTitle>
                <CardDescription>只保留面向用户的购买入口，商品列表和下单都收在同一页里。</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                        {product.cover_emoji || "食"}
                      </div>
                      <Badge variant={PRODUCT_VARIANTS[product.shelf_status] || "outline"}>
                        {SNACK_PRODUCT_LABELS[product.shelf_status as keyof typeof SNACK_PRODUCT_LABELS] || product.shelf_status}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="text-lg font-bold text-slate-900">{product.name}</div>
                      {product.subtitle && <div className="text-sm text-slate-500">{product.subtitle}</div>}
                      <div className="text-sm leading-6 text-slate-600">{product.description}</div>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">价格</div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-2xl font-black text-slate-900">¥{Number(product.sale_price).toFixed(2)}</span>
                          {product.original_price ? <span className="text-sm text-slate-400 line-through">¥{Number(product.original_price).toFixed(2)}</span> : null}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">库存 {product.stock_count} / {product.category}</div>
                      </div>
                      {product.shelf_status === "ON_SALE" && Number(product.stock_count) > 0 ? (
                        <Button asChild>
                          <Link href={`/campus/snacks?product=${product.id}${category ? `&category=${encodeURIComponent(category)}` : ""}`}>
                            选这个
                          </Link>
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" disabled>
                          暂不可下单
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">当前分类下还没有可展示的零食。</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>立即下单</CardTitle>
                <CardDescription>当前只提供普通用户购买入口，支付方式统一使用支付宝。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {!session ? (
                  <div className="space-y-4 rounded-2xl bg-slate-50 px-5 py-6 text-center">
                    <div className="text-lg font-semibold text-slate-900">请先登录后下单</div>
                    <p className="text-sm leading-6 text-slate-600">登录后即可填写联系人、送达位置并创建零食快递订单。</p>
                    <div className="flex justify-center gap-3">
                      <Link href="/auth/login"><Button>去登录</Button></Link>
                      <Link href="/auth/register"><Button variant="outline">邮箱注册</Button></Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedProduct && (
                      <div className="flex items-center gap-4 rounded-2xl bg-slate-50 px-4 py-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">{selectedProduct.cover_emoji || "食"}</div>
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900">{selectedProduct.name}</div>
                          <div className="text-sm text-slate-500">{selectedProduct.subtitle || selectedProduct.category}</div>
                          <div className="text-sm text-slate-600">单价 ¥{Number(selectedProduct.sale_price).toFixed(2)} / 库存 {selectedProduct.stock_count}</div>
                        </div>
                      </div>
                    )}
                    <form action={createSnackOrderAction} className="grid grid-cols-1 gap-4">
                      <input type="hidden" name="category" value={category || ""} />
                      <label className="space-y-2 text-sm text-slate-600">
                        <span>选择商品</span>
                        <select name="productId" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" defaultValue={selectedProduct?.id || ""} required>
                          <option value="" disabled>请选择零食商品</option>
                          {products.filter((item) => item.shelf_status === "ON_SALE").map((product) => (
                            <option key={product.id} value={product.id}>{product.name} / ¥{Number(product.sale_price).toFixed(2)}</option>
                          ))}
                        </select>
                      </label>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-slate-600">
                          <span>购买数量</span>
                          <input name="quantity" type="number" min={1} defaultValue={1} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" required />
                        </label>
                        <label className="space-y-2 text-sm text-slate-600">
                          <span>联系人</span>
                          <input name="contactName" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：小陈" required />
                        </label>
                        <label className="space-y-2 text-sm text-slate-600">
                          <span>联系电话</span>
                          <input name="contactPhone" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：13800000000" required />
                        </label>
                        <label className="space-y-2 text-sm text-slate-600">
                          <span>送达位置</span>
                          <input name="deliveryLocation" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：南门 3 号楼 402" required />
                        </label>
                      </div>
                      <label className="space-y-2 text-sm text-slate-600">
                        <span>备注</span>
                        <textarea name="remark" rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="例如：晚点送达、到楼下联系、少冰饮料等。" />
                      </label>
                      <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                        提交后会先创建零食快递订单，再由你发起支付宝支付；支付完成后订单会自动保存在你的订单中心和下方订单列表。
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit">提交零食订单</Button>
                      </div>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>我的零食订单</CardTitle>
                <CardDescription>这里只保留普通用户购买后的订单视图，不做后台售卖管理入口。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {orders.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">你还没有零食订单。</div>
                )}
                {orders.map((order) => (
                  <div key={order.id} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{order.product_name}</div>
                        <div className="mt-1 text-sm text-slate-500">订单号：{order.order_no} / 送达：{order.delivery_location}</div>
                      </div>
                      <Badge variant={ORDER_VARIANTS[order.status] || "outline"}>
                        {SNACK_ORDER_LABELS[order.status as keyof typeof SNACK_ORDER_LABELS] || order.status}
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <div>购买明细：{order.quantity} 份 x ¥{Number(order.unit_price).toFixed(2)}</div>
                      <div>支付金额：<span className="font-semibold text-slate-900">¥{Number(order.total_amount).toFixed(2)}</span></div>
                      <div>联系人：{order.contact_name} / {order.contact_phone}</div>
                      <div>支付方式：{PAY_LABELS[(order.pay_type || "alipay") as keyof typeof PAY_LABELS] || order.pay_type || "未选择"}</div>
                    </div>
                    {order.remark && <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">{order.remark}</div>}
                    <div className="flex flex-wrap gap-3">
                      {order.status === "PENDING_PAYMENT" && (
                        <>
                          <form action={paySnackOrderAction}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <Button type="submit">支付宝支付</Button>
                          </form>
                          <form action={syncSnackOrderAction}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <Button type="submit" variant="outline">同步支付状态</Button>
                          </form>
                        </>
                      )}
                      {order.status === "PAID" && (
                        <form action={completeSnackOrderAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <Button type="submit" variant="outline">确认完成</Button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

