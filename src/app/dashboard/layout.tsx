import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, username, display_name')
    .eq('id', user.id)
    .single()

  // Must be a creator or admin to access the dashboard
  if (profile?.role !== 'creator' && profile?.role !== 'admin') {
    redirect('/apply')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          <DashboardSidebar username={profile.username} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
