-- ============================================================
-- Migration 010: Create Helper Functions
-- Foremark CRM
-- ============================================================
-- Helper functions for RLS policies and triggers.
-- SECURITY DEFINER so they can access tables regardless of
-- the calling user's RLS context.
-- ============================================================

-- Get the current user's role from the users table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get the current user's internal UUID from the users table
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION public.get_user_role() IS 'Returns the role of the currently authenticated user. Used in RLS policies.';
COMMENT ON FUNCTION public.get_user_id() IS 'Returns the internal users.id of the currently authenticated user. Used in RLS policies.';
COMMENT ON FUNCTION public.set_updated_at() IS 'Generic trigger function to auto-update updated_at timestamp.';
