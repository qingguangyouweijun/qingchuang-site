"use client"

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X, Home, Package, LogOut, Bot, SunMedium, HeartHandshake, Shield } from 'lucide-react'
import { Button } from '@/components/UI/Button'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

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
    const { data: { user: authUser } } = await supabase.auth.getUser()

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

  const navItems = [
    { name: '首页', href: '/', icon: Home },
    { name: '校园服务', href: '/campus', icon: Package },
    { name: '晴窗', href: '/draw', icon: HeartHandshake },
    { name: 'AI 陪伴', href: '/ai-companion', icon: Bot },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b-0">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform shadow-sm">
            <SunMedium className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold text-gradient">
            轻创 Qintra
          </span>
        </Link>

        <nav className="hidden lg:flex items-center space-x-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-1 text-sm font-medium transition-colors hover:text-emerald-700',
                  isActive ? 'text-emerald-700 font-semibold' : 'text-slate-600'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
          {user?.app_role === 'admin' && (
            <Link href="/admin" className={cn('flex items-center space-x-1 text-sm font-medium transition-colors hover:text-sky-700', pathname.startsWith('/admin') ? 'text-sky-700 font-semibold' : 'text-slate-600')}>
              <Shield className="w-4 h-4" />
              <span>管理员网站</span>
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          {isLoading ? (
            <div className="w-20 h-8 rounded-full bg-slate-200 animate-pulse" />
          ) : user ? (
            <>
              <Link href="/profile" className="text-sm text-slate-700 hover:text-emerald-700 transition-colors">
                {(user.nickname || user.account) ?? '当前用户'}
              </Link>
              {user.app_role === 'admin' && (
                <Link href="/admin">
                  <Button variant="secondary" size="sm">管理后台</Button>
                </Link>
              )}
              <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-emerald-700 transition-colors" title="退出登录">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">邮箱登录</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">邮箱注册</Button>
              </Link>
              <Link href="/admin/login">
                <Button variant="secondary" size="sm">管理员登录</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen((prev) => !prev)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white/95 shadow-xl border-t border-emerald-100 backdrop-blur-xl">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="px-4 py-3 rounded-xl hover:bg-emerald-50 text-slate-700" onClick={() => setIsMenuOpen(false)}>
                {item.name}
              </Link>
            ))}
            {user?.app_role === 'admin' && (
              <Link href="/admin" className="px-4 py-3 rounded-xl hover:bg-sky-50 text-sky-700" onClick={() => setIsMenuOpen(false)}>
                管理员网站
              </Link>
            )}
            <div className="pt-3 border-t border-emerald-100 flex flex-col gap-2">
              {user ? (
                <Button variant="ghost" className="w-full" onClick={() => void handleLogout()}>退出登录</Button>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}><Button variant="ghost" className="w-full">邮箱登录</Button></Link>
                  <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}><Button className="w-full">邮箱注册</Button></Link>
                  <Link href="/admin/login" onClick={() => setIsMenuOpen(false)}><Button variant="secondary" className="w-full">管理员登录</Button></Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}