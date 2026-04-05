'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import EmojiPicker from '@/components/EmojiPicker'
import type { KnownItem } from '@/lib/types'
import { CATEGORIES } from '@/lib/types'

function siteUrl() {
  return typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || ''
}

function nfcUrl(slug: string) {
  return `${siteUrl()}/add?item=${slug}`
}

function CopyButton({ slug, short }: { slug: string; short?: boolean }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const url = short ? `${siteUrl()}/nfc/${slug}` : nfcUrl(slug)
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
        copied
          ? 'border-green-300 bg-green-50 text-green-600'
          : 'border-gray-200 text-gray-500 active:bg-gray-50'
      }`}
    >
      {copied ? '✓ Copied' : '⎘ Copy URL'}
    </button>
  )
}

function CategorySection({
  cat,
  items,
  defaultOpen,
  onEdit,
  onToggleActive,
  onRemove,
}: {
  cat: string
  items: KnownItem[]
  defaultOpen: boolean
  onEdit: (item: KnownItem) => void
  onToggleActive: (item: KnownItem) => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-2 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-semibold text-gray-700 text-sm">{cat}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{items.length}</span>
          <span className={`text-gray-400 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {open && (
        <ul className="border-t border-gray-100 divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className={`px-4 py-3 ${!item.active ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  {item.emoji && <span className="text-xl flex-shrink-0">{item.emoji}</span>}
                  <span className="font-semibold text-gray-900 truncate">{item.name}</span>
                  <span className="text-xs text-gray-400 font-mono flex-shrink-0">{item.slug}</span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => onToggleActive(item)}
                    className="px-2 py-1 rounded text-xs border border-gray-200 text-gray-500 active:bg-gray-50"
                  >
                    {item.active ? 'Off' : 'On'}
                  </button>
                  <button
                    onClick={() => onEdit(item)}
                    className="px-2 py-1 rounded text-xs border border-gray-200 text-gray-500 active:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="px-2 py-1 rounded text-xs border border-red-100 text-red-400 active:bg-red-50"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.tag ? (
                  <>
                    <span className="text-xs font-mono text-green-700 bg-green-50 px-1.5 py-0.5 rounded flex-shrink-0">
                      /nfc/{item.tag}
                    </span>
                    <span className="text-xs text-gray-300 font-mono truncate flex-1">
                      {nfcUrl(item.slug)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 font-mono truncate flex-1">
                    {nfcUrl(item.slug)}
                  </span>
                )}
                <CopyButton slug={item.tag || item.slug} short={!!item.tag} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const EMPTY_FORM = { slug: '', name: '', emoji: '', category: 'Pantry', active: true, tag: '' }

export default function ManagePage() {
  const [items, setItems] = useState<KnownItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [userName, setUserName] = useState('')
  const [nameSaved, setNameSaved] = useState(false)

  useEffect(() => {
    setUserName(localStorage.getItem('home-tracker-name') || '')
  }, [])

  async function load() {
    const res = await fetch('/api/items')
    setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(item: KnownItem) {
    setEditId(item.id)
    setForm({ slug: item.slug, name: item.name, emoji: item.emoji || '', category: item.category, active: item.active, tag: item.tag || '' })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const groupEntries = Object.entries(grouped)

  return (
    <main className="pb-24 pt-4 max-w-lg mx-auto px-4">
      {/* Your name */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <h2 className="font-semibold text-gray-700 mb-3">Your name</h2>
        <p className="text-xs text-gray-400 mb-3">Shown on the shared list when you add items.</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Andrea"
            value={userName}
            onChange={(e) => { setUserName(e.target.value); setNameSaved(false) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                localStorage.setItem('home-tracker-name', userName.trim())
                setNameSaved(true)
              }
            }}
            className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={() => {
              localStorage.setItem('home-tracker-name', userName.trim())
              setNameSaved(true)
              setTimeout(() => setNameSaved(false), 2000)
            }}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              nameSaved
                ? 'bg-green-50 text-green-600 border border-green-200'
                : 'bg-green-600 text-white active:bg-green-700'
            }`}
          >
            {nameSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

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
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Slug (e.g. olive-oil)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Tag # (e.g. 1)"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value.trim() })}
              className="w-24 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {(() => {
            const conflict = form.tag
              ? items.find((i) => i.tag === form.tag && i.id !== editId)
              : null
            return conflict ? (
              <p className="text-amber-600 text-xs mt-1">
                ⚠ /nfc/{form.tag} is already used by <strong>{conflict.name}</strong>
              </p>
            ) : null
          })()}
          <input
            type="text"
            placeholder="Display name (e.g. Olive Oil)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <EmojiPicker value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e })} searchQuery={form.name} />
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

      {groupEntries.map(([cat, catItems], idx) => (
        <CategorySection
          key={cat}
          cat={cat}
          items={catItems}
          defaultOpen={idx === 0}
          onEdit={startEdit}
          onToggleActive={toggleActive}
          onRemove={remove}
        />
      ))}

      <Nav />
    </main>
  )
}
