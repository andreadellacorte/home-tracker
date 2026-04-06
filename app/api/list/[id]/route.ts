import { NextResponse } from 'next/server'
import { getShoppingList, saveShoppingList } from '@/lib/store'
import { requireAuth } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  const body = await request.json()
  const list = await getShoppingList()
  const idx = list.findIndex((e) => e.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  list[idx] = { ...list[idx], ...body, id, updatedAt: new Date().toISOString() }
  await saveShoppingList(list)
  return NextResponse.json(list[idx])
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  const list = await getShoppingList()
  const filtered = list.filter((e) => e.id !== id)
  if (filtered.length === list.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await saveShoppingList(filtered)
  return NextResponse.json({ ok: true })
}
