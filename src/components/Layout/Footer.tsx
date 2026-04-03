import Link from "next/link"

const footerLinks = [
  { label: "服务能力", href: "/#services" },
  { label: "合作流程", href: "/#process" },
  { label: "联系说明", href: "/#contact" },
  { label: "用户登录", href: "/auth/login" },
]

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-slate-200 bg-white/92 py-8 backdrop-blur">
      <div className="container mx-auto grid gap-6 px-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">轻创 Qintra</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">面向校园场景的轻量生活服务平台官网，当前以对外展示、部署准备与备案信息承接为主。</p>
          </div>
          <p className="text-xs leading-6 text-slate-400">ICP备案办理中，备案号与公安联网备案信息将在正式通过后统一公示。</p>
        </div>

        <div className="space-y-3 text-sm text-slate-600 md:text-right">
          <div className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-emerald-700">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="text-xs text-slate-400">&copy; {new Date().getFullYear()} 轻创 Qintra. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}
