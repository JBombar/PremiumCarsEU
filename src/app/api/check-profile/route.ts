import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// =================================================================================
// ✅ GET /api/check-profile
// Checks if a profile exists in public.users for the authenticated user.
// =================================================================================
export async function GET(req: NextRequest) {
    const cookieStore = cookies();

    // 1. --- Authentication Client (SSR) ---
    const supabaseAuthClient = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) { } },
                remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) { } },
            },
        }
    );

    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();

    if (authError || !user) {
        console.error('API /check-profile: Auth Error or No User', authError);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. --- Database Operations Client (Service Role) ---
    // Needed to query public.users potentially bypassing RLS if necessary for this check
    const supabaseAdminClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 3. --- Check for existing profile ---
    try {
        const { data, error, count } = await supabaseAdminClient
            .from('users')
            .select('id', { count: 'exact', head: true }) // Efficiently check existence
            .eq('id', user.id);

        if (error) {
            console.error('API /check-profile: Error querying users table:', error);
            // Don't return 500 easily, maybe profile doesn't exist is the common case
            // Let's assume error means we couldn't confirm, treat as non-existent? Or return error?
            // Returning error is safer.
            return NextResponse.json({ error: 'Database query failed', details: error.message }, { status: 500 });
        }

        const profileExists = count !== null && count > 0;
        console.log(`API /check-profile: Profile check for user ${user.id}. Exists: ${profileExists}`);

        return NextResponse.json({ exists: profileExists }, { status: 200 });

    } catch (error) {
        console.error('API /check-profile: Unexpected error:', error);
        const message = error instanceof Error ? error.message : 'Unexpected server error';
        return NextResponse.json({ error: 'Server Error', details: message }, { status: 500 });
    }
}