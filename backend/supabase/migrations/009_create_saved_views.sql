-- ============================================================
-- Migration 009: Create Saved Views Table
-- Foremark CRM — BRD §2.12
-- ============================================================
-- User-specific filter presets. BRD §2.12: "Saved views
-- (e.g. 'My open leads', 'Overdue follow-ups', 'Hot leads
-- this week') — at least a few sensible defaults out of the box."
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
