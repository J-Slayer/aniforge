import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EpisodeEditForm from './EpisodeEditForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Episode — Dashboard' }

export default async function EpisodeEditPage({
  params,
}: {
  params: Promise<{ id: string; episodeId: string }>
}) {
  const { id: seriesId, episodeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: seriesRaw } = await supabase
    .from('series')
    .select('creator_id, title, type')
    .eq('id', seriesId)
    .single()

  const series = seriesRaw as any
  if (!series || series.creator_id !== user.id) redirect('/dashboard/series')

  const { data: episodeRaw } = await supabase
    .from('episodes')
    .select('*')
    .eq('id', episodeId)
    .eq('series_id', seriesId)
    .single()

  const episode = episodeRaw as any
  if (!episode) redirect(`/dashboard/series/${seriesId}`)

  const hasVideo = episode.mux_asset_id && !episode.mux_asset_id.startsWith('upload:')
  const isProcessing = episode.mux_asset_id?.startsWith('upload:')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <a href={`/dashboard/series/${seriesId}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← {series.title}
        </a>
        <h1 className="text-2xl font-bold text-foreground mt-2">
          Episode {episode.episode_number}: {episode.title}
        </h1>
      </div>

      {/* Video status */}
      {isProcessing && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <p className="font-medium text-amber-400">Video processing…</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mux is encoding your video. This usually takes 1–5 minutes. Refresh to check.
          </p>
        </div>
      )}
      {hasVideo && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm">
          <p className="font-medium text-green-400">Video ready</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            Playback ID: {episode.mux_playback_id}
          </p>
        </div>
      )}
      {!episode.mux_asset_id && (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          No video uploaded yet.{' '}
          <a href={`/dashboard/series/${seriesId}/episodes/new`}
            className="text-primary hover:underline">
            Upload via new episode form.
          </a>
        </div>
      )}

      <EpisodeEditForm episode={episode} seriesId={seriesId} />
    </div>
  )
}
