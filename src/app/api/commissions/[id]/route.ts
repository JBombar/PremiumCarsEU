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

const idSchema = z.object({
  id: z.string().uuid()
});

// partial update
const commissionUpdateSchema = z.object({
  amount: z.number().nonnegative().optional(),
  status: z.enum(['pending', 'paid']).optional(),
  paid_at: z.string().datetime().optional()
});

// ============================================================================
// GET /api/commissions/:id
// => admin => sees any
// => tipper => sees if tipper_id => tipper's id 
// ============================================================================
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid commission ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // fetch commission
  const { data: comm, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !comm) {
    return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
  }

  // check user role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  if (currentUser.role === 'admin') {
    // admin => can see anything
    return NextResponse.json(comm, { status: 200 });
  } else if (currentUser.role === 'tipper') {
    // tipper => see if tipper_id matches
    // first find the tipper record for this user
    const { data: tipperRec } = await supabase
      .from('tippers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!tipperRec || comm.tipper_id !== tipperRec.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(comm, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ============================================================================
// PATCH /api/commissions/:id
// => admin => can update any
// => tipper => might not be allowed to update? Or can they only confirm something?
// => adapt if you want tippers to see or manage their commission status
// ============================================================================
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid commission ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // parse body
  const body = await req.json();
  const parsed = commissionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  // fetch existing
  const { data: comm, error: fetchErr } = await supabase
    .from('commissions')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !comm) {
    return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
  }

  // check user role
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
  } else if (currentUser.role === 'tipper') {
    // maybe tippers can't update the status themselves unless you want them to see "paid"? 
    // For example:
    // if they want to confirm they've received the payment, you might allow it.
    // We'll do a check:
    const { data: tipperRec } = await supabase
      .from('tippers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (tipperRec && comm.tipper_id === tipperRec.id) {
      // You can choose to allow partial updates, e.g., they can't set "paid" 
      // unless admin does it. This is up to your business rule.
      // We'll assume tippers can't set "status = 'paid'".
      // We'll do a quick check:
      if (parsed.data.status && parsed.data.status === 'paid') {
        // not allowed
        allowed = false;
      } else {
        allowed = true;
      }
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // perform update
  const { data: updated, error: updateErr } = await supabase
    .from('commissions')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update commission', details: updateErr.message }, { status: 500 });
  }

  return NextResponse.json(updated, { status: 200 });
}

// ============================================================================
// DELETE /api/commissions/:id
// => admin => can delete
// => tipper => maybe not, or you can allow them to remove if it's still pending?
// => adapt logic
// ============================================================================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid commission ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: comm, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !comm) {
    return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
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
  } else if (currentUser.role === 'tipper') {
    // maybe tipper can't actually delete. Or you only allow them if "status = 'pending'"
    // We'll show an example check:
    const { data: tipperRec } = await supabase
      .from('tippers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (tipperRec && comm.tipper_id === tipperRec.id && comm.status === 'pending') {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteErr } = await supabase
    .from('commissions')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: 'Failed to delete commission', details: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Commission deleted' }, { status: 200 });
}
