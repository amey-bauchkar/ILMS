-- ============================================================
-- Migration 005: Create Activities Table
-- Foremark CRM — BRD §2.8, §2.9
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

-- Partial index for "calls made this week" leaderboard (BRD §2.10)
CREATE INDEX idx_activities_calls ON public.activities (created_by, created_at DESC)
  WHERE type = 'call';

-- Comments
COMMENT ON TABLE public.activities IS 'Unified timeline combining calls, notes, status changes, tag changes, and reassignments.';
COMMENT ON COLUMN public.activities.outcome IS 'Only populated when type = call. Validated by trigger.';
COMMENT ON COLUMN public.activities.from_status_id IS 'Only populated when type = status_change. Set by trigger.';
COMMENT ON COLUMN public.activities.from_owner_id IS 'Only populated when type = reassignment. Set by trigger.';
