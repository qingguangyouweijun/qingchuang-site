"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LayoutDashboard, Package, ReceiptText, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { name: '总览', href: '/campus', icon: LayoutDashboard },
  { name: '快递代取', href: '/campus/express', icon: Package },
  { name: '旧书广场', href: '/campus/books', icon: BookOpen },
  { name: '订单中心', href: '/campus/orders', icon: ReceiptText },
  { name: '校园钱包', href: '/campus/wallet', icon: Wallet },
]

function isItemActive(pathname: string, href: string) {
  if (href === '/campus') {
    return pathname === '/campus'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function CampusSubnav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <div className={cn('overflow-x-auto pb-1', className)}>
      <nav className="flex min-w-max gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        {items.map((item) => {
          const active = isItemActive(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}