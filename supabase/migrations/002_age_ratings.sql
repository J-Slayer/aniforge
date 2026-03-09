-- ─── Age Rating for Series ────────────────────────────────────────────────────
-- Adds an age_rating column to series so creators can flag mature content.
-- Viewers will see a content warning before accessing mature/adult series.

ALTER TABLE series
  ADD COLUMN IF NOT EXISTS age_rating text NOT NULL DEFAULT 'all'
  CHECK (age_rating IN ('all', 'teen', 'mature', 'adult'));

COMMENT ON COLUMN series.age_rating IS
  'all = All ages, teen = 13+, mature = 17+, adult = 18+ explicit content';
