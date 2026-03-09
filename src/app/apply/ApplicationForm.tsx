'use client'

import { useActionState } from 'react'
import { submitApplicationAction } from './actions'
import type { Profile } from '@/types'

export default function ApplicationForm({ profile }: { profile: Profile }) {
  const [state, formAction, isPending] = useActionState(
    submitApplicationAction,
    null
  )

  // Success state
  if (state && 'success' in state) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/30 mb-6">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">Application submitted!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thanks for applying. We&apos;ll review your application and get back to you soon.
          You&apos;ll receive a notification once a decision is made.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Error */}
      {state && 'error' in state && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {state.error}
        </div>
      )}

      {/* Display Name */}
      <div className="space-y-1.5">
        <label htmlFor="display_name" className="block text-sm font-medium text-foreground">
          Creator Name <span className="text-destructive">*</span>
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          defaultValue={profile.display_name ?? profile.username}
          maxLength={80}
          placeholder="Your creator name"
          className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
        <p className="text-xs text-muted-foreground">This is the name that will appear on your public creator profile.</p>
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label htmlFor="bio" className="block text-sm font-medium text-foreground">
          About You <span className="text-destructive">*</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          required
          rows={4}
          minLength={50}
          maxLength={500}
          placeholder="Tell us about yourself as a creator — your background, style, and what kind of content you make..."
          className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
        />
        <p className="text-xs text-muted-foreground">Minimum 50 characters.</p>
      </div>

      {/* Portfolio URL */}
      <div className="space-y-1.5">
        <label htmlFor="portfolio_url" className="block text-sm font-medium text-foreground">
          Portfolio or Website <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="portfolio_url"
          name="portfolio_url"
          type="url"
          placeholder="https://yoursite.com"
          className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
      </div>

      {/* Social URL */}
      <div className="space-y-1.5">
        <label htmlFor="social_url" className="block text-sm font-medium text-foreground">
          Social Profile <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="social_url"
          name="social_url"
          type="url"
          placeholder="https://twitter.com/yourhandle"
          className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
        <p className="text-xs text-muted-foreground">Twitter, YouTube, Instagram — wherever your work lives.</p>
      </div>

      {/* Reason */}
      <div className="space-y-1.5">
        <label htmlFor="reason" className="block text-sm font-medium text-foreground">
          Why do you want to create on AniForge? <span className="text-destructive">*</span>
        </label>
        <textarea
          id="reason"
          name="reason"
          required
          rows={4}
          minLength={50}
          maxLength={1000}
          placeholder="Tell us about the series you want to create, your goals, and why AniForge is the right platform for your work..."
          className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
        />
      </div>

      {/* Copyright acknowledgment */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/50 border border-border">
        <input
          id="copyright"
          name="copyright"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary flex-shrink-0"
        />
        <label htmlFor="copyright" className="text-sm text-muted-foreground leading-relaxed">
          I confirm that all content I upload will be original work that I own the rights to,
          or content I have explicit permission to publish. I understand that uploading
          copyrighted content without authorization will result in removal and account termination.
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
      >
        {isPending ? 'Submitting application…' : 'Submit application'}
      </button>
    </form>
  )
}
