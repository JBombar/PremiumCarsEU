import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Supabase client
function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
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

// Param validation
const idSchema = z.object({
  id: z.string().uuid()
});

// Partial update
const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional()
});

// ============================================================================
// GET /api/reviews/:id
// => admin => can see
// => normal => can see if reviewer_id=me or reviewee_id=me
// => or you can make them fully public, adapt logic
// ============================================================================
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid review ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  // role
  const { data: userRec } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRec) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  if (userRec.role === 'admin') {
    return NextResponse.json(review, { status: 200 });
  }

  // normal => must be the reviewer or reviewee
  if (review.reviewer_id === user.id || review.reviewee_id === user.id) {
    return NextResponse.json(review, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ============================================================================
// PATCH /api/reviews/:id
// => only the reviewer or admin can update rating/comment
// ============================================================================
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid review ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsedBody = reviewUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.flatten() }, { status: 400 });
  }

  const { data: existing, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !existing) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  // role
  const { data: userRec } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRec) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  let allowed = false;
  if (userRec.role === 'admin') {
    allowed = true;
  } else if (existing.reviewer_id === user.id) {
    // the original reviewer
    allowed = true;
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: updated, error: updateErr } = await supabase
    .from('reviews')
    .update({
      ...parsedBody.data
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update review', details: updateErr.message }, { status: 500 });
  }

  return NextResponse.json(updated, { status: 200 });
}

// ============================================================================
// DELETE /api/reviews/:id
// => admin => can delete
// => reviewer => can delete their own
// ============================================================================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid review ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // fetch
  const { data: existing, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !existing) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  // role
  const { data: userRec } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRec) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  let allowed = false;
  if (userRec.role === 'admin') {
    allowed = true;
  } else if (existing.reviewer_id === user.id) {
    allowed = true;
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteErr } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: 'Failed to delete review', details: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Review deleted' }, { status: 200 });
}
