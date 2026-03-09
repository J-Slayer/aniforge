import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center overflow-hidden">
        {/* Background gradient glow */}
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Now in early development
        </div>

        {/* Headline */}
        <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Where indie{' '}
          <span className="text-primary">anime &amp; manga</span>{' '}
          creators thrive
        </h1>

        {/* Subtext */}
        <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
          AniForge is a creator-first platform for independent anime and manga.
          Discover new series, support the creators you love, and build your fanbase.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/browse"
            className="rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            Browse Content
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-border px-8 py-3.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            Create an account
          </Link>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground">
          <svg
            className="h-5 w-5 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Discovery Sections — placeholder until real content exists */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24 space-y-16">
        {[
          {
            label: 'Trending Indie Anime',
            description: 'The most-watched original anime this week',
          },
          {
            label: 'New Episodes Today',
            description: 'Fresh episodes just uploaded by creators',
          },
          {
            label: 'Rising Creators',
            description: 'Up-and-coming creators building their fanbase',
          },
          {
            label: 'Hidden Gems',
            description: 'Underrated series that deserve more eyes',
          },
        ].map(({ label, description }) => (
          <div key={label}>
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">{label}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              </div>
              <Link
                href="/browse"
                className="text-sm text-primary hover:underline font-medium"
              >
                See all
              </Link>
            </div>

            {/* Skeleton cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-card border border-border overflow-hidden"
                >
                  <div className="aspect-[3/4] bg-accent/60 animate-pulse" />
                  <div className="p-3 space-y-1.5">
                    <div className="h-3 rounded bg-accent/60 animate-pulse w-3/4" />
                    <div className="h-2.5 rounded bg-accent/60 animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AniForge. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/apply" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Become a Creator
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
