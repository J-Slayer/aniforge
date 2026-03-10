import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics — Dashboard' }

export default function DashboardAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
      <div className="rounded-xl border border-dashed border-border p-16 text-center">
        <p className="text-sm text-muted-foreground">
          Analytics — coming in Phase 6 (Creator Dashboard & Analytics).
        </p>
      </div>
    </div>
  )
}
