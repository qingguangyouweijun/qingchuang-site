"use client"

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X, Package, LogOut, Bot, SunMedium, HeartHandshake, BookOpen, ReceiptText } from 'lucide-react'
import { Button } from '@/components/UI/Button'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

const navItems = [
  { name: '快递代取', href: '/campus/express', icon: Package },
  { name: '旧书广场', href: '/campus/books', icon: BookOpen },
  { name: '订单中心', href: '/campus/orders', icon: ReceiptText },
  { name: '晴窗', href: '/draw', icon: HeartHandshake },
  { name: 'AI 陪伴', href: '/ai-companion', icon: Bot },
]

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [user, setUser] = React.useState<Profile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    void checkUser()
  }, [pathname])

  async function checkUser() {
    const supabase = createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      setUser(null)
      setIsLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    setUser(profile as Profile | null)
    setIsLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="group flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-sm transition-transform group-hover:scale-105">
            <SunMedium className="h-4 w-4" />
          </div>
          <span className="text-xl font-bold text-slate-900">轻创 Qintra</span>
        </Link>

        <nav className="hidden items-center space-x-6 lg:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-1 text-sm font-medium transition-colors hover:text-emerald-700',
                  isActive ? 'text-emerald-700' : 'text-slate-600'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center space-x-3 md:flex">
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-slate-200" />
          ) : user ? (
            <>
              <Link href="/profile" className="text-sm font-medium text-slate-700 transition-colors hover:text-emerald-700">
                {user.nickname || user.account || '当前用户'}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700"
                title="退出登录"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login"><Button variant="ghost" size="sm">邮箱登录</Button></Link>
              <Link href="/auth/register"><Button size="sm">邮箱注册</Button></Link>
            </>
          )}
        </div>

        <button className="p-2 text-slate-600 md:hidden" onClick={() => setIsMenuOpen((prev) => !prev)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-white/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
              {user ? (
                <Button variant="ghost" className="w-full" onClick={() => void handleLogout()}>退出登录</Button>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}><Button variant="ghost" className="w-full">邮箱登录</Button></Link>
                  <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}><Button className="w-full">邮箱注册</Button></Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}