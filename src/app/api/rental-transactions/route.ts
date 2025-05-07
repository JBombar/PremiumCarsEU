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
    const pageSize = parseInt(searchParams.get('page_size') || '10', 10);
    const rawSort = searchParams.get('sort') || 'createdAt,desc';
    const [clientSortField, sortDirection] = rawSort.split(',') as [string, 'asc' | 'desc'];
    const search = searchParams.get('search') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const status = searchParams.get('status') || '';

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
    type ValidStatus = typeof validStatuses[number];

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

    // Query the full list of transactions to manually compute KPIs
    let fullKpiQuery = supabase
        .from('rental_transactions_v')
        .select('status, total_price, duration, created_at');

    if (statusFilter) fullKpiQuery = fullKpiQuery.eq('status', statusFilter);
    if (search) {
        fullKpiQuery = fullKpiQuery.or(
            `car_make.ilike.%${search}%,car_model.ilike.%${search}%,renter_name.ilike.%${search}%`
        );
    }
    if (from) fullKpiQuery = fullKpiQuery.gte('created_at', from);
    if (to) fullKpiQuery = fullKpiQuery.lte('created_at', to);

    const { data: allTransactions, error: kpiError } = await fullKpiQuery;

    if (kpiError) {
        console.error('KPI Fetch Error:', kpiError);
        return NextResponse.json({ error: 'Failed to fetch KPI data', details: kpiError.message }, { status: 500 });
    }

    const kpis = {
        total_reservations: allTransactions?.length || 0,
        total_confirmed: 0,
        total_completed: 0,
        gross_revenue_chf: 0,
        avg_price_chf: 0,
        avg_length_hours: 0,
    };

    if (allTransactions && allTransactions.length > 0) {
        for (const row of allTransactions) {
            if (row.status === 'confirmed') kpis.total_confirmed++;
            if (row.status === 'completed') kpis.total_completed++;
            kpis.gross_revenue_chf += row.total_price || 0;
            kpis.avg_price_chf += row.total_price || 0;
            kpis.avg_length_hours += row.duration || 0;
        }

        const count = allTransactions.length;
        kpis.avg_price_chf = kpis.avg_price_chf / count;
        kpis.avg_length_hours = kpis.avg_length_hours / count;
    }

    // Fetch paginated transaction rows
    let query = supabase
        .from('rental_transactions_v')
        .select('*', { count: 'exact' })
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (statusFilter) query = query.eq('status', statusFilter);
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
