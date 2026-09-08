import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
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
                setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        supabaseResponse.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // getClaims() verifies the JWT locally against a cached JWKS when the
    // project has asymmetric (ECC/RSA) signing keys enabled, avoiding a
    // network round trip to Supabase Auth on every single navigation. It
    // transparently falls back to a network call if the project still uses
    // a legacy HS256 shared secret. This is a routing decision only — it is
    // not a substitute for supabase.auth.getUser() immediately before a
    // sensitive mutation.
    const { data } = await supabase.auth.getClaims();
    const isAuthenticated = !!data?.claims;

    const pathname = request.nextUrl.pathname;

    const LEGAL_PATHS = ['/terms', '/privacy', '/community-guidelines', '/copyright', '/cookies'];

    // Public routes: auth pages, password reset, user profiles, and legal pages
    const isPublicRoute =
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname === '/forgot-password' ||
        pathname === '/reset-password' ||
        LEGAL_PATHS.includes(pathname) ||
        pathname.startsWith('/u/');

    // If on auth pages and authenticated, redirect to /home
    if ((pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password') && isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/home';
        return NextResponse.redirect(url);
    }

    // Profile pages, password reset, and legal pages are public (allow both authed and unauthed)
    if (
        pathname.startsWith('/u/') ||
        pathname === '/forgot-password' ||
        pathname === '/reset-password' ||
        LEGAL_PATHS.includes(pathname)
    ) {
        return supabaseResponse;
    }

    // Root route - handled by page.tsx redirect
    if (pathname === '/') {
        return supabaseResponse;
    }

    // All other routes require authentication
    if (!isPublicRoute && !isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
