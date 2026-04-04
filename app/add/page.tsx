'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type State = 'loading' | 'success' | 'error'

interface AddedEntry {
  id: string
  name: string
  emoji?: string
  quantity: number
  wasNew: boolean // true = created, false = incremented
}

function AddItemInner() {
  const params = useSearchParams()
  const slug = params.get('item') || ''
  const [state, setState] = useState<State>('loading')
  const [entry, setEntry] = useState<AddedEntry | null>(null)
  const [undone, setUndone] = useState(false)
  const didAdd = useRef(false) // guard against React StrictMode double-fire

  useEffect(() => {
    if (!slug || didAdd.current) return
    didAdd.current = true

    const addedBy = localStorage.getItem('home-tracker-name') || undefined

    fetch('/api/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, quantity: 1, addedBy, source: 'nfc' }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        setEntry({
          id: data.id,
          name: data.name,
          emoji: data.emoji,
          quantity: data.quantity,
          wasNew: res.status === 201,
        })
        setState('success')
      })
      .catch(() => setState('error'))
  }, [slug])

  async function handleUndo() {
    if (!entry) return
    if (entry.wasNew) {
      await fetch(`/api/list/${entry.id}`, { method: 'DELETE' })
    } else {
      // Was an increment — decrement back
      await fetch(`/api/list/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: entry.quantity - 1 }),
      })
    }
    setUndone(true)
  }

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

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Adding…
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-gray-700 font-semibold mb-2">Something went wrong</p>
        <Link href="/list" className="text-green-600 font-semibold">Go to list →</Link>
      </div>
    )
  }

  if (undone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">{entry?.emoji || '↩️'}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Removed</h1>
        <p className="text-gray-400 text-sm mb-8">{entry?.name} was taken off the list</p>
        <Link href="/list" className="text-green-600 font-semibold">View list →</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {/* Green check circle */}
      <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-5 shadow-lg shadow-green-500/30 animate-fade-in-up">
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Item emoji */}
      {entry?.emoji && (
        <div className="text-6xl mb-3 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          {entry.emoji}
        </div>
      )}

      <h1
        className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in-up"
        style={{ animationDelay: '80ms' }}
      >
        {entry?.name}
      </h1>
      <p
        className="text-green-600 font-semibold text-lg mb-10 animate-fade-in-up"
        style={{ animationDelay: '100ms' }}
      >
        Added to your list!
      </p>

      <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
        <button
          onClick={handleUndo}
          className="px-6 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-600 active:bg-gray-50 transition-colors"
        >
          Undo
        </button>
        <Link
          href="/list"
          className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold shadow-md shadow-green-600/20"
        >
          View list
        </Link>
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
