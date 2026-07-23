-- ============================================================
-- Migration 011: Create Triggers
-- Foremark CRM — BRD §2.6, §2.8, §2.9, §2.13
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
-- 2. Lead Status Change → History + Activity
-- BRD §2.6: "Every status change is logged automatically"
-- BRD §2.13: "Every status change and reassignment is
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
-- 3. Lead Reassignment → Activity
-- BRD §2.9: "Reassignments appear automatically in the
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
-- 4. Call Activity → Update last_contacted_at
-- BRD §2.8: "updates 'Last Contacted Date' automatically"
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
-- BRD §2.5: "Lost Reason — Required only when status
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
-- BRD §2.8: Call outcome required; notes required when
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
      RAISE EXCEPTION 'notes are required when call outcome is Answered (BRD §2.8 Step 2)';
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
-- BRD §2.3: "Only pre-approved email addresses can log in.
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

  -- If email not found → block signup by deleting the auth row
  IF user_record IS NULL THEN
    DELETE FROM auth.users WHERE id = NEW.id;
    RETURN NULL;
  END IF;

  -- If user is deactivated → block signup
  IF user_record.is_active = false THEN
    DELETE FROM auth.users WHERE id = NEW.id;
    RETURN NULL;
  END IF;

  -- Email found and active → link auth_id
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
