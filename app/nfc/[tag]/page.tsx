import { redirect, notFound } from 'next/navigation'
import { getKnownItems } from '@/lib/store'

// Resolve a short NFC tag identifier to the add page for the mapped item.
// e.g. /1 → /add?item=milk
export default async function TagRedirectPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  const items = await getKnownItems()
  const item = items.find((i) => i.active && i.tag === tag)
  if (!item) notFound()
  redirect(`/add?item=${item.slug}`)
}
