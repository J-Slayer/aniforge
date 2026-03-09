import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChapterEditForm from './ChapterEditForm'
import PageManager from './PageManager'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Chapter — Dashboard' }

export default async function ChapterEditPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>
}) {
  const { id: seriesId, chapterId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: seriesRaw } = await supabase
    .from('series')
    .select('creator_id, title')
    .eq('id', seriesId)
    .single()

  const series = seriesRaw as any
  if (!series || series.creator_id !== user.id) redirect('/dashboard/series')

  const { data: chapterRaw } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .eq('series_id', seriesId)
    .single()

  const chapter = chapterRaw as any
  if (!chapter) redirect(`/dashboard/series/${seriesId}`)

  const { data: pagesRaw } = await supabase
    .from('chapter_pages')
    .select('id, page_number, image_url')
    .eq('chapter_id', chapterId)
    .order('page_number', { ascending: true })

  const pages = (pagesRaw as any[]) ?? []

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <a href={`/dashboard/series/${seriesId}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← {series.title}
        </a>
        <h1 className="text-2xl font-bold text-foreground mt-2">
          Chapter {chapter.chapter_number}: {chapter.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {chapter.page_count} pages · {chapter.is_published ? 'Published' : 'Draft'}
        </p>
      </div>

      <section>
        <h2 className="text-base font-bold text-foreground mb-4">Details</h2>
        <ChapterEditForm chapter={chapter} seriesId={seriesId} />
      </section>

      <section>
        <h2 className="text-base font-bold text-foreground mb-4">Pages</h2>
        <PageManager
          seriesId={seriesId}
          chapterId={chapterId}
          pages={pages}
        />
      </section>
    </div>
  )
}
