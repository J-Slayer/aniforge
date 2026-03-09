'use client'

import { useState, useTransition } from 'react'
import { togglePublishAction } from '../actions'

export default function PublishToggle({
  seriesId,
  isPublished,
}: {
  seriesId: string
  isPublished: boolean
}) {
  const [published, setPublished] = useState(isPublished)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !published
    startTransition(async () => {
      const result = await togglePublishAction(seriesId, next)
      if (!('error' in result)) setPublished(next)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        published
          ? 'bg-accent text-foreground hover:bg-accent/80 border border-border'
          : 'bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20'
      }`}
    >
      {isPending ? '…' : published ? 'Unpublish' : 'Publish'}
    </button>
  )
}
