import { createClient } from '@/lib/supabase/server';

// ============================================================
// User Queries — BRD §1.3
// ============================================================

/**
 * Get all active team members.
 * Used for assignment dropdowns, settings page, etc.
 */
export async function getTeamMembers(includeInactive: boolean = false) {
  const supabase = await createClient();

  let query = supabase
    .from('users')
    .select('*')
    .order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get the current user's pending reminders.
 * BRD §2.11: In-app reminder badge count.
 */
export async function getMyReminders(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      lead:leads!reminders_lead_id_fkey(id, name)
    `)
    .eq('assigned_to', userId)
    .eq('status', 'pending')
    .order('due_date', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get the current user's saved views.
 * BRD §2.12: Saved views sidebar.
 */
export async function getSavedViews(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('saved_views')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}
