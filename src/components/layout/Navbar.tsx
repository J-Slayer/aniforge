'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { signOutAction } from '@/app/(auth)/actions'
import type { Profile } from '@/types'

export default function Navbar() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    // Load initial user
    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data as any)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadProfile(user.id)
    })

    // Keep in sync with auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors"
        >
          Ani<span className="text-primary">Forge</span>
        </Link>

        {/* Center nav links */}
        <div className="hidden sm:flex items-center gap-6">
          <Link
            href="/browse"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse
          </Link>
          <Link
            href="/browse?type=anime"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Anime
          </Link>
          <Link
            href="/browse?type=manga"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Manga
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {profile ? (
            // Authenticated user menu
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
                aria-label="Open user menu"
              >
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name ?? profile.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-primary uppercase">
                      {profile.username.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                  {profile.display_name ?? profile.username}
                </span>
                {/* Chevron */}
                <svg
                  className={`h-4 w-4 text-muted-foreground transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card shadow-xl py-1 z-50">
                  {/* User info header */}
                  <div className="px-4 py-2.5 border-b border-border">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {profile.display_name ?? profile.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{profile.username}
                    </p>
                  </div>

                  {/* Links */}
                  <div className="py-1">
                    <Link
                      href="/watchlist"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      Watchlist
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      Account Settings
                    </Link>

                    {/* Become a Creator — only shown for viewers */}
                    {profile.role === 'viewer' && (
                      <Link
                        href="/apply"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-primary hover:bg-accent transition-colors font-medium"
                      >
                        Become a Creator
                      </Link>
                    )}

                    {/* Creator dashboard — only shown for creators */}
                    {(profile.role === 'creator' || profile.role === 'admin') && (
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-primary hover:bg-accent transition-colors"
                      >
                        Creator Dashboard
                      </Link>
                    )}

                    {/* Admin panel — only shown for admins */}
                    {profile.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
                      >
                        Admin Panel
                      </Link>
                    )}
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-border py-1">
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Unauthenticated state
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
