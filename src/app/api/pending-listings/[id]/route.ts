import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

// ✅ Modified schema to include `is_shared_with_network`
const pendingListingUpdateSchema = z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.number().int().optional(),
    price: z.number().nonnegative().optional(),
    mileage: z.number().int().nonnegative().optional(),
    fuel_type: z.string().optional(),
    transmission: z.string().optional(),
    condition: z.string().optional(),
    location_city: z.string().optional(),
    location_country: z.string().optional(),
    images: z.array(z.string().url()).optional(),
    description: z.string().optional(),
    body_type: z.string().optional(),
    exterior_color: z.string().optional(),
    interior_color: z.string().optional(),
    engine: z.string().optional(),
    vin: z.string().optional(),
    features: z.array(z.string()).optional(),
    seller_name: z.string().optional(),
    seller_since: z.string().optional(),
    is_special_offer: z.boolean().optional(),
    special_offer_label: z.string().optional(),
    // ✅ NEW FIELD
    is_shared_with_network: z.boolean().optional(),
});

function createSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (name) => cookieStore.get(name)?.value,
                set: (name, value, opts) => { try { cookieStore.set({ name, value, ...opts }) } catch { } },
                remove: (name, opts) => { try { cookieStore.set({ name, value: '', ...opts }) } catch { } },
            },
        }
    );
}

// PATCH /pending-listings/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createSupabaseClient();
    const validation = paramsSchema.safeParse(params);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid ID', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { id } = validation.data;

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // confirm partner
    const { data: partner } = await supabase
        .from('dealer_partners')
        .select('dealership_id')
        .eq('dealer_user_id', user.id)
        .eq('is_approved', true)
        .single();
    if (!partner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const parsed = pendingListingUpdateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    // ensure the listing belongs to this dealership and is still pending
    const { data: existing, error: fetchErr } = await supabase
        .from('pending_listings')
        .select('dealership_id, is_approved')
        .eq('id', id)
        .single();
    if (fetchErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.dealership_id !== partner.dealership_id || existing.is_approved) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
        .from('pending_listings')
        .update(parsed.data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 200 });
}

// DELETE /pending-listings/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createSupabaseClient();
    const validation = paramsSchema.safeParse(params);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid ID', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { id } = validation.data;

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: partner } = await supabase
        .from('dealer_partners')
        .select('dealership_id')
        .eq('dealer_user_id', user.id)
        .eq('is_approved', true)
        .single();
    if (!partner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // ensure it belongs & still pending
    const { data: existing } = await supabase
        .from('pending_listings')
        .select('dealership_id, is_approved')
        .eq('id', id)
        .single();
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.dealership_id !== partner.dealership_id || existing.is_approved) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
        .from('pending_listings')
        .delete()
        .eq('id', id);
    if (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
    return NextResponse.json(null, { status: 204 });
}
