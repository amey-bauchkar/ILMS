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

/**
 * Admin Update Password — Allows an admin to update password for any user or admin.
 */
export async function adminUpdatePassword(formData: FormData) {
  const adminEmail = (formData.get('adminEmail') as string)?.trim().toLowerCase();
  const adminPassword = formData.get('adminPassword') as string;
  const targetEmail = (formData.get('targetEmail') as string)?.trim().toLowerCase();
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!adminEmail || !adminPassword) {
    return { error: 'Admin email and admin password are required for authorization.' };
  }

  if (!targetEmail || !newPassword) {
    return { error: 'Target user email and new password are required.' };
  }

  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters.' };
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return { error: 'New password and confirmation do not match.' };
  }

  // 1. Verify admin credentials
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authError || !authData.user) {
    return { error: 'Invalid admin credentials. Please verify your admin email and password.' };
  }

  // 2. Verify admin role in public.users
  const adminSupabase = await createAdminClient();
  const { data: adminProfile } = await adminSupabase
    .from('users')
    .select('id, role, is_active')
    .or(`auth_id.eq.${authData.user.id},email.eq.${adminEmail}`)
    .single();

  if (!adminProfile || adminProfile.role !== 'admin' || adminProfile.is_active === false) {
    await supabase.auth.signOut();
    return { error: 'Unauthorized: Only active administrators can update passwords.' };
  }

  // 3. Find the target user in Supabase Auth
  const { data: targetProfile } = await adminSupabase
    .from('users')
    .select('id, auth_id, email, name')
    .eq('email', targetEmail)
    .single();

  let targetAuthId = targetProfile?.auth_id;

  if (!targetAuthId) {
    const { data: authUsersList, error: listError } = await adminSupabase.auth.admin.listUsers();
    if (listError) {
      return { error: 'Failed to look up user in authentication directory.' };
    }
    const foundAuthUser = authUsersList.users.find(
      (u) => u.email?.toLowerCase() === targetEmail
    );
    if (foundAuthUser) {
      targetAuthId = foundAuthUser.id;
    }
  }

  if (!targetAuthId) {
    return { error: `No account found for "${targetEmail}".` };
  }

  // 4. Update the target user's password
  const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
    targetAuthId,
    {
      password: newPassword,
      email_confirm: true,
    }
  );

  if (updateError) {
    console.error('Admin password update error:', updateError);
    return { error: `Failed to update password: ${updateError.message}` };
  }

  // Sign out the verification session so user is back on clean login state
  await supabase.auth.signOut();

  return {
    success: true,
    message: `Password updated successfully for ${targetEmail}. You can now sign in with your new password.`,
  };
}
