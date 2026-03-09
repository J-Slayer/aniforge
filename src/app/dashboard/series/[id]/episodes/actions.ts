'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type Result = { error: string } | { success: true }

async function requireCreatorOwningSeries(seriesId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' as const, user: null, supabase: null }

  const { data: series } = await supabase
    .from('series')
    .select('creator_id, type')
    .eq('id', seriesId)
    .single()

  const s = series as any
  if (!s || s.creator_id !== user.id) return { error: 'Not found.' as const, user: null, supabase: null }

  return { error: null, user, supabase, series: s }
}

// ─── Create Episode ───────────────────────────────────────────────────────────

export async function createEpisodeAction(
  seriesId: string,
  _prevState: Result | null,
  formData: FormData
): Promise<Result> {
  const { error, user, supabase } = await requireCreatorOwningSeries(seriesId)
  if (error || !user || !supabase) return { error: error ?? 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  const episode_number = parseInt(formData.get('episode_number') as string, 10)
  const description = (formData.get('description') as string)?.trim() || null
  const access = (formData.get('access') as string) || 'free'
  const thumbnail_url = (formData.get('thumbnail_url') as string)?.trim() || null
  const mux_upload_id = (formData.get('mux_upload_id') as string)?.trim() || null

  if (!title) return { error: 'Title is required.' }
  if (isNaN(episode_number) || episode_number < 1) return { error: 'Episode number must be a positive number.' }

  const { data: ep, error: insertError } = await supabase
    .from('episodes')
    .insert({
      series_id: seriesId,
      title,
      episode_number,
      description,
      access: access as any,
      thumbnail_url,
      mux_asset_id: null,
      mux_playback_id: null,
      duration_seconds: null,
      scheduled_at: null,
      published_at: null,
      is_published: false,
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }

  // Store the mux_upload_id temporarily in mux_asset_id until webhook updates it
  // (We'll use a dedicated field or just treat it as pending)
  if (mux_upload_id && ep) {
    await supabase
      .from('episodes')
      .update({ mux_asset_id: `upload:${mux_upload_id}` })
      .eq('id', (ep as any).id)
  }

  redirect(`/dashboard/series/${seriesId}/episodes/${(ep as any).id}`)
}

// ─── Update Episode ───────────────────────────────────────────────────────────

export async function updateEpisodeAction(
  seriesId: string,
  episodeId: string,
  _prevState: Result | null,
  formData: FormData
): Promise<Result> {
  const { error, supabase } = await requireCreatorOwningSeries(seriesId)
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const access = formData.get('access') as string
  const thumbnail_url = (formData.get('thumbnail_url') as string)?.trim() || null

  if (!title) return { error: 'Title is required.' }

  const { error: updateError } = await supabase
    .from('episodes')
    .update({ title, description, access: access as any, thumbnail_url })
    .eq('id', episodeId)
    .eq('series_id', seriesId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/dashboard/series/${seriesId}/episodes/${episodeId}`)
  return { success: true }
}

// ─── Save Mux Upload ID ───────────────────────────────────────────────────────

export async function saveMuxUploadAction(
  seriesId: string,
  episodeId: string,
  muxUploadId: string
): Promise<Result> {
  const { error, supabase } = await requireCreatorOwningSeries(seriesId)
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const { error: updateError } = await supabase
    .from('episodes')
    .update({ mux_asset_id: `upload:${muxUploadId}` })
    .eq('id', episodeId)
    .eq('series_id', seriesId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/dashboard/series/${seriesId}/episodes/${episodeId}`)
  return { success: true }
}

// ─── Toggle Episode Publish ───────────────────────────────────────────────────

export async function toggleEpisodePublishAction(
  seriesId: string,
  episodeId: string,
  publish: boolean
): Promise<Result> {
  const { error, supabase } = await requireCreatorOwningSeries(seriesId)
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const { error: updateError } = await supabase
    .from('episodes')
    .update({
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq('id', episodeId)
    .eq('series_id', seriesId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/dashboard/series/${seriesId}`)
  return { success: true }
}

// ─── Delete Episode ───────────────────────────────────────────────────────────

export async function deleteEpisodeAction(seriesId: string, episodeId: string): Promise<Result> {
  const { error, supabase } = await requireCreatorOwningSeries(seriesId)
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const { error: deleteError } = await supabase
    .from('episodes')
    .delete()
    .eq('id', episodeId)
    .eq('series_id', seriesId)

  if (deleteError) return { error: deleteError.message }

  redirect(`/dashboard/series/${seriesId}`)
}
