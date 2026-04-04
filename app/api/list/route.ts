import { NextResponse } from 'next/server'
import { getKnownItems, getShoppingList, saveShoppingList } from '@/lib/store'
import type { ShoppingListEntry } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function GET() {
  const list = await getShoppingList()
  return NextResponse.json(list)
}

// POST body: { slug?, name?, quantity?, addedBy?, source? }
// If slug provided, resolves known item and deduplicates active entries.
export async function POST(request: Request) {
  const body = await request.json()
  const list = await getShoppingList()
  const now = new Date().toISOString()

  let name: string = body.name
  let knownItemId: string | undefined
  let emoji: string | undefined

  if (body.slug) {
    const knownItems = await getKnownItems()
    const known = knownItems.find((i) => i.slug === body.slug && i.active)
    if (known) {
      name = known.name
      knownItemId = known.id
      emoji = known.emoji
    } else {
      // Slug provided but unknown — use slug as display name
      name = name || body.slug
    }
  }

  if (!name) {
    return NextResponse.json({ error: 'name or slug required' }, { status: 400 })
  }

  // Deduplicate: if there's an active entry for this item, increment quantity
  const existing = list.find(
    (e) =>
      e.status === 'active' &&
      (knownItemId ? e.knownItemId === knownItemId : e.name.toLowerCase() === name.toLowerCase())
  )

  if (existing) {
    existing.quantity += body.quantity ?? 1
    existing.updatedAt = now
    if (body.addedBy) existing.addedBy = body.addedBy
    if (body.source) existing.source = body.source
    await saveShoppingList(list)
    return NextResponse.json(existing)
  }

  const entry: ShoppingListEntry = {
    id: randomUUID(),
    knownItemId,
    name,
    emoji,
    quantity: body.quantity ?? 1,
    status: 'active',
    addedBy: body.addedBy,
    source: body.source,
    updatedAt: now,
    createdAt: now,
  }

  await saveShoppingList([...list, entry])
  return NextResponse.json(entry, { status: 201 })
}
