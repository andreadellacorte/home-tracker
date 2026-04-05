import { NextResponse } from 'next/server'
import { getKnownItems, getShoppingList, saveShoppingList } from '@/lib/store'
import { randomUUID } from 'crypto'

const META = {
  description:
    'Machine-readable interface for the Home Tracker shopping list. ' +
    'Use GET to read current state, POST to perform actions.',
  post_actions: {
    add: {
      description: 'Add an item to the active shopping list. Matches by slug first, then by name (case-insensitive). Silently no-ops if the item is already active.',
      body: { action: 'add', item: 'string — slug (e.g. "milk") or display name (e.g. "Milk")', added_by: 'string (optional)' },
    },
    bought: {
      description: 'Mark an active item as bought.',
      body: { action: 'bought', item: 'string — slug or name' },
    },
    remove: {
      description: 'Delete an item from the list entirely.',
      body: { action: 'remove', item: 'string — slug or name' },
    },
    clear_bought: {
      description: 'Delete all items that are marked as bought.',
      body: { action: 'clear_bought' },
    },
  },
}

export async function GET() {
  const [list, knownItems] = await Promise.all([getShoppingList(), getKnownItems()])

  return NextResponse.json({
    shopping_list: {
      active: list
        .filter((e) => e.status === 'active')
        .map(({ id, name, emoji, addedBy, source, updatedAt }) => ({
          id, name, emoji, added_by: addedBy, source, updated_at: updatedAt,
        })),
      bought: list
        .filter((e) => e.status === 'bought')
        .map(({ id, name, emoji, updatedAt }) => ({
          id, name, emoji, updated_at: updatedAt,
        })),
    },
    known_items: knownItems
      .filter((i) => i.active)
      .map(({ slug, name, emoji, category }) => ({ slug, name, emoji, category })),
    _meta: META,
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 })
  }

  const [list, knownItems] = await Promise.all([getShoppingList(), getKnownItems()])
  const now = new Date().toISOString()

  // Resolve item string → known item + display name
  function resolve(itemStr: string) {
    const bySlug = knownItems.find((i) => i.slug === itemStr.toLowerCase())
    if (bySlug) return bySlug
    const byName = knownItems.find((i) => i.name.toLowerCase() === itemStr.toLowerCase())
    return byName || null
  }

  function findActive(itemStr: string) {
    const known = resolve(itemStr)
    return list.find(
      (e) =>
        e.status === 'active' &&
        (known ? e.knownItemId === known.id : e.name.toLowerCase() === itemStr.toLowerCase())
    )
  }

  switch (body.action) {
    case 'add': {
      if (!body.item) return NextResponse.json({ error: 'Missing item' }, { status: 400 })
      const existing = findActive(body.item)
      if (existing) return NextResponse.json({ ok: true, result: 'already_active', entry: existing })

      const known = resolve(body.item)
      const entry = {
        id: randomUUID(),
        knownItemId: known?.id,
        name: known?.name ?? body.item,
        emoji: known?.emoji,
        quantity: 1,
        status: 'active' as const,
        addedBy: body.added_by,
        source: 'manual' as const,
        updatedAt: now,
        createdAt: now,
      }
      await saveShoppingList([...list, entry])
      return NextResponse.json({ ok: true, result: 'added', entry })
    }

    case 'bought': {
      if (!body.item) return NextResponse.json({ error: 'Missing item' }, { status: 400 })
      const entry = findActive(body.item)
      if (!entry) return NextResponse.json({ error: 'Item not found in active list' }, { status: 404 })
      entry.status = 'bought'
      entry.updatedAt = now
      await saveShoppingList(list)
      return NextResponse.json({ ok: true, result: 'marked_bought', entry })
    }

    case 'remove': {
      if (!body.item) return NextResponse.json({ error: 'Missing item' }, { status: 400 })
      const known = resolve(body.item)
      const before = list.length
      const filtered = list.filter(
        (e) =>
          !(known ? e.knownItemId === known.id : e.name.toLowerCase() === body.item.toLowerCase())
      )
      if (filtered.length === before) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      await saveShoppingList(filtered)
      return NextResponse.json({ ok: true, result: 'removed' })
    }

    case 'clear_bought': {
      const filtered = list.filter((e) => e.status !== 'bought')
      await saveShoppingList(filtered)
      return NextResponse.json({ ok: true, result: 'cleared', removed: list.length - filtered.length })
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 })
  }
}
