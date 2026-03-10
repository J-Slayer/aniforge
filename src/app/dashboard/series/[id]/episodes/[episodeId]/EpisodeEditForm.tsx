'use client'

import { useActionState, useState, useTransition } from 'react'
import { updateEpisodeAction, toggleEpisodePublishAction, deleteEpisodeAction } from '../actions'

const inputClass =
  'w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors'

export default function EpisodeEditForm({
  episode,
  seriesId,
}: {
  episode: any
  seriesId: string
}) {
  const boundUpdate = updateEpisodeAction.bind(null, seriesId, episode.id)
  const [state, formAction, isPending] = useActionState(boundUpdate, null)
  const [isPublished, setIsPublished] = useState(episode.is_published)
  const [publishPending, startPublishTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()

  function handleTogglePublish() {
    const next = !isPublished
    startPublishTransition(() => {
      ;(async () => {
        const result = await toggleEpisodePublishAction(seriesId, episode.id, next)
        if (!('error' in result)) setIsPublished(next)
      })()
    })
  }

  function handleDelete() {
    if (!confirm('Delete this episode? This cannot be undone.')) return
    startDeleteTransition(() => { void deleteEpisodeAction(seriesId, episode.id) })
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5 rounded-xl border border-border bg-card p-6">
        {state && 'error' in state && (
          <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {state.error}
          </div>
        )}
        {state && 'success' in state && (
          <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            Saved.
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-sm font-medium text-foreground">Title</label>
          <input id="title" name="title" type="text" required maxLength={200}
            defaultValue={episode.title} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="access" className="block text-sm font-medium text-foreground">Access</label>
          <select id="access" name="access" defaultValue={episode.access} className={inputClass}>
            <option value="free">Free</option>
            <option value="supporter">Supporter Only</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium text-foreground">Description</label>
          <textarea id="description" name="description" rows={3} maxLength={1000}
            defaultValue={episode.description ?? ''}
            className={`${inputClass} resize-none`} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="thumbnail_url" className="block text-sm font-medium text-foreground">Thumbnail URL</label>
          <input id="thumbnail_url" name="thumbnail_url" type="url"
            defaultValue={episode.thumbnail_url ?? ''}
            placeholder="https://…" className={inputClass} />
        </div>

        <button type="submit" disabled={isPending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Publish / Delete */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-6 py-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            {isPublished ? 'Published' : 'Draft'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isPublished ? 'Visible to viewers.' : 'Only visible to you.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deletePending}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={handleTogglePublish}
            disabled={publishPending}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${
              isPublished
                ? 'bg-accent text-foreground hover:bg-accent/80 border border-border'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            {publishPending ? '…' : isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}
