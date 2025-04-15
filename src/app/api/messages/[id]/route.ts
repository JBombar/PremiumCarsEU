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

// Zod for ID + optional updates
const idSchema = z.object({
  id: z.string().uuid()
});

const messageUpdateSchema = z.object({
  content: z.string().min(1).optional(),
  // e.g. read_at
  read_at: z.string().datetime().optional()
});

// ============================================================================
// GET /api/messages/:id
// => admin => can see
// => else => must be sender or receiver
// ============================================================================
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid message ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: msg, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !msg) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  // check role
  const { data: userRec } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRec) return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });

  if (userRec.role === 'admin') {
    return NextResponse.json(msg, { status: 200 });
  }

  // must be sender or receiver
  if (msg.sender_id !== user.id && msg.receiver_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(msg, { status: 200 });
}

// ============================================================================
// PATCH /api/messages/:id
// => admin => can patch anything
// => else => must be sender (to update content?) or receiver (maybe to set read_at?)
// ============================================================================
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();
  const parse = idSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const body = await req.json();
  const parsedBody = messageUpdateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsedBody.error.flatten() }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: msg, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !msg) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
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
    // must be sender or receiver
    if (msg.sender_id === user.id || msg.receiver_id === user.id) {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // do the update
  const { data: updated, error: updateErr } = await supabase
    .from('messages')
    .update({
      ...parsedBody.data
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update message', details: updateErr.message }, { status: 500 });
  }

  return NextResponse.json(updated, { status: 200 });
}

// ============================================================================
// DELETE /api/messages/:id
// => admin => can delete
// => sender => can delete?
// => receiver => might not be allowed? adapt
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

  const { data: msg, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !msg) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  // role
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
    // must be the sender to delete?
    if (msg.sender_id === user.id) {
      allowed = true;
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteErr } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: 'Failed to delete message', details: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Message deleted' }, { status: 200 });
}
