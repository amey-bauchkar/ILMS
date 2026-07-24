'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(data: { name: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({ name: data.name })
    .eq('auth_id', user.id);

  if (error) {
    console.error('Profile update error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/settings');
  return { success: true };
}
