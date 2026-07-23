// @ts-nocheck
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserRole } from '@/types/database';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();
    
  if (profile?.role !== 'admin') {
    throw new Error("Unauthorized: Admin access required");
  }
  
  return supabase;
}

// =======================
// Users
// =======================

export async function inviteUser(data: { email: string; name: string; role: UserRole }) {
  const supabase = await checkAdmin();
  
  // We insert into users. RLS allows this for admins.
  // The user will sign up themselves with this email and link via trigger.
  const { data: newUser, error } = await supabase
    .from('users')
    .insert([{
      email: data.email,
      name: data.name,
      role: data.role,
      is_active: true
    }])
    .select()
    .single();
    
  if (error) {
    console.error("Invite error:", error);
    throw new Error(error.message);
  }
  
  revalidatePath('/settings');
  return newUser;
}

export async function updateUserRole(id: string, role: UserRole) {
  const supabase = await checkAdmin();
  
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function deactivateUser(id: string, is_active: boolean) {
  const supabase = await checkAdmin();
  
  const { error } = await supabase
    .from('users')
    .update({ is_active })
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

// =======================
// Statuses
// =======================

export async function createStatus(data: { name: string; color: string; is_terminal?: boolean; exclude_from_conversion?: boolean }) {
  const supabase = await checkAdmin();
  
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
      exclude_from_conversion: data.exclude_from_conversion || false
    }]);
    
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function updateStatus(id: string, data: { name?: string; color?: string; is_terminal?: boolean; exclude_from_conversion?: boolean }) {
  const supabase = await checkAdmin();
  
  const updates: any = { ...data };
  if (data.name) {
    updates.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  
  const { error } = await supabase
    .from('statuses')
    .update(updates)
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function reorderStatuses(updates: { id: string, display_order: number }[]) {
  const supabase = await checkAdmin();
  
  // Update each status
  for (const update of updates) {
    const { error } = await supabase
      .from('statuses')
      .update({ display_order: update.display_order })
      .eq('id', update.id);
      
    if (error) {
      console.error("Failed to reorder status:", update.id, error);
    }
  }
  
  revalidatePath('/settings');
}

export async function deleteStatus(id: string) {
  const supabase = await checkAdmin();
  
  const { error } = await supabase
    .from('statuses')
    .delete()
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

// =======================
// Tags
// =======================

export async function createTag(name: string, color: string) {
  const supabase = await checkAdmin();
  
  const { error } = await supabase
    .from('tags')
    .insert([{ name, color }]);
    
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function updateTag(id: string, data: { name?: string; color?: string }) {
  const supabase = await checkAdmin();
  
  const { error } = await supabase
    .from('tags')
    .update(data)
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function deleteTag(id: string) {
  const supabase = await checkAdmin();
  
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}
