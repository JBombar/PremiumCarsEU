import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

const adminUpdateSchema = z.object({
    price: z.number().nonnegative().optional(),
    is_special_offer: z.boolean().optional(),
    special_offer_label: z.string().optional(),
    is_shared_with_network: z.boolean().optional(),
    is_public: z.boolean().optional(),
    approval_status: z.enum(['pending', 'approved', 'rejected']).optional(),
    model: z.string().optional(),
    year: z.number().int().optional(),
    mileage: z.number().int().nonnegative().optional(),
    description: z.string().optional(),
    // Add more fields as needed
});

function createSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin override
        {
            cookies: {
                get: (name) => cookieStore.get(name)?.value,
                set: (name, value, opts) => {
                    try {
                        cookieStore.set({ name, value, ...opts });
                    } catch { }
                },
                remove: (name, opts) => {
                    try {
                        cookieStore.set({ name, value: '', ...opts });
                    } catch { }
                },
            },
        }
    );
}

// PATCH /api/admin/partner-listings/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createSupabaseClient();

    const validation = paramsSchema.safeParse(params);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid ID', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { id } = validation.data;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = adminUpdateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('partner_listings')
        .update(parsed.data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Admin PATCH error (partner_listings):', error);
        return NextResponse.json({ error: 'Failed to update listing', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
}
