// /app/api/contact/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// Updated schema according to requirements
const contactSchema = z.object({
    full_name: z.string().min(1),
    phone: z.string().min(5),
    email: z.string().email().optional(),
    car_id: z.string().uuid().optional(),
    car_name: z.string().optional(),
    message: z.string().optional()
});

function createSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name) { return cookieStore.get(name)?.value; },
                set(name, value, options) { cookieStore.set({ name, value, ...options }); },
                remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
            },
        }
    );
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createSupabaseClient();
        const body = await request.json();

        // Validate with updated schema
        const validation = contactSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const validatedData = validation.data;

        // Insert into contact_inquiries instead of leads
        const { data, error } = await supabase
            .from('contact_inquiries')
            .insert({
                ...validatedData,
                contacted: false,
                // Keep created_at if your table has a default timestamp
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to insert contact inquiry:', error);
            return NextResponse.json(
                { error: 'Failed to submit contact inquiry' },
                { status: 500 }
            );
        }

        // Return with the specified format
        return NextResponse.json(
            { success: true, inquiry: data },
            { status: 201 }
        );
    } catch (error) {
        console.error('Unexpected error in contact API:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
