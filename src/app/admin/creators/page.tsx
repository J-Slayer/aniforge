import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ApplicationCard from './ApplicationCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Creator Applications — Admin' }

export default async function AdminCreatorsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: adminProfileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const adminProfile = adminProfileRaw as any

  if (adminProfile?.role !== 'admin') redirect('/')

  // Fetch all pending applications with applicant profile info.
  // Must use explicit FK hint because creator_applications has two FKs to profiles
  // (user_id and reviewed_by) — Supabase can't infer which one to join on without it.
  const { data: applicationsRaw } = await supabase
    .from('creator_applications')
    .select('*, profiles!creator_applications_user_id_fkey(username, avatar_url, display_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  const applications = applicationsRaw as any[]

  return (
    <div className="min-h-screen bg-background">
      {/* Admin header bar */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm font-bold text-foreground">
              Ani<span className="text-primary">Forge</span>
            </a>
            <span className="text-border">/</span>
            <span className="text-sm text-muted-foreground">Admin</span>
            <span className="text-border">/</span>
            <span className="text-sm text-foreground font-medium">Creator Applications</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
            Admin
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Creator Applications</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {applications?.length ?? 0} pending application{applications?.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Quick nav */}
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected'].map((status) => (
              <a
                key={status}
                href={`/admin/creators?status=${status}`}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors capitalize"
              >
                {status}
              </a>
            ))}
          </div>
        </div>

        {/* Applications list */}
        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-xl border border-border bg-card">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm font-medium text-foreground mb-1">All caught up</p>
            <p className="text-sm text-muted-foreground">No pending applications right now.</p>
          </div>
        )}
      </main>
    </div>
  )
}
