import { getStore } from '@netlify/blobs'
import type { KnownItem, ShoppingListEntry } from './types'

const STORE_NAME = 'household'
const ITEMS_KEY = 'known_items'
const LIST_KEY = 'shopping_list'

function store() {
  return getStore(STORE_NAME)
}

export async function getKnownItems(): Promise<KnownItem[]> {
  try {
    const data = await store().get(ITEMS_KEY, { type: 'json' })
    return (data as KnownItem[]) || []
  } catch {
    return []
  }
}

export async function saveKnownItems(items: KnownItem[]): Promise<void> {
  await store().setJSON(ITEMS_KEY, items)
}

export async function getShoppingList(): Promise<ShoppingListEntry[]> {
  try {
    const data = await store().get(LIST_KEY, { type: 'json' })
    return (data as ShoppingListEntry[]) || []
  } catch {
    return []
  }
}

export async function saveShoppingList(entries: ShoppingListEntry[]): Promise<void> {
  await store().setJSON(LIST_KEY, entries)
}
