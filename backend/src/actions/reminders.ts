'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';

// ============================================================
// Reminder Actions — BRD §2.11
// ============================================================

interface CreateReminderInput {
  lead_id: string;
  title: string;
  due_date: string;
  assigned_to: string;
}

/**
 * Create a follow-up reminder.
 * Any authenticated user can create reminders.
 */
export async function createReminder(input: CreateReminderInput) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };
  if (!input.title?.trim()) return { error: 'Reminder title is required.' };
  if (!input.due_date) return { error: 'Due date is required.' };

  const { data, error } = await supabase
    .from('reminders')
    .insert({
      lead_id: input.lead_id,
      title: input.title.trim(),
      due_date: input.due_date,
      assigned_to: input.assigned_to,
      created_by: currentUser.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/leads/${input.lead_id}`);
  revalidatePath('/dashboard');
  return { data };
}

/**
 * Update a reminder — Mark complete or dismiss.
 * RLS: assignee or admin can update.
 */
export async function updateReminder(
  reminderId: string,
  updates: { status?: 'completed' | 'dismissed' }
) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };

  const updateData: Record<string, unknown> = {};
  if (updates.status) {
    updateData.status = updates.status;
    if (updates.status === 'completed' || updates.status === 'dismissed') {
      updateData.completed_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('reminders')
    .update(updateData)
    .eq('id', reminderId)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  if (data?.lead_id) revalidatePath(`/leads/${data.lead_id}`);
  return { data };
}
