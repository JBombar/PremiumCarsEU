import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// 1) Create Supabase Client
function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );
}

// 2) Zod Schemas
// GET might be simple or you can add filters
// For POST, we require listing_id, start_date, end_date
const reservationCreateSchema = z.object({
  listing_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string()
});

// ============================================================================
// GET /api/rental_reservations
// => Show all reservations for the logged-in user (the "renter")
// ============================================================================
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // In this simplified version, we only show reservations for user.id
  // If you want admin or dealer logic, see the previous approach with subqueries or adapt further
  const { data: reservations, error } = await supabase
    .from('rental_reservations')
    .select('*')
    .eq('renter_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch reservations', details: error.message }, { status: 500 });
  }

  return NextResponse.json(reservations, { status: 200 });
}

// ============================================================================
// POST /api/rental_reservations
// => Create a new reservation, setting renter_id = user.id
// ============================================================================
export async function POST(req: Request) {
  const supabase = createSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawBody = await req.json();
  const parseResult = reservationCreateSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten() }, { status: 400 });
  }
  const { listing_id, start_date, end_date } = parseResult.data;

  // Insert new reservation
  const { data: newReservation, error: insertError } = await supabase
    .from('rental_reservations')
    .insert({
      listing_id,
      renter_id: user.id,    // <== Key difference: use "renter_id"
      start_date,
      end_date,
      status: 'pending',    // default, if your table has such a column
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create reservation', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newReservation, { status: 201 });
}
