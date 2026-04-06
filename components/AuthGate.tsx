'use client'

import { useEffect, useState } from 'react'
import type { User } from 'netlify-identity-widget'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  // undefined = still checking, null = logged out, User = logged in
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    import('netlify-identity-widget').then((mod) => {
      const identity = mod.default
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
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return <>{children}</>
}

function syncName(user: User) {
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || ''
  if (name) localStorage.setItem('home-tracker-name', name)
}

function LoginScreen() {
  function open() {
    import('netlify-identity-widget').then((mod) => mod.default.open())
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gray-50">
      <div className="text-6xl mb-5">🏠</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Home Tracker</h1>
      <p className="text-gray-500 mb-8">Sign in to access your shopping list</p>
      <button
        onClick={open}
        className="px-8 py-4 bg-green-600 text-white text-xl font-bold rounded-2xl shadow-lg shadow-green-600/20 active:bg-green-700 transition-colors"
      >
        Sign in
      </button>
    </div>
  )
}
