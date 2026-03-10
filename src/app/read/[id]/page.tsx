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
  const { data } = await supabase.from('chapters').select('title').eq('id', id).single()
  const ch = data as any
  return { title: ch?.title ? `${ch.title} — AniForge` : 'Read — AniForge' }
}

export default async function ReadPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch chapter + series
  const { data: chRaw } = await supabase
    .from('chapters')
    .select('*, series!inner(id, title, slug, age_rating, cover_url, profiles!series_creator_id_fkey(username, display_name))')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!chRaw) notFound()
  const ch = chRaw as any
  const series = ch.series

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
  }

  // Fetch pages
  const { data: pagesRaw } = await supabase
    .from('chapter_pages')
    .select('id, page_number, image_url, alt_text')
    .eq('chapter_id', id)
    .order('page_number', { ascending: true })

  const pages = (pagesRaw ?? []) as any[]

  // Prev / next chapters
  const { data: siblingRaw } = await supabase
    .from('chapters')
    .select('id, chapter_number, title')
    .eq('series_id', series.id)
    .eq('is_published', true)
    .order('chapter_number', { ascending: true })

  const siblings = (siblingRaw ?? []) as any[]
  const currentIdx = siblings.findIndex((c) => c.id === id)
  const prevCh = currentIdx > 0 ? siblings[currentIdx - 1] : null
  const nextCh = currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link
            href={`/series/${series.slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate mr-4"
          >
            ← {series.title}
          </Link>
          <span className="text-sm font-semibold text-foreground flex-shrink-0">
            Ch.{ch.chapter_number} · {ch.title}
          </span>
        </div>
      </div>

      {/* Page reader — vertical scroll */}
      <main className="mx-auto max-w-3xl px-2 sm:px-0 py-6">
        {pages.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-muted-foreground text-sm">No pages uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {pages.map((page) => (
              <div key={page.id} className="w-full">
                {page.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={page.image_url}
                    alt={page.alt_text ?? `Page ${page.page_number}`}
                    className="w-full h-auto block"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-accent/40 flex items-center justify-center text-muted-foreground text-sm border border-border">
                    Page {page.page_number}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Prev / Next navigation */}
        <div className="flex gap-3 mt-10 px-4 sm:px-0">
          {prevCh ? (
            <Link
              href={`/read/${prevCh.id}`}
              className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors group"
            >
              <span className="text-muted-foreground">←</span>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Previous</p>
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  Ch.{prevCh.chapter_number}: {prevCh.title}
                </p>
              </div>
            </Link>
          ) : <div className="flex-1" />}

          {nextCh ? (
            <Link
              href={`/read/${nextCh.id}`}
              className="flex-1 flex items-center justify-end gap-2 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors group text-right"
            >
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Next</p>
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  Ch.{nextCh.chapter_number}: {nextCh.title}
                </p>
              </div>
              <span className="text-muted-foreground flex-shrink-0">→</span>
            </Link>
          ) : (
            <Link
              href={`/series/${series.slug}`}
              className="flex-1 flex items-center justify-end gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 transition-colors text-right"
            >
              <div>
                <p className="text-[10px] text-muted-foreground">You&apos;re all caught up!</p>
                <p className="text-sm font-medium text-primary">Back to series →</p>
              </div>
            </Link>
          )}
        </div>

        {/* Page count */}
        {pages.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            {pages.length} pages
          </p>
        )}
      </main>
    </div>
  )
}
