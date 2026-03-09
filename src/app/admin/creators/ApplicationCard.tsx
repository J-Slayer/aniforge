'use client'

import { useState } from 'react'
import { approveApplicationAction, rejectApplicationAction } from './actions'
import type { CreatorApplication, Profile } from '@/types'

type ApplicationWithProfile = CreatorApplication & {
  profiles: Pick<Profile, 'username' | 'avatar_url' | 'display_name'>
}

export default function ApplicationCard({
  application,
}: {
  application: ApplicationWithProfile
}) {
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [result, setResult] = useState<{ error: string } | { success: true } | null>(null)
  const [showNotes, setShowNotes] = useState(false)

  async function handleApprove() {
    setLoading('approve')
    const res = await approveApplicationAction(application.id, application.user_id)
    setResult(res)
    setLoading(null)
  }

  async function handleReject() {
    setLoading('reject')
    const res = await rejectApplicationAction(application.id, adminNotes)
    setResult(res)
    setLoading(null)
  }

  // Already actioned
  if (result && 'success' in result) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 opacity-60">
        <p className="text-sm text-muted-foreground">Action recorded.</p>
      </div>
    )
  }

  const profile = application.profiles
  const appliedAt = new Date(application.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary uppercase">
                {profile?.username?.charAt(0) ?? '?'}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {application.display_name}
            </p>
            <p className="text-xs text-muted-foreground">
              @{profile?.username} · Applied {appliedAt}
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-medium">
          Pending
        </span>
      </div>

      {/* Bio */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Bio</p>
        <p className="text-sm text-foreground leading-relaxed">{application.bio}</p>
      </div>

      {/* Reason */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Why AniForge?</p>
        <p className="text-sm text-foreground leading-relaxed">{application.reason}</p>
      </div>

      {/* Links */}
      {(application.portfolio_url || application.social_url) && (
        <div className="flex gap-3">
          {application.portfolio_url && (
            <a
              href={application.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Portfolio ↗
            </a>
          )}
          {application.social_url && (
            <a
              href={application.social_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Social ↗
            </a>
          )}
        </div>
      )}

      {/* Error */}
      {result && 'error' in result && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}

      {/* Admin notes (shown before reject) */}
      {showNotes && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Rejection reason (shown to applicant — optional)
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Application was too vague — please reapply with more detail about your series..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading === 'approve' ? 'Approving…' : 'Approve'}
        </button>

        {showNotes ? (
          <button
            onClick={handleReject}
            disabled={loading !== null}
            className="rounded-lg border border-destructive/40 px-5 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            {loading === 'reject' ? 'Rejecting…' : 'Confirm Reject'}
          </button>
        ) : (
          <button
            onClick={() => setShowNotes(true)}
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  )
}
