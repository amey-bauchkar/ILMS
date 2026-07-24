-- Migration 015: Security and Architecture Fixes
-- Replaces the unsafe AFTER INSERT DELETE with a proper BEFORE INSERT exception

-- 1. Drop the unsafe AFTER trigger
DROP TRIGGER IF EXISTS trigger_new_auth_user ON auth.users;

-- 2. Recreate the function to use RAISE EXCEPTION
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  invited_user record;
BEGIN
  -- Check if the email exists in our pre-created users table (allowlist)
  SELECT * INTO invited_user
  FROM public.users
  WHERE email = NEW.email;

  -- If no record found, reject signup safely by aborting the transaction
  IF invited_user IS NULL THEN
    RAISE EXCEPTION 'Unauthorized signup: Email % is not invited', NEW.email;
  END IF;

  -- If found, link the auth_id to the existing user record
  UPDATE public.users
  SET auth_id = NEW.id,
      is_active = true,
      last_login_at = now()
  WHERE id = invited_user.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger as BEFORE INSERT so the insert never happens if unauthorized
CREATE TRIGGER trigger_new_auth_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
