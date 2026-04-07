'use client'

import { useEffect, useState } from 'react'
import type { User } from 'netlify-identity-widget'

async function getIdentity() {
  // The package ships a UMD bundle marked as "type":"module". When bundled as
  // ESM, the UMD factory can't find `module`, so it registers itself on
  // globalThis.netlifyIdentity instead of exporting. Import to trigger
  // registration, then read from window.
  await import('netlify-identity-widget')
  const identity = (window as Window & typeof globalThis & { netlifyIdentity?: typeof import('netlify-identity-widget') }).netlifyIdentity
  if (!identity) throw new Error('netlify-identity-widget: not found on window')
  return identity
}

function syncName(user: User) {
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
  if (name) localStorage.setItem('home-tracker-name', name)
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    getIdentity().then((identity) => {
      identity.init()

      const current = identity.currentUser()
      setUser(current)
      if (current) syncName(current)

      identity.on('login', (u) => {
        syncName(u)
        setUser(u)
        identity.close()
      })

      identity.on('logout', () => {
        localStorage.removeItem('home-tracker-name')
        setUser(null)
      })
    })
  }, [])

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return <>{children}</>
}

function LoginScreen() {
  async function open() {
    const identity = await getIdentity()
    identity.open()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
      <div className="text-6xl mb-5">🏠</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Home Tracker</h1>
      <p className="text-muted-foreground mb-8">Sign in to access your shopping list</p>
      <button
        onClick={open}
        className="px-8 py-4 bg-primary text-primary-foreground text-xl font-bold rounded-2xl shadow-lg active:opacity-90 transition-opacity"
      >
        Sign in
      </button>
    </div>
  )
}
