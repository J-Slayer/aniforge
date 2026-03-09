import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SeriesEditForm from './SeriesEditForm'
import PublishToggle from './PublishToggle'
import ContentList from './ContentList'
import type { Series } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Series — Dashboard' }

export default async function SeriesEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: seriesRaw } = await supabase
    .from('series')
    .select('*')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!seriesRaw) redirect('/dashboard/series')
  const series = seriesRaw as unknown as Series

  // Fetch episodes or chapters depending on type
  const { data: episodes } = series.type === 'anime'
    ? await supabase
        .from('episodes')
        .select('id, title, episode_number, is_published, view_count, duration_seconds, access')
        .eq('series_id', id)
        .order('episode_number', { ascending: true })
    : { data: null }

  const { data: chapters } = series.type === 'manga'
    ? await supabase
        .from('chapters')
        .select('id, title, chapter_number, is_published, view_count, page_count, access')
        .eq('series_id', id)
        .order('chapter_number', { ascending: true })
    : { data: null }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a href="/dashboard/series" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← My Series
            </a>
          </div>
          <h1 className="text-2xl font-bold text-foreground truncate">{series.title}</h1>
          <p className="text-sm text-muted-foreground capitalize mt-0.5">
            {series.type} · /series/{series.slug}
          </p>
        </div>
        <PublishToggle seriesId={series.id} isPublished={series.is_published} />
      </div>

      {/* Edit form */}
      <section>
        <h2 className="text-base font-bold text-foreground mb-4">Details</h2>
        <SeriesEditForm series={series} />
      </section>

      {/* Content management */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">
            {series.type === 'anime' ? 'Episodes' : 'Chapters'}
          </h2>
          <a
            href={`/dashboard/series/${id}/${series.type === 'anime' ? 'episodes' : 'chapters'}/new`}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            + Add {series.type === 'anime' ? 'Episode' : 'Chapter'}
          </a>
        </div>
        <ContentList
          seriesId={id}
          type={series.type}
          episodes={episodes ?? []}
          chapters={chapters ?? []}
        />
      </section>
    </div>
  )
}
