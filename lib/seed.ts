import type { KnownItem } from './types'

export const SEED_ITEMS: Omit<KnownItem, 'id' | 'createdAt'>[] = [
  { slug: 'milk',                name: 'Milk',                emoji: '🥛', category: 'Dairy',         active: true },
  { slug: 'eggs',                name: 'Eggs',                emoji: '🥚', category: 'Dairy',         active: true },
  { slug: 'butter',              name: 'Butter',              emoji: '🧈', category: 'Dairy',         active: true },
  { slug: 'olive-oil',           name: 'Olive Oil',           emoji: '🫒', category: 'Pantry',        active: true },
  { slug: 'coffee',              name: 'Coffee Beans',        emoji: '☕', category: 'Pantry',        active: true },
  { slug: 'pasta',               name: 'Pasta',               emoji: '🍝', category: 'Pantry',        active: true },
  { slug: 'rice',                name: 'Rice',                emoji: '🍚', category: 'Pantry',        active: true },
  { slug: 'bread',               name: 'Bread',               emoji: '🍞', category: 'Bakery',        active: true },
  { slug: 'bin-bags',            name: 'Bin Bags',            emoji: '🗑️', category: 'Cleaning',      active: true },
  { slug: 'dishwasher-tablets',  name: 'Dishwasher Tablets',  emoji: '🫧', category: 'Cleaning',      active: true },
  { slug: 'kitchen-roll',        name: 'Kitchen Roll',        emoji: '🧻', category: 'Cleaning',      active: true },
  { slug: 'washing-up-liquid',   name: 'Washing Up Liquid',   emoji: '🧴', category: 'Cleaning',      active: true },
]
