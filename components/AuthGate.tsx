'use client'

import { useEffect, useState } from 'react'
import { getUser, login, onAuthChange } from '@netlify/identity'
import type { User } from '@netlify/identity'

function syncName(user: User) {
  const name = user.name || user.email?.split('@')[0] || ''
  if (name) localStorage.setItem('home-tracker-name', name)
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    getUser().then((u) => {
      setUser(u)
      if (u) syncName(u)
    })

    return onAuthChange((event, u) => {
      if (event === 'login' && u) {
        syncName(u)
        setUser(u)
      }
      if (event === 'logout') {
        localStorage.removeItem('home-tracker-name')
        setUser(null)
      }
    })
  }, [])

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading…
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return <>{children}</>
}

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      // onAuthChange in AuthGate handles state update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gray-50">
      <div className="text-6xl mb-5">🏠</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Home Tracker</h1>
      <p className="text-gray-500 mb-8">Sign in to access your shopping list</p>
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-green-600 text-white text-xl font-bold rounded-2xl shadow-lg shadow-green-600/20 active:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
