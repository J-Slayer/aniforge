'use client'

import { useActionState } from 'react'
import { updateSeriesAction } from '../actions'
import type { Series } from '@/types'

const inputClass =
  'w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors'

export default function SeriesEditForm({ series }: { series: Series }) {
  const boundAction = updateSeriesAction.bind(null, series.id)
  const [state, formAction, isPending] = useActionState(boundAction, null)

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-border bg-card p-6">
      {state && 'error' in state && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {state.error}
        </div>
      )}
      {state && 'success' in state && (
        <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Saved successfully.
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="block text-sm font-medium text-foreground">Title</label>
        <input id="title" name="title" type="text" required maxLength={200}
          defaultValue={series.title} className={inputClass} />
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <label htmlFor="status" className="block text-sm font-medium text-foreground">Status</label>
        <select id="status" name="status" defaultValue={series.status} className={inputClass}>
          <option value="ongoing">Ongoing</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="hiatus">On Hiatus</option>
        </select>
      </div>

      {/* Age Rating */}
      <div className="space-y-1.5">
        <label htmlFor="age_rating" className="block text-sm font-medium text-foreground">Age Rating</label>
        <select id="age_rating" name="age_rating" defaultValue={series.age_rating ?? 'all'} className={inputClass}>
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
        <label htmlFor="description" className="block text-sm font-medium text-foreground">Description</label>
        <textarea id="description" name="description" rows={4} maxLength={2000}
          defaultValue={series.description ?? ''}
          className={`${inputClass} resize-none`} />
      </div>

      {/* Cover URL */}
      <div className="space-y-1.5">
        <label htmlFor="cover_url" className="block text-sm font-medium text-foreground">Cover Image URL</label>
        <input id="cover_url" name="cover_url" type="url"
          defaultValue={series.cover_url ?? ''}
          placeholder="https://…" className={inputClass} />
      </div>

      {/* Genres */}
      <div className="space-y-1.5">
        <label htmlFor="genres" className="block text-sm font-medium text-foreground">Genres</label>
        <input id="genres" name="genres" type="text"
          defaultValue={series.genres.join(', ')}
          placeholder="Action, Fantasy" className={inputClass} />
        <p className="text-xs text-muted-foreground">Comma-separated.</p>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label htmlFor="tags" className="block text-sm font-medium text-foreground">Tags</label>
        <input id="tags" name="tags" type="text"
          defaultValue={series.tags.join(', ')}
          placeholder="magic, isekai" className={inputClass} />
        <p className="text-xs text-muted-foreground">Comma-separated.</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
