'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { signUpAction, signUpAsCreatorAction } from '../actions'

// ─── Shared account fields used in both tabs ─────────────────────────────────

function AccountFields() {
  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor="username" className="block text-sm font-medium text-foreground">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          placeholder="yourname"
          className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
        <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="8+ characters"
          className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
      </div>
    </>
  )
}

// ─── Viewer tab ───────────────────────────────────────────────────────────────

function ViewerTab() {
  const [state, formAction, isPending] = useActionState(signUpAction, null)

  return (
    <form action={formAction} className="space-y-4">
      {state && 'error' in state && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {state.error}
        </div>
      )}

      <AccountFields />

      <p className="text-xs text-muted-foreground">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}

// ─── Creator tab ──────────────────────────────────────────────────────────────

function CreatorTab() {
  const [state, formAction, isPending] = useActionState(signUpAsCreatorAction, null)

  return (
    <form action={formAction} className="space-y-4">
      {state && 'error' in state && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {state.error}
        </div>
      )}

      {/* Account fields */}
      <AccountFields />

      <div className="border-t border-border pt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Creator Application
        </p>

        {/* Creator name */}
        <div className="space-y-1.5 mb-4">
          <label htmlFor="display_name" className="block text-sm font-medium text-foreground">
            Creator Name
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            required
            maxLength={80}
            placeholder="Your public creator name"
            className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5 mb-4">
          <label htmlFor="bio" className="block text-sm font-medium text-foreground">
            About you as a creator
          </label>
          <textarea
            id="bio"
            name="bio"
            required
            rows={3}
            minLength={50}
            maxLength={500}
            placeholder="Your background, style, and what kind of content you create… (min 50 characters)"
            className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
          />
        </div>

        {/* Reason */}
        <div className="space-y-1.5 mb-4">
          <label htmlFor="reason" className="block text-sm font-medium text-foreground">
            Why do you want to create on AniForge?
          </label>
          <textarea
            id="reason"
            name="reason"
            required
            rows={3}
            minLength={50}
            maxLength={1000}
            placeholder="Tell us about the series you want to make and your goals… (min 50 characters)"
            className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
          />
        </div>

        {/* Optional links */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="space-y-1.5">
            <label htmlFor="portfolio_url" className="block text-xs font-medium text-muted-foreground">
              Portfolio (optional)
            </label>
            <input
              id="portfolio_url"
              name="portfolio_url"
              type="url"
              placeholder="https://…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="social_url" className="block text-xs font-medium text-muted-foreground">
              Social (optional)
            </label>
            <input
              id="social_url"
              name="social_url"
              type="url"
              placeholder="https://…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Copyright acknowledgment */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50 border border-border">
        <input
          id="copyright"
          name="copyright"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary flex-shrink-0"
        />
        <label htmlFor="copyright" className="text-xs text-muted-foreground leading-relaxed">
          I confirm all content I upload will be original work I own the rights to. I understand
          that uploading copyrighted content without authorization will result in removal and
          account termination.
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        By applying you also agree to our{' '}
        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
      >
        {isPending ? 'Submitting…' : 'Create account & apply'}
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [tab, setTab] = useState<'viewer' | 'creator'>('viewer')

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-border">
          <button
            onClick={() => setTab('viewer')}
            className={`py-3.5 text-sm font-semibold transition-colors ${
              tab === 'viewer'
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            Join AniForge
          </button>
          <button
            onClick={() => setTab('creator')}
            className={`py-3.5 text-sm font-semibold transition-colors ${
              tab === 'creator'
                ? 'bg-background text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            Become a Creator
          </button>
        </div>

        {/* Tab content */}
        <div className="p-8">
          {tab === 'viewer' ? (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-foreground mb-1">Create your account</h1>
                <p className="text-sm text-muted-foreground">
                  Join AniForge and discover indie anime &amp; manga.
                </p>
              </div>
              <ViewerTab />
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-foreground mb-1">Apply as a Creator</h1>
                <p className="text-sm text-muted-foreground">
                  Create your account and submit your creator application in one step.
                  We review all applications manually.
                </p>
              </div>
              <CreatorTab />
            </>
          )}
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
