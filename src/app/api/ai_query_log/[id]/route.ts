import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch {} },
        remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch {} },
      },
    }
  );
}

const idSchema = z.object({ id: z.string().uuid() });
const updateSchema = z.object({
  prompt: z.string().optional(),
  response_summary: z.string().optional()
});

// ============================================================================
// GET /api/ai_query_log/:id
// => admin => can see
// => normal => must be user_id = me
// ============================================================================
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: log, error } = await supabase
    .from('ai_query_log')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !log) {
    return NextResponse.json({ error: 'Log not found' }, { status: 404 });
  }

  // check role
  const { data: userRec } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRec) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  if (userRec.role === 'admin') {
    return NextResponse.json(log, { status: 200 });
  } else {
    // must match user_id
    if (log.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(log, { status: 200 });
  }
}

// ============================================================================
// PATCH /api/ai_query_log/:id
// => admin => can patch
// => user => can patch if user_id= me?
// ============================================================================
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const body = await req.json();
  const parsedBody = updateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.flatten() }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: log, error } = await supabase
    .from('ai_query_log')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !log) {
    return NextResponse.json({ error: 'Log not found' }, { status: 404 });
  }

  // check role
  const { data: userRec } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRec) return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });

  let allowed = false;
  if (userRec.role === 'admin') {
    allowed = true;
  } else {
    if (log.user_id === user.id) {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: updated, error: updateErr } = await supabase
    .from('ai_query_log')
    .update({
      ...parsedBody.data
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update log', details: updateErr.message }, { status: 500 });
  }

  return NextResponse.json(updated, { status: 200 });
}

// ============================================================================
// DELETE /api/ai_query_log/:id
// => admin => can delete
// => user => can delete if user_id= me
// ============================================================================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: log, error } = await supabase
    .from('ai_query_log')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !log) {
    return NextResponse.json({ error: 'Log not found' }, { status: 404 });
  }

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
  } else {
    if (log.user_id === user.id) {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteErr } = await supabase
    .from('ai_query_log')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: 'Failed to delete log', details: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'AI query log deleted' }, { status: 200 });
}
