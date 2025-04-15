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

// For GET, no schema needed unless you want query params
// For POST, define needed fields
const aiLogCreateSchema = z.object({
  prompt: z.string().min(1),
  response_summary: z.string().optional()
});

// ============================================================================
// GET /api/ai_query_log
// => admin => sees all
// => user => sees logs with user_id = me
// ============================================================================
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userRec } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRec) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  let query = supabase.from('ai_query_log').select('*');

  if (userRec.role === 'admin') {
    // admin => no filter
  } else {
    // normal => user => see only logs where user_id = me
    query = query.eq('user_id', user.id);
  }

  const { data: logs, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch AI logs', details: error.message }, { status: 500 });
  }

  return NextResponse.json(logs, { status: 200 });
}

// ============================================================================
// POST /api/ai_query_log
// => user => logs a prompt + response summary
// ============================================================================
export async function POST(req: Request) {
  const supabase = createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = aiLogCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { prompt, response_summary } = parsed.data;

  const { data: newLog, error: insertErr } = await supabase
    .from('ai_query_log')
    .insert({
      user_id: user.id,
      prompt,
      response_summary: response_summary || null,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: 'Failed to create AI query log', details: insertErr.message }, { status: 500 });
  }

  return NextResponse.json(newLog, { status: 201 });
}
