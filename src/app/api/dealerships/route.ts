import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Zod schema for creating a dealership
const dealershipCreateSchema = z.object({
  name: z.string().min(1, { message: 'Dealership name is required' }),
  city: z.string().optional(),
  country: z.string().optional(),
  logo_url: z.string().url().optional(),
  website_url: z.string().url().optional()
});

// Helper to create Supabase client
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
// GET /api/dealerships — List all dealerships (admin-only? adapt if needed)
// ============================================================================
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient();

  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role from users table
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
    }

    // Suppose only admin sees all. (Adapt if owners can see only their dealership.)
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admin can list dealerships' }, { status: 403 });
    }

    // Fetch all dealerships
    const { data: dealerships, error: fetchError } = await supabase
      .from('dealerships')
      .select('*');

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch dealerships', details: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ dealerships }, { status: 200 });

  } catch (err) {
    console.error('GET /api/dealerships error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/dealerships — Create a new dealership
// - If admin, can specify owner_user_id or pass in a user ID. If none, fallback?
// - If non-admin, forced to set owner_user_id = the authenticated user
// ============================================================================
export async function POST(req: Request) {
  const supabase = createSupabaseClient();

  // Zod schema for optional 'owner_user_id' if you allow admin to set it
  // If not, remove or adapt
  const bodySchema = dealershipCreateSchema.extend({
    owner_user_id: z.string().uuid().optional()
  });

  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate body
    const rawBody = await req.json();
    const parseResult = bodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const validatedData = parseResult.data;

    // Check role
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }

    // Suppose non-admin can create a dealership only for themselves
    // If admin, can specify `owner_user_id`
    let ownerUserId = validatedData.owner_user_id;
    if (currentUser.role !== 'admin') {
      ownerUserId = user.id; // Forced to be their own user ID
    } else {
      ownerUserId = ownerUserId || user.id;
    }

    const { data: newDealership, error: insertError } = await supabase
      .from('dealerships')
      .insert({
        owner_user_id: ownerUserId,
        name: validatedData.name,
        city: validatedData.city || '',
        country: validatedData.country || '',
        logo_url: validatedData.logo_url || '',
        website_url: validatedData.website_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating dealership:', insertError);
      return NextResponse.json({ error: 'Failed to create dealership', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newDealership, { status: 201 });

  } catch (err) {
    console.error('POST /api/dealerships error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
