-- ============================================================
-- Migration 012: Create RLS Policies
-- Foremark CRM — BRD §2.4 (Roles & Permissions Matrix)
-- ============================================================
-- Every policy maps directly to the BRD §2.4 permission table.
-- RLS is enforced at the database level, independent of the
-- frontend UI (BRD §2.13 Security requirement).
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

-- Only Admin can add team members (BRD §2.4: "Add/remove team members — Admin only")
CREATE POLICY users_insert_admin ON public.users
  FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

-- Only Admin can edit team members
CREATE POLICY users_update_admin ON public.users
  FOR UPDATE USING (public.get_user_role() = 'admin');

-- ===================
-- LEADS policies
-- ===================
-- "View all leads (company-wide)" — Yes for all roles (BRD §2.4)
CREATE POLICY leads_select_all ON public.leads
  FOR SELECT USING (true);

-- Any authenticated user can create a lead
CREATE POLICY leads_insert_all ON public.leads
  FOR INSERT WITH CHECK (true);

-- Admin can edit any lead (BRD §2.4: "Edit/update others' leads — Yes")
CREATE POLICY leads_update_admin ON public.leads
  FOR UPDATE USING (public.get_user_role() = 'admin');

-- CM and Sales can only edit their own assigned leads
-- (BRD §2.4: "Edit/update only own assigned leads — Yes")
CREATE POLICY leads_update_own ON public.leads
  FOR UPDATE USING (owner_id = public.get_user_id());

-- Only Admin can delete leads
-- (BRD §2.4: "Delete a lead — Admin: Yes, CM: No, Sales: No")
CREATE POLICY leads_delete_admin ON public.leads
  FOR DELETE USING (public.get_user_role() = 'admin');

-- ===================
-- STATUSES policies
-- ===================
-- Everyone can see statuses (for dropdowns, pipeline view)
CREATE POLICY statuses_select_all ON public.statuses
  FOR SELECT USING (true);

-- Only Admin can manage statuses
-- (BRD §2.4: "Create/edit custom tags & statuses — Admin: Yes")
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
-- (BRD §2.4: "Create/edit custom tags & statuses — Admin: Yes, CM: No, Sales: No")
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
-- (BRD §2.7: "any team member can apply existing tags to a lead")
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

-- No INSERT/UPDATE/DELETE policies for users — only triggers write here

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
