'use server';

import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Login — Email/Password authentication.
 */
export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login failed:', error.message);
    return { error: error.message || 'Authentication failed. Please check your credentials.' };
  }

  if (authData?.user) {
    try {
      const adminSupabase = await createAdminClient();
      const { data: dbUser } = await adminSupabase
        .from('users')
        .select('id, is_active, auth_id')
        .eq('email', email)
        .single();

      if (dbUser) {
        if (dbUser.is_active === false) {
          await supabase.auth.signOut();
          return { error: 'Your account has been deactivated. Please contact your admin.' };
        }
        if (dbUser.auth_id !== authData.user.id) {
          await adminSupabase
            .from('users')
            .update({ auth_id: authData.user.id })
            .eq('id', dbUser.id);
        }
      } else {
        // If user exists in Auth but not in public.users, create their profile row
        await adminSupabase.from('users').insert({
          auth_id: authData.user.id,
          email: authData.user.email || email,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          role: 'admin',
          is_active: true,
        });
      }
    } catch (e) {
      console.warn('Could not auto-link user profile:', e);
    }
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Signup — Create account and sign in.
 */
export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  // Password complexity check
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { error: 'Password must contain at least one uppercase letter and one number.' };
  }

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // After signup, try to login
  const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    console.error('Signup post-login failed:', loginError.message);
    return { error: loginError.message || 'Account created, but sign-in failed. Please log in.' };
  }

  if (authData?.user) {
    try {
      const adminSupabase = await createAdminClient();
      const { data: dbUser } = await adminSupabase
        .from('users')
        .select('id, is_active, auth_id')
        .eq('email', email)
        .single();

      if (dbUser) {
        if (dbUser.is_active === false) {
          await supabase.auth.signOut();
          return { error: 'Your account has been deactivated. Please contact your admin.' };
        }
        if (dbUser.auth_id !== authData.user.id) {
          await adminSupabase
            .from('users')
            .update({ auth_id: authData.user.id })
            .eq('id', dbUser.id);
        }
      } else {
        await adminSupabase.from('users').insert({
          auth_id: authData.user.id,
          email: authData.user.email || email,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          role: 'admin',
          is_active: true,
        });
      }
    } catch (e) {
      console.warn('Could not auto-link user profile:', e);
    }
  }

  revalidatePath('/', 'layout');
  return { success: true };
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

  let { data: dbUser } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();

  if (!dbUser && authUser.email) {
    const { data: userByEmail } = await supabase
      .from('users')
      .select('*')
      .eq('email', authUser.email)
      .single();
    dbUser = userByEmail;
  }

  return dbUser;
}
