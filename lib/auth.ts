import { getUser } from '@netlify/identity'
import { NextResponse } from 'next/server'

export async function requireAuth() {
  const user = await getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { user, error: null }
}

export async function requireAdmin() {
  const user = await getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!user.roles?.includes('admin')) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, error: null }
}
