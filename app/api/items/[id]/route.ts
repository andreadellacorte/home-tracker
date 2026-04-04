import { NextResponse } from 'next/server'
import { getKnownItems, saveKnownItems } from '@/lib/store'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const items = await getKnownItems()
  const idx = items.findIndex((i) => i.id === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  items[idx] = { ...items[idx], ...body, id: params.id }
  await saveKnownItems(items)
  return NextResponse.json(items[idx])
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const items = await getKnownItems()
  const filtered = items.filter((i) => i.id !== params.id)
  if (filtered.length === items.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await saveKnownItems(filtered)
  return NextResponse.json({ ok: true })
}
