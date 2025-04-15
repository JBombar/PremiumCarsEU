import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// 1) Supabase
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
const idSchema = z.object({
  id: z.string().uuid()
});

const reservationUpdateSchema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional()
});

// ============================================================================
// GET /api/rental_reservations/:id
// => only the user who created (renter_id) can see it (in this simplified version)
// ============================================================================
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid reservation ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: reservation, error } = await supabase
    .from('rental_reservations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  // Check if this user is the renter
  if (reservation.renter_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(reservation, { status: 200 });
}

// ============================================================================
// PATCH /api/rental_reservations/:id
// => only the user (renter) who created it can update
// ============================================================================
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid reservation ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // parse body
  const body = await req.json();
  const updateParsed = reservationUpdateSchema.safeParse(body);
  if (!updateParsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: updateParsed.error.flatten() }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('rental_reservations')
    .select('renter_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  if (existing.renter_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('rental_reservations')
    .update({
      ...updateParsed.data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update reservation', details: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updated, { status: 200 });
}

// ============================================================================
// DELETE /api/rental_reservations/:id
// => only the user (renter) who created it can delete
// ============================================================================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid reservation ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('rental_reservations')
    .select('renter_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  if (existing.renter_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from('rental_reservations')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete reservation', details: deleteError.message }, { status: 500 });
  }

  // 204 is standard for successful delete with no body
  return new NextResponse(null, { status: 204 });
}
