import { NextResponse } from 'next/server'
import Mux from '@mux/mux-node'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  // Verify the request is from an authenticated creator
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const p = profile as any
  if (p?.role !== 'creator' && p?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
  })

  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: ['public'],
      mp4_support: 'none',
    },
    cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  })

  return NextResponse.json({ uploadId: upload.id, url: upload.url })
}
