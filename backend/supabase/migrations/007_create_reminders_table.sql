-- ============================================================
-- Migration 007: Create Reminders Table
-- Foremark CRM — BRD §2.11
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
