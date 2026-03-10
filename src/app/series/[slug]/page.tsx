import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AgeGate from './AgeGate'
import type { Series } from '@/types'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

type SeriesWithCreator = Series & {
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('series').select('title, description').eq('slug', slug).single()
  const row = data as unknown as Pick<Series, 'title' | 'description'> | null
  if (!row) return { title: 'Series Not Found' }
  return {
    title: row.title,
    description: row.description ?? undefined,
  }
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: seriesRaw } = await supabase
    .from('series')
    .select('*, profiles!series_creator_id_fkey(username, display_name, avatar_url)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!seriesRaw) notFound()
  const series = seriesRaw as unknown as SeriesWithCreator

  const creator = series.profiles

  // Fetch episodes or chapters
  const { data: episodesRaw } = series.type === 'anime'
    ? await supabase
        .from('episodes')
        .select('id, title, episode_number, description, thumbnail_url, duration_seconds, access, view_count, published_at')
        .eq('series_id', series.id)
        .eq('is_published', true)
        .order('episode_number', { ascending: true })
    : { data: null }

  const { data: chaptersRaw } = series.type === 'manga'
    ? await supabase
        .from('chapters')
        .select('id, title, chapter_number, description, cover_url, page_count, access, view_count, published_at')
        .eq('series_id', series.id)
        .eq('is_published', true)
        .order('chapter_number', { ascending: true })
    : { data: null }

  type EpisodeRow = { id: string; title: string; episode_number: number; description: string | null; thumbnail_url: string | null; duration_seconds: number | null; access: string; view_count: number; published_at: string | null }
  type ChapterRow = { id: string; title: string; chapter_number: number; description: string | null; cover_url: string | null; page_count: number; access: string; view_count: number; published_at: string | null }

  const episodes = episodesRaw as unknown as EpisodeRow[] | null
  const chapters = chaptersRaw as unknown as ChapterRow[] | null

  const statusColors: Record<string, string> = {
    ongoing: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    hiatus: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    upcoming: 'bg-primary/10 text-primary border-primary/20',
  }

  const ageRatingBadge: Record<string, string> = {
    teen: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    mature: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    adult: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <AgeGate rating={series.age_rating ?? 'all'}>
    <div className="min-h-screen bg-background">
      {/* Hero / Cover banner */}
      <div className="relative h-48 sm:h-64 bg-accent/30 overflow-hidden">
        {series.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={series.banner_url} alt="" className="w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-16 relative">
        <div className="flex gap-6 items-end mb-6">
          {/* Cover */}
          <div className="h-36 w-24 sm:h-44 sm:w-30 rounded-xl border-2 border-border bg-accent/60 overflow-hidden flex-shrink-0 shadow-xl">
            {series.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={series.cover_url} alt={series.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-2xl">
                {series.type === 'anime' ? '▶' : '📖'}
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div className="pb-2 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full capitalize bg-accent text-muted-foreground border border-border">
                {series.type}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize border ${statusColors[series.status] ?? ''}`}>
                {series.status}
              </span>
              {series.age_rating && series.age_rating !== 'all' && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${ageRatingBadge[series.age_rating] ?? ''}`}>
                  {series.age_rating === 'teen' ? '13+' : series.age_rating === 'mature' ? '17+' : '18+'}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-2">
              {series.title}
            </h1>
            {creator && (
              <Link
                href={`/creator/${creator.username}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                by {creator.display_name ?? creator.username}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {series.description && (
              <section>
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">About</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {series.description}
                </p>
              </section>
            )}

            {/* Episode / Chapter list */}
            <section>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">
                {series.type === 'anime' ? 'Episodes' : 'Chapters'}
                <span className="ml-2 text-muted-foreground font-normal normal-case">
                  ({episodes?.length ?? chapters?.length ?? 0})
                </span>
              </h2>

              {series.type === 'anime' && episodes ? (
                <div className="space-y-2">
                  {episodes.map((ep) => (
                    <Link
                      key={ep.id}
                      href={`/watch/${ep.id}`}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors group"
                    >
                      {/* Thumbnail */}
                      <div className="h-14 w-24 rounded-lg bg-accent/60 overflow-hidden flex-shrink-0">
                        {ep.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ep.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-lg">▶</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Episode {ep.episode_number}</p>
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {ep.title}
                        </p>
                        {ep.duration_seconds && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {Math.floor(ep.duration_seconds / 60)}m {ep.duration_seconds % 60}s
                          </p>
                        )}
                      </div>
                      {ep.access === 'supporter' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                          Supporter
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : series.type === 'manga' && chapters ? (
                <div className="space-y-2">
                  {chapters.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/read/${ch.id}`}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/30 transition-colors group"
                    >
                      <span className="text-xs font-mono text-muted-foreground w-10 flex-shrink-0">
                        Ch.{ch.chapter_number}
                      </span>
                      <p className="flex-1 text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {ch.title}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{ch.page_count}p</span>
                      {ch.access === 'supporter' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
                          Supporter
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No content yet.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Stats */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium text-foreground">{series.total_views.toLocaleString()}</span>
                </div>
                {series.type === 'anime' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Episodes</span>
                    <span className="font-medium text-foreground">{series.total_episodes}</span>
                  </div>
                )}
                {series.type === 'manga' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Chapters</span>
                    <span className="font-medium text-foreground">{series.total_chapters}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Genres */}
            {series.genres.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {series.genres.map((g) => (
                    <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-accent text-muted-foreground border border-border">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {series.tags.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {series.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-accent/50 text-muted-foreground">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Creator card */}
            {creator && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Creator</h3>
                <Link href={`/creator/${creator.username}`} className="flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {creator.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={creator.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary uppercase">
                        {creator.username.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {creator.display_name ?? creator.username}
                    </p>
                    <p className="text-xs text-muted-foreground">@{creator.username}</p>
                  </div>
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
    </AgeGate>
  )
}
