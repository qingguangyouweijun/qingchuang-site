"use client"

import * as React from 'react'
import Script from 'next/script'

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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700">
        当前环境未配置 Cloudflare Turnstile，将暂时跳过真人校验。
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
      <p className="text-xs text-slate-500">继续前请完成 Cloudflare 人机校验。</p>
    </div>
  )
}