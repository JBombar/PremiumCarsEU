import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// ============================================================================
// Supabase Client
// ============================================================================
function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch {} },
        remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch {} },
      },
    }
  );
}

// ============================================================================
// Zod Schemas
// ============================================================================
const reviewCreateSchema = z.object({
  reviewee_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  listing_id: z.string().uuid().optional(),
  transaction_id: z.string().uuid().optional()
});

// ============================================================================
// GET /api/reviews
// => admin => sees all
// => normal user => sees reviews where reviewer_id = me OR reviewee_id = me
// ============================================================================
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient();

  // Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user role
  const { data: userRec } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRec) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  // Build query
  let query = supabase.from('reviews').select('*');

  if (userRec.role === 'admin') {
    // admin => see everything
  } else {
    // normal user => see where I'm the reviewer or reviewee
    query = query.or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`);
  }

  const { data: reviews, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews', details: error.message }, { status: 500 });
  }

  return NextResponse.json(reviews, { status: 200 });
}

// ============================================================================
// POST /api/reviews
// => user => create a new review
// ============================================================================
export async function POST(req: Request) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookies().get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          try { cookies().set({ name, value, ...options }); } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookies().set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );

  // Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse body
  const body = await req.json();
  const parsed = reviewCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { reviewee_id, rating, comment, listing_id, transaction_id } = parsed.data;

  // Insert
  const { data: newReview, error: insertErr } = await supabase
    .from('reviews')
    .insert({
      reviewer_id: user.id,
      reviewee_id,
      rating,
      comment: comment || null,
      listing_id: listing_id || null,
      transaction_id: transaction_id || null,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: 'Failed to create review', details: insertErr.message }, { status: 500 });
  }

  return NextResponse.json(newReview, { status: 201 });
}
