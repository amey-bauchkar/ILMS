'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  generateAndStoreKeyForAdmin,
  getActiveEncryptionKey,
} from '@/lib/encryption-keys';

/**
 * Check if the current authenticated user is an administrator
 */
async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated', adminClient: null, user: null };
  }

  const adminClient = await createAdminClient();
  const { data: dbUser } = await adminClient
    .from('users')
    .select('id, auth_id, email, name, role')
    .eq('auth_id', user.id)
    .single();

  if (dbUser?.role !== 'admin') {
    return { error: 'Unauthorized: Admin access required', adminClient: null, user: null };
  }

  return { error: null, adminClient, user: dbUser };
}

export type KeyActionResult = {
  success: boolean;
  key?: string;
  created_at?: string;
  total_active?: number;
  error?: string;
};

/**
 * Server action to fetch the currently active encryption key
 */
export async function getActiveEncryptionKeyAction(): Promise<KeyActionResult> {
  const { error, adminClient } = await checkAdminAuth();
  if (error || !adminClient) {
    return { success: false, error: error || 'Failed to authenticate admin' };
  }

  try {
    const keyData = await getActiveEncryptionKey(adminClient);
    return { success: true, ...keyData };
  } catch (err: any) {
    console.error('Error fetching encryption key:', err);
    return { success: false, error: err.message || 'Failed to retrieve encryption key' };
  }
}

/**
 * Server action to generate a fresh encryption key on demand
 */
export async function generateNewEncryptionKeyAction(): Promise<KeyActionResult> {
  const { error, adminClient, user } = await checkAdminAuth();
  if (error || !adminClient) {
    return { success: false, error: error || 'Failed to authenticate admin' };
  }

  try {
    const newKey = await generateAndStoreKeyForAdmin(adminClient, user?.email || 'admin@foremark.in');
    return { success: true, key: newKey, created_at: new Date().toISOString() };
  } catch (err: any) {
    console.error('Error generating new encryption key:', err);
    return { success: false, error: err.message || 'Failed to generate new encryption key' };
  }
}
