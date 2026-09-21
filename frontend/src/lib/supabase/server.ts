import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xcsnxduxnyvurpikiyhh.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjc254ZHV4bnl2dXJwaWtpeWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzQzODEsImV4cCI6MjEwNTMxMDM4MX0.UX7eBCr4vWr_elVBGgAJCE4KaZjO5MefXfnA6yr7i2o';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjc254ZHV4bnl2dXJwaWtpeWhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTczNDM4MSwiZXhwIjoyMTA1MzEwMzgxfQ.h7Ri_YsNYMnjy9h5RT7Vr9DIP3Ik-aJjaVJG7ZuFr_A';

/**
 * Supabase client for use in Server Components and Server Actions.
 * Uses the anon key — RLS policies enforce access based on the
 * authenticated user's session cookie.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Admin Supabase client for privileged operations (e.g., reassignment).
 * Uses the service_role key — BYPASSES RLS entirely.
 * Only use in Server Actions with explicit role checks!
 */
export async function createAdminClient() {
  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Service role clients must be stateless and never write to the user's cookies.
        },
      },
    }
  );
}
