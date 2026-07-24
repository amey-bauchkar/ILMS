'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserRole } from '@/types/database';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'client_manager', 'sales'])
});

const statusSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  is_terminal: z.boolean().optional(),
  exclude_from_conversion: z.boolean().optional()
});

const updateStatusSchema = statusSchema.partial();

const tagSchema = z.string().min(1).max(50);

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', supabase: null };
  
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();
    
  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized: Admin access required', supabase: null };
  }
  
  return { error: null, supabase };
}

// =======================
// Users
// =======================

export async function inviteUser(data: { email: string; name: string; role: UserRole }) {
  const parsed = userSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid input' };

  const result = await checkAdmin();
  if (result.error) return { error: result.error };
  const supabase = result.supabase!;
  
  // We insert into users. RLS allows this for admins.
  // The user will sign up themselves with this email and link via trigger.
  const { data: newUser, error } = await supabase
    .from('users')
    .insert([{
      email: data.email,
      name: data.name,
      role: data.role,
      is_active: true,
      auth_id: null,
      avatar_url: null
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Invite error:', error);
    return { error: 'Failed to invite user. They may already exist.' };
  }
  
  revalidatePath('/settings');
  return newUser;
}

export async function updateUserRole(id: string, role: UserRole) {
  const result = await checkAdmin();
  if (result.error) return { error: result.error };
  const supabase = result.supabase!;
  
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id);
    
  if (error) {
    console.error('Role update error:', error);
    return { error: 'Failed to update user role.' };
  }
  revalidatePath('/settings');
  return { success: true };
}

export async function deactivateUser(id: string, is_active: boolean) {
  const result = await checkAdmin();
  if (result.error) return { error: result.error };
  const supabase = result.supabase!;
  
  const { error } = await supabase
    .from('users')
    .update({ is_active })
    .eq('id', id);
    
  if (error) {
    console.error('Deactivation error:', error);
    return { error: 'Failed to update user status.' };
  }
  revalidatePath('/settings');
  return { success: true };
}

// =======================
// Statuses
// =======================

export async function createStatus(data: { name: string; color: string; is_terminal?: boolean; exclude_from_conversion?: boolean }) {
  const parsed = statusSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid input' };

  const result = await checkAdmin();
  if (result.error) return { error: result.error };
  const supabase = result.supabase!;
  
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  // Get max display order
  const { data: statuses } = await supabase
    .from('statuses')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1);
    
  const nextOrder = statuses && statuses.length > 0 ? statuses[0].display_order + 1 : 1;
  
  const { error } = await supabase
    .from('statuses')
    .insert([{
      name: data.name,
      slug,
      color: data.color,
      display_order: nextOrder,
      is_terminal: data.is_terminal || false,
      exclude_from_conversion: data.exclude_from_conversion || false,
      is_active: true
    }]);
    
  if (error) {
    console.error('Status creation error:', error);
    return { error: 'Failed to create status.' };
  }
  revalidatePath('/settings');
  return { success: true };
}

export async function updateStatus(id: string, data: { name?: string; color?: string; is_terminal?: boolean; exclude_from_conversion?: boolean }) {
  const parsed = updateStatusSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid input' };

  const result = await checkAdmin();
  if (result.error) return { error: result.error };
  const supabase = result.supabase!;
  
  const updates: any = { ...data };
  if (data.name) {
    updates.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  
  const { error } = await supabase
    .from('statuses')
    .update(updates)
    .eq('id', id);
    
  if (error) {
    console.error('Status update error:', error);
    return { error: 'Failed to update status.' };
  }
  revalidatePath('/settings');
  return { success: true };
}

export async function reorderStatuses(updates: { id: string, display_order: number }[]) {
  const result = await checkAdmin();
  if (result.error) return { error: result.error };
  const supabase = result.supabase!;
  
  // Update each status
  for (const update of updates) {
    const { error } = await supabase
      .from('statuses')
      .update({ display_order: update.display_order })
      .eq('id', update.id);
      
    if (error) {
      console.error('Failed to reorder status:', update.id, error);
    }
  }
  
  revalidatePath('/settings');
  return { success: true };
}

export async function deleteStatus(id: string) {
  const result = await checkAdmin();
  if (result.error) return { error: result.error };
  const supabase = result.supabase!;
  
  const { error } = await supabase
    .from('statuses')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Status deletion error:', error);
    return { error: 'Failed to delete status.' };
  }
  revalidatePath('/settings');
  return { success: true };
}

// =======================
// Tags
// =======================

export async function createTag(name: string) {
  const parsed = tagSchema.safeParse(name);
  if (!parsed.success) return { error: 'Invalid tag name' };

  const result = await checkAdmin();
  if (result.error) return { error: result.error };
  const supabase = result.supabase!;
  
  const { error } = await supabase
    .from('tags')
    .insert([{ name, is_active: true, category: null }]);
    
  if (error) {
    console.error('Tag creation error:', error);
    return { error: 'Failed to create tag.' };
  }
  revalidatePath('/settings');
  return { success: true };
}

export async function updateTag(id: string, updates: { name?: string }) {
  if (updates.name) {
    const parsed = tagSchema.safeParse(updates.name);
    if (!parsed.success) return { error: 'Invalid tag name' };
  }

  const result = await checkAdmin();
  if (result.error) return { error: result.error };
  const supabase = result.supabase!;
  
  const { error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', id);
    
  if (error) {
    console.error('Tag update error:', error);
    return { error: 'Failed to update tag.' };
  }
  revalidatePath('/settings');
  return { success: true };
}

export async function deleteTag(id: string) {
  const result = await checkAdmin();
  if (result.error) return { error: result.error };
  const supabase = result.supabase!;
  
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Tag deletion error:', error);
    return { error: 'Failed to delete tag.' };
  }
  revalidatePath('/settings');
  return { success: true };
}

