import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Make sure this has the correct definition for activity_logs
import { z } from 'zod';

// ⚠️ Fix #1: The actual enum from your DB is:
//    'login' | 'view_listing' | 'submit_lead' | 'create_listing' | 'update_listing' | 'delete_listing' |
//    'create_reservation' | 'update_reservation' | 'create_transaction' | 'update_transaction' | 'etc...'
//    We'll create a Zod schema that exactly matches these possible values.
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

// For creating a new activity log
const activityLogCreateSchema = z.object({
  event_type: eventTypeEnum,              // Must be one of the above
  target_id: z.string().uuid().optional(),// or you can allow any string
  metadata: z.any().optional()            // JSON field
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
// GET /api/activity_logs
// => admin => sees all
// => normal => sees logs where user_id = self
// ============================================================================
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient();

  // 1) Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2) Fetch user role
  const { data: userRec, error: roleErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleErr || !userRec) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  let query = supabase.from('activity_logs').select('*');

  if (userRec.role === 'admin') {
    // admin => see all logs
  } else {
    // normal => only logs with user_id = me
    query = query.eq('user_id', user.id);
  }

  const { data: logs, error: fetchErr } = await query;
  if (fetchErr) {
    return NextResponse.json({ error: 'Failed to fetch logs', details: fetchErr.message }, { status: 500 });
  }

  return NextResponse.json(logs, { status: 200 });
}

// ============================================================================
// POST /api/activity_logs
// => create a new log record
// => user_id = the authenticated user (if required) 
// ============================================================================
export async function POST(req: Request) {
  const supabase = createSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // If you want to allow completely anonymous logs, remove this check
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate input
  const rawBody = await req.json();
  const parseResult = activityLogCreateSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json({
      error: 'Invalid input',
      details: parseResult.error.flatten()
    }, { status: 400 });
  }

  const validatedData = parseResult.data;

  // Insert
  const { data: newLog, error: insertErr } = await supabase
    .from('activity_logs')
    .insert({
      user_id: user.id, // This column must exist in your DB schema & supabase.ts type
      event_type: validatedData.event_type,
      target_id: validatedData.target_id || null,
      metadata: validatedData.metadata || {},
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: 'Failed to create activity log', details: insertErr.message }, { status: 500 });
  }

  return NextResponse.json(newLog, { status: 201 });
}
