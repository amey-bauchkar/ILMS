-- ============================================================
-- Foremark CRM — Unified Database Schema & Initial Seed
-- Consolidates Migrations 001 to 015
-- ============================================================

-- ============================================================
-- SECTION 1: CUSTOM ENUM TYPES
-- ============================================================

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

CREATE TYPE lead_priority AS ENUM ('Hot', 'Warm', 'Cold');

CREATE TYPE user_role AS ENUM ('admin', 'client_manager', 'sales');

CREATE TYPE activity_type AS ENUM (
  'call',
  'note',
  'status_change',
  'tag_change',
  'reassignment'
);

CREATE TYPE call_outcome AS ENUM (
  'Answered',
  'Not Answered',
  'Busy',
  'Wrong Number',
  'Voicemail',
  'Call Back Requested'
);

CREATE TYPE reminder_status AS ENUM ('pending', 'completed', 'dismissed');

CREATE TYPE lost_reason_category AS ENUM (
  'Budget',
  'Timing',
  'Went with competitor',
  'Not a fit',
  'No response',
  'Other'
);

-- ============================================================
-- SECTION 2: TABLES
-- ============================================================

-- 1. Users Table (Team members & Auth Allowlist)
CREATE TABLE public.users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID UNIQUE,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'sales',
  avatar_url  TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON public.users (role);

-- 2. Statuses Table (Admin-configurable lead pipeline)
CREATE TABLE public.statuses (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL UNIQUE,
  slug                      TEXT NOT NULL UNIQUE,
  display_order             INTEGER NOT NULL,
  color                     TEXT NOT NULL DEFAULT '#737373',
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  is_terminal               BOOLEAN NOT NULL DEFAULT false,
  exclude_from_conversion   BOOLEAN NOT NULL DEFAULT false,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_statuses_display_order ON public.statuses (display_order);
CREATE INDEX idx_statuses_active ON public.statuses (is_active) WHERE is_active = true;

-- 3. Leads Table
CREATE TABLE public.leads (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL CHECK (length(name) >= 2),
  company_name            TEXT,
  phone                   TEXT NOT NULL CHECK (length(phone) >= 10),
  email                   TEXT,
  source                  lead_source NOT NULL,
  status_id               UUID NOT NULL REFERENCES public.statuses(id),
  owner_id                UUID NOT NULL REFERENCES public.users(id),
  created_by              UUID NOT NULL REFERENCES public.users(id),
  priority                lead_priority NOT NULL DEFAULT 'Warm',
  estimated_deal_value    NUMERIC(12,2) NOT NULL CHECK (estimated_deal_value >= 0),
  next_followup_date      DATE,
  last_contacted_at       TIMESTAMPTZ,
  lost_reason             lost_reason_category,
  lost_reason_details     TEXT,
  custom_fields           JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_owner_id       ON public.leads (owner_id);
CREATE INDEX idx_leads_status_id      ON public.leads (status_id);
CREATE INDEX idx_leads_source         ON public.leads (source);
CREATE INDEX idx_leads_priority       ON public.leads (priority);
CREATE INDEX idx_leads_created_at     ON public.leads (created_at DESC);
CREATE INDEX idx_leads_status_owner   ON public.leads (status_id, owner_id);
CREATE INDEX idx_leads_next_followup  ON public.leads (next_followup_date) WHERE next_followup_date IS NOT NULL;

CREATE INDEX idx_leads_search ON public.leads
  USING GIN (to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(company_name, '') || ' ' ||
    coalesce(phone, '') || ' ' ||
    coalesce(email, '')
  ));

-- 4. Activities Table (Timeline combining calls, notes, status changes, reassignments)
CREATE TABLE public.activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type            activity_type NOT NULL,
  outcome         call_outcome,
  notes           TEXT,
  from_status_id  UUID REFERENCES public.statuses(id),
  to_status_id    UUID REFERENCES public.statuses(id),
  from_owner_id   UUID REFERENCES public.users(id),
  to_owner_id     UUID REFERENCES public.users(id),
  created_by      UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_lead_id       ON public.activities (lead_id);
CREATE INDEX idx_activities_created_at    ON public.activities (created_at DESC);
CREATE INDEX idx_activities_lead_created  ON public.activities (lead_id, created_at DESC);
CREATE INDEX idx_activities_type          ON public.activities (type);
CREATE INDEX idx_activities_calls         ON public.activities (created_by, created_at DESC) WHERE type = 'call';

-- 5. Tags & Lead_Tags Tables
CREATE TABLE public.tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  category    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tags_active ON public.tags (is_active) WHERE is_active = true;

CREATE TABLE public.lead_tags (
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, tag_id)
);

CREATE INDEX idx_lead_tags_tag_id ON public.lead_tags (tag_id);

-- 6. Reminders Table
CREATE TABLE public.reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  due_date      TIMESTAMPTZ NOT NULL,
  status        reminder_status NOT NULL DEFAULT 'pending',
  assigned_to   UUID NOT NULL REFERENCES public.users(id),
  created_by    UUID NOT NULL REFERENCES public.users(id),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_assigned_due ON public.reminders (assigned_to, due_date) WHERE status = 'pending';
CREATE INDEX idx_reminders_lead_id      ON public.reminders (lead_id);

-- 7. Lead Status History Table (Audit Trail)
CREATE TABLE public.lead_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_status_id  UUID NOT NULL REFERENCES public.statuses(id),
  to_status_id    UUID NOT NULL REFERENCES public.statuses(id),
  changed_by      UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_history_lead ON public.lead_status_history (lead_id, created_at DESC);

-- 8. Saved Views Table
CREATE TABLE public.saved_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  filters     JSONB NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_views_user ON public.saved_views (user_id);

-- ============================================================
-- SECTION 3: HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SECTION 4: TRIGGERS
-- ============================================================

-- 1. Auto-update updated_at
CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. Lead Status Change → History + Activity
CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.lead_status_history (lead_id, from_status_id, to_status_id, changed_by)
  VALUES (NEW.id, OLD.status_id, NEW.status_id, public.get_user_id());

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

-- 3. Lead Reassignment → Activity
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

-- 4. Call Activity → Update last_contacted_at
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

-- 5. Lost Status Validation
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

-- 6. Activity Validation
CREATE OR REPLACE FUNCTION public.validate_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'call' THEN
    IF NEW.outcome IS NULL THEN
      RAISE EXCEPTION 'outcome is required for call activities';
    END IF;
    IF NEW.outcome = 'Answered' AND (NEW.notes IS NULL OR trim(NEW.notes) = '') THEN
      RAISE EXCEPTION 'notes are required when call outcome is Answered';
    END IF;
  END IF;

  IF NEW.type = 'status_change' THEN
    IF NEW.from_status_id IS NULL OR NEW.to_status_id IS NULL THEN
      RAISE EXCEPTION 'from_status_id and to_status_id are required for status_change activities';
    END IF;
  END IF;

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

-- 7. Auth Allow-List Enforcement (BEFORE INSERT safely rejecting uninvited emails)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  invited_user record;
BEGIN
  SELECT * INTO invited_user
  FROM public.users
  WHERE email = NEW.email;

  IF invited_user IS NULL THEN
    RAISE EXCEPTION 'Unauthorized signup: Email % is not invited', NEW.email;
  END IF;

  IF invited_user.is_active = false THEN
    RAISE EXCEPTION 'Account is deactivated: Email %', NEW.email;
  END IF;

  UPDATE public.users
  SET auth_id = NEW.id,
      is_active = true,
      updated_at = now()
  WHERE id = invited_user.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_new_auth_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- SECTION 5: ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY users_select_all ON public.users FOR SELECT USING (true);
CREATE POLICY users_insert_admin ON public.users FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY users_update_admin ON public.users FOR UPDATE USING (public.get_user_role() = 'admin');

-- Leads policies
CREATE POLICY leads_select_all ON public.leads FOR SELECT USING (true);
CREATE POLICY leads_insert_all ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY leads_update_admin ON public.leads FOR UPDATE USING (public.get_user_role() = 'admin');
CREATE POLICY leads_update_own ON public.leads FOR UPDATE USING (owner_id = public.get_user_id());
CREATE POLICY leads_delete_admin ON public.leads FOR DELETE USING (public.get_user_role() = 'admin');

-- Statuses policies
CREATE POLICY statuses_select_all ON public.statuses FOR SELECT USING (true);
CREATE POLICY statuses_insert_admin ON public.statuses FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY statuses_update_admin ON public.statuses FOR UPDATE USING (public.get_user_role() = 'admin');
CREATE POLICY statuses_delete_admin ON public.statuses FOR DELETE USING (public.get_user_role() = 'admin');

-- Activities policies
CREATE POLICY activities_select_all ON public.activities FOR SELECT USING (true);
CREATE POLICY activities_insert_all ON public.activities FOR INSERT WITH CHECK (true);

-- Tags policies
CREATE POLICY tags_select_all ON public.tags FOR SELECT USING (true);
CREATE POLICY tags_insert_admin ON public.tags FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY tags_update_admin ON public.tags FOR UPDATE USING (public.get_user_role() = 'admin');
CREATE POLICY tags_delete_admin ON public.tags FOR DELETE USING (public.get_user_role() = 'admin');

-- Lead_tags policies
CREATE POLICY lead_tags_select_all ON public.lead_tags FOR SELECT USING (true);
CREATE POLICY lead_tags_insert_all ON public.lead_tags FOR INSERT WITH CHECK (true);
CREATE POLICY lead_tags_delete_all ON public.lead_tags FOR DELETE USING (true);

-- Reminders policies
CREATE POLICY reminders_select_all ON public.reminders FOR SELECT USING (true);
CREATE POLICY reminders_insert_all ON public.reminders FOR INSERT WITH CHECK (true);
CREATE POLICY reminders_update_all ON public.reminders FOR UPDATE USING (true);
CREATE POLICY reminders_delete_admin ON public.reminders FOR DELETE USING (public.get_user_role() = 'admin');

-- Status history policies
CREATE POLICY status_history_select_all ON public.lead_status_history FOR SELECT USING (true);

-- Saved views policies
CREATE POLICY saved_views_select_own ON public.saved_views FOR SELECT USING (user_id = public.get_user_id());
CREATE POLICY saved_views_insert_own ON public.saved_views FOR INSERT WITH CHECK (user_id = public.get_user_id());
CREATE POLICY saved_views_update_own ON public.saved_views FOR UPDATE USING (user_id = public.get_user_id());
CREATE POLICY saved_views_delete_own ON public.saved_views FOR DELETE USING (user_id = public.get_user_id());

-- ============================================================
-- SECTION 6: STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'audio/mpeg',
    'audio/wav'
  ]
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_attachments_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments');

CREATE POLICY storage_attachments_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments');

CREATE POLICY storage_attachments_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.get_user_role() = 'admin'
  );

-- ============================================================
-- SECTION 7: INITIAL SEED DATA
-- ============================================================

-- 1. Team Members (Allowlist)
INSERT INTO public.users (email, name, role) VALUES
  ('amey@foremark.in',       'Amey',        'admin'),
  ('janhavi@foremark.in',    'Janhavi',     'client_manager'),
  ('tanmay@foremark.in',     'Tanmay',      'client_manager'),
  ('manish@foremark.in',     'Manish',      'sales'),
  ('tripspahila@gmail.com',  'Admin User',  'admin')
ON CONFLICT (email) DO UPDATE 
  SET name = EXCLUDED.name, role = EXCLUDED.role;

-- 2. Pipeline Statuses
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
  ('Junk',              'junk',               10, '#525252', true,  true)
ON CONFLICT (name) DO NOTHING;

-- 3. Starter Tags
INSERT INTO public.tags (name, category) VALUES
  ('High Intent',     'Priority'),
  ('IT Services',     'Industry'),
  ('Logistics',       'Industry'),
  ('Manufacturing',   'Industry'),
  ('FinTech',         'Industry'),
  ('E-commerce',      'Industry'),
  ('SaaS',            'Industry'),
  ('Retail',          'Industry'),
  ('Export',          'Industry'),
  ('B2B',             'Industry'),
  ('Construction',    'Industry'),
  ('Healthcare',      'Industry'),
  ('Agriculture',     'Industry'),
  ('Real Estate',     'Industry'),
  ('D2C',             'Industry'),
  ('Website Rebuild', 'Service'),
  ('CRM Setup',       'Service'),
  ('Automation',      'Service'),
  ('Retainer',        'Deal Type'),
  ('Enterprise',      'Deal Size'),
  ('Large Deal',      'Deal Size')
ON CONFLICT (name) DO NOTHING;

-- 4. Default Saved Views
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM public.users WHERE email = 'amey@foremark.in';
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.saved_views (user_id, name, filters, is_default) VALUES
      (admin_id, 'My Open Leads', '{"owner": "self", "excludeTerminal": true}'::jsonb, true),
      (admin_id, 'Overdue Follow-ups', '{"followupOverdue": true, "excludeTerminal": true}'::jsonb, false),
      (admin_id, 'Hot Leads This Week', '{"priority": "Hot", "createdThisWeek": true}'::jsonb, false)
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO admin_id FROM public.users WHERE email = 'tripspahila@gmail.com';
  IF admin_id IS NOT NULL THEN
    INSERT INTO public.saved_views (user_id, name, filters, is_default) VALUES
      (admin_id, 'My Open Leads', '{"owner": "self", "excludeTerminal": true}'::jsonb, true),
      (admin_id, 'Overdue Follow-ups', '{"followupOverdue": true, "excludeTerminal": true}'::jsonb, false),
      (admin_id, 'Hot Leads This Week', '{"priority": "Hot", "createdThisWeek": true}'::jsonb, false)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
