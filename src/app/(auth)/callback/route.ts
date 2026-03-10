import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth callback route.
 * Supabase redirects here after email confirmation or OAuth login.
 * Configure this URL in Supabase Dashboard:
 *   Authentication > URL Configuration > Redirect URLs
 *   Add: http://localhost:3000/callback (dev)
 *        https://yourdomain.com/callback (prod)
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Where to send the user after confirming (defaults to homepage)
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — redirect to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
