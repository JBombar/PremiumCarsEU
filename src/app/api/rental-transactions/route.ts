// src/app/api/rental-transactions/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(req: NextRequest) {
    const cookieStore = cookies();

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    const cookie = cookieStore.get(name);
                    return cookie?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const rawSort = searchParams.get('sort') || 'createdAt,desc';
    const [clientSortField, sortDirection] = rawSort.split(',') as [string, 'asc' | 'desc'];
    const search = searchParams.get('search') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const status = searchParams.get('status') || '';

    // Define a proper type for the status values
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
    type ValidStatus = typeof validStatuses[number]; // Creates union type from array

    // Properly type the statusFilter variable
    const statusFilter: ValidStatus | null =
        validStatuses.includes(status as any)
            ? (status as ValidStatus)
            : null;

    const sortMap: Record<string, string> = {
        createdAt: 'created_at',
        startDate: 'start_date',
        totalPrice: 'total_price',
        status: 'status',
        id: 'id',
    };
    const sortField = sortMap[clientSortField] || 'created_at';

    const { data: kpis, error: kpiError } = await supabase
        .from('rental_kpis_v')
        .select('*')
        .single();

    if (kpiError) {
        console.error('KPI Fetch Error:', kpiError);
        return NextResponse.json({ error: 'Failed to fetch KPIs', details: kpiError.message }, { status: 500 });
    }

    let query = supabase
        .from('rental_transactions_v')
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (statusFilter) query = query.eq('status', statusFilter as "pending" | "confirmed" | "completed" | "cancelled");
    if (search) {
        query = query.or(
            `car_make.ilike.%${search}%,car_model.ilike.%${search}%,renter_name.ilike.%${search}%`
        );
    }
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data: rows, error: txError, count } = await query;

    if (txError) {
        console.error('Transaction Fetch Error:', txError);
        return NextResponse.json({ error: 'Failed to fetch transactions', details: txError.message }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json(
        {
            kpis,
            rows,
            paging: {
                total,
                page,
                pageSize,
                totalPages,
            },
        },
        { status: 200 }
    );
}
