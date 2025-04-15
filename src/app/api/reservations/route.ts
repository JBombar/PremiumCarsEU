// File: src/app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { Database } from '@/types/supabase'

// 🔧 Schema validation
const reservationSchema = z.object({
    customer_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(5),
    vehicle: z.string().min(1),
    car_id: z.string().uuid(),
});


// 🔧 Supabase client creator
function createSupabaseClient() {
    const cookieStore = cookies()
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (_) { }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (_) { }
                }
            }
        }
    )
}

// 🚀 POST: Accept a reservation
export async function POST(req: NextRequest) {
    const supabase = createSupabaseClient();

    try {
        const body = await req.json();
        const parsed = reservationSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
        }

        const data = parsed.data;

        const { data: { user } } = await supabase.auth.getUser();

        const { data: inserted, error } = await supabase
            .from('reservations')
            .insert([
                {
                    ...data,
                    user_id: user?.id || null,
                    status: 'pending',
                    contacted: false,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error saving reservation:', error);
            return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
        }

        return NextResponse.json(inserted, { status: 201 });

    } catch (err) {
        console.error('Unexpected error in reservation POST:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
