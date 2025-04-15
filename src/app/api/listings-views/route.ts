import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Input validation schema
const viewSchema = z.object({
    car_id: z.string().uuid('Car ID must be a valid UUID')
});

// Create Supabase SSR client
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

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validationResult = viewSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { car_id } = validationResult.data;

        // Initialize Supabase client
        const supabase = createSupabaseClient();

        // Check if user is logged in
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        const user_id = user?.id || null; // Use null if not logged in

        // Insert the view record - NOTE: Always insert a new record for each view
        const { error: insertError } = await supabase
            .from('listing_views')
            .insert({
                car_id,
                user_id,
                // timestamp will default to now() in the database
            });

        if (insertError) {
            console.error('Error logging listing view:', insertError);
            return NextResponse.json(
                { error: 'Database error' },
                { status: 500 }
            );
        }

        // Return success response
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Unexpected error in listing-views API:', error);
        return NextResponse.json(
            { error: 'Unexpected server error' },
            { status: 500 }
        );
    }
}
