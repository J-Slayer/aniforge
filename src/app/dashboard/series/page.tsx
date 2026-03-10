import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Series — Dashboard' }

export default async function DashboardSeriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: seriesList } = await supabase
    .from('series')
    .select('id, title, slug, type, status, is_published, cover_url, total_views, total_episodes, total_chapters, created_at')
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Series</h1>
        <Link
          href="/dashboard/series/new"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          + New Series
        </Link>
      </div>

      {seriesList && seriesList.length > 0 ? (
        <div className="space-y-3">
          {seriesList.map((s) => (
            <div key={s.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
              {/* Cover */}
              <div className="h-16 w-11 rounded-lg bg-accent/60 overflow-hidden flex-shrink-0">
                {s.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                    {s.type === 'anime' ? '▶' : '📖'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {s.type} · {s.status} ·{' '}
                  {s.type === 'anime'
                    ? `${s.total_episodes} ep`
                    : `${s.total_chapters} ch`}
                  {' · '}
                  {s.total_views.toLocaleString()} views
                </p>
              </div>

              {/* Status badge */}
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                s.is_published
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-accent text-muted-foreground'
              }`}>
                {s.is_published ? 'Live' : 'Draft'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {s.is_published && (
                  <Link
                    href={`/series/${s.slug}`}
                    target="_blank"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View
                  </Link>
                )}
                <Link
                  href={`/dashboard/series/${s.id}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <p className="text-sm font-medium text-foreground mb-1">No series yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first anime or manga series to get started.
          </p>
          <Link
            href="/dashboard/series/new"
            className="text-sm text-primary hover:underline font-medium"
          >
            Create your first series →
          </Link>
        </div>
      )}
    </div>
  )
}
