import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*, creator_profiles(*)')
    .eq('id', user!.id)
    .single()

  const profile = profileRaw as any
  const creatorProfile = profile?.creator_profiles

  // Stats
  const { data: seriesList } = await supabase
    .from('series')
    .select('id, title, slug, type, is_published, total_views, total_episodes, total_chapters, cover_url')
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: false })

  const { count: subscriberCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user!.id)
    .eq('status', 'active')

  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user!.id)

  const publishedSeries = seriesList?.filter((s) => s.is_published) ?? []
  const draftSeries = seriesList?.filter((s) => !s.is_published) ?? []

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.display_name ?? profile?.username}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here&apos;s your creator overview.
          </p>
        </div>
        <Link
          href="/dashboard/series/new"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
        >
          + New Series
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Series', value: seriesList?.length ?? 0 },
          { label: 'Published', value: publishedSeries.length },
          { label: 'Subscribers', value: subscriberCount ?? 0 },
          { label: 'Followers', value: followerCount ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-2xl font-extrabold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Stripe Connect prompt — show if not yet onboarded */}
      {!creatorProfile?.stripe_onboarding_complete && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">
              Set up payouts to start earning
            </p>
            <p className="text-xs text-muted-foreground">
              Connect your Stripe account to receive monthly supporter payments directly.
            </p>
          </div>
          <Link
            href="/dashboard/earnings"
            className="flex-shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Set up payouts
          </Link>
        </div>
      )}

      {/* Published series */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Published Series</h2>
          <Link href="/dashboard/series" className="text-sm text-primary hover:underline">
            Manage all
          </Link>
        </div>

        {publishedSeries.length > 0 ? (
          <div className="space-y-3">
            {publishedSeries.slice(0, 5).map((s) => (
              <SeriesRow key={s.id} series={s} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">No published series yet.</p>
            <Link
              href="/dashboard/series/new"
              className="text-sm text-primary hover:underline font-medium"
            >
              Create your first series →
            </Link>
          </div>
        )}
      </section>

      {/* Draft series */}
      {draftSeries.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-foreground mb-4">Drafts</h2>
          <div className="space-y-3">
            {draftSeries.map((s) => (
              <SeriesRow key={s.id} series={s} isDraft />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Series Row ──────────────────────────────────────────────────────────────

function SeriesRow({
  series,
  isDraft = false,
}: {
  series: any
  isDraft?: boolean
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-border/80 transition-colors">
      {/* Cover thumbnail */}
      <div className="h-14 w-10 rounded-lg bg-accent/60 overflow-hidden flex-shrink-0">
        {series.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={series.cover_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{series.title}</p>
        <p className="text-xs text-muted-foreground capitalize mt-0.5">
          {series.type} ·{' '}
          {series.type === 'anime'
            ? `${series.total_episodes} episodes`
            : `${series.total_chapters} chapters`}
          {' · '}
          {series.total_views.toLocaleString()} views
        </p>
      </div>

      {/* Status badge */}
      <span
        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          isDraft
            ? 'bg-accent text-muted-foreground'
            : 'bg-primary/10 text-primary border border-primary/20'
        }`}
      >
        {isDraft ? 'Draft' : 'Live'}
      </span>

      {/* Edit link */}
      <Link
        href={`/dashboard/series/${series.id}`}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Edit →
      </Link>
    </div>
  )
}
