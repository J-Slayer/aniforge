'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Shared admin check — returns the current user's profile or throws
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Forbidden' as const }

  return { user, error: null }
}

// ─── Approve Application ─────────────────────────────────────────────────────

export async function approveApplicationAction(
  applicationId: string,
  applicantUserId: string
): Promise<{ error: string } | { success: true }> {
  const { error: authError, user } = await requireAdmin()
  if (authError) return { error: authError }

  // Service role client bypasses RLS for privileged writes
  const adminSupabase = createAdminClient()

  // 1. Mark application approved
  const { error: appError } = await adminSupabase
    .from('creator_applications')
    .update({
      status: 'approved',
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (appError) return { error: `Failed to update application status: ${appError.message}` }

  // 2. Upgrade user role to creator
  const { error: roleError } = await adminSupabase
    .from('profiles')
    .update({ role: 'creator' })
    .eq('id', applicantUserId)

  if (roleError) return { error: 'Failed to update user role.' }

  // 3. Create the creator_profiles row (only if it doesn't exist yet)
  const { error: cpError } = await adminSupabase
    .from('creator_profiles')
    .upsert({ id: applicantUserId }, { onConflict: 'id', ignoreDuplicates: true })

  if (cpError) return { error: 'Failed to create creator profile.' }

  revalidatePath('/admin/creators')
  return { success: true }
}

// ─── Reject Application ──────────────────────────────────────────────────────

export async function rejectApplicationAction(
  applicationId: string,
  adminNotes: string
): Promise<{ error: string } | { success: true }> {
  const { error: authError, user } = await requireAdmin()
  if (authError) return { error: authError }

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('creator_applications')
    .update({
      status: 'rejected',
      admin_notes: adminNotes || null,
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) return { error: 'Failed to reject application.' }

  revalidatePath('/admin/creators')
  return { success: true }
}
