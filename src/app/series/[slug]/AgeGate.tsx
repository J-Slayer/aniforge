'use client'

import { useState } from 'react'
import type { AgeRating } from '@/types'

const ratingConfig: Record<string, { label: string; color: string; icon: string; message: string }> = {
  teen: {
    label: 'Teen 13+',
    color: 'border-blue-500/30 bg-blue-500/5',
    icon: '🔞',
    message: 'This series contains content suitable for ages 13 and older.',
  },
  mature: {
    label: 'Mature 17+',
    color: 'border-amber-500/30 bg-amber-500/5',
    icon: '⚠️',
    message: 'This series contains mature themes including violence or adult situations. Recommended for ages 17+.',
  },
  adult: {
    label: 'Adult 18+',
    color: 'border-red-500/30 bg-red-500/5',
    icon: '🔞',
    message: 'This series contains explicit adult content and is intended for ages 18 and older only.',
  },
}

export default function AgeGate({
  rating,
  children,
}: {
  rating: AgeRating
  children: React.ReactNode
}) {
  const [confirmed, setConfirmed] = useState(false)

  if (rating === 'all' || confirmed) {
    return <>{children}</>
  }

  const config = ratingConfig[rating]

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className={`max-w-md w-full rounded-2xl border p-8 text-center ${config.color}`}>
        <p className="text-4xl mb-4">{config.icon}</p>
        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${
          rating === 'adult'
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        }`}>
          {config.label}
        </span>
        <h2 className="text-lg font-bold text-foreground mb-3">Content Warning</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {config.message}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setConfirmed(true)}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            I confirm I meet the age requirement
          </button>
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Take me back
          </a>
        </div>
      </div>
    </div>
  )
}
