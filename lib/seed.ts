import type { KnownItem } from './types'

export const SEED_ITEMS: Omit<KnownItem, 'id' | 'createdAt'>[] = [
  { slug: 'milk', name: 'Milk', category: 'Dairy', active: true },
  { slug: 'eggs', name: 'Eggs', category: 'Dairy', active: true },
  { slug: 'butter', name: 'Butter', category: 'Dairy', active: true },
  { slug: 'olive-oil', name: 'Olive Oil', category: 'Pantry', active: true },
  { slug: 'coffee', name: 'Coffee Beans', category: 'Pantry', active: true },
  { slug: 'pasta', name: 'Pasta', category: 'Pantry', active: true },
  { slug: 'rice', name: 'Rice', category: 'Pantry', active: true },
  { slug: 'bin-bags', name: 'Bin Bags', category: 'Cleaning', active: true },
  { slug: 'dishwasher-tablets', name: 'Dishwasher Tablets', category: 'Cleaning', active: true },
  { slug: 'kitchen-roll', name: 'Kitchen Roll', category: 'Cleaning', active: true },
  { slug: 'bread', name: 'Bread', category: 'Bakery', active: true },
  { slug: 'washing-up-liquid', name: 'Washing Up Liquid', category: 'Cleaning', active: true },
]
