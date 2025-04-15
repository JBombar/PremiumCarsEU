import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// === Helper to create authenticated Supabase client ===
function createSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (e) { }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (e) { }
                },
            },
        }
    );
}

// === GET /api/car-makes ===
export async function GET(request: NextRequest) {
    const supabase = createSupabaseClient();

    try {
        const { data, error } = await supabase
            .from('car_makes')
            .select('id, name')
            .order('name');

        if (error) {
            console.error('Error fetching car makes:', error);
            return NextResponse.json({ error: 'Failed to fetch car makes', details: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Unexpected error fetching car makes:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
