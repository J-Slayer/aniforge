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
    .select('creator_id')
    .eq('id', seriesId)
    .single()

  const s = series as any
  if (!s || s.creator_id !== user.id) return { error: 'Not found.' as const, user: null, supabase: null }

  return { error: null, user, supabase }
}

// ─── Create Chapter ───────────────────────────────────────────────────────────

export async function createChapterAction(
  seriesId: string,
  _prevState: Result | null,
  formData: FormData
): Promise<Result> {
  const { error, user, supabase } = await requireCreatorOwningSeries(seriesId)
  if (error || !user || !supabase) return { error: error ?? 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  const chapter_number = parseFloat(formData.get('chapter_number') as string)
  const description = (formData.get('description') as string)?.trim() || null
  const access = (formData.get('access') as string) || 'free'

  if (!title) return { error: 'Title is required.' }
  if (isNaN(chapter_number) || chapter_number < 0) return { error: 'Chapter number must be a positive number.' }

  const { data: ch, error: insertError } = await supabase
    .from('chapters')
    .insert({
      series_id: seriesId,
      title,
      chapter_number,
      description,
      access: access as any,
      cover_url: null,
      page_count: 0,
      scheduled_at: null,
      published_at: null,
      is_published: false,
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }

  redirect(`/dashboard/series/${seriesId}/chapters/${(ch as any).id}`)
}

// ─── Update Chapter ───────────────────────────────────────────────────────────

export async function updateChapterAction(
  seriesId: string,
  chapterId: string,
  _prevState: Result | null,
  formData: FormData
): Promise<Result> {
  const { error, supabase } = await requireCreatorOwningSeries(seriesId)
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const access = formData.get('access') as string

  if (!title) return { error: 'Title is required.' }

  const { error: updateError } = await supabase
    .from('chapters')
    .update({ title, description, access: access as any })
    .eq('id', chapterId)
    .eq('series_id', seriesId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/dashboard/series/${seriesId}/chapters/${chapterId}`)
  return { success: true }
}

// ─── Add Page ─────────────────────────────────────────────────────────────────

export async function addPageAction(
  seriesId: string,
  chapterId: string,
  imageUrl: string,
  pageNumber: number
): Promise<Result> {
  const { error, supabase } = await requireCreatorOwningSeries(seriesId)
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const { error: insertError } = await supabase
    .from('chapter_pages')
    .insert({ chapter_id: chapterId, page_number: pageNumber, image_url: imageUrl })

  if (insertError) return { error: insertError.message }

  // Update page_count
  const { data: pages } = await supabase
    .from('chapter_pages')
    .select('id', { count: 'exact' })
    .eq('chapter_id', chapterId)

  await supabase
    .from('chapters')
    .update({ page_count: (pages as any[])?.length ?? pageNumber })
    .eq('id', chapterId)

  revalidatePath(`/dashboard/series/${seriesId}/chapters/${chapterId}`)
  return { success: true }
}

// ─── Delete Page ──────────────────────────────────────────────────────────────

export async function deletePageAction(
  seriesId: string,
  chapterId: string,
  pageId: string
): Promise<Result> {
  const { error, supabase } = await requireCreatorOwningSeries(seriesId)
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const { error: deleteError } = await supabase
    .from('chapter_pages')
    .delete()
    .eq('id', pageId)
    .eq('chapter_id', chapterId)

  if (deleteError) return { error: deleteError.message }

  // Reorder remaining pages and update count
  const { data: remaining } = await supabase
    .from('chapter_pages')
    .select('id')
    .eq('chapter_id', chapterId)
    .order('page_number', { ascending: true })

  await supabase
    .from('chapters')
    .update({ page_count: (remaining as any[])?.length ?? 0 })
    .eq('id', chapterId)

  revalidatePath(`/dashboard/series/${seriesId}/chapters/${chapterId}`)
  return { success: true }
}

// ─── Toggle Chapter Publish ───────────────────────────────────────────────────

export async function toggleChapterPublishAction(
  seriesId: string,
  chapterId: string,
  publish: boolean
): Promise<Result> {
  const { error, supabase } = await requireCreatorOwningSeries(seriesId)
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const { error: updateError } = await supabase
    .from('chapters')
    .update({
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq('id', chapterId)
    .eq('series_id', seriesId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/dashboard/series/${seriesId}`)
  return { success: true }
}

// ─── Delete Chapter ───────────────────────────────────────────────────────────

export async function deleteChapterAction(seriesId: string, chapterId: string): Promise<Result> {
  const { error, supabase } = await requireCreatorOwningSeries(seriesId)
  if (error || !supabase) return { error: error ?? 'Unauthorized' }

  const { error: deleteError } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId)
    .eq('series_id', seriesId)

  if (deleteError) return { error: deleteError.message }

  redirect(`/dashboard/series/${seriesId}`)
}
