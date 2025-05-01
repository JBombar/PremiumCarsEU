// src/app/api/rental_transactions/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(req: NextRequest) {
    // 1. Spin up a Supabase client in SSR mode
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (name: string) => cookies().get(name)?.value,
                set: () => { /* no-op */ },
                remove: () => { /* no-op */ },
            },
        }
    );

    // 2. Fetch all rows from your view
    const { data, error } = await supabase
        .from('rental_transactions_v')
        .select('*')
        .order('start_ts', { ascending: false });

    if (error) {
        console.error('Error fetching rental transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions', details: error.message },
            { status: 500 }
        );
    }

    // 3. Return the data as JSON
    return NextResponse.json(data, { status: 200 });
}
