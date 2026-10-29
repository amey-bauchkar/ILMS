import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface EncryptionKeyRecord {
  key: string;
  created_at: string;
  used: boolean;
  used_by?: string;
  used_at?: string;
  created_by?: string;
}

export const ADMIN_MASTER_EMAIL = 'admin@foremark.in';

/**
 * Generate a formatted, cryptographically secure encryption key
 * Example: FM-A7B2-9F1C-4E8D-3B0F
 */
export function generateEncryptionKey(): string {
  const bytes = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `FM-${bytes.substring(0, 4)}-${bytes.substring(4, 8)}-${bytes.substring(8, 12)}-${bytes.substring(12, 16)}`;
}

/**
 * Retrieve the Admin (Master) Supabase auth user
 */
export async function getAdminMasterAuthUser(adminSupabase: SupabaseClient) {
  // 1. Try by canonical email
  const { data: dbUser } = await adminSupabase
    .from('users')
    .select('id, auth_id, email, name, role')
    .eq('email', ADMIN_MASTER_EMAIL)
    .maybeSingle();

  let targetAuthId = dbUser?.auth_id;

  // 2. Fallback: find any admin in public.users if admin@foremark.in is missing auth_id
  if (!targetAuthId) {
    const { data: anyAdmin } = await adminSupabase
      .from('users')
      .select('id, auth_id, email, name, role')
      .eq('role', 'admin')
      .not('auth_id', 'is', null)
      .limit(1)
      .maybeSingle();

    targetAuthId = anyAdmin?.auth_id;
  }

  if (!targetAuthId) {
    throw new Error('No admin user with valid auth ID found in database.');
  }

  const { data: authData, error } = await adminSupabase.auth.admin.getUserById(targetAuthId);
  if (error || !authData?.user) {
    throw new Error('Could not fetch Admin Master auth user: ' + (error?.message || 'Not found'));
  }

  return authData.user;
}

/**
 * Generate a new encryption key, store it in Admin Master app_metadata, and return it
 */
export async function generateAndStoreKeyForAdmin(
  adminSupabase: SupabaseClient,
  createdByEmail: string = ADMIN_MASTER_EMAIL
): Promise<string> {
  const adminUser = await getAdminMasterAuthUser(adminSupabase);
  const newKey = generateEncryptionKey();

  const existingKeys: EncryptionKeyRecord[] = adminUser.app_metadata?.encryption_keys || [];
  
  // Keep up to 25 unused keys and preserve recent history
  const activeUnused = existingKeys.filter((k) => !k.used).slice(0, 24);
  const usedHistory = existingKeys.filter((k) => k.used).slice(0, 10);

  const newRecord: EncryptionKeyRecord = {
    key: newKey,
    created_at: new Date().toISOString(),
    used: false,
    created_by: createdByEmail,
  };

  const updatedKeys = [newRecord, ...activeUnused, ...usedHistory];

  await adminSupabase.auth.admin.updateUserById(adminUser.id, {
    app_metadata: {
      ...adminUser.app_metadata,
      latest_encryption_key: newKey,
      latest_encryption_key_created_at: newRecord.created_at,
      encryption_keys: updatedKeys,
    },
  });

  return newKey;
}

/**
 * Retrieve the current active encryption key for Admin (Master)
 * If none exists, generates one on the fly.
 */
export async function getActiveEncryptionKey(adminSupabase: SupabaseClient): Promise<{
  key: string;
  created_at: string;
  total_active: number;
}> {
  const adminUser = await getAdminMasterAuthUser(adminSupabase);
  const keys: EncryptionKeyRecord[] = adminUser.app_metadata?.encryption_keys || [];
  
  // Find the most recent unused key
  const activeKey = keys.find((k) => !k.used);

  if (activeKey) {
    return {
      key: activeKey.key,
      created_at: activeKey.created_at,
      total_active: keys.filter((k) => !k.used).length,
    };
  }

  // Generate a fresh one if no active key exists
  const generatedKey = await generateAndStoreKeyForAdmin(adminSupabase, ADMIN_MASTER_EMAIL);
  return {
    key: generatedKey,
    created_at: new Date().toISOString(),
    total_active: 1,
  };
}

/**
 * Validate and consume an encryption key during new member registration
 */
export async function validateAndConsumeEncryptionKey(
  adminSupabase: SupabaseClient,
  inputKey: string,
  newMemberEmail: string
): Promise<{ valid: boolean; error?: string }> {
  if (!inputKey || typeof inputKey !== 'string') {
    return { valid: false, error: 'Encryption key is required.' };
  }

  const normalized = inputKey.trim().toUpperCase();
  const adminUser = await getAdminMasterAuthUser(adminSupabase);
  const keys: EncryptionKeyRecord[] = adminUser.app_metadata?.encryption_keys || [];

  const keyIndex = keys.findIndex(
    (k) => k.key.toUpperCase() === normalized && !k.used
  );

  if (keyIndex === -1) {
    return {
      valid: false,
      error: 'Invalid, already used, or expired Master Encryption Key. Please request an active key from Admin (Master).',
    };
  }

  // Mark key as consumed
  keys[keyIndex].used = true;
  keys[keyIndex].used_by = newMemberEmail.trim().toLowerCase();
  keys[keyIndex].used_at = new Date().toISOString();

  await adminSupabase.auth.admin.updateUserById(adminUser.id, {
    app_metadata: {
      ...adminUser.app_metadata,
      encryption_keys: keys,
    },
  });

  return { valid: true };
}
