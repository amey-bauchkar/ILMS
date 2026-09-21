import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Supabase client for use in Client Components (browser).
 * Uses the anon key — RLS policies enforce access.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xcsnxduxnyvurpikiyhh.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjc254ZHV4bnl2dXJwaWtpeWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzQzODEsImV4cCI6MjEwNTMxMDM4MX0.UX7eBCr4vWr_elVBGgAJCE4KaZjO5MefXfnA6yr7i2o';

export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}
