'use client'

import { useEffect, useState } from 'react'

type Platform = 'android' | 'ios' | null

export default function InstallBanner() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [prompt, setPrompt] = useState<Event | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed as a standalone app
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Don't show if already dismissed this session
    if (sessionStorage.getItem('install-dismissed')) return

    const ua = navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua) && !('MSStream' in window)
    const isAndroidChrome = /android/i.test(ua)

    if (isIos) {
      // iOS Safari: no install event, show manual instructions
      const isSafari = /safari/i.test(ua) && !/crios|fxios/i.test(ua)
      if (isSafari) setPlatform('ios')
    } else if (isAndroidChrome) {
      // Android Chrome: capture the native install prompt
      const handler = (e: Event) => {
        e.preventDefault()
        setPrompt(e)
        setPlatform('android')
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem('install-dismissed', '1')
    setDismissed(true)
  }

  async function install() {
    if (!prompt) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prompt as any).prompt()
    dismiss()
  }

  if (dismissed || !platform) return null

  return (
    <div className="fixed top-0 inset-x-0 z-50 animate-slide-down">
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-md">
        <span className="text-2xl">🏠</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Add to home screen</p>
          {platform === 'ios' && (
            <p className="text-primary-foreground/80 text-xs mt-0.5">
              Tap <strong>Share</strong> then <strong>Add to Home Screen</strong>
            </p>
          )}
          {platform === 'android' && (
            <p className="text-primary-foreground/80 text-xs mt-0.5">Use it like an app, works offline</p>
          )}
        </div>
        {platform === 'android' && (
          <button
            onClick={install}
            className="flex-shrink-0 bg-background text-primary font-bold text-sm px-3 py-1.5 rounded-lg"
          >
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-primary-foreground/60 text-lg px-1"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
