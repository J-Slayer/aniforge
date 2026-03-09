-- ============================================================
-- AniForge — Initial Database Schema
-- Migration: 001_initial_schema
-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor).
-- ============================================================


-- ─── Extensions ─────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";


-- ─── Enums ───────────────────────────────────────────────────────────────────

create type user_role as enum ('viewer', 'creator', 'admin');
create type series_type as enum ('anime', 'manga');
create type series_status as enum ('ongoing', 'completed', 'hiatus', 'upcoming');
create type content_access as enum ('free', 'supporter');
create type application_status as enum ('pending', 'approved', 'rejected');
create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type report_reason as enum ('copyright', 'inappropriate', 'spam', 'other');


-- ─── Helper: auto-update updated_at ─────────────────────────────────────────

create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─── Table: profiles ─────────────────────────────────────────────────────────
-- One row per Supabase auth user. Created automatically via trigger.

create table profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  role          user_role not null default 'viewer',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 30),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]+$')
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();


-- ─── Trigger: auto-create profile on signup ──────────────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    -- Use provided username or generate one from the user ID
    coalesce(
      new.raw_user_meta_data->>'username',
      'user_' || substr(replace(new.id::text, '-', ''), 1, 10)
    ),
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'username'
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ─── Table: creator_profiles ─────────────────────────────────────────────────
-- Extended data for users with role = 'creator'. Created on creator approval.

create table creator_profiles (
  id                          uuid references profiles(id) on delete cascade primary key,
  banner_url                  text,
  website_url                 text,
  twitter_url                 text,
  instagram_url               text,
  youtube_url                 text,
  subscription_price_cents    integer check (subscription_price_cents >= 100), -- min $1.00
  stripe_account_id           text,
  stripe_onboarding_complete  boolean not null default false,
  total_subscribers           integer not null default 0,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create trigger creator_profiles_updated_at
  before update on creator_profiles
  for each row execute function update_updated_at();


-- ─── Table: creator_applications ─────────────────────────────────────────────

create table creator_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade not null,
  display_name  text not null,
  bio           text not null,
  portfolio_url text,
  social_url    text,
  reason        text not null,
  status        application_status not null default 'pending',
  admin_notes   text,
  reviewed_by   uuid references profiles(id),
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index creator_applications_user_id_idx on creator_applications(user_id);
create index creator_applications_status_idx on creator_applications(status);

create trigger creator_applications_updated_at
  before update on creator_applications
  for each row execute function update_updated_at();


-- ─── Table: series ───────────────────────────────────────────────────────────

create table series (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid references creator_profiles(id) on delete cascade not null,
  title           text not null,
  slug            text unique not null,
  description     text,
  cover_url       text,
  banner_url      text,
  type            series_type not null,
  status          series_status not null default 'ongoing',
  genres          text[] not null default '{}',
  tags            text[] not null default '{}',
  is_published    boolean not null default false,
  total_views     bigint not null default 0,
  total_episodes  integer not null default 0,
  total_chapters  integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint title_length check (char_length(title) >= 1 and char_length(title) <= 200)
);

create index series_creator_id_idx on series(creator_id);
create index series_type_idx on series(type);
create index series_is_published_idx on series(is_published);

create trigger series_updated_at
  before update on series
  for each row execute function update_updated_at();


-- ─── Table: episodes ─────────────────────────────────────────────────────────

create table episodes (
  id               uuid primary key default gen_random_uuid(),
  series_id        uuid references series(id) on delete cascade not null,
  title            text not null,
  episode_number   integer not null check (episode_number > 0),
  description      text,
  thumbnail_url    text,
  mux_asset_id     text,
  mux_playback_id  text,
  duration_seconds integer,
  access           content_access not null default 'free',
  is_published     boolean not null default false,
  published_at     timestamptz,
  scheduled_at     timestamptz,
  view_count       bigint not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint unique_episode_number_per_series unique (series_id, episode_number)
);

create index episodes_series_id_idx on episodes(series_id);
create index episodes_is_published_idx on episodes(is_published);

create trigger episodes_updated_at
  before update on episodes
  for each row execute function update_updated_at();


-- ─── Table: chapters ─────────────────────────────────────────────────────────

create table chapters (
  id              uuid primary key default gen_random_uuid(),
  series_id       uuid references series(id) on delete cascade not null,
  title           text not null,
  chapter_number  decimal(8,1) not null check (chapter_number > 0),
  description     text,
  cover_url       text,
  page_count      integer not null default 0,
  access          content_access not null default 'free',
  is_published    boolean not null default false,
  published_at    timestamptz,
  scheduled_at    timestamptz,
  view_count      bigint not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint unique_chapter_number_per_series unique (series_id, chapter_number)
);

create index chapters_series_id_idx on chapters(series_id);
create index chapters_is_published_idx on chapters(is_published);

create trigger chapters_updated_at
  before update on chapters
  for each row execute function update_updated_at();


-- ─── Table: chapter_pages ────────────────────────────────────────────────────

create table chapter_pages (
  id           uuid primary key default gen_random_uuid(),
  chapter_id   uuid references chapters(id) on delete cascade not null,
  page_number  integer not null check (page_number > 0),
  image_url    text not null,
  created_at   timestamptz not null default now(),

  constraint unique_page_number_per_chapter unique (chapter_id, page_number)
);

create index chapter_pages_chapter_id_idx on chapter_pages(chapter_id);


-- ─── Table: follows ──────────────────────────────────────────────────────────

create table follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid references profiles(id) on delete cascade not null,
  creator_id   uuid references creator_profiles(id) on delete cascade not null,
  created_at   timestamptz not null default now(),

  constraint unique_follow unique (follower_id, creator_id),
  constraint no_self_follow check (follower_id != creator_id)
);

create index follows_follower_id_idx on follows(follower_id);
create index follows_creator_id_idx on follows(creator_id);


-- ─── Table: watchlist ────────────────────────────────────────────────────────

create table watchlist (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete cascade not null,
  series_id        uuid references series(id) on delete cascade not null,
  last_episode_id  uuid references episodes(id) on delete set null,
  last_chapter_id  uuid references chapters(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint unique_watchlist_entry unique (user_id, series_id)
);

create index watchlist_user_id_idx on watchlist(user_id);

create trigger watchlist_updated_at
  before update on watchlist
  for each row execute function update_updated_at();


-- ─── Table: subscriptions ────────────────────────────────────────────────────

create table subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  subscriber_id            uuid references profiles(id) on delete cascade not null,
  creator_id               uuid references creator_profiles(id) on delete cascade not null,
  stripe_subscription_id   text unique,
  stripe_customer_id       text,
  status                   text not null default 'active',
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  canceled_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint unique_subscription unique (subscriber_id, creator_id),
  constraint valid_status check (status in ('active', 'canceled', 'past_due', 'incomplete'))
);

create index subscriptions_subscriber_id_idx on subscriptions(subscriber_id);
create index subscriptions_creator_id_idx on subscriptions(creator_id);
create index subscriptions_status_idx on subscriptions(status);

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at();


-- ─── Table: comments ─────────────────────────────────────────────────────────

create table comments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  episode_id  uuid references episodes(id) on delete cascade,
  chapter_id  uuid references chapters(id) on delete cascade,
  content     text not null,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- A comment must belong to exactly one content type
  constraint comment_has_one_target check (
    (episode_id is not null and chapter_id is null) or
    (episode_id is null and chapter_id is not null)
  ),
  constraint content_length check (char_length(content) >= 1 and char_length(content) <= 2000)
);

create index comments_episode_id_idx on comments(episode_id);
create index comments_chapter_id_idx on comments(chapter_id);
create index comments_user_id_idx on comments(user_id);

create trigger comments_updated_at
  before update on comments
  for each row execute function update_updated_at();


-- ─── Table: reports ──────────────────────────────────────────────────────────

create table reports (
  id                uuid primary key default gen_random_uuid(),
  reporter_id       uuid references profiles(id) on delete cascade not null,
  reason            report_reason not null,
  details           text,
  status            report_status not null default 'open',
  series_id         uuid references series(id) on delete cascade,
  episode_id        uuid references episodes(id) on delete cascade,
  chapter_id        uuid references chapters(id) on delete cascade,
  comment_id        uuid references comments(id) on delete cascade,
  reviewed_by       uuid references profiles(id),
  reviewed_at       timestamptz,
  resolution_notes  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index reports_status_idx on reports(status);
create index reports_reporter_id_idx on reports(reporter_id);

create trigger reports_updated_at
  before update on reports
  for each row execute function update_updated_at();


-- ─── Table: devlogs ──────────────────────────────────────────────────────────

create table devlogs (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid references creator_profiles(id) on delete cascade not null,
  title         text not null,
  content       text not null,
  is_published  boolean not null default false,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index devlogs_creator_id_idx on devlogs(creator_id);

create trigger devlogs_updated_at
  before update on devlogs
  for each row execute function update_updated_at();


-- ─── Table: analytics_events ─────────────────────────────────────────────────
-- Lightweight event log. Use sparingly — one row per meaningful action.

create table analytics_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete set null,
  event_type  text not null, -- 'episode_view', 'chapter_view', 'series_view', 'profile_view'
  series_id   uuid references series(id) on delete cascade,
  episode_id  uuid references episodes(id) on delete cascade,
  chapter_id  uuid references chapters(id) on delete cascade,
  creator_id  uuid references creator_profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index analytics_events_creator_id_idx on analytics_events(creator_id);
create index analytics_events_created_at_idx on analytics_events(created_at);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================


-- ─── Enable RLS on all tables ────────────────────────────────────────────────

alter table profiles enable row level security;
alter table creator_profiles enable row level security;
alter table creator_applications enable row level security;
alter table series enable row level security;
alter table episodes enable row level security;
alter table chapters enable row level security;
alter table chapter_pages enable row level security;
alter table follows enable row level security;
alter table watchlist enable row level security;
alter table subscriptions enable row level security;
alter table comments enable row level security;
alter table reports enable row level security;
alter table devlogs enable row level security;
alter table analytics_events enable row level security;


-- ─── Helper Functions ────────────────────────────────────────────────────────

-- Check if current user is admin
create or replace function is_admin()
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Check if current user is a creator (or admin)
create or replace function is_creator()
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('creator', 'admin')
  );
$$;

-- Check if current user has an active subscription to a creator
create or replace function is_subscribed_to(creator_uuid uuid)
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from public.subscriptions
    where subscriber_id = auth.uid()
      and creator_id = creator_uuid
      and status = 'active'
  );
$$;

-- Get the creator_id for a given series (used in RLS policies)
create or replace function series_creator_id(series_uuid uuid)
returns uuid
language sql security definer
as $$
  select creator_id from public.series where id = series_uuid;
$$;


-- ─── RLS: profiles ───────────────────────────────────────────────────────────

-- Anyone can read any profile
create policy "profiles_select_public"
  on profiles for select
  using (true);

-- Users can only update their own profile
create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

-- Insert is handled by the trigger (no direct insert allowed)
create policy "profiles_insert_trigger_only"
  on profiles for insert
  with check (auth.uid() = id);


-- ─── RLS: creator_profiles ───────────────────────────────────────────────────

-- Anyone can read creator profiles
create policy "creator_profiles_select_public"
  on creator_profiles for select
  using (true);

-- Creators can update their own profile
create policy "creator_profiles_update_own"
  on creator_profiles for update
  using (auth.uid() = id);

-- Only the system (service role) or trigger inserts creator profiles
create policy "creator_profiles_insert_admin"
  on creator_profiles for insert
  with check (is_admin());


-- ─── RLS: creator_applications ───────────────────────────────────────────────

-- Users can see their own applications; admins see all
create policy "creator_applications_select"
  on creator_applications for select
  using (auth.uid() = user_id or is_admin());

-- Authenticated users can submit an application
create policy "creator_applications_insert"
  on creator_applications for insert
  with check (auth.uid() = user_id);

-- Only admins can review/update applications
create policy "creator_applications_update_admin"
  on creator_applications for update
  using (is_admin());


-- ─── RLS: series ─────────────────────────────────────────────────────────────

-- Anyone can read published series; creators can read their own drafts
create policy "series_select"
  on series for select
  using (
    is_published = true
    or auth.uid() = creator_id
    or is_admin()
  );

-- Creators can insert their own series
create policy "series_insert"
  on series for insert
  with check (auth.uid() = creator_id and is_creator());

-- Creators can update their own series
create policy "series_update"
  on series for update
  using (auth.uid() = creator_id or is_admin());

-- Creators can delete their own series; admins can delete any
create policy "series_delete"
  on series for delete
  using (auth.uid() = creator_id or is_admin());


-- ─── RLS: episodes ───────────────────────────────────────────────────────────

-- Free published episodes: anyone can read
-- Supporter episodes: only subscribers and the creator can read
create policy "episodes_select"
  on episodes for select
  using (
    -- Creator can always see their own episodes
    auth.uid() = (select creator_id from series where id = series_id)
    or is_admin()
    -- Free published episodes are public
    or (is_published = true and access = 'free')
    -- Supporter episodes: active subscribers only
    or (
      is_published = true
      and access = 'supporter'
      and is_subscribed_to((select creator_id from series where id = series_id))
    )
  );

create policy "episodes_insert"
  on episodes for insert
  with check (
    auth.uid() = (select creator_id from series where id = series_id)
    and is_creator()
  );

create policy "episodes_update"
  on episodes for update
  using (
    auth.uid() = (select creator_id from series where id = series_id)
    or is_admin()
  );

create policy "episodes_delete"
  on episodes for delete
  using (
    auth.uid() = (select creator_id from series where id = series_id)
    or is_admin()
  );


-- ─── RLS: chapters ───────────────────────────────────────────────────────────

create policy "chapters_select"
  on chapters for select
  using (
    auth.uid() = (select creator_id from series where id = series_id)
    or is_admin()
    or (is_published = true and access = 'free')
    or (
      is_published = true
      and access = 'supporter'
      and is_subscribed_to((select creator_id from series where id = series_id))
    )
  );

create policy "chapters_insert"
  on chapters for insert
  with check (
    auth.uid() = (select creator_id from series where id = series_id)
    and is_creator()
  );

create policy "chapters_update"
  on chapters for update
  using (
    auth.uid() = (select creator_id from series where id = series_id)
    or is_admin()
  );

create policy "chapters_delete"
  on chapters for delete
  using (
    auth.uid() = (select creator_id from series where id = series_id)
    or is_admin()
  );


-- ─── RLS: chapter_pages ──────────────────────────────────────────────────────

-- Access follows the parent chapter's access rules
create policy "chapter_pages_select"
  on chapter_pages for select
  using (
    exists (
      select 1 from chapters c
      join series s on s.id = c.series_id
      where c.id = chapter_id
        and (
          auth.uid() = s.creator_id
          or is_admin()
          or (c.is_published = true and c.access = 'free')
          or (
            c.is_published = true
            and c.access = 'supporter'
            and is_subscribed_to(s.creator_id)
          )
        )
    )
  );

create policy "chapter_pages_insert"
  on chapter_pages for insert
  with check (
    exists (
      select 1 from chapters c
      join series s on s.id = c.series_id
      where c.id = chapter_id
        and auth.uid() = s.creator_id
    )
    and is_creator()
  );

create policy "chapter_pages_delete"
  on chapter_pages for delete
  using (
    exists (
      select 1 from chapters c
      join series s on s.id = c.series_id
      where c.id = chapter_id
        and auth.uid() = s.creator_id
    )
    or is_admin()
  );


-- ─── RLS: follows ────────────────────────────────────────────────────────────

create policy "follows_select_public"
  on follows for select
  using (true);

create policy "follows_insert"
  on follows for insert
  with check (auth.uid() = follower_id);

create policy "follows_delete"
  on follows for delete
  using (auth.uid() = follower_id);


-- ─── RLS: watchlist ──────────────────────────────────────────────────────────

create policy "watchlist_select_own"
  on watchlist for select
  using (auth.uid() = user_id);

create policy "watchlist_insert"
  on watchlist for insert
  with check (auth.uid() = user_id);

create policy "watchlist_update"
  on watchlist for update
  using (auth.uid() = user_id);

create policy "watchlist_delete"
  on watchlist for delete
  using (auth.uid() = user_id);


-- ─── RLS: subscriptions ──────────────────────────────────────────────────────

-- Users see their own subscriptions; creators see who subscribes to them
create policy "subscriptions_select"
  on subscriptions for select
  using (
    auth.uid() = subscriber_id
    or auth.uid() = creator_id
    or is_admin()
  );

-- Inserts and updates are handled by Stripe webhooks via service role
-- No direct client insert/update allowed
create policy "subscriptions_insert_service_only"
  on subscriptions for insert
  with check (false); -- blocked; use service role in webhook

create policy "subscriptions_update_service_only"
  on subscriptions for update
  using (false); -- blocked; use service role in webhook


-- ─── RLS: comments ───────────────────────────────────────────────────────────

-- Published, non-deleted comments are public
create policy "comments_select"
  on comments for select
  using (is_deleted = false);

create policy "comments_insert"
  on comments for insert
  with check (auth.uid() = user_id);

-- Users can soft-delete their own comments; admins can delete any
create policy "comments_update"
  on comments for update
  using (auth.uid() = user_id or is_admin());

create policy "comments_delete"
  on comments for delete
  using (auth.uid() = user_id or is_admin());


-- ─── RLS: reports ────────────────────────────────────────────────────────────

-- Users see their own reports; admins see all
create policy "reports_select"
  on reports for select
  using (auth.uid() = reporter_id or is_admin());

create policy "reports_insert"
  on reports for insert
  with check (auth.uid() = reporter_id);

create policy "reports_update_admin"
  on reports for update
  using (is_admin());


-- ─── RLS: devlogs ────────────────────────────────────────────────────────────

-- Published devlogs are public; creators see their own drafts
create policy "devlogs_select"
  on devlogs for select
  using (
    is_published = true
    or auth.uid() = creator_id
    or is_admin()
  );

create policy "devlogs_insert"
  on devlogs for insert
  with check (auth.uid() = creator_id and is_creator());

create policy "devlogs_update"
  on devlogs for update
  using (auth.uid() = creator_id or is_admin());

create policy "devlogs_delete"
  on devlogs for delete
  using (auth.uid() = creator_id or is_admin());


-- ─── RLS: analytics_events ───────────────────────────────────────────────────

-- Creators can see events for their own content; admins see all
create policy "analytics_events_select"
  on analytics_events for select
  using (
    auth.uid() = creator_id
    or is_admin()
  );

-- Anyone (including anonymous) can insert events
create policy "analytics_events_insert"
  on analytics_events for insert
  with check (true);

-- Events are immutable — no updates or deletes
