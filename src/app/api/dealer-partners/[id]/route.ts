import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

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

// PATCH /dealer-partners/:id → approve / revoke sub‑dealer
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createSupabaseClient();
    const validation = paramsSchema.safeParse(params);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    const { id } = validation.data;

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // confirm this user is the owner of that dealership
    const { data: dealer } = await supabase
        .from('dealerships')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();
    if (!dealer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // read desired approval state from the body
    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const isApproved = (body as any).is_approved;
    if (typeof isApproved !== 'boolean') {
        return NextResponse.json({ error: '`is_approved` boolean required' }, { status: 400 });
    }

    // update the partner record
    const { data, error } = await supabase
        .from('dealer_partners')
        .update({ is_approved: isApproved })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 200 });
}
