export function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function setCached<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

// Fetch with automatic retry on failure (blob store can be flaky).
// Retries up to `retries` times with exponential back-off (500ms, 1000ms).
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2
): Promise<Response> {
  let last: unknown
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res
      last = new Error(`HTTP ${res.status}`)
    } catch (e) {
      last = e
    }
    if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)))
  }
  throw last
}
