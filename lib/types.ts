export interface KnownItem {
  id: string
  slug: string
  name: string
  category: string
  active: boolean
  createdAt: string
}

export interface ShoppingListEntry {
  id: string
  knownItemId?: string
  name: string
  quantity: number
  status: 'active' | 'bought'
  addedBy?: string
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
