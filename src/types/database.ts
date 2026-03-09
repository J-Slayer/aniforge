/**
 * AniForge — Supabase Database Types
 *
 * These types mirror the database schema exactly.
 * Update this file whenever the schema changes.
 *
 * Future: replace with auto-generated types via `supabase gen types typescript`
 */

export type UserRole = 'viewer' | 'creator' | 'admin'
export type SeriesType = 'anime' | 'manga'
export type SeriesStatus = 'ongoing' | 'completed' | 'hiatus' | 'upcoming'
export type ContentAccess = 'free' | 'supporter'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed'
export type ReportReason = 'copyright' | 'inappropriate' | 'spam' | 'other'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete'

// ─── Table Row Types ────────────────────────────────────────────────────────

export type Profile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export type CreatorProfile = {
  id: string
  banner_url: string | null
  website_url: string | null
  twitter_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  subscription_price_cents: number | null
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
  total_subscribers: number
  created_at: string
  updated_at: string
}

export type CreatorApplication = {
  id: string
  user_id: string
  display_name: string
  bio: string
  portfolio_url: string | null
  social_url: string | null
  reason: string
  status: ApplicationStatus
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type AgeRating = 'all' | 'teen' | 'mature' | 'adult'

export type Series = {
  id: string
  creator_id: string
  title: string
  slug: string
  description: string | null
  cover_url: string | null
  banner_url: string | null
  type: SeriesType
  status: SeriesStatus
  age_rating: AgeRating
  genres: string[]
  tags: string[]
  is_published: boolean
  total_views: number
  total_episodes: number
  total_chapters: number
  created_at: string
  updated_at: string
}

export type Episode = {
  id: string
  series_id: string
  title: string
  episode_number: number
  description: string | null
  thumbnail_url: string | null
  mux_asset_id: string | null
  mux_playback_id: string | null
  duration_seconds: number | null
  access: ContentAccess
  is_published: boolean
  published_at: string | null
  scheduled_at: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export type Chapter = {
  id: string
  series_id: string
  title: string
  chapter_number: number
  description: string | null
  cover_url: string | null
  page_count: number
  access: ContentAccess
  is_published: boolean
  published_at: string | null
  scheduled_at: string | null
  view_count: number
  created_at: string
  updated_at: string
}

export type ChapterPage = {
  id: string
  chapter_id: string
  page_number: number
  image_url: string
  created_at: string
}

export type Follow = {
  id: string
  follower_id: string
  creator_id: string
  created_at: string
}

export type Watchlist = {
  id: string
  user_id: string
  series_id: string
  last_episode_id: string | null
  last_chapter_id: string | null
  created_at: string
  updated_at: string
}

export type Subscription = {
  id: string
  subscriber_id: string
  creator_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export type Comment = {
  id: string
  user_id: string
  episode_id: string | null
  chapter_id: string | null
  content: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type Report = {
  id: string
  reporter_id: string
  reason: ReportReason
  details: string | null
  status: ReportStatus
  series_id: string | null
  episode_id: string | null
  chapter_id: string | null
  comment_id: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

export type Devlog = {
  id: string
  creator_id: string
  title: string
  content: string
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type AnalyticsEvent = {
  id: string
  user_id: string | null
  event_type: string
  series_id: string | null
  episode_id: string | null
  chapter_id: string | null
  creator_id: string | null
  created_at: string
}

// ─── Database Type Map (for Supabase client generics) ───────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & Pick<Profile, 'id' | 'username'>
        Update: Partial<Profile>
        Relationships: []
      }
      creator_profiles: {
        Row: CreatorProfile
        Insert: Partial<CreatorProfile> & Pick<CreatorProfile, 'id'>
        Update: Partial<CreatorProfile>
        Relationships: []
      }
      creator_applications: {
        Row: CreatorApplication
        Insert: Omit<CreatorApplication, 'id' | 'created_at' | 'updated_at' | 'status' | 'admin_notes' | 'reviewed_by' | 'reviewed_at'>
        Update: Partial<CreatorApplication>
        Relationships: []
      }
      series: {
        Row: Series
        Insert: Omit<Series, 'id' | 'created_at' | 'updated_at' | 'total_views' | 'total_episodes' | 'total_chapters'>
        Update: Partial<Series>
        Relationships: []
      }
      episodes: {
        Row: Episode
        Insert: Omit<Episode, 'id' | 'created_at' | 'updated_at' | 'view_count'>
        Update: Partial<Episode>
        Relationships: []
      }
      chapters: {
        Row: Chapter
        Insert: Omit<Chapter, 'id' | 'created_at' | 'updated_at' | 'view_count'>
        Update: Partial<Chapter>
        Relationships: []
      }
      chapter_pages: {
        Row: ChapterPage
        Insert: Omit<ChapterPage, 'id' | 'created_at'>
        Update: Partial<ChapterPage>
        Relationships: []
      }
      follows: {
        Row: Follow
        Insert: Omit<Follow, 'id' | 'created_at'>
        Update: Partial<Follow>
        Relationships: []
      }
      watchlist: {
        Row: Watchlist
        Insert: Omit<Watchlist, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Watchlist>
        Relationships: []
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Subscription>
        Relationships: []
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'is_deleted'>
        Update: Partial<Comment>
        Relationships: []
      }
      reports: {
        Row: Report
        Insert: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status' | 'reviewed_by' | 'reviewed_at' | 'resolution_notes'>
        Update: Partial<Report>
        Relationships: []
      }
      devlogs: {
        Row: Devlog
        Insert: Omit<Devlog, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Devlog>
        Relationships: []
      }
      analytics_events: {
        Row: AnalyticsEvent
        Insert: Omit<AnalyticsEvent, 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      series_type: SeriesType
      series_status: SeriesStatus
      content_access: ContentAccess
      application_status: ApplicationStatus
      report_status: ReportStatus
      report_reason: ReportReason
    }
  }
}
