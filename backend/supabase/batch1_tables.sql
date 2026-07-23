-- ============================================================
-- Migration 001: Create Custom ENUM Types
-- Foremark CRM â€” BRD/FRD v1.0
-- ============================================================
-- These ENUMs are ONLY for values that are truly fixed and
-- will never be edited by a user at runtime.
-- Note: lead_status is NOT an ENUM â€” it uses a reference table
-- (see 003_create_statuses_table.sql) because BRD Â§2.6 requires
-- Admin-configurable statuses.
-- ============================================================

-- Lead source channels (BRD Â§1.4)
CREATE TYPE lead_source AS ENUM (
  'Reddit',
  'Google Business Profile',
  'Referral',
  'Website Inbound',
  'LinkedIn',
  'Cold Outreach',
  'WhatsApp',
  'Upwork',
  'Events',
  'Other'
);

-- Priority levels (BRD Â§2.5)
CREATE TYPE lead_priority AS ENUM ('Hot', 'Warm', 'Cold');

-- User roles (BRD Â§2.4)
CREATE TYPE user_role AS ENUM ('admin', 'client_manager', 'sales');

-- Activity types (BRD Â§2.9)
CREATE TYPE activity_type AS ENUM (
  'call',
  'note',
  'status_change',
  'tag_change',
  'reassignment'
);

-- Call outcomes (BRD Â§2.8)
CREATE TYPE call_outcome AS ENUM (
  'Answered',
  'Not Answered',
  'Busy',
  'Wrong Number',
  'Voicemail',
  'Call Back Requested'
);

-- Reminder status
CREATE TYPE reminder_status AS ENUM ('pending', 'completed', 'dismissed');

-- Lost reason categories (BRD Â§2.5)
CREATE TYPE lost_reason_category AS ENUM (
  'Budget',
  'Timing',
  'Went with competitor',
  'Not a fit',
  'No response',
  'Other'
);
-- ============================================================
-- Migration 002: Create Users Table
-- Foremark CRM â€” BRD Â§1.3, Â§2.3, Â§2.4
-- ============================================================
-- Team members allowed to log in. Admin pre-creates rows here
-- (the "allow-list"); Supabase Auth links via auth_id after signup.
-- ============================================================

CREATE TABLE public.users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID UNIQUE,                                    -- Linked after signup via trigger
  email       TEXT NOT NULL UNIQUE,                            -- Must match auth email
  name        TEXT NOT NULL,                                   -- Display name
  role        user_role NOT NULL DEFAULT 'sales',              -- admin | client_manager | sales
  avatar_url  TEXT,                                            -- Profile photo URL (optional)
  is_active   BOOLEAN NOT NULL DEFAULT true,                   -- Soft disable
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_role ON public.users (role);

-- Comments
COMMENT ON TABLE public.users IS 'Team members with access to the CRM. Acts as the auth allow-list.';
COMMENT ON COLUMN public.users.auth_id IS 'Linked to auth.users.id after the user signs up via Supabase Auth.';
COMMENT ON COLUMN public.users.is_active IS 'Set to false to deactivate without deleting. Middleware blocks login.';
-- ============================================================
-- Migration 003: Create Statuses Table (Admin-Configurable Pipeline)
-- Foremark CRM â€” BRD Â§2.6
-- ============================================================
-- BRD Â§2.6: "Admin should be able to edit this list
-- (add/rename/reorder/deactivate statuses) from a settings
-- screen rather than needing a code change."
--
-- This is a reference table, NOT an ENUM, so statuses can be
-- managed at runtime by Admin users.
-- ============================================================

CREATE TABLE public.statuses (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL UNIQUE,              -- Display name (e.g., "Qualified")
  slug                      TEXT NOT NULL UNIQUE,              -- Machine key (e.g., "qualified")
  display_order             INTEGER NOT NULL,                  -- Pipeline ordering (1, 2, 3...)
  color                     TEXT NOT NULL DEFAULT '#737373',   -- Hex color for UI badges
  is_active                 BOOLEAN NOT NULL DEFAULT true,     -- Soft deactivate (hide from dropdowns)
  is_terminal               BOOLEAN NOT NULL DEFAULT false,    -- true for Won, Lost, Junk
  exclude_from_conversion   BOOLEAN NOT NULL DEFAULT false,    -- true for Junk (excluded from win rate)
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_statuses_display_order ON public.statuses (display_order);
CREATE INDEX idx_statuses_active ON public.statuses (is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE public.statuses IS 'Admin-configurable lead pipeline statuses. Replaces a hardcoded ENUM.';
COMMENT ON COLUMN public.statuses.slug IS 'Machine-readable key used in code logic (e.g., checking if status is "lost" for validation).';
COMMENT ON COLUMN public.statuses.is_terminal IS 'Terminal statuses (Won, Lost, Junk) are excluded from overdue follow-up calculations.';
COMMENT ON COLUMN public.statuses.exclude_from_conversion IS 'Statuses like Junk are excluded from win/loss conversion rate metrics.';
-- ============================================================
-- Migration 004: Create Leads Table
-- Foremark CRM â€” BRD Â§2.5
-- ============================================================
-- Core lead/deal records. Every field from the BRD Â§2.5 data
-- model is represented. status_id references the statuses
-- reference table (not an ENUM).
-- ============================================================

CREATE TABLE public.leads (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL CHECK (length(name) >= 2),         -- Contact person name
  company_name            TEXT,                                            -- Optional company
  phone                   TEXT NOT NULL CHECK (length(phone) >= 10),       -- Primary phone
  email                   TEXT,                                            -- Optional contact email
  source                  lead_source NOT NULL,                            -- Channel (ENUM)
  status_id               UUID NOT NULL REFERENCES public.statuses(id),    -- Pipeline stage (reference table)
  owner_id                UUID NOT NULL REFERENCES public.users(id),       -- Assigned team member
  created_by              UUID NOT NULL REFERENCES public.users(id),       -- Who created this lead
  priority                lead_priority NOT NULL DEFAULT 'Warm',           -- Hot / Warm / Cold
  estimated_deal_value    NUMERIC(12,2) NOT NULL CHECK (estimated_deal_value >= 0),  -- Required (Decision #1)
  next_followup_date      DATE,                                            -- Next scheduled follow-up
  last_contacted_at       TIMESTAMPTZ,                                     -- Auto-updated by trigger
  lost_reason             lost_reason_category,                            -- Required when status = Lost
  lost_reason_details     TEXT,                                            -- Free-text elaboration
  custom_fields           JSONB NOT NULL DEFAULT '{}',                     -- Extensible metadata
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_leads_owner_id       ON public.leads (owner_id);
CREATE INDEX idx_leads_status_id      ON public.leads (status_id);
CREATE INDEX idx_leads_source         ON public.leads (source);
CREATE INDEX idx_leads_priority       ON public.leads (priority);
CREATE INDEX idx_leads_created_at     ON public.leads (created_at DESC);
CREATE INDEX idx_leads_status_owner   ON public.leads (status_id, owner_id);

-- Partial index for overdue follow-up queries (BRD Â§2.10)
CREATE INDEX idx_leads_next_followup  ON public.leads (next_followup_date)
  WHERE next_followup_date IS NOT NULL;

-- Full-text search index for global search (BRD Â§2.12)
-- Searches across name, company, phone, and email
CREATE INDEX idx_leads_search ON public.leads
  USING GIN (to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(company_name, '') || ' ' ||
    coalesce(phone, '') || ' ' ||
    coalesce(email, '')
  ));

-- Comments
COMMENT ON TABLE public.leads IS 'Core lead/deal records. Every lead from every source lives here.';
COMMENT ON COLUMN public.leads.status_id IS 'FK to statuses table â€” Admin-configurable, not a hardcoded ENUM.';
COMMENT ON COLUMN public.leads.estimated_deal_value IS 'Required per team decision. Powers Pipeline Value dashboard widget.';
COMMENT ON COLUMN public.leads.custom_fields IS 'JSONB for extensible metadata without schema changes.';
COMMENT ON COLUMN public.leads.last_contacted_at IS 'Auto-updated by trigger when a call activity is logged.';
-- ============================================================
-- Migration 005: Create Activities Table
-- Foremark CRM â€” BRD Â§2.8, Â§2.9
-- ============================================================
-- Timeline entries combining: call logs, manual notes, status
-- changes, tag changes, and reassignments. This is the
-- "what happened with this lead" view.
-- ============================================================

CREATE TABLE public.activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type            activity_type NOT NULL,                                      -- call | note | status_change | tag_change | reassignment
  outcome         call_outcome,                                                -- Only for type = 'call'
  notes           TEXT,                                                        -- Free-text (max 2000 at app level)
  from_status_id  UUID REFERENCES public.statuses(id),                         -- For status_change
  to_status_id    UUID REFERENCES public.statuses(id),                         -- For status_change
  from_owner_id   UUID REFERENCES public.users(id),                            -- For reassignment
  to_owner_id     UUID REFERENCES public.users(id),                            -- For reassignment
  created_by      UUID NOT NULL REFERENCES public.users(id),                   -- Who performed this
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_activities_lead_id       ON public.activities (lead_id);
CREATE INDEX idx_activities_created_at    ON public.activities (created_at DESC);
CREATE INDEX idx_activities_lead_created  ON public.activities (lead_id, created_at DESC);
CREATE INDEX idx_activities_type          ON public.activities (type);

-- Partial index for "calls made this week" leaderboard (BRD Â§2.10)
CREATE INDEX idx_activities_calls ON public.activities (created_by, created_at DESC)
  WHERE type = 'call';

-- Comments
COMMENT ON TABLE public.activities IS 'Unified timeline combining calls, notes, status changes, tag changes, and reassignments.';
COMMENT ON COLUMN public.activities.outcome IS 'Only populated when type = call. Validated by trigger.';
COMMENT ON COLUMN public.activities.from_status_id IS 'Only populated when type = status_change. Set by trigger.';
COMMENT ON COLUMN public.activities.from_owner_id IS 'Only populated when type = reassignment. Set by trigger.';
-- ============================================================
-- Migration 006: Create Tags & Lead_Tags Tables
-- Foremark CRM â€” BRD Â§2.7
-- ============================================================
-- Tags are separate from Status and Source â€” a flexible,
-- internal-use layer. Admin creates/edits/deactivates tags;
-- any team member can apply existing tags to a lead.
-- ============================================================

-- Tags: Admin-managed tag list
CREATE TABLE public.tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,                        -- Tag display name
  category    TEXT,                                        -- Grouping (e.g., "Industry", "Service")
  is_active   BOOLEAN NOT NULL DEFAULT true,               -- Soft deactivate
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tags_active ON public.tags (is_active) WHERE is_active = true;

-- Lead_Tags: Many-to-many join
CREATE TABLE public.lead_tags (
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, tag_id)                            -- Composite PK prevents duplicates
);

-- Reverse lookup index: "all leads with tag X"
CREATE INDEX idx_lead_tags_tag_id ON public.lead_tags (tag_id);

-- Comments
COMMENT ON TABLE public.tags IS 'Admin-managed tags for flexible lead categorization (Industry, Service, Deal Size, etc.)';
COMMENT ON TABLE public.lead_tags IS 'Many-to-many join between leads and tags. Multiple tags per lead supported.';
-- ============================================================
-- Migration 007: Create Reminders Table
-- Foremark CRM â€” BRD Â§2.11
-- ============================================================
-- Follow-up due dates / tasks. Drives the in-app reminder
-- badges and the "overdue follow-ups" dashboard widget.
-- ============================================================

CREATE TABLE public.reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,                                    -- Short description
  due_date      TIMESTAMPTZ NOT NULL,                             -- When the reminder is due
  status        reminder_status NOT NULL DEFAULT 'pending',       -- pending | completed | dismissed
  assigned_to   UUID NOT NULL REFERENCES public.users(id),        -- Who needs to act
  created_by    UUID NOT NULL REFERENCES public.users(id),        -- Who created it
  completed_at  TIMESTAMPTZ,                                      -- When marked done
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial index for "my pending reminders" queries
CREATE INDEX idx_reminders_assigned_due ON public.reminders (assigned_to, due_date)
  WHERE status = 'pending';

-- Reminders for a specific lead
CREATE INDEX idx_reminders_lead_id ON public.reminders (lead_id);

-- Comments
COMMENT ON TABLE public.reminders IS 'Follow-up reminders/tasks. Powers in-app badges and daily email digest.';
COMMENT ON COLUMN public.reminders.completed_at IS 'Timestamp of when the reminder was marked completed or dismissed.';
-- ============================================================
-- Migration 008: Create Lead Status History Table
-- Foremark CRM â€” BRD Â§2.6, Â§2.13 (Auditability)
-- ============================================================
-- Audit trail of every status change. Separate from activities
-- for focused pipeline analytics (time-in-stage, conversion
-- funnels). Populated exclusively by trigger â€” never by
-- direct user INSERT.
-- ============================================================

CREATE TABLE public.lead_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_status_id  UUID NOT NULL REFERENCES public.statuses(id),  -- Previous status
  to_status_id    UUID NOT NULL REFERENCES public.statuses(id),  -- New status
  changed_by      UUID NOT NULL REFERENCES public.users(id),     -- Who changed it
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit trail per lead, newest first
CREATE INDEX idx_status_history_lead ON public.lead_status_history (lead_id, created_at DESC);

-- Comments
COMMENT ON TABLE public.lead_status_history IS 'Immutable audit trail of status changes. Written only by database trigger.';
-- ============================================================
-- Migration 009: Create Saved Views Table
-- Foremark CRM â€” BRD Â§2.12
-- ============================================================
-- User-specific filter presets. BRD Â§2.12: "Saved views
-- (e.g. 'My open leads', 'Overdue follow-ups', 'Hot leads
-- this week') â€” at least a few sensible defaults out of the box."
-- ============================================================

CREATE TABLE public.saved_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,                                -- Display name
  filters     JSONB NOT NULL,                               -- Serialized filter state
  is_default  BOOLEAN NOT NULL DEFAULT false,               -- Load this view by default
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fetch a user's saved views
CREATE INDEX idx_saved_views_user ON public.saved_views (user_id);

-- Comments
COMMENT ON TABLE public.saved_views IS 'Per-user saved filter presets for the leads list view.';
COMMENT ON COLUMN public.saved_views.filters IS 'JSONB storing the filter state: {status, source, owner, priority, tags, dateFrom, dateTo}.';
-- ============================================================
-- Migration 010: Create Helper Functions
-- Foremark CRM
-- ============================================================
-- Helper functions for RLS policies and triggers.
-- SECURITY DEFINER so they can access tables regardless of
-- the calling user's RLS context.
-- ============================================================

-- Get the current user's role from the users table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get the current user's internal UUID from the users table
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION public.get_user_role() IS 'Returns the role of the currently authenticated user. Used in RLS policies.';
COMMENT ON FUNCTION public.get_user_id() IS 'Returns the internal users.id of the currently authenticated user. Used in RLS policies.';
COMMENT ON FUNCTION public.set_updated_at() IS 'Generic trigger function to auto-update updated_at timestamp.';
