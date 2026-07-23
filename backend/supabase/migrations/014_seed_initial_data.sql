-- ============================================================
-- Migration 014: Seed Initial Data
-- Foremark CRM
-- ============================================================
-- Seeds: team members, pipeline statuses, tags, and default
-- saved views as specified in the BRD.
-- ============================================================

-- -------------------------------------------------------
-- 1. Team Members (BRD §1.3 — from mock-data.ts)
-- -------------------------------------------------------
-- Note: auth_id is NULL because users haven't signed up yet.
-- The auth trigger will link auth_id after first signup.

INSERT INTO public.users (email, name, role) VALUES
  ('amey@foremark.in',    'Amey',    'admin'),
  ('janhavi@foremark.in', 'Janhavi', 'client_manager'),
  ('tanmay@foremark.in',  'Tanmay',  'client_manager'),
  ('manish@foremark.in',  'Manish',  'sales');

-- -------------------------------------------------------
-- 2. Pipeline Statuses (BRD §2.6 — with colors from mock-data.ts)
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
-- 3. Tags (BRD §2.7 — starter tags from mock data)
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
-- 4. Default Saved Views (BRD §2.12)
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
