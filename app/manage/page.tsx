'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import type { KnownItem } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'

const siteUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || ''

function NfcUrl({ slug }: { slug: string }) {
  const url = `${siteUrl}/add?item=${slug}`
  return (
    <span
      className="text-xs text-blue-600 font-mono break-all cursor-pointer"
      onClick={() => navigator.clipboard?.writeText(url)}
      title="Tap to copy"
    >
      {url}
    </span>
  )
}

const EMPTY_FORM = { slug: '', name: '', category: 'Pantry', active: true }

export default function ManagePage() {
  const [items, setItems] = useState<KnownItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [seeding, setSeeding] = useState(false)

  async function load() {
    const res = await fetch('/api/items')
    setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(item: KnownItem) {
    setEditId(item.id)
    setForm({ slug: item.slug, name: item.name, category: item.category, active: item.active })
    setError('')
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  async function save() {
    if (!form.slug || !form.name) { setError('Slug and name are required'); return }
    setSaving(true)
    setError('')
    try {
      if (editId) {
        const res = await fetch(`/api/items/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error(await res.text())
        const updated = await res.json()
        setItems((prev) => prev.map((i) => (i.id === editId ? updated : i)))
      } else {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error(await res.text())
        const created = await res.json()
        setItems((prev) => [...prev, created])
      }
      setEditId(null)
      setForm(EMPTY_FORM)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this item?')) return
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function toggleActive(item: KnownItem) {
    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !item.active }),
    })
    const updated = await res.json()
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
  }

  async function runSeed() {
    setSeeding(true)
    const res = await fetch('/api/seed', { method: 'POST' })
    const { added } = await res.json()
    await load()
    setSeeding(false)
    alert(`Seeded ${added} items`)
  }

  const grouped = CATEGORIES.reduce<Record<string, KnownItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {})

  const otherItems = items.filter((i) => !CATEGORIES.includes(i.category as typeof CATEGORIES[number]))
  if (otherItems.length > 0) grouped['Other'] = otherItems

  return (
    <main className="pb-24 pt-4 max-w-lg mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Items</h1>
        <button
          onClick={runSeed}
          disabled={seeding}
          className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 active:bg-gray-50 disabled:opacity-50"
        >
          {seeding ? 'Seeding…' : 'Seed defaults'}
        </button>
      </div>

      {/* Add / Edit form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-3">{editId ? 'Edit Item' : 'New Item'}</h2>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Slug (e.g. olive-oil)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="text"
            placeholder="Display name (e.g. Olive Oil)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="accent-green-600"
            />
            Active (shows in autocomplete)
          </label>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex gap-2 mt-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : editId ? 'Save changes' : 'Add item'}
          </button>
          {editId && (
            <button onClick={cancelEdit} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600">
              Cancel
            </button>
          )}
        </div>
      </div>

      {loading && <div className="text-center py-8 text-gray-400">Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No items yet. Add one above or click &ldquo;Seed defaults&rdquo;.
        </div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{cat}</h3>
          <ul className="space-y-2">
            {catItems.map((item) => (
              <li key={item.id} className={`bg-white rounded-xl border border-gray-100 p-3 shadow-sm ${!item.active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{item.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{item.slug}</span>
                    </div>
                    <div className="mt-1">
                      <NfcUrl slug={item.slug} />
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(item)}
                      className="px-2 py-1 rounded text-xs border border-gray-200 text-gray-500 active:bg-gray-50"
                    >
                      {item.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="px-2 py-1 rounded text-xs border border-gray-200 text-gray-500 active:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="px-2 py-1 rounded text-xs border border-red-100 text-red-400 active:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <Nav />
    </main>
  )
}
