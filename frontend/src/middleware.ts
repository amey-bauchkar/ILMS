import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware: Protects all routes except /login.
 * - Refreshes the Supabase auth session on every request.
 * - Redirects unauthenticated users to /login.
 * - Redirects deactivated users to /login with an error.
 * - Redirects authenticated users away from /login to /dashboard.
 *
 * BRD §2.3: "Only pre-approved email addresses can log in."
 * BRD §2.13: "Session handling via JWT."
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT run any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it hard to debug.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === '/login';
  const isCronRoute = request.nextUrl.pathname.startsWith('/api/cron');

  // Allow cron routes through (they use CRON_SECRET for auth)
  if (isCronRoute) {
    return supabaseResponse;
  }

  // If not authenticated and NOT on /login → redirect to /login
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If authenticated, check if user is active
  if (user) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('is_active')
      .eq('auth_id', user.id)
      .single();

    // Deactivated user → sign out and redirect
    if (dbUser && !dbUser.is_active) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'account_deactivated');
      return NextResponse.redirect(url);
    }

    // Authenticated user on /login → redirect to /dashboard
    if (isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
