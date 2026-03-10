'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthState = { error: string } | { message: string } | null

// ─── Sign Up ─────────────────────────────────────────────────────────────────

export async function signUpAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const username = (formData.get('username') as string)?.trim().toLowerCase()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  // --- Validate inputs ---
  if (!username || !email || !password) {
    return { error: 'All fields are required.' }
  }

  if (username.length < 3 || username.length > 30) {
    return { error: 'Username must be between 3 and 30 characters.' }
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { error: 'Username can only contain letters, numbers, and underscores.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createClient()

  // --- Check username availability ---
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle()

  if (existingProfile) {
    return { error: 'That username is already taken. Try another.' }
  }

  // --- Create the user ---
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: username,
      },
    },
  })

  if (error) {
    // Supabase returns a generic message for duplicate emails to prevent enumeration.
    // We surface it directly — fine for MVP.
    return { error: error.message }
  }

  redirect('/')
}

// ─── Sign In ─────────────────────────────────────────────────────────────────

export async function signInAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const identifier = (formData.get('identifier') as string)?.trim()
  const password = formData.get('password') as string

  if (!identifier || !password) {
    return { error: 'Email (or username) and password are required.' }
  }

  let loginEmail = identifier.toLowerCase()

  // If the identifier has no '@', treat it as a username and resolve it to an email
  if (!identifier.includes('@')) {
    const adminSupabase = createAdminClient()

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('username', identifier.toLowerCase())
      .maybeSingle()

    if (!profile) {
      return { error: 'Invalid username or password.' }
    }

    const { data: authUser } = await adminSupabase.auth.admin.getUserById(profile.id)

    if (!authUser.user?.email) {
      return { error: 'Invalid username or password.' }
    }

    loginEmail = authUser.user.email
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
    password,
  })

  if (error) {
    return { error: 'Invalid email or password.' }
  }

  redirect('/')
}

// ─── Sign Up as Creator (account + application in one step) ─────────────────

export async function signUpAsCreatorAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const username = (formData.get('username') as string)?.trim().toLowerCase()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const display_name = (formData.get('display_name') as string)?.trim()
  const bio = (formData.get('bio') as string)?.trim()
  const reason = (formData.get('reason') as string)?.trim()
  const portfolio_url = (formData.get('portfolio_url') as string)?.trim() || null
  const social_url = (formData.get('social_url') as string)?.trim() || null

  // --- Validate account fields ---
  if (!username || !email || !password) {
    return { error: 'Username, email, and password are all required.' }
  }
  if (username.length < 3 || username.length > 30) {
    return { error: 'Username must be between 3 and 30 characters.' }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { error: 'Username can only contain letters, numbers, and underscores.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  // --- Validate creator fields ---
  if (!display_name || !bio || !reason) {
    return { error: 'Creator name, bio, and reason are all required.' }
  }
  if (bio.length < 50) {
    return { error: 'Bio must be at least 50 characters.' }
  }
  if (reason.length < 50) {
    return { error: 'Please write at least 50 characters about why you want to create on AniForge.' }
  }

  const supabase = await createClient()

  // --- Check username availability ---
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle()

  if (existingProfile) {
    return { error: 'That username is already taken. Try another.' }
  }

  // --- Create the account ---
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name },
    },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  const userId = authData.user?.id
  if (!userId) {
    return { error: 'Account creation failed. Please try again.' }
  }

  // --- Submit the creator application ---
  // The DB trigger has already created the profiles row by this point.
  // The supabase client now has the new user's session, so RLS will allow this insert.
  const { error: appError } = await supabase.from('creator_applications').insert({
    user_id: userId,
    display_name,
    bio,
    portfolio_url,
    social_url,
    reason,
  })

  if (appError) {
    // Account was created successfully even if application fails.
    // Redirect to homepage — they can apply again from their account.
    redirect('/?applied=false')
  }

  redirect('/?applied=true')
}

// ─── Sign Out ────────────────────────────────────────────────────────────────

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
