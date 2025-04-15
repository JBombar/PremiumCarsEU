import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// The same enumerations if user can patch event_type
const eventTypeEnum = z.enum([
  'login',
  'view_listing',
  'submit_lead',
  'create_listing',
  'update_listing',
  'delete_listing',
  'create_reservation',
  'update_reservation',
  'create_transaction',
  'update_transaction',
  'etc...'
]);

const paramSchema = z.object({ id: z.string().uuid() });

const activityLogUpdateSchema = z.object({
  // All optional
  event_type: eventTypeEnum.optional(),
  target_id: z.string().uuid().optional(),
  metadata: z.any().optional()
});

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

// ============================================================================
// GET /api/activity_logs/:id
// => admin => can view
// => normal => can view if user_id = self
// ============================================================================
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  // Param validation
  const parse = paramSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid log ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  // Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the log
  const { data: logRec, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !logRec) {
    return NextResponse.json({ error: 'Activity log not found' }, { status: 404 });
  }

  // role check
  const { data: userRec } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRec) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  if (userRec.role === 'admin') {
    return NextResponse.json(logRec, { status: 200 });
  } else {
    // normal => check if user_id= me
    if (logRec.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(logRec, { status: 200 });
  }
}

// ============================================================================
// PATCH /api/activity_logs/:id
// => admin => can patch
// => normal => can patch if user_id= me? (depends on your rules)
// ============================================================================
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parseParam = paramSchema.safeParse(params);
  if (!parseParam.success) {
    return NextResponse.json({ error: 'Invalid log ID', details: parseParam.error.flatten() }, { status: 400 });
  }
  const { id } = parseParam.data;

  const body = await req.json();
  const parseBody = activityLogUpdateSchema.safeParse(body);
  if (!parseBody.success) {
    return NextResponse.json({ error: 'Invalid input', details: parseBody.error.flatten() }, { status: 400 });
  }

  // Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // fetch existing
  const { data: existing, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !existing) {
    return NextResponse.json({ error: 'Activity log not found' }, { status: 404 });
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
  } else {
    if (existing.user_id === user.id) {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: updated, error: updateErr } = await supabase
    .from('activity_logs')
    .update({
      ...parseBody.data
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update activity log', details: updateErr.message }, { status: 500 });
  }

  return NextResponse.json(updated, { status: 200 });
}

// ============================================================================
// DELETE /api/activity_logs/:id
// => admin => can delete
// => normal => can delete if user_id= me
// ============================================================================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parseParam = paramSchema.safeParse(params);
  if (!parseParam.success) {
    return NextResponse.json({ error: 'Invalid log ID', details: parseParam.error.flatten() }, { status: 400 });
  }
  const { id } = parseParam.data;

  // Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // fetch existing
  const { data: existing, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !existing) {
    return NextResponse.json({ error: 'Activity log not found' }, { status: 404 });
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
  } else {
    if (existing.user_id === user.id) {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteErr } = await supabase
    .from('activity_logs')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: 'Failed to delete activity log', details: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Activity log deleted' }, { status: 200 });
}
