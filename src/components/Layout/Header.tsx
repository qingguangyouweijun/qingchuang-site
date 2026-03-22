"use client"

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Bot, HeartHandshake, Home, LayoutGrid, LogOut, Menu, SunMedium, UserRound, X } from 'lucide-react'
import { Button } from '@/components/UI/Button'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [user, setUser] = React.useState<Profile | null>(null)
  const [accountLabel, setAccountLabel] = React.useState('')
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
      setAccountLabel('')
      setIsLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    setUser(profile as Profile | null)
    setAccountLabel(String(profile?.nickname || profile?.account || authUser.email?.split('@')[0] || '我的'))
    setIsLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const navItems = [
    { name: '首页', href: '/', icon: Home },
    { name: '校园服务', href: '/campus', icon: LayoutGrid },
    { name: '晴窗', href: '/draw', icon: HeartHandshake },
    { name: 'AI 陪伴', href: '/ai-companion', icon: Bot },
    { name: '我的', href: user ? '/profile' : '/auth/login', icon: UserRound },
  ]

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    if (href === '/campus') return pathname === '/campus' || pathname.startsWith('/campus/')
    if (href === '/profile') return pathname === '/profile' || pathname.startsWith('/profile/')
    if (href === '/auth/login') return pathname.startsWith('/auth/')
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/70 bg-white/92 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="group flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm transition-transform group-hover:scale-105">
            <SunMedium className="h-4 w-4" />
          </div>
          <span className="text-xl font-bold text-slate-900">轻创 Qintra</span>
        </Link>

        <nav className="hidden items-center space-x-6 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-1 text-sm font-medium transition-colors hover:text-emerald-700',
                isActive(item.href) ? 'text-emerald-700' : 'text-slate-600'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="hidden items-center space-x-3 md:flex">
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-slate-200" />
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
              >
                {accountLabel || '我的'}
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
                className={cn(
                  'rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700',
                  isActive(item.href) && 'bg-emerald-50 text-emerald-700'
                )}
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