'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeReminder(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // Get internal user ID (matches RLS and reminders.assigned_to)
  const { data: dbUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_id', user.id)
    .single();

  if (!dbUser) throw new Error('User not found');

  let query = supabase
    .from('reminders')
    .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
    })
    .eq('id', id);

  if (dbUser.role !== 'admin') {
    query = query.eq('assigned_to', dbUser.id);
  }

  const { error } = await query;

  if (error) {
    console.error('Error completing reminder:', error);
    throw new Error('Failed to complete reminder');
  }

  revalidatePath('/');
}

