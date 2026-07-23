-- ============================================================
-- Migration 003: Create Statuses Table (Admin-Configurable Pipeline)
-- Foremark CRM — BRD §2.6
-- ============================================================
-- BRD §2.6: "Admin should be able to edit this list
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
