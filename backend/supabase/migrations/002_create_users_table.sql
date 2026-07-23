-- ============================================================
-- Migration 002: Create Users Table
-- Foremark CRM — BRD §1.3, §2.3, §2.4
-- ============================================================
-- Team members allowed to log in. Admin pre-creates rows here
-- (the "allow-list"); Supabase Auth links via auth_id after signup.
-- ============================================================

CREATE TABLE public.users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID UNIQUE,                                    -- Linked after signup via trigger
  email       TEXT NOT NULL UNIQUE,                            -- Must match auth email
  name        TEXT NOT NULL,                                   -- Display name
  role        user_role NOT NULL DEFAULT 'sales',              -- admin | client_manager | sales
  avatar_url  TEXT,                                            -- Profile photo URL (optional)
  is_active   BOOLEAN NOT NULL DEFAULT true,                   -- Soft disable
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_role ON public.users (role);

-- Comments
COMMENT ON TABLE public.users IS 'Team members with access to the CRM. Acts as the auth allow-list.';
COMMENT ON COLUMN public.users.auth_id IS 'Linked to auth.users.id after the user signs up via Supabase Auth.';
COMMENT ON COLUMN public.users.is_active IS 'Set to false to deactivate without deleting. Middleware blocks login.';
