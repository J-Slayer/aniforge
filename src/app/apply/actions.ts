'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type ApplyState = { error: string } | { success: true } | null

export async function submitApplicationAction(
  _prevState: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/apply')
  }

  const display_name = (formData.get('display_name') as string)?.trim()
  const bio = (formData.get('bio') as string)?.trim()
  const portfolio_url = (formData.get('portfolio_url') as string)?.trim() || null
  const social_url = (formData.get('social_url') as string)?.trim() || null
  const reason = (formData.get('reason') as string)?.trim()

  if (!display_name || !bio || !reason) {
    return { error: 'Display name, bio, and reason are all required.' }
  }

  if (bio.length < 50) {
    return { error: 'Bio must be at least 50 characters — tell us about yourself as a creator.' }
  }

  if (reason.length < 50) {
    return { error: 'Please write at least 50 characters about why you want to create on AniForge.' }
  }

  // Check if they already have a pending or approved application
  const { data: existing } = await supabase
    .from('creator_applications')
    .select('status')
    .eq('user_id', user.id)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (existing) {
    return {
      error:
        existing.status === 'approved'
          ? 'Your application was already approved. Go to your dashboard.'
          : 'You already have a pending application. We\'ll review it soon.',
    }
  }

  const { error } = await supabase.from('creator_applications').insert({
    user_id: user.id,
    display_name,
    bio,
    portfolio_url,
    social_url,
    reason,
  })

  if (error) {
    return { error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
