import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

function getAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const minAgeForRating: Record<string, number> = { all: 0, teen: 13, mature: 17, adult: 18 }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('episodes').select('title').eq('id', id).single()
  const ep = data as any
  return { title: ep?.title ? `${ep.title} — AniForge` : 'Watch — AniForge' }
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch episode + series
  const { data: epRaw } = await supabase
    .from('episodes')
    .select('*, series!inner(id, title, slug, age_rating, cover_url, total_episodes, profiles!series_creator_id_fkey(username, display_name))')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!epRaw) notFound()
  const ep = epRaw as any
  const series = ep.series

  // Age check
  const requiredAge = minAgeForRating[series.age_rating ?? 'all'] ?? 0
  if (requiredAge > 0) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: p } = await supabase
        .from('profiles').select('date_of_birth').eq('id', user.id).single()
      const profile = p as any
      const viewerAge = profile?.date_of_birth ? getAge(profile.date_of_birth) : 0
      if (viewerAge < requiredAge) redirect(`/series/${series.slug}`)
    }
    // Guests: we don't block here (they clicked through the series page gate already)
  }

  // Prev / next episodes
  const { data: siblingRaw } = await supabase
    .from('episodes')
    .select('id, episode_number, title')
    .eq('series_id', series.id)
    .eq('is_published', true)
    .order('episode_number', { ascending: true })

  const siblings = (siblingRaw ?? []) as any[]
  const currentIdx = siblings.findIndex((e) => e.id === id)
  const prevEp = currentIdx > 0 ? siblings[currentIdx - 1] : null
  const nextEp = currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null

  const durationStr = ep.duration_seconds
    ? `${Math.floor(ep.duration_seconds / 60)}m ${ep.duration_seconds % 60}s`
    : null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link href={`/series/${series.slug}`} className="hover:text-primary transition-colors">
            {series.title}
          </Link>
          <span>/</span>
          <span className="text-foreground">Episode {ep.episode_number}</span>
        </div>

        {/* Video player */}
        <div className="rounded-2xl overflow-hidden bg-black aspect-video mb-6 flex items-center justify-center border border-border">
          {ep.video_url ? (
            <video
              src={ep.video_url}
              controls
              className="w-full h-full"
              poster={ep.thumbnail_url ?? undefined}
            />
          ) : (
            <div className="text-center text-muted-foreground px-8">
              <p className="text-5xl mb-4">▶</p>
              <p className="text-sm font-medium">Video not yet available</p>
              <p className="text-xs mt-1 opacity-60">The creator hasn&apos;t uploaded this episode yet.</p>
            </div>
          )}
        </div>

        {/* Episode info */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Episode {ep.episode_number}{durationStr ? ` · ${durationStr}` : ''}
            </p>
            <h1 className="text-xl font-bold text-foreground">{ep.title}</h1>
            {ep.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                {ep.description}
              </p>
            )}
          </div>

          {ep.access === 'supporter' && (
            <span className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              Supporter Only
            </span>
          )}
        </div>

        {/* Prev / Next navigation */}
        <div className="flex gap-3 mb-10">
          {prevEp ? (
            <Link
              href={`/watch/${prevEp.id}`}
              className="flex-1 flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors group"
            >
              <span className="text-muted-foreground">←</span>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Previous</p>
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  Ep {prevEp.episode_number}: {prevEp.title}
                </p>
              </div>
            </Link>
          ) : <div className="flex-1" />}

          {nextEp ? (
            <Link
              href={`/watch/${nextEp.id}`}
              className="flex-1 flex items-center justify-end gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors group text-right"
            >
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Next</p>
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  Ep {nextEp.episode_number}: {nextEp.title}
                </p>
              </div>
              <span className="text-muted-foreground flex-shrink-0">→</span>
            </Link>
          ) : <div className="flex-1" />}
        </div>

        {/* Back to series */}
        <div className="border-t border-border pt-6">
          <Link
            href={`/series/${series.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to {series.title}
          </Link>
        </div>
      </div>
    </div>
  )
}
