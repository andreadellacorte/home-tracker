'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import InstallBanner from '@/components/InstallBanner'
import type { ShoppingListEntry } from '@/lib/types'
import { getCached, setCached, fetchWithRetry } from '@/lib/cache'

const LIST_CACHE = 'home-tracker-list'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function ListPage() {
  const [items, setItems] = useState<ShoppingListEntry[]>(() => getCached<ShoppingListEntry[]>(LIST_CACHE) ?? [])
  const [loading, setLoading] = useState(true)
  const [undoItem, setUndoItem] = useState<ShoppingListEntry | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    setUserName(localStorage.getItem('home-tracker-name') || '')
    load()
  }, [])

  async function load() {
    try {
      const res = await fetchWithRetry('/api/list')
      const data: ShoppingListEntry[] = await res.json()
      setItems(data)
      setCached(LIST_CACHE, data)
    } finally {
      setLoading(false)
    }
  }

  async function markBought(id: string) {
    const item = items.find((i) => i.id === id)!
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'bought' } : i)))
    await fetch(`/api/list/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'bought' }),
    })
    setUndoItem(item)
    setTimeout(() => setUndoItem((u) => (u?.id === id ? null : u)), 5000)
  }

  async function undoBought(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'active' } : i)))
    await fetch(`/api/list/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    setUndoItem(null)
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await fetch(`/api/list/${id}`, { method: 'DELETE' })
  }

  const active = items.filter((i) => i.status === 'active')
  const bought = items.filter((i) => i.status === 'bought')

  return (
    <>
      <InstallBanner />

      <main className="pb-24 pt-4 max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Shopping List</h1>
          {userName
            ? <Link href="/manage" className="text-xs text-muted-foreground">Hi, {userName} · change</Link>
            : <Link href="/manage" className="text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-lg">Set your name →</Link>
          }
        </div>

        {loading && items.length === 0 && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl h-16 animate-pulse border border-border" />
            ))}
          </div>
        )}

        {!loading && active.length === 0 && (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-muted-foreground text-lg">Your list is empty</p>
            <p className="text-muted-foreground text-sm mt-1">Tap an NFC tag or use Quick Add</p>
          </div>
        )}

        {active.length > 0 && (
          <ul className="space-y-2">
            {active.map((item, idx) => (
              <li
                key={item.id}
                className="bg-card rounded-xl shadow-sm border border-border flex items-center gap-3 px-4 py-3 animate-fade-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <button
                  onClick={() => markBought(item.id)}
                  className="w-7 h-7 rounded-full border-2 border-primary flex-shrink-0 hover:bg-primary/10 active:bg-primary/20 transition-colors"
                  aria-label="Mark as bought"
                />
                {item.emoji && (
                  <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {item.addedBy && <span>{item.addedBy} · </span>}
                    {item.source === 'nfc' && <span>via NFC · </span>}
                    {item.source === 'quick-add' && <span>typed · </span>}
                    {timeAgo(item.updatedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => remove(item.id)}
                    className="text-muted-foreground hover:text-destructive active:text-destructive transition-colors p-1"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {bought.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Bought ({bought.length})
            </h2>
            <ul className="space-y-1.5">
              {bought.map((item) => (
                <li
                  key={item.id}
                  className="bg-card rounded-xl border border-border flex items-center gap-3 px-4 py-2.5 opacity-60"
                >
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-xs">✓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-muted-foreground line-through truncate">{item.name}</div>
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 text-sm"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {undoItem && (
          <div className="fixed bottom-20 inset-x-4 max-w-sm mx-auto bg-popover text-popover-foreground rounded-xl px-4 py-3 flex items-center justify-between shadow-lg z-40 animate-slide-up">
            <span className="text-sm">{undoItem.name} marked as bought</span>
            <button
              onClick={() => undoBought(undoItem.id)}
              className="text-primary font-semibold text-sm ml-4"
            >
              Undo
            </button>
          </div>
        )}

        <Nav />
      </main>
    </>
  )
}
