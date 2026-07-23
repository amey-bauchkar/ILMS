-- ============================================================
-- Migration 006: Create Tags & Lead_Tags Tables
-- Foremark CRM — BRD §2.7
-- ============================================================
-- Tags are separate from Status and Source — a flexible,
-- internal-use layer. Admin creates/edits/deactivates tags;
-- any team member can apply existing tags to a lead.
-- ============================================================

-- Tags: Admin-managed tag list
CREATE TABLE public.tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,                        -- Tag display name
  category    TEXT,                                        -- Grouping (e.g., "Industry", "Service")
  is_active   BOOLEAN NOT NULL DEFAULT true,               -- Soft deactivate
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tags_active ON public.tags (is_active) WHERE is_active = true;

-- Lead_Tags: Many-to-many join
CREATE TABLE public.lead_tags (
  lead_id     UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, tag_id)                            -- Composite PK prevents duplicates
);

-- Reverse lookup index: "all leads with tag X"
CREATE INDEX idx_lead_tags_tag_id ON public.lead_tags (tag_id);

-- Comments
COMMENT ON TABLE public.tags IS 'Admin-managed tags for flexible lead categorization (Industry, Service, Deal Size, etc.)';
COMMENT ON TABLE public.lead_tags IS 'Many-to-many join between leads and tags. Multiple tags per lead supported.';
