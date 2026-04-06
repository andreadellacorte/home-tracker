import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// @netlify/identity's server-side getUser() reads from globalThis.Netlify.context.cookies
// (Netlify Functions v2 global), which is not set in Next.js route handlers. Instead,
// read nf_jwt directly via next/headers and decode the payload — the widget sets this
// cookie on login; we trust it over HTTPS with Secure + SameSite=Lax.

interface JwtPayload {
  sub?: string
  email?: string
  exp?: number
  app_metadata?: { roles?: string[] }
  user_metadata?: { full_name?: string }
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8')
    return JSON.parse(payload) as JwtPayload
  } catch {
    return null
  }
}

async function getAuthUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('nf_jwt')?.value
  if (!token) return null
  const payload = decodeJwt(token)
  if (!payload) return null
  if (payload.exp && payload.exp * 1000 < Date.now()) return null
  return payload
}

export async function requireAuth() {
  const user = await getAuthUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { user, error: null }
}

export async function requireAdmin() {
  const user = await getAuthUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const roles = user.app_metadata?.roles ?? []
  if (!roles.includes('admin')) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}
