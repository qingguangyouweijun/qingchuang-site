"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu, X, User, History, Home, Shuffle, Users, LogOut } from "lucide-react"
import { Button } from "@/components/UI/Button"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [user, setUser] = React.useState<Profile | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const pathname = usePathname()

  React.useEffect(() => {
    checkUser()
  }, [pathname])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      setUser(profile)
    } else {
      setUser(null)
    }
    setIsLoading(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  const navItems = [
    { name: "首页", href: "/", icon: Home },
    { name: "抽取", href: "/draw", icon: Shuffle },
    { name: "联系方式池", href: "/pool", icon: Users },
    { name: "历史记录", href: "/history", icon: History },
    { name: "个人中心", href: "/profile", icon: User },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b-0 border-white/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
            晴
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-purple-600">
            晴窗葳蕤
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-rose-500",
                  isActive ? "text-rose-600 font-semibold" : "text-gray-600"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Auth Buttons / User Info */}
        <div className="hidden md:flex items-center space-x-4">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : user ? (
            <div className="flex items-center space-x-3">
              <Link href="/profile" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-rose-300">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white text-sm">
                      {user.gender === 'female' ? '👩' : '👨'}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">{user.nickname || user.account}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-rose-500 transition-colors"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">登录</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">注册</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 top-16 bg-black/50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Menu */}
          <div className="md:hidden fixed top-16 left-0 right-0 bg-white z-50 shadow-xl animate-slide-up">
            <nav className="flex flex-col p-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-rose-50 text-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 text-rose-500" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-200 flex flex-col space-y-3">
                {user ? (
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">退出登录</span>
                  </button>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">登录</Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="primary" className="w-full">注册</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
