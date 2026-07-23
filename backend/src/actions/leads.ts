'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import type { LeadSource, LeadPriority, LostReasonCategory } from '../types/database';

// ============================================================
// Lead CRUD — BRD §2.5
// ============================================================

interface CreateLeadInput {
  name: string;
  company_name?: string;
  phone: string;
  email?: string;
  source: LeadSource;
  status_id: string;
  owner_id: string;
  priority: LeadPriority;
  estimated_deal_value: number;
  next_followup_date?: string;
  custom_fields?: Record<string, unknown>;
}

/**
 * Create a new lead.
 * All authenticated roles can create leads.
 */
export async function createLead(input: CreateLeadInput) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: 'Not authenticated.' };
  }

  // Validation
  if (!input.name || input.name.length < 2) {
    return { error: 'Lead name must be at least 2 characters.' };
  }
  if (!input.phone || input.phone.length < 10) {
    return { error: 'Phone number must be at least 10 characters.' };
  }
  if (input.estimated_deal_value < 0) {
    return { error: 'Estimated deal value must be 0 or greater.' };
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: input.name,
      company_name: input.company_name || null,
      phone: input.phone,
      email: input.email || null,
      source: input.source,
      status_id: input.status_id,
      owner_id: input.owner_id,
      created_by: currentUser.id,
      priority: input.priority,
      estimated_deal_value: input.estimated_deal_value,
      next_followup_date: input.next_followup_date || null,
      custom_fields: input.custom_fields || {},
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { data };
}

interface UpdateLeadInput {
  id: string;
  name?: string;
  company_name?: string;
  phone?: string;
  email?: string;
  source?: LeadSource;
  status_id?: string;
  priority?: LeadPriority;
  estimated_deal_value?: number;
  next_followup_date?: string | null;
  lost_reason?: LostReasonCategory;
  lost_reason_details?: string;
  custom_fields?: Record<string, unknown>;
}

/**
 * Update an existing lead.
 * Admin can update any lead. CM/Sales can only update their own.
 * RLS enforces ownership at the DB level.
 */
export async function updateLead(input: UpdateLeadInput) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: 'Not authenticated.' };
  }

  // Build update payload (only include provided fields)
  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.company_name !== undefined) updateData.company_name = input.company_name;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.source !== undefined) updateData.source = input.source;
  if (input.status_id !== undefined) updateData.status_id = input.status_id;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.estimated_deal_value !== undefined) updateData.estimated_deal_value = input.estimated_deal_value;
  if (input.next_followup_date !== undefined) updateData.next_followup_date = input.next_followup_date;
  if (input.lost_reason !== undefined) updateData.lost_reason = input.lost_reason;
  if (input.lost_reason_details !== undefined) updateData.lost_reason_details = input.lost_reason_details;
  if (input.custom_fields !== undefined) updateData.custom_fields = input.custom_fields;

  const { data, error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single();

  if (error) {
    // Handle trigger errors (e.g., lost_reason required)
    if (error.message.includes('lost_reason is required')) {
      return { error: 'A lost reason is required when setting status to Lost.' };
    }
    return { error: error.message };
  }

  revalidatePath('/leads');
  revalidatePath(`/leads/${input.id}`);
  revalidatePath('/dashboard');
  return { data };
}

/**
 * Delete a lead — Admin only.
 * BRD §2.4: "Delete a lead — Admin: Yes, CM: No, Sales: No"
 * RLS enforces this, but we also check in application code for a clear error.
 */
export async function deleteLead(leadId: string) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: 'Not authenticated.' };
  }

  if (currentUser.role !== 'admin') {
    return { error: 'Only Admin can delete leads.' };
  }

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/leads');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Reassign a lead — Admin + Client Manager only.
 * BRD §2.4: "Reassign leads — Admin: Yes, CM: Yes, Sales: No"
 *
 * Uses service_role client because RLS prevents CM from editing
 * a lead they don't own, but reassignment requires exactly that.
 */
export async function reassignLead(leadId: string, newOwnerId: string) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: 'Not authenticated.' };
  }

  // Explicit role check (Sales blocked)
  if (currentUser.role === 'sales') {
    return { error: 'Sales users cannot reassign leads.' };
  }

  // Use admin client to bypass RLS for this operation
  const adminSupabase = await createAdminClient();

  const { data, error } = await adminSupabase
    .from('leads')
    .update({ owner_id: newOwnerId })
    .eq('id', leadId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // The trigger_lead_reassignment will auto-create the activity entry
  revalidatePath('/leads');
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/dashboard');
  return { data };
}
