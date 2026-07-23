-- ============================================================
-- Migration 008: Create Lead Status History Table
-- Foremark CRM — BRD §2.6, §2.13 (Auditability)
-- ============================================================
-- Audit trail of every status change. Separate from activities
-- for focused pipeline analytics (time-in-stage, conversion
-- funnels). Populated exclusively by trigger — never by
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
