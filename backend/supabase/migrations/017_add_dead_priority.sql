-- ============================================================
-- Migration 017: Add 'Dead' priority option to lead_priority enum
-- ============================================================

-- If Postgres ENUM lead_priority exists, add 'Dead' value safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_priority') THEN
    ALTER TYPE lead_priority ADD VALUE IF NOT EXISTS 'Dead';
  END IF;
END $$;
