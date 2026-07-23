'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

// ============================================================
// Tag Management — BRD §2.7
// ============================================================

/**
 * Create a new tag — Admin only.
 * BRD §2.4: "Create/edit custom tags & statuses — Admin: Yes, CM: No, Sales: No"
 */
export async function createTag(name: string, category?: string) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };
  if (currentUser.role !== 'admin') return { error: 'Only Admin can create tags.' };
  if (!name || name.trim() === '') return { error: 'Tag name is required.' };

  const { data, error } = await supabase
    .from('tags')
    .insert({ name: name.trim(), category: category || null })
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate')) {
      return { error: `Tag "${name}" already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath('/settings');
  return { data };
}

/**
 * Update a tag — Admin only.
 * Can rename, change category, or deactivate.
 */
export async function updateTag(
  tagId: string,
  updates: { name?: string; category?: string; is_active?: boolean }
) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };
  if (currentUser.role !== 'admin') return { error: 'Only Admin can edit tags.' };

  const { data, error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', tagId)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/settings');
  revalidatePath('/leads');
  return { data };
}

/**
 * Add a tag to a lead.
 * BRD §2.7: "Any team member can apply existing tags to a lead."
 * RLS enforces: admin or lead owner can apply tags.
 */
export async function addTagToLead(leadId: string, tagId: string) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };

  // Insert the tag association
  const { error } = await supabase
    .from('lead_tags')
    .insert({ lead_id: leadId, tag_id: tagId });

  if (error) {
    if (error.message.includes('duplicate')) {
      return { error: 'This tag is already applied to the lead.' };
    }
    return { error: error.message };
  }

  // Log tag_change activity
  const { data: tag } = await supabase
    .from('tags')
    .select('name')
    .eq('id', tagId)
    .single();

  await supabase
    .from('activities')
    .insert({
      lead_id: leadId,
      type: 'tag_change',
      notes: `Added tag: ${tag?.name || 'Unknown'}`,
      created_by: currentUser.id,
    });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  return { success: true };
}

/**
 * Remove a tag from a lead.
 * RLS enforces: admin or lead owner can remove tags.
 */
export async function removeTagFromLead(leadId: string, tagId: string) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };

  // Get tag name before removing
  const { data: tag } = await supabase
    .from('tags')
    .select('name')
    .eq('id', tagId)
    .single();

  const { error } = await supabase
    .from('lead_tags')
    .delete()
    .eq('lead_id', leadId)
    .eq('tag_id', tagId);

  if (error) return { error: error.message };

  // Log tag_change activity
  await supabase
    .from('activities')
    .insert({
      lead_id: leadId,
      type: 'tag_change',
      notes: `Removed tag: ${tag?.name || 'Unknown'}`,
      created_by: currentUser.id,
    });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  return { success: true };
}
