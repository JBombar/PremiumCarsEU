import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Validate param: must be a UUID
const paramSchema = z.object({
  id: z.string().uuid({ message: 'Invalid dealership ID format' })
});

// For partial updates
const dealershipUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  logo_url: z.string().url().optional(),
  website_url: z.string().url().optional(),
});

// Helper function
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
// GET /api/dealerships/:id
// (Only admin or the "owner_user_id" can see details, adapt if needed.)
// ============================================================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = paramSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json(
      { error: 'Invalid dealership ID', details: parse.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { id } = parse.data;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the dealership
    const { data: dealership, error } = await supabase
      .from('dealerships')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !dealership) {
      console.error('Dealership not found or error:', error);
      return NextResponse.json({ error: 'Dealership not found' }, { status: 404 });
    }

    // Check user role or ownership
    // Suppose only admin or the "owner_user_id" can see details
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }

    const isOwnerOrAdmin = (currentUser.role === 'admin') || (dealership.owner_user_id === user.id);
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Not allowed to view this dealership' }, { status: 403 });
    }

    return NextResponse.json(dealership, { status: 200 });

  } catch (err) {
    console.error('GET /api/dealerships/:id error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/dealerships/:id
// (Only admin or the "owner_user_id" can update, adapt if needed.)
// ============================================================================
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  // Validate param
  const parseParam = paramSchema.safeParse(params);
  if (!parseParam.success) {
    return NextResponse.json(
      { error: 'Invalid dealership ID', details: parseParam.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { id } = parseParam.data;

  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const parseBody = dealershipUpdateSchema.safeParse(body);
    if (!parseBody.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const validatedData = parseBody.data;

    // Fetch the existing dealership
    const { data: existing, error: fetchError } = await supabase
      .from('dealerships')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Dealership not found' }, { status: 404 });
    }

    // Check user role or ownership
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
    }

    const isOwnerOrAdmin = (currentUser.role === 'admin') || (existing.owner_user_id === user.id);
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Not allowed to update this dealership' }, { status: 403 });
    }

    // Perform the update
    const { data: updatedDealership, error: updateError } = await supabase
      .from('dealerships')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating dealership:', updateError);
      return NextResponse.json({ error: 'Failed to update dealership', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedDealership, { status: 200 });

  } catch (err) {
    console.error('PATCH /api/dealerships/:id error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/dealerships/:id
// (Only admin or the "owner_user_id" can delete, adapt if needed.)
// ============================================================================
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  // Param check
  const parseParam = paramSchema.safeParse(params);
  if (!parseParam.success) {
    return NextResponse.json(
      { error: 'Invalid dealership ID', details: parseParam.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { id } = parseParam.data;

  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the existing dealership
    const { data: existing, error: fetchError } = await supabase
      .from('dealerships')
      .select('owner_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Dealership not found' }, { status: 404 });
    }

    // Check user role or ownership
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
    }

    const isOwnerOrAdmin = (currentUser.role === 'admin') || (existing.owner_user_id === user.id);
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Not allowed to delete this dealership' }, { status: 403 });
    }

    // Perform delete
    const { error: deleteError } = await supabase
      .from('dealerships')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting dealership:', deleteError);
      return NextResponse.json({ error: 'Failed to delete dealership', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Dealership deleted successfully' }, { status: 200 });

  } catch (err) {
    console.error('DELETE /api/dealerships/:id error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
