'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

// ============================================================
// Status Management — BRD §2.6
// "Admin should be able to edit this list (add/rename/reorder/
// deactivate statuses) from a settings screen."
// ============================================================

interface CreateStatusInput {
  name: string;
  slug: string;
  color?: string;
  is_terminal?: boolean;
  exclude_from_conversion?: boolean;
}

/**
 * Create a new pipeline status — Admin only.
 */
export async function createStatus(input: CreateStatusInput) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };
  if (currentUser.role !== 'admin') return { error: 'Only Admin can create statuses.' };
  if (!input.name?.trim()) return { error: 'Status name is required.' };
  if (!input.slug?.trim()) return { error: 'Status slug is required.' };

  // Get the next display_order
  const { data: maxOrder } = await supabase
    .from('statuses')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxOrder?.display_order || 0) + 1;

  const { data, error } = await supabase
    .from('statuses')
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase().replace(/\s+/g, '_'),
      display_order: nextOrder,
      color: input.color || '#737373',
      is_terminal: input.is_terminal || false,
      exclude_from_conversion: input.exclude_from_conversion || false,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate')) {
      return { error: `Status "${input.name}" or slug "${input.slug}" already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath('/settings');
  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { data };
}

interface UpdateStatusInput {
  id: string;
  name?: string;
  color?: string;
  is_active?: boolean;
  is_terminal?: boolean;
  exclude_from_conversion?: boolean;
}

/**
 * Update a pipeline status — Admin only.
 * Can rename, change color, deactivate, or change terminal/conversion flags.
 * Note: slug is NOT editable (used in code logic like lost validation).
 */
export async function updateStatus(input: UpdateStatusInput) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };
  if (currentUser.role !== 'admin') return { error: 'Only Admin can edit statuses.' };

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.is_terminal !== undefined) updateData.is_terminal = input.is_terminal;
  if (input.exclude_from_conversion !== undefined) {
    updateData.exclude_from_conversion = input.exclude_from_conversion;
  }

  const { data, error } = await supabase
    .from('statuses')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/settings');
  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { data };
}

/**
 * Reorder statuses — Admin only.
 * Accepts an array of { id, display_order } pairs and bulk-updates.
 */
export async function reorderStatuses(
  orderings: Array<{ id: string; display_order: number }>
) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };
  if (currentUser.role !== 'admin') return { error: 'Only Admin can reorder statuses.' };

  // Update each status's display_order
  const promises = orderings.map(({ id, display_order }) =>
    supabase
      .from('statuses')
      .update({ display_order })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  const firstError = results.find((r) => r.error);

  if (firstError?.error) {
    return { error: firstError.error.message };
  }

  revalidatePath('/settings');
  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { success: true };
}
