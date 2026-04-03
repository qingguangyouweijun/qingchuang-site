"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Building2, Home, LogOut, Menu, ScrollText, UserRound, X } from "lucide-react";
import { Button } from "@/components/UI/Button";
import type { Profile } from "@/lib/types";

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [user, setUser] = React.useState<Profile | null>(null);
  const [accountLabel, setAccountLabel] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    void checkUser();
  }, [pathname]);

  async function checkUser() {
    try {
      const response = await fetch("/api/auth/me");
      const data = (await response.json()) as {
        user: { id: string; email: string } | null;
        profile: Profile | null;
      };

      if (!data.user || !data.profile) {
        setUser(null);
        setAccountLabel("");
        setIsLoading(false);
        return;
      }

      setUser(data.profile);
      setAccountLabel(
        String(data.profile.nickname || data.profile.account || data.user.email.split("@")[0] || "我的"),
      );
    } catch {
      setUser(null);
      setAccountLabel("");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  }

  const navItems = [
    { name: "首页", href: "/", icon: Home },
    { name: "服务能力", href: "/#services", icon: Building2 },
    { name: "合作流程", href: "/#process", icon: ScrollText },
    { name: "联系说明", href: "/#contact", icon: UserRound },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/profile") return pathname === "/profile" || pathname.startsWith("/profile/");
    if (href === "/auth/login") return pathname.startsWith("/auth/");
    return false;
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/70 bg-white/94 backdrop-blur-xl">
      <div className="container mx-auto flex h-18 items-center justify-between gap-6 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center">
          <Image src="/qingchuang.jpg" alt="轻创 Qintra" width={420} height={112} priority className="h-11 w-auto sm:h-12" />
        </Link>

        <nav className="hidden items-center space-x-6 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-emerald-700",
                isActive(item.href) ? "text-emerald-700" : "text-slate-600",
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
              <Link href="/profile" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700">
                {accountLabel || "我的"}
              </Link>
              <button onClick={handleLogout} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700" title="退出登录">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">用户登录</Link>
            </Button>
          )}
        </div>

        <button className="p-2 text-slate-600 md:hidden" onClick={() => setIsMenuOpen((prev) => !prev)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-white/95 px-4 py-4 md:hidden">
          <div className="mb-4">
            <Image src="/qingchuang.jpg" alt="轻创 Qintra" width={360} height={96} className="h-10 w-auto" />
          </div>
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700",
                  isActive(item.href) && "bg-emerald-50 text-emerald-700",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
              {user ? (
                <>
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                      进入我的
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => void handleLogout()}>
                    退出登录
                  </Button>
                </>
              ) : (
                <Button asChild className="w-full">
                  <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    用户登录
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
