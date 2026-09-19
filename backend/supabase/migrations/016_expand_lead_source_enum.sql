-- ============================================================
-- Migration 016: Expand lead_source enum and support all sources
-- ============================================================

-- Convert leads.source column to TEXT to support all social media, job sites, and custom sources flexibly
ALTER TABLE public.leads ALTER COLUMN source TYPE TEXT;

-- Drop default if any, or retain
COMMENT ON COLUMN public.leads.source IS 'Lead acquisition channel: Social media, Job site, Inbound, Outreach, etc.';
