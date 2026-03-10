import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Earnings — Dashboard' }

export default function DashboardEarningsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
      <div className="rounded-xl border border-dashed border-border p-16 text-center">
        <p className="text-sm text-muted-foreground">
          Earnings & Stripe Connect — coming in Phase 5 (Monetization).
        </p>
      </div>
    </div>
  )
}
