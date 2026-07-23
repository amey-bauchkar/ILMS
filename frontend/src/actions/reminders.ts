// @ts-nocheck
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeReminder(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('reminders')
    .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('assigned_to', user.id);

  if (error) {
    console.error('Error completing reminder:', error);
    throw new Error('Failed to complete reminder');
  }

  revalidatePath('/'); // Revalidate everywhere the topbar might be
}
