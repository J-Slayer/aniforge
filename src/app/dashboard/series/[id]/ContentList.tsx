'use client'

type Episode = {
  id: string
  title: string
  episode_number: number
  is_published: boolean
  view_count: number
  duration_seconds: number | null
  access: string
}

type Chapter = {
  id: string
  title: string
  chapter_number: number
  is_published: boolean
  view_count: number
  page_count: number
  access: string
}

export default function ContentList({
  seriesId,
  type,
  episodes,
  chapters,
}: {
  seriesId: string
  type: 'anime' | 'manga'
  episodes: Episode[]
  chapters: Chapter[]
}) {
  const items = type === 'anime' ? episodes : chapters

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          No {type === 'anime' ? 'episodes' : 'chapters'} yet.
        </p>
        <a
          href={`/dashboard/series/${seriesId}/${type === 'anime' ? 'episodes' : 'chapters'}/new`}
          className="text-sm text-primary hover:underline font-medium"
        >
          Add your first {type === 'anime' ? 'episode' : 'chapter'} →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {type === 'anime'
        ? episodes.map((ep) => (
            <div key={ep.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-xs font-mono text-muted-foreground w-8 flex-shrink-0">
                #{ep.episode_number}
              </span>
              <p className="flex-1 text-sm font-medium text-foreground truncate">{ep.title}</p>
              {ep.duration_seconds && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {Math.floor(ep.duration_seconds / 60)}m
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                ep.access === 'supporter'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-accent text-muted-foreground'
              }`}>
                {ep.access === 'supporter' ? 'Supporter' : 'Free'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                ep.is_published
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-accent text-muted-foreground'
              }`}>
                {ep.is_published ? 'Live' : 'Draft'}
              </span>
              <a
                href={`/dashboard/series/${seriesId}/episodes/${ep.id}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                Edit
              </a>
            </div>
          ))
        : chapters.map((ch) => (
            <div key={ch.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-xs font-mono text-muted-foreground w-8 flex-shrink-0">
                #{ch.chapter_number}
              </span>
              <p className="flex-1 text-sm font-medium text-foreground truncate">{ch.title}</p>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {ch.page_count}p
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                ch.access === 'supporter'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-accent text-muted-foreground'
              }`}>
                {ch.access === 'supporter' ? 'Supporter' : 'Free'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                ch.is_published
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-accent text-muted-foreground'
              }`}>
                {ch.is_published ? 'Live' : 'Draft'}
              </span>
              <a
                href={`/dashboard/series/${seriesId}/chapters/${ch.id}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                Edit
              </a>
            </div>
          ))}
    </div>
  )
}
