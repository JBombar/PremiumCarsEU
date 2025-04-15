import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Helper
function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
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

// param check
const idSchema = z.object({
  id: z.string().uuid()
});

// partial update schema
const transactionUpdateSchema = z.object({
  agreed_price: z.number().positive().optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  completed_at: z.string().datetime().optional()
});

// ============================================================================
// GET /api/transactions/:id
// => admin => sees any
// => buyer => sees if buyer_id = user.id
// => dealer => sees if seller_id = user.id
// ============================================================================
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid transaction ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: tx, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !tx) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  // check role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentUser) return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });

  if (currentUser.role === 'admin') {
    return NextResponse.json(tx, { status: 200 });
  } else if (currentUser.role === 'dealer') {
    if (tx.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(tx, { status: 200 });
  } else {
    // assume normal user => must be buyer
    if (tx.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(tx, { status: 200 });
  }
}

// ============================================================================
// PATCH /api/transactions/:id
// => admin => can update
// => buyer => can do updates if buyer_id = user.id (like cancel?)
// => dealer => can do updates if seller_id = user.id
// ============================================================================
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid transaction ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // parse body
  const body = await req.json();
  const parsed = transactionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: tx, error: fetchErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !tx) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  // role check
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  let allowed = false;
  if (currentUser.role === 'admin') {
    allowed = true;
  } else if (currentUser.role === 'dealer') {
    if (tx.seller_id === user.id) {
      allowed = true;
    }
  } else {
    // normal => must be buyer
    if (tx.buyer_id === user.id) {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: updated, error: updateErr } = await supabase
    .from('transactions')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: 'Update failed', details: updateErr.message }, { status: 500 });
  }

  return NextResponse.json(updated, { status: 200 });
}

// ============================================================================
// DELETE /api/transactions/:id
// => admin => can delete
// => buyer => can delete if buyer_id = user.id? (e.g. if transaction not completed yet)
// => dealer => can delete if seller_id = user.id? 
// => adapt to your business logic
// ============================================================================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid transaction ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tx, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !tx) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  // role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  let allowed = false;
  if (currentUser.role === 'admin') {
    allowed = true;
  } else if (currentUser.role === 'dealer') {
    if (tx.seller_id === user.id) {
      allowed = true;
    }
  } else {
    // normal => buyer
    if (tx.buyer_id === user.id) {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteErr } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: 'Delete failed', details: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Transaction deleted' }, { status: 200 });
}
