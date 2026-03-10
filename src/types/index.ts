/**
 * AniForge — Shared Types
 * Re-exports database types and defines UI/component-level types.
 */

export type * from './database'

// ─── Extended / Joined Types (for UI queries) ───────────────────────────────

import type { Profile, CreatorProfile, Series, Episode, Chapter } from './database'

/** Creator profile joined with their base profile */
export type CreatorWithProfile = CreatorProfile & {
  profile: Profile
}

/** Series with creator info joined */
export type SeriesWithCreator = Series & {
  creator: CreatorWithProfile
}

/** Episode with its parent series */
export type EpisodeWithSeries = Episode & {
  series: Series
}

/** Chapter with its parent series */
export type ChapterWithSeries = Chapter & {
  series: Series
}

// ─── Auth / Session ──────────────────────────────────────────────────────────

export type AuthUser = {
  id: string
  email: string | null
  profile: Profile | null
}

// ─── UI Utilities ────────────────────────────────────────────────────────────

/** Generic async server action result */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
