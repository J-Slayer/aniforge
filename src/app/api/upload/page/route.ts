import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const p = profile as any
  if (p?.role !== 'creator' && p?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const chapterId = formData.get('chapter_id') as string | null

  if (!file || !chapterId) {
    return NextResponse.json({ error: 'Missing file or chapter_id' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `chapters/${chapterId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const adminSupabase = createAdminClient()
  const { error: uploadError } = await adminSupabase.storage
    .from('manga-pages')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = adminSupabase.storage
    .from('manga-pages')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
