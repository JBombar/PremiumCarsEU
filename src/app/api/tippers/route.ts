import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Zod schema for creating a tipper
// Adjust fields to match your "tippers" table structure
const tipperCreateSchema = z.object({
  user_id: z.string().uuid().optional(),
  dealership_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional().default('pending'),
  commission_rate: z.number().min(0).max(1).optional().default(0),
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
// GET /api/tippers - list all tippers (admin-only in this example)
// ============================================================================
export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient();

  try {
    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify role from "users" table
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }

    // Only admin can see all tippers by default
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admin can list all tippers' }, { status: 403 });
    }

    // 3. Fetch all tippers
    const { data: tippers, error: fetchError } = await supabase
      .from('tippers')
      .select('*');

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch tippers', details: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ tippers }, { status: 200 });

  } catch (err) {
    console.error('GET /api/tippers error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/tippers - create new tipper
// - Admin can create for any user
// - Non-admin? adapt if you allow them to become tipper themselves
// ============================================================================
export async function POST(request: Request) {
  const supabase = createSupabaseClient();

  try {
    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const rawBody = await request.json();
    const parseResult = tipperCreateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const validatedData = parseResult.data;

    // 2. Check current user's role
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }

    let targetUserId = validatedData.user_id;

    // Example logic:
    // If user is admin, can specify any user_id.
    // If non-admin, forced to be themselves.
    if (currentUser.role !== 'admin') {
      targetUserId = user.id;
    } else {
      targetUserId = targetUserId || user.id;
    }

    // 3. Insert new tipper
    const { data: newTipper, error: insertError } = await supabase
      .from('tippers')
      .insert({
        user_id: targetUserId,
        dealership_id: validatedData.dealership_id || null,
        status: validatedData.status,
        commission_rate: validatedData.commission_rate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating tipper:', insertError);
      return NextResponse.json({ error: 'Failed to create tipper', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newTipper, { status: 201 });

  } catch (err) {
    console.error('POST /api/tippers error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
