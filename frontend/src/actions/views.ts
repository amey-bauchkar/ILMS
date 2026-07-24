// @ts-nocheck
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveView(name: string, filters: Record<string, unknown>, isDefault: boolean = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Get internal user ID from users table (matches RLS get_user_id())
  const { data: dbUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (!dbUser) throw new Error('User not found in database');

  const { data, error } = await supabase
    .from('saved_views')
    .insert({
      user_id: dbUser.id,
      name,
      filters,
      is_default: isDefault,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving view:', error);
    throw new Error('Failed to save view');
  }

  revalidatePath('/leads');
  return data;
}

export async function deleteView(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('saved_views')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting view:', error);
    throw new Error('Failed to delete view');
  }

  revalidatePath('/leads');
}
