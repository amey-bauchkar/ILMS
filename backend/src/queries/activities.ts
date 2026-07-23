import { createClient } from '@/lib/supabase/server';

// ============================================================
// Activity Queries — BRD §2.9
// ============================================================

/**
 * Get all activities for a specific lead, reverse-chronological.
 * BRD §2.9: "Single reverse-chronological timeline combining
 * calls, notes, status changes, tag changes, reassignments."
 */
export async function getLeadActivities(leadId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      user:users!activities_created_by_fkey(id, name, avatar_url),
      from_status:statuses!activities_from_status_id_fkey(name, color),
      to_status:statuses!activities_to_status_id_fkey(name, color),
      from_owner:users!activities_from_owner_id_fkey(id, name),
      to_owner:users!activities_to_owner_id_fkey(id, name)
    `)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get the lead's reminder list (pending first, then completed).
 */
export async function getLeadReminders(leadId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      assigned_user:users!reminders_assigned_to_fkey(id, name),
      created_user:users!reminders_created_by_fkey(id, name)
    `)
    .eq('lead_id', leadId)
    .order('status', { ascending: true })   // pending first
    .order('due_date', { ascending: true }); // then by due date

  if (error) throw new Error(error.message);
  return data || [];
}
