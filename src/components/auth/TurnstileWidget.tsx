"use client"

import * as React from 'react'
import Script from 'next/script'
import { ShieldCheck } from 'lucide-react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: {
        sitekey: string
        callback?: (token: string) => void
        theme?: 'light' | 'dark'
        'expired-callback'?: () => void
        'error-callback'?: () => void
      }) => string
      remove?: (widgetId?: string) => void
    }
  }
}

export function TurnstileWidget({
  onVerify,
  theme = 'light',
}: {
  onVerify: (token: string) => void
  theme?: 'light' | 'dark'
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const widgetIdRef = React.useRef<string | null>(null)
  const [scriptReady, setScriptReady] = React.useState(false)

  const renderWidget = React.useCallback(() => {
    if (!siteKey || !scriptReady || !window.turnstile || !containerRef.current) {
      return
    }

    containerRef.current.innerHTML = ''
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: (token) => onVerify(token),
      'expired-callback': () => onVerify(''),
      'error-callback': () => onVerify(''),
    })
  }, [onVerify, scriptReady, siteKey, theme])

  React.useEffect(() => {
    renderWidget()

    return () => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [renderWidget])

  if (!siteKey) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
        <div className="mb-1 flex items-center gap-2 font-medium text-slate-700">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          人机验证
        </div>
        <p>验证区域将在这里显示，验证后即可发送邮箱验证码。</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} />
      <p className="text-xs text-slate-500">完成人机验证后即可继续发送验证码。</p>
    </div>
  )
}

