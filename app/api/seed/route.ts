import { NextResponse } from 'next/server'
import { getKnownItems, saveKnownItems } from '@/lib/store'
import { SEED_ITEMS } from '@/lib/seed'
import type { KnownItem } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function POST() {
  const existing = await getKnownItems()
  const existingSlugs = new Set(existing.map((i) => i.slug))

  const toAdd: KnownItem[] = SEED_ITEMS.filter((s) => !existingSlugs.has(s.slug)).map((s) => ({
    ...s,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  }))

  await saveKnownItems([...existing, ...toAdd])
  return NextResponse.json({ added: toAdd.length, skipped: SEED_ITEMS.length - toAdd.length })
}
