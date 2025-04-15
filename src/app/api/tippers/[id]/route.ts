import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Validate param: must be a UUID
const paramSchema = z.object({
  id: z.string().uuid({ message: 'Invalid tipper ID format' })
});

// For partial updates to a tipper
const tipperUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  commission_rate: z.number().min(0).max(1).optional(),
  dealership_id: z.string().uuid().optional()
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
// GET /api/tippers/:id
// (Only admin or the tipper user themselves can see? adapt as needed)
// ============================================================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parse = paramSchema.safeParse(params);
  if (!parse.success) {
    return NextResponse.json(
      { error: 'Invalid tipper ID', details: parse.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { id } = parse.data;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch tipper
    const { data: tipper, error: fetchError } = await supabase
      .from('tippers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !tipper) {
      return NextResponse.json({ error: 'Tipper not found' }, { status: 404 });
    }

    // Check user role / ownership
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
    }

    const isOwnerOrAdmin = (currentUser.role === 'admin') || (tipper.user_id === user.id);
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Not allowed to view this tipper' }, { status: 403 });
    }

    return NextResponse.json(tipper, { status: 200 });

  } catch (err) {
    console.error('GET /api/tippers/:id error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/tippers/:id
// (Only admin or the tipper user themselves can update? adapt as needed.)
// ============================================================================
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  // Param check
  const parseParam = paramSchema.safeParse(params);
  if (!parseParam.success) {
    return NextResponse.json(
      { error: 'Invalid tipper ID', details: parseParam.error.flatten().fieldErrors },
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

    // Validate body
    const body = await request.json();
    const parseBody = tipperUpdateSchema.safeParse(body);
    if (!parseBody.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const validatedData = parseBody.data;

    // Fetch existing tipper
    const { data: existingTipper, error: fetchError } = await supabase
      .from('tippers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTipper) {
      return NextResponse.json({ error: 'Tipper not found' }, { status: 404 });
    }

    // Check role/ownership
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
    }

    const isOwnerOrAdmin = (currentUser.role === 'admin') || (existingTipper.user_id === user.id);
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Not allowed to update this tipper' }, { status: 403 });
    }

    // Perform update
    const { data: updatedTipper, error: updateError } = await supabase
      .from('tippers')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating tipper:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tipper', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedTipper, { status: 200 });

  } catch (err) {
    console.error('PATCH /api/tippers/:id error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/tippers/:id
// (Only admin or tipper user can delete? adapt logic.)
// ============================================================================
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  const parseParam = paramSchema.safeParse(params);
  if (!parseParam.success) {
    return NextResponse.json(
      { error: 'Invalid tipper ID', details: parseParam.error.flatten().fieldErrors },
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

    // Fetch existing tipper
    const { data: existingTipper, error: fetchError } = await supabase
      .from('tippers')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingTipper) {
      return NextResponse.json({ error: 'Tipper not found' }, { status: 404 });
    }

    // Check role or ownership
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
    }

    const isOwnerOrAdmin = (currentUser.role === 'admin') || (existingTipper.user_id === user.id);
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Not allowed to delete this tipper' }, { status: 403 });
    }

    // Perform delete
    const { error: deleteError } = await supabase
      .from('tippers')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting tipper:', deleteError);
      return NextResponse.json({ error: 'Failed to delete tipper', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tipper deleted successfully' }, { status: 200 });

  } catch (err) {
    console.error('DELETE /api/tippers/:id error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
