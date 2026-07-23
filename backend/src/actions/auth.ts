'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Login — Email/Password authentication.
 * BRD §2.3: Only pre-approved emails can log in.
 */
export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Handle specific error cases
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password.' };
    }
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

/**
 * Signup — Only for pre-approved emails in the users table.
 * The auth trigger (handle_new_auth_user) enforces the allow-list.
 * BRD §2.3: "No public sign-up form. Admin adds approved emails."
 */
export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // If the auth trigger deleted the auth row (email not in allow-list),
  // the signup technically "succeeds" but the user won't be able to log in.
  // We check if the user can actually authenticate.
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    return { error: 'You are not authorized to access this system. Contact your admin.' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

/**
 * Logout — Sign out and redirect to login page.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * Get the currently authenticated user's profile from the users table.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: dbUser } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();

  return dbUser;
}
