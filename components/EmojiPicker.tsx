'use client'

import { useEffect, useRef, useState } from 'react'

// Tell TypeScript about the custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'emoji-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

interface Props {
  value: string
  onChange: (emoji: string) => void
  searchQuery?: string
}

export default function EmojiPicker({ value, onChange, searchQuery }: Props) {
  const [open, setOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Dynamically import to register the custom element (client-only)
  useEffect(() => {
    import('emoji-picker-element')
  }, [])

  // Pre-fill search query when picker opens
  useEffect(() => {
    if (!open || !searchQuery) return
    // The search input lives inside the shadow DOM
    requestAnimationFrame(() => {
      const picker = pickerRef.current?.querySelector('emoji-picker')
      const input = picker?.shadowRoot?.querySelector('input[type="search"]') as HTMLInputElement | null
      if (input) {
        input.value = searchQuery
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
  }, [open, searchQuery])

  // Attach event listener whenever picker is open
  useEffect(() => {
    if (!open) return
    const el = pickerRef.current?.querySelector('emoji-picker')
    if (!el) return
    const handler = (e: Event) => {
      const unicode = (e as CustomEvent).detail?.unicode
      if (unicode) {
        onChange(unicode)
        setOpen(false)
      }
    }
    el.addEventListener('emoji-click', handler)
    return () => el.removeEventListener('emoji-click', handler)
  }, [open, onChange])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors w-full"
      >
        <span className="text-2xl w-7 text-center">{value || '?'}</span>
        <span className="text-gray-500">{value ? 'Change emoji' : 'Pick emoji'}</span>
      </button>

      {open && (
        <div
          ref={pickerRef}
          className="absolute z-50 top-full left-0 mt-1 shadow-xl rounded-xl overflow-hidden"
        >
          {/* @ts-expect-error web component */}
          <emoji-picker style={{ '--num-columns': 8 }} />
        </div>
      )}
    </div>
  )
}
