'use client'

import { useEffect, useRef, useState } from 'react'
import Nav from '@/components/Nav'
import Link from 'next/link'
import type { KnownItem } from '@/lib/types'
import { getCached, setCached, fetchWithRetry } from '@/lib/cache'

const ITEMS_CACHE = 'home-tracker-items'

export default function QuickAddPage() {
  const [query, setQuery] = useState('')
  const [knownItems, setKnownItems] = useState<KnownItem[]>(() => getCached<KnownItem[]>(ITEMS_CACHE) ?? [])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [lastAdded, setLastAdded] = useState('')
  const [userName, setUserName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUserName(localStorage.getItem('home-tracker-name') || '')
    fetchWithRetry('/api/items').then((r) => r.json()).then((data: KnownItem[]) => {
      setKnownItems(data)
      setCached(ITEMS_CACHE, data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => setStatus('idle'), 2000)
      return () => clearTimeout(t)
    }
  }, [status])

  const suggestions = query.length > 0
    ? knownItems
        .filter((i) => i.active && i.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
    : []

  async function addItem(name: string, slug?: string) {
    const addedBy = localStorage.getItem('home-tracker-name') || undefined
    setStatus('loading')
    try {
      const res = await fetch('/api/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, addedBy, source: 'quick-add' }),
      })
      if (!res.ok) throw new Error()
      setLastAdded(name)
      setQuery('')
      setStatus('success')
      inputRef.current?.focus()
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="pb-24 pt-4 max-w-lg mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quick Add</h1>
        {userName && (
          <Link href="/manage" className="text-xs text-gray-400">Hi, {userName} · change</Link>
        )}
      </div>

      <div className="mb-4">
        <input
          ref={inputRef}
          type="text"
          placeholder="Item name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && query.trim() && addItem(query.trim())}
          className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          autoFocus
        />
      </div>

      {suggestions.length > 0 && (
        <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-4 overflow-hidden shadow-sm">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => addItem(item.name, item.slug)}
                className="w-full text-left px-4 py-3.5 flex items-center justify-between active:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{item.name}</span>
                <span className="text-xs text-gray-400">{item.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && suggestions.length === 0 && (
        <button
          onClick={() => addItem(query.trim())}
          disabled={status === 'loading'}
          className="w-full py-4 rounded-xl bg-green-600 text-white text-lg font-bold active:bg-green-700 disabled:opacity-50 transition-colors"
        >
          Add &ldquo;{query}&rdquo;
        </button>
      )}

      {query.trim() && suggestions.length > 0 && (
        <button
          onClick={() => addItem(query.trim())}
          disabled={status === 'loading'}
          className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium active:bg-gray-50 transition-colors"
        >
          Add &ldquo;{query}&rdquo; as new item
        </button>
      )}

      {status === 'success' && (
        <div className="mt-4 bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm font-medium text-center">
          ✓ {lastAdded} added to list!{' '}
          <Link href="/list" className="underline">View list</Link>
        </div>
      )}
      {status === 'error' && (
        <div className="mt-4 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm text-center">
          Something went wrong. Try again.
        </div>
      )}

      <Nav />
    </main>
  )
}
