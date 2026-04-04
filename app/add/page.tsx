'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type State = 'idle' | 'loading' | 'success' | 'error'

function AddItemInner() {
  const params = useSearchParams()
  const slug = params.get('item') || ''
  const [displayName, setDisplayName] = useState(slug.replace(/-/g, ' '))
  const [quantity, setQuantity] = useState(1)
  const [addedBy, setAddedBy] = useState('')
  const [state, setState] = useState<State>('idle')
  const [isExisting, setIsExisting] = useState(false)

  // Load saved name from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('home-tracker-name')
    if (saved) setAddedBy(saved)
  }, [])

  // Resolve display name from known items
  useEffect(() => {
    if (!slug) return
    fetch('/api/items')
      .then((r) => r.json())
      .then((items: { slug: string; name: string }[]) => {
        const found = items.find((i) => i.slug === slug)
        if (found) setDisplayName(found.name)
      })
  }, [slug])

  // Check if item already on list
  useEffect(() => {
    if (!slug) return
    fetch('/api/list')
      .then((r) => r.json())
      .then((list: { name: string; status: string; quantity: number }[]) => {
        const name = displayName || slug.replace(/-/g, ' ')
        const existing = list.find(
          (e) => e.status === 'active' && e.name.toLowerCase() === name.toLowerCase()
        )
        if (existing) {
          setIsExisting(true)
          setQuantity(existing.quantity + 1)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, displayName])

  if (!slug) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">🏷️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">No item specified</h1>
        <p className="text-gray-500 mb-6">Use a URL like /add?item=milk</p>
        <Link href="/list" className="text-green-600 font-semibold">Go to list →</Link>
      </div>
    )
  }

  async function handleAdd() {
    if (addedBy) localStorage.setItem('home-tracker-name', addedBy)
    setState('loading')
    try {
      const res = await fetch('/api/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, quantity, addedBy: addedBy || undefined }),
      })
      if (!res.ok) throw new Error('Failed')
      setState('success')
    } catch {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-7xl mb-6 animate-bounce">✅</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
        <p className="text-gray-500 text-lg mb-8">Added to your list!</p>
        <div className="flex gap-3">
          <button
            onClick={() => { setState('idle'); setQuantity(1); setIsExisting(false) }}
            className="px-6 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-700"
          >
            Add more
          </button>
          <Link
            href="/list"
            className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold"
          >
            View list
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-4xl font-bold text-gray-900 capitalize">{displayName}</h1>
          {isExisting && (
            <p className="text-green-600 text-sm mt-2 font-medium">Already on your list — will update quantity</p>
          )}
        </div>

        {/* Quantity picker */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-14 h-14 rounded-full bg-gray-100 text-3xl font-light text-gray-600 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            −
          </button>
          <span className="text-5xl font-bold text-gray-900 w-12 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-14 h-14 rounded-full bg-gray-100 text-3xl font-light text-gray-600 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            +
          </button>
        </div>

        {/* Name field */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={addedBy}
            onChange={(e) => setAddedBy(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-gray-700 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={state === 'loading'}
          className="w-full py-5 rounded-2xl bg-green-600 text-white text-xl font-bold active:bg-green-700 disabled:opacity-50 transition-colors shadow-lg shadow-green-600/20"
        >
          {state === 'loading' ? 'Adding…' : 'Add to List'}
        </button>

        {state === 'error' && (
          <p className="text-red-500 text-center mt-4">Something went wrong. Try again.</p>
        )}

        <div className="text-center mt-6">
          <Link href="/list" className="text-gray-400 text-sm">View list →</Link>
        </div>
      </div>
    </div>
  )
}

export default function AddPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>}>
      <AddItemInner />
    </Suspense>
  )
}
