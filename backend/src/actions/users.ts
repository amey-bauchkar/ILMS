'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import type { UserRole } from '../types/database';

// ============================================================
// User Management — BRD §2.4
// Admin-only team member management (the "allow-list")
// ============================================================

interface AddUserInput {
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Add a new team member to the allow-list — Admin only.
 * BRD §2.4: "Add/remove team members — Admin: Yes, CM: No, Sales: No"
 *
 * This creates the public.users row. The user can then sign up
 * with Supabase Auth — the auth trigger links auth_id.
 */
export async function addUser(input: AddUserInput) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };
  if (currentUser.role !== 'admin') return { error: 'Only Admin can add team members.' };
  if (!input.email?.trim()) return { error: 'Email is required.' };
  if (!input.name?.trim()) return { error: 'Name is required.' };

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      role: input.role,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate')) {
      return { error: `A user with email "${input.email}" already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath('/settings');
  return { data };
}

interface UpdateUserInput {
  id: string;
  name?: string;
  role?: UserRole;
  is_active?: boolean;
}

/**
 * Update a team member — Admin only.
 * Can change name, role, or deactivate.
 * Edge case: prevents deactivating the last admin.
 */
export async function updateUser(input: UpdateUserInput) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) return { error: 'Not authenticated.' };
  if (currentUser.role !== 'admin') return { error: 'Only Admin can edit team members.' };

  // Edge case: prevent deactivating the last admin
  if (input.is_active === false || (input.role && input.role !== 'admin')) {
    const { data: targetUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', input.id)
      .single();

    if (targetUser?.role === 'admin') {
      // Check how many active admins exist
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('is_active', true);

      if ((count || 0) <= 1) {
        return { error: 'Cannot deactivate or change the role of the last active Admin.' };
      }
    }
  }

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.role !== undefined) updateData.role = input.role;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', input.id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/settings');
  return { data };
}
