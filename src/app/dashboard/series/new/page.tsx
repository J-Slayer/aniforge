'use client'

import { useActionState } from 'react'
import { createSeriesAction } from '../actions'
import type { Metadata } from 'next'

const inputClass =
  'w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors'

export default function NewSeriesPage() {
  const [state, formAction, isPending] = useActionState(createSeriesAction, null)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Series</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create a new anime or manga series.
        </p>
      </div>

      {state && 'error' in state && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Title <span className="text-destructive">*</span>
          </label>
          <input id="title" name="title" type="text" required maxLength={200}
            placeholder="My Awesome Series" className={inputClass} />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Type <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['anime', 'manga'] as const).map((t) => (
              <label key={t} className="relative flex cursor-pointer">
                <input type="radio" name="type" value={t} required
                  defaultChecked={t === 'anime'}
                  className="peer sr-only" />
                <span className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium text-muted-foreground text-center transition-colors peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-medium text-foreground">
            Status
          </label>
          <select id="status" name="status" defaultValue="ongoing"
            className={inputClass}>
            <option value="ongoing">Ongoing</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="hiatus">On Hiatus</option>
          </select>
        </div>

        {/* Age Rating */}
        <div className="space-y-1.5">
          <label htmlFor="age_rating" className="block text-sm font-medium text-foreground">
            Age Rating
          </label>
          <select id="age_rating" name="age_rating" defaultValue="all" className={inputClass}>
            <option value="all">All Ages</option>
            <option value="teen">Teen (13+)</option>
            <option value="mature">Mature (17+)</option>
            <option value="adult">Adult (18+) — explicit content</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Mature and Adult series display a content warning before viewers can proceed.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea id="description" name="description" rows={4} maxLength={2000}
            placeholder="What's your series about?"
            className={`${inputClass} resize-none`} />
        </div>

        {/* Cover URL */}
        <div className="space-y-1.5">
          <label htmlFor="cover_url" className="block text-sm font-medium text-foreground">
            Cover Image URL
          </label>
          <input id="cover_url" name="cover_url" type="url"
            placeholder="https://…"
            className={inputClass} />
          <p className="text-xs text-muted-foreground">Direct link to a cover image (jpg, png, webp).</p>
        </div>

        {/* Genres */}
        <div className="space-y-1.5">
          <label htmlFor="genres" className="block text-sm font-medium text-foreground">
            Genres
          </label>
          <input id="genres" name="genres" type="text"
            placeholder="Action, Fantasy, Romance"
            className={inputClass} />
          <p className="text-xs text-muted-foreground">Comma-separated.</p>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label htmlFor="tags" className="block text-sm font-medium text-foreground">
            Tags
          </label>
          <input id="tags" name="tags" type="text"
            placeholder="magic, isekai, slow-burn"
            className={inputClass} />
          <p className="text-xs text-muted-foreground">Comma-separated.</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Creating…' : 'Create Series'}
          </button>
          <a href="/dashboard/series"
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
