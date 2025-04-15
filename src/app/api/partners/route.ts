import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Database } from '@/types/supabase';

// ✅ Define Zod schema for partner validation
const partnerSchema = z.object({
    name: z.string().min(1),
    contact_name: z.string().min(1),
    contact_email: z.string().email().optional(),
    contact_phone: z.string().min(5).optional(),
    location: z.string().optional(),
    company: z.string().optional(),
    is_active: z.boolean().default(true),
    status: z.enum(['active', 'inactive', 'pending']).default('pending'), // 🆕
    trust_level: z.enum(['unrated', 'trusted', 'verified', 'flagged']).default('unrated'),
    notes: z.string().optional(),
});


// ✅ Supabase client
function createSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value;
                },
                set(name, value, options) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name, options) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );
}

// ✅ GET /api/partners – fetch all partners
export async function GET(req: NextRequest) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('partners').select('*').order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to fetch partners:', error);
        return NextResponse.json({ error: 'Failed to load partners' }, { status: 500 });
    }

    return NextResponse.json(data);
}

// ✅ POST /api/partners – create a new partner
export async function POST(req: NextRequest) {
    const supabase = createSupabaseClient();
    const body = await req.json();
    const validation = partnerSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('partners')
        .insert({
            name: validation.data.name,
            contact_name: validation.data.contact_name,
            contact_email: validation.data.contact_email,
            contact_phone: validation.data.contact_phone,
            location: validation.data.location,
            company: validation.data.company,
            is_active: validation.data.is_active,
            status: validation.data.status, // 🆕
            notes: validation.data.notes,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to insert partner:', error);
        return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 });
    }

    return NextResponse.json({ success: true, partner: data }, { status: 201 });
}

// ✅ PUT /api/partners – update an existing partner
export async function PUT(req: NextRequest) {
    const supabase = createSupabaseClient();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
        return NextResponse.json({ error: 'Missing partner ID' }, { status: 400 });
    }

    const validation = partnerSchema.partial().safeParse(updates);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('partners')
        .update({ ...validation.data })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Failed to update partner:', error);
        return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 });
    }

    return NextResponse.json({ success: true, partner: data }, { status: 200 });
}

// ✅ DELETE /api/partners – delete a partner
export async function DELETE(req: NextRequest) {
    const supabase = createSupabaseClient();
    const { id } = await req.json();

    if (!id) {
        return NextResponse.json({ error: 'Missing partner ID' }, { status: 400 });
    }

    const { error } = await supabase.from('partners').delete().eq('id', id);

    if (error) {
        console.error('Failed to delete partner:', error);
        return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
}
