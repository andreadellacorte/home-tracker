'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

const links = [
  { href: '/list', label: 'List', icon: '🛒' },
  { href: '/quick-add', label: 'Add', icon: '＋' },
  { href: '/manage', label: 'Manage', icon: '⚙️' },
]

export default function Nav() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-card border-t border-border flex safe-bottom z-50">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors ${
            pathname === l.href ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <span className="text-xl leading-none mb-0.5">{l.icon}</span>
          {l.label}
        </Link>
      ))}
      <button
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium text-muted-foreground transition-colors"
        aria-label="Toggle theme"
      >
        {resolvedTheme === 'dark'
          ? <Sun className="w-5 h-5 mb-0.5" />
          : <Moon className="w-5 h-5 mb-0.5" />}
        Theme
      </button>
    </nav>
  )
}
