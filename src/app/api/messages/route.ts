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

// Zod Schemas
// GET might be minimal or you can add query filters
// POST requires: receiver_id, content
const messageCreateSchema = z.object({
  receiver_id: z.string().uuid(),
  content: z.string().min(1)
});

// ============================================================================
// GET /api/messages
// => admin => sees all
// => normal user => sees messages where sender_id = user.id OR receiver_id = user.id
// ============================================================================
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient();

  // 1) Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2) Check role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  let query = supabase.from('messages').select('*');

  if (currentUser.role === 'admin') {
    // admin => see all
  } else {
    // normal => see messages where sender_id = me OR receiver_id = me
    query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
  }

  const { data: messages, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch messages', details: error.message }, { status: 500 });
  }

  return NextResponse.json(messages, { status: 200 });
}

// ============================================================================
// POST /api/messages
// => user can send message to receiver_id
// ============================================================================
export async function POST(req: Request) {
  const supabase = createSupabaseClient();

  // Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // parse body
  const body = await req.json();
  const parsed = messageCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { receiver_id, content } = parsed.data;

  // insert
  const { data: newMsg, error: insertErr } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id,
      content,
      sent_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: 'Failed to create message', details: insertErr.message }, { status: 500 });
  }

  return NextResponse.json(newMsg, { status: 201 });
}
