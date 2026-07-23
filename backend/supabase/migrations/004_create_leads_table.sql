-- ============================================================
-- Migration 004: Create Leads Table
-- Foremark CRM — BRD §2.5
-- ============================================================
-- Core lead/deal records. Every field from the BRD §2.5 data
-- model is represented. status_id references the statuses
-- reference table (not an ENUM).
-- ============================================================

CREATE TABLE public.leads (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL CHECK (length(name) >= 2),         -- Contact person name
  company_name            TEXT,                                            -- Optional company
  phone                   TEXT NOT NULL CHECK (length(phone) >= 10),       -- Primary phone
  email                   TEXT,                                            -- Optional contact email
  source                  lead_source NOT NULL,                            -- Channel (ENUM)
  status_id               UUID NOT NULL REFERENCES public.statuses(id),    -- Pipeline stage (reference table)
  owner_id                UUID NOT NULL REFERENCES public.users(id),       -- Assigned team member
  created_by              UUID NOT NULL REFERENCES public.users(id),       -- Who created this lead
  priority                lead_priority NOT NULL DEFAULT 'Warm',           -- Hot / Warm / Cold
  estimated_deal_value    NUMERIC(12,2) NOT NULL CHECK (estimated_deal_value >= 0),  -- Required (Decision #1)
  next_followup_date      DATE,                                            -- Next scheduled follow-up
  last_contacted_at       TIMESTAMPTZ,                                     -- Auto-updated by trigger
  lost_reason             lost_reason_category,                            -- Required when status = Lost
  lost_reason_details     TEXT,                                            -- Free-text elaboration
  custom_fields           JSONB NOT NULL DEFAULT '{}',                     -- Extensible metadata
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_leads_owner_id       ON public.leads (owner_id);
CREATE INDEX idx_leads_status_id      ON public.leads (status_id);
CREATE INDEX idx_leads_source         ON public.leads (source);
CREATE INDEX idx_leads_priority       ON public.leads (priority);
CREATE INDEX idx_leads_created_at     ON public.leads (created_at DESC);
CREATE INDEX idx_leads_status_owner   ON public.leads (status_id, owner_id);

-- Partial index for overdue follow-up queries (BRD §2.10)
CREATE INDEX idx_leads_next_followup  ON public.leads (next_followup_date)
  WHERE next_followup_date IS NOT NULL;

-- Full-text search index for global search (BRD §2.12)
-- Searches across name, company, phone, and email
CREATE INDEX idx_leads_search ON public.leads
  USING GIN (to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(company_name, '') || ' ' ||
    coalesce(phone, '') || ' ' ||
    coalesce(email, '')
  ));

-- Comments
COMMENT ON TABLE public.leads IS 'Core lead/deal records. Every lead from every source lives here.';
COMMENT ON COLUMN public.leads.status_id IS 'FK to statuses table — Admin-configurable, not a hardcoded ENUM.';
COMMENT ON COLUMN public.leads.estimated_deal_value IS 'Required per team decision. Powers Pipeline Value dashboard widget.';
COMMENT ON COLUMN public.leads.custom_fields IS 'JSONB for extensible metadata without schema changes.';
COMMENT ON COLUMN public.leads.last_contacted_at IS 'Auto-updated by trigger when a call activity is logged.';
