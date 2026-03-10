import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import ApplicationForm from './ApplicationForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Become a Creator',
}

export default async function ApplyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/apply')
  }

  // Fetch the user's profile
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as any

  // Already a creator — send them to their dashboard
  if (profile?.role === 'creator' || profile?.role === 'admin') {
    redirect('/dashboard')
  }

  // Check for existing application
  const { data: existingApplicationRaw } = await supabase
    .from('creator_applications')
    .select('status, created_at, admin_notes')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const existingApplication = existingApplicationRaw as any

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            Creator Program
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-3">
            Become an AniForge Creator
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            AniForge is built for independent anime and manga creators. Apply to join,
            upload your series, build a fanbase, and earn directly from your supporters.
          </p>
        </div>

        {/* Existing application status */}
        {existingApplication && existingApplication.status === 'pending' && (
          <div className="mb-8 p-5 rounded-xl bg-accent/50 border border-border">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-sm font-semibold text-foreground">Application under review</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your application is in the queue. We review applications manually and will notify you of our decision.
            </p>
          </div>
        )}

        {existingApplication && existingApplication.status === 'rejected' && (
          <div className="mb-8 p-5 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-sm font-semibold text-destructive">Previous application not approved</span>
            </div>
            {existingApplication.admin_notes && (
              <p className="text-sm text-muted-foreground mb-3">
                Feedback: {existingApplication.admin_notes}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              You can submit a new application below.
            </p>
          </div>
        )}

        {/* What you get */}
        <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Upload freely',
              body: 'Anime episodes, manga chapters — full control over your series.',
            },
            {
              title: 'Earn directly',
              body: 'Monthly supporter subscriptions. Revenue paid out via Stripe.',
            },
            {
              title: 'Own your audience',
              body: 'Real follower counts, analytics, and creator tools.',
            },
          ].map(({ title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-primary mb-1">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Application form — always shown, even after rejection */}
        {(!existingApplication || existingApplication.status === 'rejected') && profile && (
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-lg font-bold text-foreground mb-6">Your Application</h2>
            <ApplicationForm profile={profile} />
          </div>
        )}
      </main>
    </div>
  )
}
