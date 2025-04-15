import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// === Helper to create Supabase client ===
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

// === Zod validation for query ===
const querySchema = z.object({
    make_id: z.string().uuid().optional(),
});

// === GET /api/car-models?make_id=xxx ===
export async function GET(request: NextRequest) {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Validate query params
    const query = Object.fromEntries(searchParams.entries());
    const result = querySchema.safeParse(query);
    if (!result.success) {
        return NextResponse.json(
            { error: 'Invalid query parameter', details: result.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const { make_id } = result.data;

    try {
        let queryBuilder = supabase.from('car_models').select('id, name, make_id');

        if (make_id) {
            queryBuilder = queryBuilder.eq('make_id', make_id);
        }

        const { data, error } = await queryBuilder.order('name');

        if (error) {
            console.error('Error fetching car models:', error);
            return NextResponse.json({ error: 'Failed to fetch car models', details: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Unexpected error fetching car models:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
