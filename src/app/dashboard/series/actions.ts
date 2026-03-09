'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type Result = { error: string } | { success: true }

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function requireCreator() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' as const, user: null, supabase: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'creator' && profile?.role !== 'admin') {
    return { error: 'Forbidden' as const, user: null, supabase: null }
  }

  return { error: null, user, supabase }
}

// ─── Create Series ────────────────────────────────────────────────────────────

export async function createSeriesAction(
  _prevState: Result | null,
  formData: FormData
): Promise<Result> {
  const { error, user, supabase } = await requireCreator()
  if (error || !user || !supabase) return { error: error ?? 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  const type = formData.get('type') as 'anime' | 'manga'
  const status = (formData.get('status') as string) || 'ongoing'
  const age_rating = (formData.get('age_rating') as string) || 'all'
  const description = (formData.get('description') as string)?.trim() || null
  const cover_url = (formData.get('cover_url') as string)?.trim() || null
  const genresRaw = (formData.get('genres') as string)?.trim() || ''
  const tagsRaw = (formData.get('tags') as string)?.trim() || ''

  if (!title) return { error: 'Title is required.' }
  if (!type || (type !== 'anime' && type !== 'manga')) return { error: 'Type must be anime or manga.' }

  const genres = genresRaw ? genresRaw.split(',').map((g) => g.trim()).filter(Boolean) : []
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []

  // Generate a unique slug
  const baseSlug = slugify(title)
  let slug = baseSlug
  let attempt = 0

  while (true) {
    const { data: existing } = await supabase
      .from('series')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!existing) break
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  const { data: series, error: insertError } = await supabase
    .from('series')
    .insert({
      creator_id: user.id,
      title,
      slug,
      type,
      status: status as any,
      age_rating: age_rating as any,
      description,
      banner_url: null,
      cover_url,
      genres,
      tags,
      is_published: false,
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }

  redirect(`/dashboard/series/${series.id}`)
}

// ─── Update Series ────────────────────────────────────────────────────────────

export async function updateSeriesAction(
  seriesId: string,
  _prevState: Result | null,
  formData: FormData
): Promise<Result> {
  const { error, user, supabase } = await requireCreator()
  if (error || !user || !supabase) return { error: error ?? 'Unauthorized' }

  // Verify ownership
  const { data: existing } = await supabase
    .from('series')
    .select('creator_id')
    .eq('id', seriesId)
    .single()

  if (!existing || existing.creator_id !== user.id) return { error: 'Not found.' }

  const title = (formData.get('title') as string)?.trim()
  const status = formData.get('status') as string
  const age_rating = (formData.get('age_rating') as string) || 'all'
  const description = (formData.get('description') as string)?.trim() || null
  const cover_url = (formData.get('cover_url') as string)?.trim() || null
  const genresRaw = (formData.get('genres') as string)?.trim() || ''
  const tagsRaw = (formData.get('tags') as string)?.trim() || ''

  if (!title) return { error: 'Title is required.' }

  const genres = genresRaw ? genresRaw.split(',').map((g) => g.trim()).filter(Boolean) : []
  const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []

  const { error: updateError } = await supabase
    .from('series')
    .update({ title, status: status as any, age_rating: age_rating as any, description, cover_url, genres, tags })
    .eq('id', seriesId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/dashboard/series/${seriesId}`)
  return { success: true }
}

// ─── Toggle Publish ───────────────────────────────────────────────────────────

export async function togglePublishAction(seriesId: string, publish: boolean): Promise<Result> {
  const { error, user, supabase } = await requireCreator()
  if (error || !user || !supabase) return { error: error ?? 'Unauthorized' }

  const { data: existing } = await supabase
    .from('series')
    .select('creator_id')
    .eq('id', seriesId)
    .single()

  if (!existing || existing.creator_id !== user.id) return { error: 'Not found.' }

  const { error: updateError } = await supabase
    .from('series')
    .update({ is_published: publish })
    .eq('id', seriesId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/dashboard/series/${seriesId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Delete Series ────────────────────────────────────────────────────────────

export async function deleteSeriesAction(seriesId: string): Promise<Result> {
  const { error, user, supabase } = await requireCreator()
  if (error || !user || !supabase) return { error: error ?? 'Unauthorized' }

  const { data: existing } = await supabase
    .from('series')
    .select('creator_id')
    .eq('id', seriesId)
    .single()

  if (!existing || existing.creator_id !== user.id) return { error: 'Not found.' }

  const { error: deleteError } = await supabase
    .from('series')
    .delete()
    .eq('id', seriesId)

  if (deleteError) return { error: deleteError.message }

  redirect('/dashboard/series')
}
