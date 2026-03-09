'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signInAction } from '../actions'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInAction, null)

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your AniForge account.
          </p>
        </div>

        {/* Error message */}
        {state && 'error' in state && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {state.error}
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          {/* Email or Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-foreground"
            >
              Email or Username
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              placeholder="you@example.com or yourname"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              {/* Placeholder — forgot password comes in a later phase */}
              <span className="text-xs text-muted-foreground">
                Forgot password? (coming soon)
              </span>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Your password"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
