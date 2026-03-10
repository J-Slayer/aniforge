import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import FollowButton from './FollowButton'
import type { Metadata } from 'next'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} — Creator`,
  }
}

export default async function CreatorProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  // Fetch profile + creator_profiles in one query
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*, creator_profiles(*)')
    .eq('username', username)
    .in('role', ['creator', 'admin'])
    .single()

  if (!profileRaw) notFound()
  const profile = profileRaw as any
  const creatorProfile = profile.creator_profiles

  // Fetch their published series
  const { data: seriesRaw } = await supabase
    .from('series')
    .select('id, title, slug, cover_url, type, status, total_views, total_episodes, total_chapters')
    .eq('creator_id', profile.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  const series = seriesRaw as any[]

  // Follower count
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', profile.id)

  const animeSeries = series?.filter((s) => s.type === 'anime') ?? []
  const mangaSeries = series?.filter((s) => s.type === 'manga') ?? []

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-primary/20 via-accent to-background overflow-hidden">
        {creatorProfile?.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creatorProfile.banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      {/* Profile header */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative -mt-16 mb-6 flex items-end justify-between gap-4">
          {/* Avatar */}
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-background bg-card overflow-hidden flex-shrink-0 shadow-xl">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl font-extrabold text-primary uppercase">
                  {profile.username.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Follow button — only for other users */}
          <div className="pb-1">
            <FollowButton creatorId={profile.id} />
          </div>
        </div>

        {/* Name + stats */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {profile.display_name ?? profile.username}
          </h1>
          <p className="text-sm text-muted-foreground mb-3">@{profile.username}</p>

          {/* Stats row */}
          <div className="flex items-center gap-5 mb-4">
            <div>
              <span className="text-sm font-bold text-foreground">{followerCount ?? 0}</span>
              <span className="text-sm text-muted-foreground ml-1">followers</span>
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">{series?.length ?? 0}</span>
              <span className="text-sm text-muted-foreground ml-1">series</span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-foreground leading-relaxed max-w-xl mb-4">
              {profile.bio}
            </p>
          )}

          {/* Social links */}
          {creatorProfile && (
            <div className="flex flex-wrap gap-3">
              {creatorProfile.website_url && (
                <a href={creatorProfile.website_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-medium">
                  Website ↗
                </a>
              )}
              {creatorProfile.twitter_url && (
                <a href={creatorProfile.twitter_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-medium">
                  Twitter ↗
                </a>
              )}
              {creatorProfile.youtube_url && (
                <a href={creatorProfile.youtube_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-medium">
                  YouTube ↗
                </a>
              )}
              {creatorProfile.instagram_url && (
                <a href={creatorProfile.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-medium">
                  Instagram ↗
                </a>
              )}
            </div>
          )}
        </div>

        {/* Anime Series */}
        {animeSeries.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-bold text-foreground mb-4">Anime Series</h2>
            <SeriesGrid series={animeSeries} />
          </section>
        )}

        {/* Manga Series */}
        {mangaSeries.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-bold text-foreground mb-4">Manga Series</h2>
            <SeriesGrid series={mangaSeries} />
          </section>
        )}

        {/* Empty state */}
        {series?.length === 0 && (
          <div className="py-16 text-center rounded-xl border border-border bg-card mb-10">
            <p className="text-sm text-muted-foreground">
              No published series yet — check back soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Series Grid ─────────────────────────────────────────────────────────────

function SeriesGrid({ series }: { series: any[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {series.map((s) => (
        <a key={s.id} href={`/series/${s.slug}`} className="group">
          <div className="rounded-xl overflow-hidden border border-border bg-card transition-all group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10">
            {/* Cover */}
            <div className="aspect-[3/4] bg-accent/60 overflow-hidden">
              {s.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.cover_url}
                  alt={s.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-3xl text-muted-foreground/30 font-bold">
                    {s.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-3">
              <p className="text-xs font-semibold text-foreground truncate">{s.title}</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                {s.status} · {s.type === 'anime' ? `${s.total_episodes} ep` : `${s.total_chapters} ch`}
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
