import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getOptionalUser } from '@/utils/supabase/auth-helpers';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client for the middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: '', ...options });
        }
      }
    }
  );

  // Use getUser() instead of getSession() for secure validation
  try {
    console.log('Middleware: Starting auth check for path:', req.nextUrl.pathname);
    const { user, error } = await getOptionalUser(supabase);

    if (error) {
      console.error('Middleware: Auth error:', error);
    }

    console.log('Middleware: Auth response:', JSON.stringify({
      status: error ? 'error' : 'success',
      isAuthenticated: !!user
    }));

    if (!user && req.nextUrl.pathname.startsWith('/admin')) {
      console.log('Middleware: No authenticated user, redirecting to login');
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('returnUrl', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    console.log('Middleware: Authentication valid or not needed for this path');
  } catch (error) {
    console.error('Middleware: Error checking authentication', error);
  }

  return res;
}

// Optional: Only run middleware on matching paths
export const config = {
  matcher: ['/admin/:path*', '/login'],
}; 