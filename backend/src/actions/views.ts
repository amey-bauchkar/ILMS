'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

// ============================================================
// Saved Views — BRD §2.12
// ============================================================

/**
 * Save or update a filter preset view.
 * Each user can only manage their own views (RLS enforced).
 */
export async function saveSavedView(
  name: string,
  filters: Record<string, unknown>,
  viewId?: string
) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };
  if (!name?.trim()) return { error: 'View name is required.' };

  if (viewId) {
    // Update existing
    const { data, error } = await supabase
      .from('saved_views')
      .update({ name: name.trim(), filters })
      .eq('id', viewId)
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath('/leads');
    return { data };
  } else {
    // Create new
    const { data, error } = await supabase
      .from('saved_views')
      .insert({
        user_id: currentUser.id,
        name: name.trim(),
        filters,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath('/leads');
    return { data };
  }
}

/**
 * Delete a saved view — own views only.
 */
export async function deleteSavedView(viewId: string) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };

  const { error } = await supabase
    .from('saved_views')
    .delete()
    .eq('id', viewId);

  if (error) return { error: error.message };

  revalidatePath('/leads');
  return { success: true };
}

/**
 * Set a view as the default (unsets any previous default).
 */
export async function setDefaultView(viewId: string) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };

  // Unset all existing defaults for this user
  await supabase
    .from('saved_views')
    .update({ is_default: false })
    .eq('user_id', currentUser.id);

  // Set the new default
  const { error } = await supabase
    .from('saved_views')
    .update({ is_default: true })
    .eq('id', viewId);

  if (error) return { error: error.message };

  revalidatePath('/leads');
  return { success: true };
}
