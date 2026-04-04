'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import type { ShoppingListEntry } from '@/lib/types'

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
  const [items, setItems] = useState<ShoppingListEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [undoItem, setUndoItem] = useState<ShoppingListEntry | null>(null)

  async function load() {
    const res = await fetch('/api/list')
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

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

  // Group active items by category (we don't have category on entry, just name)
  return (
    <main className="pb-24 pt-4 max-w-lg mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Shopping List</h1>

      {loading && (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      )}

      {!loading && active.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🛒</div>
          <p className="text-gray-500 text-lg">Your list is empty</p>
          <p className="text-gray-400 text-sm mt-1">Tap an NFC tag or use Quick Add</p>
        </div>
      )}

      {active.length > 0 && (
        <ul className="space-y-2">
          {active.map((item) => (
            <li
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 px-4 py-3"
            >
              <button
                onClick={() => markBought(item.id)}
                className="w-7 h-7 rounded-full border-2 border-green-500 flex-shrink-0 hover:bg-green-50 active:bg-green-100 transition-colors"
                aria-label="Mark as bought"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {item.addedBy && <span>{item.addedBy} · </span>}
                  {item.source === 'nfc' && <span>via NFC · </span>}
                  {item.source === 'quick-add' && <span>typed · </span>}
                  {timeAgo(item.updatedAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.quantity > 1 && (
                  <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    ×{item.quantity}
                  </span>
                )}
                <button
                  onClick={() => remove(item.id)}
                  className="text-gray-300 hover:text-red-400 active:text-red-500 transition-colors p-1"
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
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Bought ({bought.length})
          </h2>
          <ul className="space-y-1.5">
            {bought.map((item) => (
              <li
                key={item.id}
                className="bg-white rounded-xl border border-gray-100 flex items-center gap-3 px-4 py-2.5 opacity-60"
              >
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-600 line-through truncate">{item.name}</div>
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1 text-sm"
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
        <div className="fixed bottom-20 inset-x-4 max-w-sm mx-auto bg-gray-800 text-white rounded-xl px-4 py-3 flex items-center justify-between shadow-lg z-40">
          <span className="text-sm">{undoItem.name} marked as bought</span>
          <button
            onClick={() => undoBought(undoItem.id)}
            className="text-green-400 font-semibold text-sm ml-4"
          >
            Undo
          </button>
        </div>
      )}

      <Nav />
    </main>
  )
}
