'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ============================================================
// Server-side validation schemas (H-01)
// ============================================================

const createLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  company_name: z.string().max(200).nullable().optional(),
  phone: z.string().min(10, 'Enter a valid phone number').max(20),
  email: z.union([z.literal(''), z.string().email()]).nullable().optional(),
  source: z.string().min(1, 'Select a valid source'),
  status_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  priority: z.enum(['Hot', 'Warm', 'Cold']),
  estimated_deal_value: z.number().min(0).nullable().optional(),
  created_at: z.string().nullable().optional(),
  next_followup_date: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string().max(100)).max(50).nullable().optional(),
  lost_reason: z.string().nullable().optional(),
  lost_reason_details: z.string().max(1000).nullable().optional(),
  source_link: z.string().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
});

const updateLeadSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  company_name: z.string().max(200).nullable().optional(),
  phone: z.string().min(10).max(20).optional(),
  email: z.union([z.literal(''), z.string().email()]).nullable().optional(),
  source: z.string().min(1, 'Select a valid source').optional(),
  status_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),
  priority: z.enum(['Hot', 'Warm', 'Cold']).optional(),
  estimated_deal_value: z.number().min(0).nullable().optional(),
  created_at: z.string().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  source_link: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  next_followup_date: z.string().nullable().optional(),
  lost_reason: z.string().nullable().optional(),
  lost_reason_details: z.string().max(1000).nullable().optional(),
  tags: z.array(z.string().max(100)).max(50).nullable().optional(),
});

const VALID_DB_ENUM_SOURCES = [
  'Reddit',
  'Google Business Profile',
  'Referral',
  'Website Inbound',
  'LinkedIn',
  'Cold Outreach',
  'WhatsApp',
  'Upwork',
  'Events',
  'Other',
];

// ============================================================
// Helper: Resolve tag names to UUIDs (C-02 fix)
// Uses admin client to create new tags since RLS restricts
// tag creation to admins only.
// ============================================================

async function resolveTagIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tagNamesOrIds: string[]
): Promise<string[]> {
  const resolvedTagIds: string[] = [];

  for (const tagNameOrId of tagNamesOrIds) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tagNameOrId);

    if (isUUID) {
      resolvedTagIds.push(tagNameOrId);
    } else {
      // Strictly look up existing tag by name (only admins can create tags via Settings)
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagNameOrId)
        .single();

      if (existingTag) {
        resolvedTagIds.push(existingTag.id);
      }
    }
  }

  return resolvedTagIds;
}

// ============================================================
// createLead
// ============================================================

export async function createLead(rawData: {
  name: string;
  company_name?: string;
  phone: string;
  email?: string;
  source: string;
  status_id: string;
  owner_id: string;
  priority: string;
  estimated_deal_value?: number;
  created_at?: string;
  location?: string;
  next_followup_date?: string;
  notes?: string;
  tags?: string[];
  lost_reason?: string;
  lost_reason_details?: string;
  source_link?: string;
}) {
  const supabase = await createClient();

  // Authentication check
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: 'Not authenticated' };

  let { data: dbUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_id', authUser.id)
    .single();

  if (!dbUser && authUser.email) {
    const { data: userByEmail } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', authUser.email)
      .single();
    dbUser = userByEmail;
  }

  if (!dbUser) return { error: 'User not found in database' };

  // Fallback resolution for status_id and owner_id if not provided
  let resolvedStatusId = rawData.status_id;
  if (!resolvedStatusId || resolvedStatusId.trim() === '') {
    const { data: defaultStatus } = await supabase
      .from('statuses')
      .select('id')
      .eq('slug', 'new')
      .single();
    resolvedStatusId = defaultStatus?.id || '';
  }

  let resolvedOwnerId = rawData.owner_id;
  if (!resolvedOwnerId || resolvedOwnerId.trim() === '') {
    resolvedOwnerId = dbUser.id;
  }

  // H-01: Server-side validation
  const parsed = createLeadSchema.safeParse({
    ...rawData,
    status_id: resolvedStatusId,
    owner_id: resolvedOwnerId,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' };
  }
  const data = parsed.data;

  const customFields: Record<string, any> = {};
  customFields.source = data.source;
  if (data.source_link) customFields.source_link = data.source_link;
  if (data.location) customFields.location = data.location;

  const safeDbSource = VALID_DB_ENUM_SOURCES.includes(data.source) ? data.source : 'Other';

  // Insert lead
  const insertPayload: any = {
    name: data.name,
    company_name: data.company_name || null,
    phone: data.phone,
    email: data.email || null,
    source: safeDbSource as any,
    status_id: data.status_id,
    owner_id: data.owner_id,
    created_by: dbUser.id,
    priority: data.priority as any,
    estimated_deal_value: data.estimated_deal_value || 0,
    next_followup_date: data.next_followup_date || null,
    lost_reason: data.lost_reason as any || null,
    lost_reason_details: data.lost_reason_details || null,
    custom_fields: customFields,
  };

  if (data.created_at) {
    try {
      insertPayload.created_at = new Date(data.created_at).toISOString();
    } catch {
      // ignore
    }
  }

  const clientToUse = dbUser.role === 'admin' ? (await createAdminClient()) : supabase;

  let { data: lead, error } = await clientToUse
    .from('leads')
    .insert(insertPayload)
    .select('id')
    .single();

  // Retry with 'Other' as source enum fallback if needed
  if (error && insertPayload.source !== 'Other') {
    insertPayload.source = 'Other';
    const retryResult = await clientToUse
      .from('leads')
      .insert(insertPayload)
      .select('id')
      .single();
    lead = retryResult.data;
    error = retryResult.error;
  }

  if (error) {
    console.error('Lead creation failed:', error);
    return { error: error.message || 'Failed to create lead. Please try again.' };
  }

  // Add tags if any — resolve tag names to UUIDs (C-02 fix)
  if (data.tags && data.tags.length > 0 && lead) {
    const resolvedTagIds = await resolveTagIds(clientToUse, data.tags);

    if (resolvedTagIds.length > 0) {
      const tagInserts = resolvedTagIds.map((tagId) => ({
        lead_id: lead.id,
        tag_id: tagId,
      }));
      await clientToUse.from('lead_tags').insert(tagInserts);
    }
  }

  // Add initial note as activity if notes provided
  if (data.notes && lead) {
    await clientToUse.from('activities').insert({
      lead_id: lead.id,
      type: 'note' as any,
      notes: data.notes,
      created_by: dbUser.id,
    });
  }

  revalidatePath('/leads');
  return { success: true, leadId: lead?.id };
}

// ============================================================
// updateLead (H-04: authorization check added)
// ============================================================

export async function updateLead(
  leadId: string,
  rawData: {
    name?: string;
    company_name?: string;
    phone?: string;
    email?: string;
    source?: string;
    status_id?: string;
    owner_id?: string;
    priority?: string;
    estimated_deal_value?: number;
    created_at?: string | null;
    location?: string | null;
    source_link?: string | null;
    notes?: string | null;
    next_followup_date?: string | null;
    lost_reason?: string | null;
    lost_reason_details?: string | null;
    tags?: string[];
  }
) {
  // Validate leadId format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId)) {
    return { error: 'Invalid lead ID' };
  }

  // H-01: Server-side validation
  const parsed = updateLeadSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' };
  }
  const data = parsed.data;

  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: 'Not authenticated' };

  let { data: dbUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_id', authUser.id)
    .single();

  if (!dbUser && authUser.email) {
    const { data: userByEmail } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', authUser.email)
      .single();
    dbUser = userByEmail;
  }

  if (!dbUser) return { error: 'User not found' };

  const clientToUse = dbUser.role === 'admin' ? (await createAdminClient()) : supabase;

  // Non-admin users can only edit their own leads
  if (dbUser.role !== 'admin') {
    const { data: lead } = await clientToUse
      .from('leads')
      .select('owner_id')
      .eq('id', leadId)
      .single();

    if (!lead || lead.owner_id !== dbUser.id) {
      return { error: 'You can only edit leads assigned to you' };
    }

    // Prevent non-admins from reassigning leads
    if (data.owner_id !== undefined && data.owner_id !== dbUser.id) {
      return { error: 'Only admins can reassign leads to other users' };
    }
  }

  const { data: existing } = await clientToUse.from('leads').select('custom_fields, source').eq('id', leadId).single();
  const currentCf = (existing?.custom_fields as Record<string, any>) || {};

  if (data.source !== undefined) currentCf.source = data.source;
  if (data.source_link !== undefined) currentCf.source_link = data.source_link || null;
  if (data.location !== undefined) currentCf.location = data.location || null;

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.company_name !== undefined) updateData.company_name = data.company_name || null;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.source !== undefined) {
    const safeDbSource = VALID_DB_ENUM_SOURCES.includes(data.source) ? data.source : 'Other';
    updateData.source = safeDbSource;
  }
  if (data.status_id !== undefined) updateData.status_id = data.status_id;
  if (data.owner_id !== undefined) updateData.owner_id = data.owner_id;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.estimated_deal_value !== undefined) updateData.estimated_deal_value = data.estimated_deal_value;
  if (data.created_at !== undefined) {
    try {
      updateData.created_at = data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString();
    } catch {
      // ignore
    }
  }
  if (data.next_followup_date !== undefined) updateData.next_followup_date = data.next_followup_date;
  if (data.lost_reason !== undefined) updateData.lost_reason = data.lost_reason;
  if (data.lost_reason_details !== undefined) updateData.lost_reason_details = data.lost_reason_details;
  updateData.custom_fields = currentCf;

  let { error } = await clientToUse
    .from('leads')
    .update(updateData)
    .eq('id', leadId);

  // Retry with 'Other' as source enum fallback if needed
  if (error && updateData.source && updateData.source !== 'Other') {
    updateData.source = 'Other';
    const retry = await clientToUse
      .from('leads')
      .update(updateData)
      .eq('id', leadId);
    error = retry.error;
  }

  if (error) {
    console.error('Lead update failed:', error);
    return { error: error.message || 'Failed to update lead. Please try again.' };
  }

  // Sync tags if provided (C-02 fix)
  if (data.tags !== undefined) {
    // Delete all existing tags for this lead
    await clientToUse.from('lead_tags').delete().eq('lead_id', leadId);

    if (data.tags.length > 0) {
      const resolvedTagIds = await resolveTagIds(clientToUse, data.tags);

      if (resolvedTagIds.length > 0) {
        const tagInserts = resolvedTagIds.map((tagId) => ({
          lead_id: leadId,
          tag_id: tagId,
        }));
        await clientToUse.from('lead_tags').insert(tagInserts);
      }
    }
  }

  // Add note activity if note provided during update
  if (data.notes && data.notes.trim()) {
    await clientToUse.from('activities').insert({
      lead_id: leadId,
      type: 'note' as any,
      notes: data.notes.trim(),
      created_by: dbUser.id,
    });
  }

  revalidatePath('/leads');
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

  // Sync tags if provided (C-02 fix)
  if (data.tags !== undefined) {
    // Delete all existing tags for this lead
    await supabase.from('lead_tags').delete().eq('lead_id', leadId);

    if (data.tags.length > 0) {
      const resolvedTagIds = await resolveTagIds(supabase, data.tags);

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

// ============================================================
// logCall
// ============================================================

export async function logCall(leadId: string, data: {
  outcome: string;
  notes?: string;
}) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId)) {
    return { error: 'Invalid lead ID' };
  }

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

  if (error) {
    console.error('Call logging failed:', error);
    return { error: 'Failed to log call. Please try again.' };
  }

  revalidatePath('/leads');
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

// ============================================================
// addNote
// ============================================================

export async function addNote(leadId: string, notes: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leadId)) {
    return { error: 'Invalid lead ID' };
  }

  if (!notes || notes.trim().length === 0) {
    return { error: 'Notes cannot be empty' };
  }

  if (notes.length > 2000) {
    return { error: 'Notes must be under 2000 characters' };
  }

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

  if (error) {
    console.error('Note creation failed:', error);
    return { error: 'Failed to add note. Please try again.' };
  }

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}
