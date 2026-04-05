import { NextResponse } from 'next/server'
import { getKnownItems, getShoppingList, saveShoppingList, saveKnownItems } from '@/lib/store'
import { randomUUID } from 'crypto'

const META = {
  description:
    'Machine-readable interface for the Home Tracker shopping list. ' +
    'Use GET to read current state, POST to perform actions.',
  post_actions: {
    // Shopping list
    add: {
      description: 'Add an item to the active shopping list. Matches by slug first, then by name (case-insensitive). No-ops if already active.',
      body: { action: 'add', item: 'slug or display name', added_by: 'string (optional)' },
    },
    bought: {
      description: 'Mark an active list item as bought.',
      body: { action: 'bought', item: 'slug or display name' },
    },
    remove: {
      description: 'Delete an item from the shopping list entirely.',
      body: { action: 'remove', item: 'slug or display name' },
    },
    clear_bought: {
      description: 'Delete all items marked as bought.',
      body: { action: 'clear_bought' },
    },
    // Known items
    create_known_item: {
      description: 'Create a new known item (makes it available for NFC tags and autocomplete).',
      body: { action: 'create_known_item', slug: 'unique-kebab-case', name: 'Display Name', emoji: '🥛 (optional)', category: 'Dairy | Produce | Pantry | Meat & Fish | Bakery | Frozen | Cleaning | Personal Care | Other' },
    },
    update_known_item: {
      description: 'Update fields on an existing known item. Only provided fields are changed.',
      body: { action: 'update_known_item', slug: 'existing slug', name: 'optional', emoji: 'optional', category: 'optional', active: 'boolean (optional)' },
    },
    delete_known_item: {
      description: 'Permanently delete a known item by slug.',
      body: { action: 'delete_known_item', slug: 'existing slug' },
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
    known_items: knownItems.map(({ slug, name, emoji, category, active, tag }) => ({
      slug, name, emoji, category, active, tag,
    })),
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

  function resolveKnown(itemStr: string) {
    return (
      knownItems.find((i) => i.slug === itemStr.toLowerCase()) ||
      knownItems.find((i) => i.name.toLowerCase() === itemStr.toLowerCase()) ||
      null
    )
  }

  function findActive(itemStr: string) {
    const known = resolveKnown(itemStr)
    return list.find(
      (e) =>
        e.status === 'active' &&
        (known ? e.knownItemId === known.id : e.name.toLowerCase() === itemStr.toLowerCase())
    )
  }

  switch (body.action) {

    // ── Shopping list ────────────────────────────────────────────────────────

    case 'add': {
      if (!body.item) return NextResponse.json({ error: 'Missing item' }, { status: 400 })
      const existing = findActive(body.item)
      if (existing) return NextResponse.json({ ok: true, result: 'already_active', entry: existing })
      const known = resolveKnown(body.item)
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
      const known = resolveKnown(body.item)
      const filtered = list.filter(
        (e) => !(known ? e.knownItemId === known.id : e.name.toLowerCase() === body.item.toLowerCase())
      )
      if (filtered.length === list.length) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      await saveShoppingList(filtered)
      return NextResponse.json({ ok: true, result: 'removed' })
    }

    case 'clear_bought': {
      const filtered = list.filter((e) => e.status !== 'bought')
      await saveShoppingList(filtered)
      return NextResponse.json({ ok: true, result: 'cleared', removed: list.length - filtered.length })
    }

    // ── Known items ──────────────────────────────────────────────────────────

    case 'create_known_item': {
      const { slug, name, emoji, category } = body
      if (!slug || !name) return NextResponse.json({ error: 'slug and name are required' }, { status: 400 })
      if (knownItems.find((i) => i.slug === slug)) {
        return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 })
      }
      const item = {
        id: randomUUID(),
        slug,
        name,
        emoji,
        category: category || 'Other',
        active: true,
        createdAt: now,
      }
      await saveKnownItems([...knownItems, item])
      return NextResponse.json({ ok: true, result: 'created', item })
    }

    case 'update_known_item': {
      if (!body.slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
      const idx = knownItems.findIndex((i) => i.slug === body.slug)
      if (idx === -1) return NextResponse.json({ error: `Slug "${body.slug}" not found` }, { status: 404 })
      if (body.tag) {
        const collision = knownItems.find((i) => i.tag === body.tag && i.slug !== body.slug)
        if (collision) {
          return NextResponse.json(
            { error: `Tag "${body.tag}" is already assigned to ${collision.name}` },
            { status: 409 }
          )
        }
      }
      const allowed = ['name', 'emoji', 'category', 'active', 'tag']
      const updates = Object.fromEntries(
        Object.entries(body).filter(([k]) => allowed.includes(k))
      )
      knownItems[idx] = { ...knownItems[idx], ...updates }
      await saveKnownItems(knownItems)
      return NextResponse.json({ ok: true, result: 'updated', item: knownItems[idx] })
    }

    case 'delete_known_item': {
      if (!body.slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
      const filtered = knownItems.filter((i) => i.slug !== body.slug)
      if (filtered.length === knownItems.length) {
        return NextResponse.json({ error: `Slug "${body.slug}" not found` }, { status: 404 })
      }
      await saveKnownItems(filtered)
      return NextResponse.json({ ok: true, result: 'deleted' })
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 })
  }
}
