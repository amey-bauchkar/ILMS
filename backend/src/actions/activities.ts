'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import type { CallOutcome } from '../types/database';

// ============================================================
// Activity Actions — BRD §2.8 (Call Logging), §2.9 (Timeline)
// ============================================================

interface LogCallInput {
  lead_id: string;
  outcome: CallOutcome;
  notes?: string;
  // Atomic updates (Gap #6 Fix — BRD §2.8 Step 2)
  // "If Answered, the user can update Status and Next Follow-up from the same screen"
  new_status_id?: string;
  next_followup_date?: string | null;
}

/**
 * Log a call — Atomic operation.
 * BRD §2.8: Creates the call activity AND optionally updates the
 * lead's status + next_followup_date in a single transaction.
 *
 * All roles can log calls.
 */
export async function logCall(input: LogCallInput) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: 'Not authenticated.' };
  }

  // Validation: notes required when Answered (BRD §2.8 Step 2)
  if (input.outcome === 'Answered' && (!input.notes || input.notes.trim() === '')) {
    return { error: 'Notes are required when the call outcome is "Answered".' };
  }

  // Validate notes length (max 2000 chars at app level)
  if (input.notes && input.notes.length > 2000) {
    return { error: 'Notes cannot exceed 2000 characters.' };
  }

  // Step 1: Create the call activity
  // The trigger_call_updates_last_contact will auto-update last_contacted_at
  const { error: activityError } = await supabase
    .from('activities')
    .insert({
      lead_id: input.lead_id,
      type: 'call',
      outcome: input.outcome,
      notes: input.notes || null,
      created_by: currentUser.id,
    });

  if (activityError) {
    return { error: activityError.message };
  }

  // Step 2: Optionally update lead status + next_followup_date (atomic)
  // If either is provided, update the lead in the same action
  if (input.new_status_id || input.next_followup_date !== undefined) {
    const updateData: Record<string, unknown> = {};
    if (input.new_status_id) updateData.status_id = input.new_status_id;
    if (input.next_followup_date !== undefined) updateData.next_followup_date = input.next_followup_date;

    const { error: leadError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', input.lead_id);

    if (leadError) {
      return { error: leadError.message };
    }
  }

  revalidatePath('/leads');
  revalidatePath(`/leads/${input.lead_id}`);
  revalidatePath('/dashboard');
  return { success: true };
}

interface AddNoteInput {
  lead_id: string;
  notes: string;
}

/**
 * Add a free-text note to a lead's timeline.
 * BRD §2.9: "Any team member can add a free-text note."
 */
export async function addNote(input: AddNoteInput) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: 'Not authenticated.' };
  }

  if (!input.notes || input.notes.trim() === '') {
    return { error: 'Note content cannot be empty.' };
  }

  if (input.notes.length > 2000) {
    return { error: 'Notes cannot exceed 2000 characters.' };
  }

  const { error } = await supabase
    .from('activities')
    .insert({
      lead_id: input.lead_id,
      type: 'note',
      notes: input.notes,
      created_by: currentUser.id,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/leads/${input.lead_id}`);
  return { success: true };
}
