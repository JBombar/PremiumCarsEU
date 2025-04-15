import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Define interfaces that match your actual database schema
interface Lead {
  id: string;
  from_user_id: string;
  listing_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: string | null;
  budget: number | null;
  color: string | null;
  condition: string | null;
  fuel_type: string | null;
  mileage: number | null;
  year: number | null;
  make: string | null;
  model: string | null;
  contacted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  source_type: string | null;
  source_id: string | null;
}

// Helper
function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch { }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch { }
        },
      },
    }
  );
}

// Param validation
const paramSchema = z.object({
  id: z.string().uuid(),
});

// For partial updates
const leadUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  message: z.string().optional(),
  status: z.enum(['new', 'contacted', 'closed']).optional(),
  source_type: z.enum(['organic', 'tipper']).optional(),
  source_id: z.string().uuid().nullable().optional(),
});

// ============================================================================
// GET /api/leads/:id
// ============================================================================
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = paramSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid ID', details: parse.error.flatten() }, { status: 400 });
  }

  const { id } = parse.data;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  const lead = data as Lead | null;

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead not found', details: error?.message }, { status: 404 });
  }

  const { data: currentUser, error: roleErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleErr || !currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  if (currentUser.role === 'admin') {
    return NextResponse.json(lead, { status: 200 });
  }

  if (currentUser.role === 'dealer') {
    // Optional: add a future dealer_id column to leads table if you want this check
    // For now, only allow access if this user created the lead
    if (lead.from_user_id === user.id) {
      return NextResponse.json(lead, { status: 200 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Normal user
  if (lead.from_user_id === user.id) {
    return NextResponse.json(lead, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ============================================================================
// PATCH /api/leads/:id
// ============================================================================
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = paramSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parseBody = leadUpdateSchema.safeParse(body);
  if (!parseBody.success) {
    return NextResponse.json({ error: 'Invalid input', details: parseBody.error.flatten() }, { status: 400 });
  }

  const validated = parseBody.data;

  const { data: existing, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Lead not found', details: fetchError?.message }, { status: 404 });
  }

  const { data: currentUser, error: roleErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleErr || !currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  const isOwner = existing.from_user_id === user.id;
  const isAdmin = currentUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('leads')
    .update({
      ...validated,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update lead', details: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updated, { status: 200 });
}

// ============================================================================
// DELETE /api/leads/:id
// ============================================================================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = paramSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json({ error: 'Invalid ID', details: parse.error.flatten() }, { status: 400 });
  }
  const { id } = parse.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing, error: fetchError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  const isOwner = existing.from_user_id === user.id;
  const isAdmin = currentUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: deleteErr } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: 'Failed to delete lead', details: deleteErr.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Lead deleted' }, { status: 200 });
}
