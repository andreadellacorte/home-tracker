import { NextResponse } from 'next/server'
import { getKnownItems, saveKnownItems } from '@/lib/store'
import { requireAdmin } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const body = await request.json()
  const items = await getKnownItems()
  const idx = items.findIndex((i) => i.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.tag) {
    const collision = items.find((i) => i.tag === body.tag && i.id !== id)
    if (collision) {
      return NextResponse.json(
        { error: `Tag "${body.tag}" is already assigned to ${collision.name}` },
        { status: 409 }
      )
    }
  }

  items[idx] = { ...items[idx], ...body, id }
  await saveKnownItems(items)
  return NextResponse.json(items[idx])
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const items = await getKnownItems()
  const filtered = items.filter((i) => i.id !== id)
  if (filtered.length === items.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await saveKnownItems(filtered)
  return NextResponse.json({ ok: true })
}
