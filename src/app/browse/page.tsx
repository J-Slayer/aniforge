import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import type { Metadata } from 'next'
import type { AgeRating } from '@/types'

export const metadata: Metadata = { title: 'Browse — AniForge' }

type SearchParams = Promise<{ type?: string; sort?: string }>
type Props = { searchParams: SearchParams }

function getAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// Returns which age ratings this viewer is allowed to see
function allowedRatings(viewerAge: number | null): AgeRating[] {
  if (viewerAge === null) return ['all', 'teen', 'mature'] // guests: no adult
  if (viewerAge >= 18) return ['all', 'teen', 'mature', 'adult']
  if (viewerAge >= 17) return ['all', 'teen', 'mature']
  if (viewerAge >= 13) return ['all', 'teen']
  return ['all']
}

const ratingBadge: Record<string, string> = {
  teen: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  mature: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  adult: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const ratingLabel: Record<string, string> = {
  teen: '13+', mature: '17+', adult: '18+',
}

export default async function BrowsePage({ searchParams }: Props) {
  const { type, sort } = await searchParams
  const supabase = await createClient()

  // Viewer age
  let viewerAge: number | null = null
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: p } = await supabase
      .from('profiles').select('date_of_birth').eq('id', user.id).single()
    const profile = p as any
    if (profile?.date_of_birth) viewerAge = getAge(profile.date_of_birth)
  }

  const ratings = allowedRatings(viewerAge)

  // Build query
  let query = supabase
    .from('series')
    .select('id, slug, title, cover_url, type, status, age_rating, total_views, total_episodes, total_chapters, profiles!series_creator_id_fkey(username, display_name)')
    .eq('is_published', true)
    .in('age_rating', ratings)

  if (type === 'anime' || type === 'manga') query = query.eq('type', type)

  if (sort === 'popular') {
    query = query.order('total_views', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data } = await query.limit(60)
  const series = (data ?? []) as any[]

  const activeTab = type ?? 'all'
  const activeSort = sort ?? 'newest'

  const tabClass = (val: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      activeTab === val
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`

  const sortClass = (val: string) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
      activeSort === val
        ? 'border-primary/50 bg-primary/10 text-primary'
        : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
    }`

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground mb-1">Browse</h1>
          <p className="text-sm text-muted-foreground">
            Discover indie anime &amp; manga from independent creators.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {/* Type tabs */}
          <div className="flex items-center gap-2">
            <Link href="/browse" className={tabClass('all')}>All</Link>
            <Link href="/browse?type=anime" className={tabClass('anime')}>Anime</Link>
            <Link href="/browse?type=manga" className={tabClass('manga')}>Manga</Link>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Sort:</span>
            <Link
              href={type ? `/browse?type=${type}&sort=newest` : '/browse?sort=newest'}
              className={sortClass('newest')}
            >
              Newest
            </Link>
            <Link
              href={type ? `/browse?type=${type}&sort=popular` : '/browse?sort=popular'}
              className={sortClass('popular')}
            >
              Most Viewed
            </Link>
          </div>
        </div>

        {/* Grid */}
        {series.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-muted-foreground">No series found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {series.map((s) => {
              const creator = s.profiles
              const count = s.type === 'anime' ? s.total_episodes : s.total_chapters
              const unit = s.type === 'anime' ? 'ep' : 'ch'

              return (
                <Link
                  key={s.id}
                  href={`/series/${s.slug}`}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors"
                >
                  {/* Cover */}
                  <div className="relative aspect-[3/4] bg-accent/60 overflow-hidden">
                    {s.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.cover_url}
                        alt={s.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-3xl">
                        {s.type === 'anime' ? '▶' : '📖'}
                      </div>
                    )}
                    {/* Age badge overlay */}
                    {s.age_rating && s.age_rating !== 'all' && (
                      <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${ratingBadge[s.age_rating] ?? ''}`}>
                        {ratingLabel[s.age_rating]}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate group-hover:text-primary transition-colors mb-1">
                      {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {creator?.display_name ?? creator?.username ?? 'Unknown'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground capitalize">{s.type}</span>
                      {count > 0 && (
                        <span className="text-[10px] text-muted-foreground">{count} {unit}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Guest adult content note */}
        {!user && (
          <p className="mt-10 text-center text-xs text-muted-foreground">
            Adult (18+) content is hidden.{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Create an account
            </Link>{' '}
            to access age-verified content.
          </p>
        )}
      </div>
    </div>
  )
}
