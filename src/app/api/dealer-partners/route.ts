import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

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

// GET all sub‑dealers for this primary dealer
export async function GET(req: NextRequest) {
    const supabase = createSupabaseClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // find the dealership owned by this dealer-user
    const { data: dealer, error: dealErr } = await supabase
        .from('dealerships')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();
    if (dealErr || !dealer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // fetch partners
    const { data, error } = await supabase
        .from('dealer_partners')
        .select('*')
        .eq('dealership_id', dealer.id);

    if (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
    return NextResponse.json(data, { status: 200 });
}
