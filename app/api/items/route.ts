import { NextResponse } from 'next/server'
import { getKnownItems, saveKnownItems } from '@/lib/store'
import type { KnownItem } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function GET() {
  const items = await getKnownItems()
  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const body = await request.json()
  const items = await getKnownItems()

  if (items.find((i) => i.slug === body.slug)) {
    return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
  }

  const newItem: KnownItem = {
    id: randomUUID(),
    slug: body.slug,
    name: body.name,
    category: body.category || 'Other',
    active: body.active ?? true,
    createdAt: new Date().toISOString(),
  }

  await saveKnownItems([...items, newItem])
  return NextResponse.json(newItem, { status: 201 })
}
