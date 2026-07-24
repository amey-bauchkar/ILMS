// @ts-nocheck
'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Create a new lead.
 */
export async function createLead(data: {
  name: string;
  company_name?: string;
  phone: string;
  email?: string;
  source: string;
  status_id: string;
  owner_id: string;
  priority: string;
  estimated_deal_value?: number;
  next_followup_date?: string;
  notes?: string;
  tags?: string[];
  lost_reason?: string;
  lost_reason_details?: string;
  source_link?: string;
}) {
  const supabase = await createClient();

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: 'Not authenticated' };

  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (!dbUser) return { error: 'User not found in database' };

  // Insert lead
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      name: data.name,
      company_name: data.company_name || null,
      phone: data.phone,
      email: data.email || null,
      source: data.source as any,
      status_id: data.status_id,
      owner_id: data.owner_id,
      created_by: dbUser.id,
      priority: data.priority as any,
      estimated_deal_value: data.estimated_deal_value || 0,
      next_followup_date: data.next_followup_date || null,
      lost_reason: data.lost_reason as any || null,
      lost_reason_details: data.lost_reason_details || null,
      custom_fields: data.source_link ? { source_link: data.source_link } : {},
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  // Add tags if any — resolve tag names to UUIDs
  if (data.tags && data.tags.length > 0 && lead) {
    const resolvedTagIds: string[] = [];

    for (const tagNameOrId of data.tags) {
      // Check if it's already a valid UUID format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tagNameOrId);
      
      if (isUUID) {
        resolvedTagIds.push(tagNameOrId);
      } else {
        // It's a tag name — look it up or create it
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagNameOrId)
          .single();

        if (existingTag) {
          resolvedTagIds.push(existingTag.id);
        } else {
          // Create the tag on the fly
          const { data: newTag } = await supabase
            .from('tags')
            .insert({ name: tagNameOrId, is_active: true })
            .select('id')
            .single();
          if (newTag) {
            resolvedTagIds.push(newTag.id);
          }
        }
      }
    }

    if (resolvedTagIds.length > 0) {
      const tagInserts = resolvedTagIds.map((tagId) => ({
        lead_id: lead.id,
        tag_id: tagId,
      }));
      await supabase.from('lead_tags').insert(tagInserts);
    }
  }

  // Add initial note as activity if notes provided
  if (data.notes && lead) {
    await supabase.from('activities').insert({
      lead_id: lead.id,
      type: 'note' as any,
      notes: data.notes,
      created_by: dbUser.id,
    });
  }

  revalidatePath('/leads');
  return { success: true, leadId: lead?.id };
}

/**
 * Update an existing lead.
 */
export async function updateLead(
  leadId: string,
  data: {
    name?: string;
    company_name?: string;
    phone?: string;
    email?: string;
    source?: string;
    status_id?: string;
    owner_id?: string;
    priority?: string;
    estimated_deal_value?: number;
    next_followup_date?: string | null;
    lost_reason?: string | null;
    lost_reason_details?: string | null;
    tags?: string[];
  }
) {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: 'Not authenticated' };

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.company_name !== undefined) updateData.company_name = data.company_name || null;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.source !== undefined) updateData.source = data.source;
  if (data.status_id !== undefined) updateData.status_id = data.status_id;
  if (data.owner_id !== undefined) updateData.owner_id = data.owner_id;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.estimated_deal_value !== undefined) updateData.estimated_deal_value = data.estimated_deal_value;
  if (data.next_followup_date !== undefined) updateData.next_followup_date = data.next_followup_date;
  if (data.lost_reason !== undefined) updateData.lost_reason = data.lost_reason;
  if (data.lost_reason_details !== undefined) updateData.lost_reason_details = data.lost_reason_details;

  const { error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', leadId);

  if (error) {
    return { error: error.message };
  }

  // Sync tags if provided
  if (data.tags !== undefined) {
    // Delete all existing tags for this lead
    await supabase.from('lead_tags').delete().eq('lead_id', leadId);

    if (data.tags.length > 0) {
      const resolvedTagIds: string[] = [];

      for (const tagNameOrId of data.tags) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tagNameOrId);
        
        if (isUUID) {
          resolvedTagIds.push(tagNameOrId);
        } else {
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagNameOrId)
            .single();

          if (existingTag) {
            resolvedTagIds.push(existingTag.id);
          } else {
            const { data: newTag } = await supabase
              .from('tags')
              .insert({ name: tagNameOrId, is_active: true })
              .select('id')
              .single();
            if (newTag) {
              resolvedTagIds.push(newTag.id);
            }
          }
        }
      }

      if (resolvedTagIds.length > 0) {
        const tagInserts = resolvedTagIds.map((tagId) => ({
          lead_id: leadId,
          tag_id: tagId,
        }));
        await supabase.from('lead_tags').insert(tagInserts);
      }
    }
  }

  revalidatePath('/leads');
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

/**
 * Log a call activity against a lead.
 */
export async function logCall(leadId: string, data: {
  outcome: string;
  notes?: string;
}) {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: 'Not authenticated' };

  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (!dbUser) return { error: 'User not found' };

  // Insert the call activity
  const { error } = await supabase.from('activities').insert({
    lead_id: leadId,
    type: 'call' as any,
    outcome: data.outcome as any,
    notes: data.notes || null,
    created_by: dbUser.id,
  });

  if (error) return { error: error.message };

  // Update last_contacted_at
  await supabase
    .from('leads')
    .update({ last_contacted_at: new Date().toISOString() })
    .eq('id', leadId);

  revalidatePath('/leads');
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

/**
 * Add a note to a lead.
 */
export async function addNote(leadId: string, notes: string) {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: 'Not authenticated' };

  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (!dbUser) return { error: 'User not found' };

  const { error } = await supabase.from('activities').insert({
    lead_id: leadId,
    type: 'note' as any,
    notes,
    created_by: dbUser.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}
