'use client'

import { useActionState } from 'react'
import { use } from 'react'
import { createChapterAction } from '../actions'

const inputClass =
  'w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors'

export default function NewChapterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: seriesId } = use(params)
  const boundAction = createChapterAction.bind(null, seriesId)
  const [state, formAction, isPending] = useActionState(boundAction, null)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <a href={`/dashboard/series/${seriesId}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Back to series
        </a>
        <h1 className="text-2xl font-bold text-foreground mt-2">Add Chapter</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create the chapter first, then upload pages on the next screen.
        </p>
      </div>

      {state && 'error' in state && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label htmlFor="chapter_number" className="block text-sm font-medium text-foreground">
              Chapter Number <span className="text-destructive">*</span>
            </label>
            <input id="chapter_number" name="chapter_number" type="number"
              required min={0} step={0.1} placeholder="1" className={inputClass} />
            <p className="text-xs text-muted-foreground">Decimals allowed (e.g. 1.5)</p>
          </div>

          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label htmlFor="access" className="block text-sm font-medium text-foreground">Access</label>
            <select id="access" name="access" defaultValue="free" className={inputClass}>
              <option value="free">Free</option>
              <option value="supporter">Supporter Only</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Title <span className="text-destructive">*</span>
          </label>
          <input id="title" name="title" type="text" required maxLength={200}
            placeholder="Chapter title" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium text-foreground">Description</label>
          <textarea id="description" name="description" rows={3} maxLength={1000}
            placeholder="Optional chapter description"
            className={`${inputClass} resize-none`} />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Creating…' : 'Create Chapter & Upload Pages →'}
          </button>
          <a href={`/dashboard/series/${seriesId}`}
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
