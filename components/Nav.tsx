'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/list', label: 'List', icon: '🛒' },
  { href: '/quick-add', label: 'Add', icon: '＋' },
  { href: '/manage', label: 'Manage', icon: '⚙️' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex safe-bottom z-50">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors ${
            pathname === l.href ? 'text-green-600' : 'text-gray-500'
          }`}
        >
          <span className="text-xl leading-none mb-0.5">{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
