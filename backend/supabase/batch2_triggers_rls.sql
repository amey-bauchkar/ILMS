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
