"use client"

import * as React from 'react'
import Script from 'next/script'
import { RotateCw, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/UI/Button'

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

const TURNSTILE_LOAD_ERROR = 'Cloudflare 验证组件加载失败，请关闭广告拦截器、允许 challenges.cloudflare.com，或刷新页面后重试。'

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
  const pollTimerRef = React.useRef<number | null>(null)
  const [scriptReady, setScriptReady] = React.useState(false)
  const [loadError, setLoadError] = React.useState('')
  const [reloadKey, setReloadKey] = React.useState(0)

  const clearPollTimer = React.useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const cleanupWidget = React.useCallback(() => {
    clearPollTimer()

    if (widgetIdRef.current && window.turnstile?.remove) {
      window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }
  }, [clearPollTimer])

  const renderWidget = React.useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile) {
      return false
    }

    cleanupWidget()
    onVerify('')
    setLoadError('')

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: (token) => {
        setLoadError('')
        onVerify(token)
      },
      'expired-callback': () => onVerify(''),
      'error-callback': () => {
        onVerify('')
        setLoadError('Cloudflare 验证初始化失败，请点击下方按钮重新加载。')
      },
    })

    return true
  }, [cleanupWidget, onVerify, siteKey, theme])

  React.useEffect(() => {
    if (!siteKey || !scriptReady) {
      return
    }

    if (renderWidget()) {
      return
    }

    let attempts = 0
    pollTimerRef.current = window.setInterval(() => {
      attempts += 1

      if (renderWidget()) {
        clearPollTimer()
        return
      }

      if (attempts >= 20) {
        clearPollTimer()
        setLoadError(TURNSTILE_LOAD_ERROR)
      }
    }, 250)

    return clearPollTimer
  }, [clearPollTimer, reloadKey, renderWidget, scriptReady, siteKey])

  React.useEffect(() => cleanupWidget, [cleanupWidget])

  const handleRetry = React.useCallback(() => {
    cleanupWidget()
    onVerify('')
    setLoadError('')
    setScriptReady(Boolean(window.turnstile))
    setReloadKey((value) => value + 1)
  }, [cleanupWidget, onVerify])

  if (!siteKey) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
        <div className="mb-1 flex items-center gap-2 font-medium text-amber-900">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          安全验证
        </div>
        <p>当前未配置 NEXT_PUBLIC_TURNSTILE_SITE_KEY，所以验证组件不会显示。</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Script
        key={`turnstile-${reloadKey}`}
        src={`https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&retry=${reloadKey}`}
        strategy="afterInteractive"
        onLoad={() => {
          setScriptReady(true)
          setLoadError('')
        }}
        onError={() => {
          setScriptReady(false)
          setLoadError(TURNSTILE_LOAD_ERROR)
        }}
      />

      <div ref={containerRef} className="min-h-[65px]" />

      {loadError ? (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs text-amber-800">
          <div className="flex items-start gap-2 leading-6">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{loadError}</span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
            <RotateCw className="mr-2 h-4 w-4" />
            重新加载验证
          </Button>
        </div>
      ) : (
        <p className="text-xs text-slate-500">如果验证区域一直不出现，请关闭广告拦截器或切换网络后重试。</p>
      )}
    </div>
  )
}
