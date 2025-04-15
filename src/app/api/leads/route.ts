import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Helper: Supabase client
function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch { } },
        remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch { } },
      },
    }
  );
}

// Zod schemas
// If you want advanced filters for GET, define them similarly to your other endpoints
// For POST, define the fields for a new lead
const leadCreateSchema = z.object({
  listing_id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  city: z.string().optional(),
  message: z.string().optional(),
  source_type: z.enum(['organic', 'tipper']).optional().default('organic'),
  source_id: z.string().uuid().optional(), // e.g. a tipper's ID if source_type = 'tipper'
});

// ============================================================================
// GET /api/leads
// => Example logic: 
// Admin: sees all leads
// Dealer: sees leads for their listings
// Normal user (buyer/tipper/etc.): sees only leads they created? 
// (Up to you if a normal user can see the lead they submitted or not.)
// ============================================================================
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient();

  // Attempt to auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user role
  const { data: currentUser, error: roleErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleErr || !currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  // We'll build the query 
  let query = supabase.from('leads').select('*');

  if (currentUser.role === 'admin') {
    // Admin => see all leads
  } else if (currentUser.role === 'dealer') {
    // Dealer => see leads for listings they own
    // We'll do a subselect approach if not relying on RLS:
    query = query.in('listing_id',
      supabase.from('car_listings')
        .select('id')
        .eq('dealer_id', user.id) as any
    );
  } else {
    // For a normal user => see only leads they created
    query = query.eq('from_user_id', user.id);
  }

  const { data: leads, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch leads', details: error.message }, { status: 500 });
  }

  return NextResponse.json(leads, { status: 200 });
}

// ============================================================================
// POST /api/leads
// => A user can create a new lead (for a listing).
// => from_user_id set to user.id, or adapt if you allow anonymous leads
// ============================================================================
export async function POST(req: Request) {
  const supabase = createSupabaseClient();

  // If you want truly anonymous leads, skip the auth check
  // For now, let's require user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawBody = await req.json();
  const parseResult = leadCreateSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten() }, { status: 400 });
  }

  const validated = parseResult.data;

  // Insert lead
  const { data: newLead, error: insertError } = await supabase
    .from('leads')
    .insert({
      listing_id: validated.listing_id,
      from_user_id: user.id,  // track which user submitted
      name: validated.name,
      email: validated.email,
      phone: validated.phone || null,
      city: validated.city || null,
      message: validated.message || null,
      status: 'new',                     // default lead status
      source_type: validated.source_type,
      source_id: validated.source_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create lead', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newLead, { status: 201 });
}
