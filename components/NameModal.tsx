'use client'

import { useState } from 'react'

interface Props {
  onSave: (name: string) => void
}

export default function NameModal({ onSave }: Props) {
  const [name, setName] = useState('')

  function save() {
    const trimmed = name.trim()
    localStorage.setItem('home-tracker-name', trimmed || 'Someone')
    onSave(trimmed || 'Someone')
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm mx-auto p-8 animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">👋</div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome!</h2>
          <p className="text-gray-500 mt-1 text-sm">
            What should we call you on the shared list?
          </p>
        </div>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          autoFocus
          className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-center text-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
        />
        <button
          onClick={save}
          className="w-full py-4 rounded-2xl bg-green-600 text-white text-lg font-bold active:bg-green-700 transition-colors"
        >
          {name.trim() ? `I'm ${name.trim()}` : 'Skip for now'}
        </button>
      </div>
    </div>
  )
}
