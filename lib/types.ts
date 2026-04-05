export interface KnownItem {
  id: string
  slug: string
  name: string
  emoji?: string
  category: string
  active: boolean
  tag?: string  // short NFC tag identifier, e.g. "1", "2" → URL becomes /<tag>
  createdAt: string
}

export interface ShoppingListEntry {
  id: string
  knownItemId?: string
  name: string
  emoji?: string
  quantity: number
  status: 'active' | 'bought'
  addedBy?: string
  source?: 'nfc' | 'quick-add' | 'manual'
  updatedAt: string
  createdAt: string
}

export const CATEGORIES = [
  'Dairy',
  'Produce',
  'Pantry',
  'Meat & Fish',
  'Bakery',
  'Frozen',
  'Cleaning',
  'Personal Care',
  'Other',
] as const
