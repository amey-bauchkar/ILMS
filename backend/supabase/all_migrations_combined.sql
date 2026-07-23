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
-- ============================================================
-- Migration 011: Create Triggers
-- Foremark CRM â€” BRD Â§2.6, Â§2.8, Â§2.9, Â§2.13
-- ============================================================

-- -------------------------------------------------------
-- 1. Auto-update updated_at on leads and users
-- -------------------------------------------------------
CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------
-- 2. Lead Status Change â†’ History + Activity
-- BRD Â§2.6: "Every status change is logged automatically"
-- BRD Â§2.13: "Every status change and reassignment is
-- logged with who/when"
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert audit trail
  INSERT INTO public.lead_status_history (lead_id, from_status_id, to_status_id, changed_by)
  VALUES (NEW.id, OLD.status_id, NEW.status_id, public.get_user_id());

  -- Insert timeline activity
  INSERT INTO public.activities (lead_id, type, from_status_id, to_status_id, created_by)
  VALUES (NEW.id, 'status_change', OLD.status_id, NEW.status_id, public.get_user_id());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_lead_status_change
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  WHEN (OLD.status_id IS DISTINCT FROM NEW.status_id)
  EXECUTE FUNCTION public.handle_lead_status_change();

-- -------------------------------------------------------
-- 3. Lead Reassignment â†’ Activity
-- BRD Â§2.9: "Reassignments appear automatically in the
-- timeline (system-generated entries)"
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_lead_reassignment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities (lead_id, type, from_owner_id, to_owner_id, created_by)
  VALUES (NEW.id, 'reassignment', OLD.owner_id, NEW.owner_id, public.get_user_id());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_lead_reassignment
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  WHEN (OLD.owner_id IS DISTINCT FROM NEW.owner_id)
  EXECUTE FUNCTION public.handle_lead_reassignment();

-- -------------------------------------------------------
-- 4. Call Activity â†’ Update last_contacted_at
-- BRD Â§2.8: "updates 'Last Contacted Date' automatically"
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_call_contact_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.leads
  SET last_contacted_at = NEW.created_at
  WHERE id = NEW.lead_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_call_updates_last_contact
  AFTER INSERT ON public.activities
  FOR EACH ROW
  WHEN (NEW.type = 'call')
  EXECUTE FUNCTION public.handle_call_contact_update();

-- -------------------------------------------------------
-- 5. Lost Status Validation
-- BRD Â§2.5: "Lost Reason â€” Required only when status
-- is set to 'Lost'"
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_lost_reason()
RETURNS TRIGGER AS $$
DECLARE
  lost_status_id UUID;
BEGIN
  SELECT id INTO lost_status_id FROM public.statuses WHERE slug = 'lost';

  IF NEW.status_id = lost_status_id AND NEW.lost_reason IS NULL THEN
    RAISE EXCEPTION 'lost_reason is required when status is set to Lost';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE TRIGGER trigger_validate_lost_reason
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lost_reason();

-- -------------------------------------------------------
-- 6. Activity Validation
-- BRD Â§2.8: Call outcome required; notes required when
-- Answered; status_change needs from/to; reassignment
-- needs from/to owner.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Call validation
  IF NEW.type = 'call' THEN
    IF NEW.outcome IS NULL THEN
      RAISE EXCEPTION 'outcome is required for call activities';
    END IF;
    IF NEW.outcome = 'Answered' AND (NEW.notes IS NULL OR trim(NEW.notes) = '') THEN
      RAISE EXCEPTION 'notes are required when call outcome is Answered (BRD Â§2.8 Step 2)';
    END IF;
  END IF;

  -- Status change validation
  IF NEW.type = 'status_change' THEN
    IF NEW.from_status_id IS NULL OR NEW.to_status_id IS NULL THEN
      RAISE EXCEPTION 'from_status_id and to_status_id are required for status_change activities';
    END IF;
  END IF;

  -- Reassignment validation
  IF NEW.type = 'reassignment' THEN
    IF NEW.from_owner_id IS NULL OR NEW.to_owner_id IS NULL THEN
      RAISE EXCEPTION 'from_owner_id and to_owner_id are required for reassignment activities';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_activity
  BEFORE INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_activity();

-- -------------------------------------------------------
-- 7. Auth Allow-List Enforcement
-- BRD Â§2.3: "Only pre-approved email addresses can log in.
-- Sign-in attempts from any other email are rejected."
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Check if email exists in our allow-list (users table)
  SELECT id, is_active INTO user_record
  FROM public.users
  WHERE email = NEW.email;

  -- If email not found â†’ block signup by deleting the auth row
  IF user_record IS NULL THEN
    DELETE FROM auth.users WHERE id = NEW.id;
    RETURN NULL;
  END IF;

  -- If user is deactivated â†’ block signup
  IF user_record.is_active = false THEN
    DELETE FROM auth.users WHERE id = NEW.id;
    RETURN NULL;
  END IF;

  -- Email found and active â†’ link auth_id
  UPDATE public.users
  SET auth_id = NEW.id
  WHERE email = NEW.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Comments
COMMENT ON FUNCTION public.handle_lead_status_change() IS 'Auto-creates audit trail + timeline entry on status change.';
COMMENT ON FUNCTION public.handle_lead_reassignment() IS 'Auto-creates timeline entry on lead reassignment.';
COMMENT ON FUNCTION public.handle_call_contact_update() IS 'Auto-updates leads.last_contacted_at when a call is logged.';
COMMENT ON FUNCTION public.validate_lost_reason() IS 'Enforces that lost_reason is required when status is Lost.';
COMMENT ON FUNCTION public.validate_activity() IS 'Enforces data integrity rules for different activity types.';
COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Auth allow-list gate: blocks signups from unregistered/deactivated emails.';
-- ============================================================
-- Migration 012: Create RLS Policies
-- Foremark CRM â€” BRD Â§2.4 (Roles & Permissions Matrix)
-- ============================================================
-- Every policy maps directly to the BRD Â§2.4 permission table.
-- RLS is enforced at the database level, independent of the
-- frontend UI (BRD Â§2.13 Security requirement).
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- ===================
-- USERS policies
-- ===================
-- Everyone can see team members (for dropdowns, assignments)
CREATE POLICY users_select_all ON public.users
  FOR SELECT USING (true);

-- Only Admin can add team members (BRD Â§2.4: "Add/remove team members â€” Admin only")
CREATE POLICY users_insert_admin ON public.users
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

-- Only Admin can edit team members
CREATE POLICY users_update_admin ON public.users
  FOR UPDATE USING (public.get_user_role() = 'admin');

-- ===================
-- LEADS policies
-- ===================
-- "View all leads (company-wide)" â€” Yes for all roles (BRD Â§2.4)
CREATE POLICY leads_select_all ON public.leads
  FOR SELECT USING (true);

-- Any authenticated user can create a lead
CREATE POLICY leads_insert_all ON public.leads
  FOR INSERT WITH CHECK (true);

-- Admin can edit any lead (BRD Â§2.4: "Edit/update others' leads â€” Yes")
CREATE POLICY leads_update_admin ON public.leads
  FOR UPDATE USING (public.get_user_role() = 'admin');

-- CM and Sales can only edit their own assigned leads
-- (BRD Â§2.4: "Edit/update only own assigned leads â€” Yes")
CREATE POLICY leads_update_own ON public.leads
  FOR UPDATE USING (owner_id = public.get_user_id());

-- Only Admin can delete leads
-- (BRD Â§2.4: "Delete a lead â€” Admin: Yes, CM: No, Sales: No")
CREATE POLICY leads_delete_admin ON public.leads
  FOR DELETE USING (public.get_user_role() = 'admin');

-- ===================
-- STATUSES policies
-- ===================
-- Everyone can see statuses (for dropdowns, pipeline view)
CREATE POLICY statuses_select_all ON public.statuses
  FOR SELECT USING (true);

-- Only Admin can manage statuses
-- (BRD Â§2.4: "Create/edit custom tags & statuses â€” Admin: Yes")
CREATE POLICY statuses_insert_admin ON public.statuses
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY statuses_update_admin ON public.statuses
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY statuses_delete_admin ON public.statuses
  FOR DELETE USING (public.get_user_role() = 'admin');

-- ===================
-- ACTIVITIES policies
-- ===================
-- All users can read all activities (company-wide timeline)
CREATE POLICY activities_select_all ON public.activities
  FOR SELECT USING (true);

-- Users can only create activities as themselves
CREATE POLICY activities_insert_own ON public.activities
  FOR INSERT WITH CHECK (created_by = public.get_user_id());

-- ===================
-- TAGS policies
-- ===================
-- Everyone can see tags
CREATE POLICY tags_select_all ON public.tags
  FOR SELECT USING (true);

-- Only Admin can manage tags
-- (BRD Â§2.4: "Create/edit custom tags & statuses â€” Admin: Yes, CM: No, Sales: No")
CREATE POLICY tags_insert_admin ON public.tags
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY tags_update_admin ON public.tags
  FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY tags_delete_admin ON public.tags
  FOR DELETE USING (public.get_user_role() = 'admin');

-- ===================
-- LEAD_TAGS policies
-- ===================
-- Everyone can see tag assignments
CREATE POLICY lead_tags_select_all ON public.lead_tags
  FOR SELECT USING (true);

-- Admin or lead owner can apply tags
-- (BRD Â§2.7: "any team member can apply existing tags to a lead")
CREATE POLICY lead_tags_insert ON public.lead_tags
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_id AND leads.owner_id = public.get_user_id()
    )
  );

-- Admin or lead owner can remove tags
CREATE POLICY lead_tags_delete ON public.lead_tags
  FOR DELETE USING (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = lead_id AND leads.owner_id = public.get_user_id()
    )
  );

-- ===================
-- REMINDERS policies
-- ===================
-- All users can see all reminders
CREATE POLICY reminders_select_all ON public.reminders
  FOR SELECT USING (true);

-- Any user can create a reminder
CREATE POLICY reminders_insert_all ON public.reminders
  FOR INSERT WITH CHECK (true);

-- Assignee or Admin can update (complete/dismiss)
CREATE POLICY reminders_update_own ON public.reminders
  FOR UPDATE USING (
    assigned_to = public.get_user_id()
    OR public.get_user_role() = 'admin'
  );

-- ===================
-- LEAD_STATUS_HISTORY policies
-- ===================
-- Read-only for all (writes are via trigger only)
CREATE POLICY status_history_select_all ON public.lead_status_history
  FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policies for users â€” only triggers write here

-- ===================
-- SAVED_VIEWS policies
-- ===================
-- Users can only see/manage their own saved views
CREATE POLICY saved_views_select_own ON public.saved_views
  FOR SELECT USING (user_id = public.get_user_id());

CREATE POLICY saved_views_insert_own ON public.saved_views
  FOR INSERT WITH CHECK (user_id = public.get_user_id());

CREATE POLICY saved_views_update_own ON public.saved_views
  FOR UPDATE USING (user_id = public.get_user_id());

CREATE POLICY saved_views_delete_own ON public.saved_views
  FOR DELETE USING (user_id = public.get_user_id());
-- ============================================================
-- Migration 013: Create Supabase Storage Bucket
-- Foremark CRM â€” BRD Â§2.1
-- ============================================================
-- BRD Â§2.1: "Supabase Storage â€” For any attachments
-- (e.g. shared documents, call recordings if added later)."
--
-- Infrastructure is set up now so it doesn't require a
-- migration later. File upload UI is Phase 2.
-- ============================================================

-- Create the private attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,                                   -- Private: authenticated users only
  10485760,                                -- 10 MB max file size
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'audio/mpeg',
    'audio/wav'
  ]
);

-- Storage RLS: Authenticated users can upload
CREATE POLICY storage_attachments_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments');

-- Storage RLS: Authenticated users can read
CREATE POLICY storage_attachments_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments');

-- Storage RLS: Only Admin can delete
CREATE POLICY storage_attachments_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.get_user_role() = 'admin'
  );
-- ============================================================
-- Migration 014: Seed Initial Data
-- Foremark CRM
-- ============================================================
-- Seeds: team members, pipeline statuses, tags, and default
-- saved views as specified in the BRD.
-- ============================================================

-- -------------------------------------------------------
-- 1. Team Members (BRD Â§1.3 â€” from mock-data.ts)
-- -------------------------------------------------------
-- Note: auth_id is NULL because users haven't signed up yet.
-- The auth trigger will link auth_id after first signup.

INSERT INTO public.users (email, name, role) VALUES
  ('amey@foremark.in',    'Amey',    'admin'),
  ('janhavi@foremark.in', 'Janhavi', 'client_manager'),
  ('tanmay@foremark.in',  'Tanmay',  'client_manager'),
  ('manish@foremark.in',  'Manish',  'sales');

-- -------------------------------------------------------
-- 2. Pipeline Statuses (BRD Â§2.6 â€” with colors from mock-data.ts)
-- -------------------------------------------------------
INSERT INTO public.statuses (name, slug, display_order, color, is_terminal, exclude_from_conversion) VALUES
  ('New',               'new',                1,  '#737373', false, false),
  ('Attempted Contact', 'attempted_contact',  2,  '#3b82f6', false, false),
  ('Contacted',         'contacted',          3,  '#06b6d4', false, false),
  ('Qualified',         'qualified',          4,  '#8b5cf6', false, false),
  ('Proposal Sent',     'proposal_sent',      5,  '#6366f1', false, false),
  ('Negotiation',       'negotiation',        6,  '#e87811', false, false),
  ('Won',               'won',                7,  '#22c55e', true,  false),
  ('Lost',              'lost',               8,  '#ef4444', true,  false),
  ('On Hold',           'on_hold',            9,  '#eab308', false, false),
  ('Junk',              'junk',               10, '#525252', true,  true);

-- -------------------------------------------------------
-- 3. Tags (BRD Â§2.7 â€” starter tags from mock data)
-- -------------------------------------------------------
-- Priority tags
INSERT INTO public.tags (name, category) VALUES
  ('High Intent', 'Priority');

-- Industry tags
INSERT INTO public.tags (name, category) VALUES
  ('IT Services',    'Industry'),
  ('Logistics',      'Industry'),
  ('Manufacturing',  'Industry'),
  ('FinTech',        'Industry'),
  ('E-commerce',     'Industry'),
  ('SaaS',           'Industry'),
  ('Retail',         'Industry'),
  ('Export',         'Industry'),
  ('B2B',            'Industry'),
  ('Construction',   'Industry'),
  ('Healthcare',     'Industry'),
  ('Agriculture',    'Industry'),
  ('Real Estate',    'Industry'),
  ('D2C',            'Industry');

-- Service interest tags
INSERT INTO public.tags (name, category) VALUES
  ('Website Rebuild', 'Service'),
  ('CRM Setup',       'Service'),
  ('Automation',      'Service');

-- Deal tags
INSERT INTO public.tags (name, category) VALUES
  ('Retainer',     'Deal Type'),
  ('Enterprise',   'Deal Size'),
  ('Large Deal',   'Deal Size');

-- -------------------------------------------------------
-- 4. Default Saved Views (BRD Â§2.12)
-- "at least a few sensible defaults out of the box"
-- -------------------------------------------------------
-- These are created as system-level views for the first admin user.
-- Each user can later create their own.

-- Get Amey's user ID for the default views
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM public.users WHERE email = 'amey@foremark.in';

  INSERT INTO public.saved_views (user_id, name, filters, is_default) VALUES
    (
      admin_id,
      'My Open Leads',
      '{"owner": "self", "excludeTerminal": true}'::jsonb,
      true
    ),
    (
      admin_id,
      'Overdue Follow-ups',
      '{"followupOverdue": true, "excludeTerminal": true}'::jsonb,
      false
    ),
    (
      admin_id,
      'Hot Leads This Week',
      '{"priority": "Hot", "createdThisWeek": true}'::jsonb,
      false
    );
END $$;
