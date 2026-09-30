'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database';

export async function updateProfile(data: { name?: string; avatar_url?: string | null }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const adminClient = await createAdminClient();
  const updates: Database['public']['Tables']['users']['Update'] = {
    updated_at: new Date().toISOString(),
  };
  if (data.name !== undefined) updates.name = data.name;
  if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;

  const { error } = await adminClient
    .from('users')
    .update(updates)
    .eq('auth_id', user.id);

  if (error) {
    console.error('Profile update error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/settings');
  return { success: true };
}
