import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// ============================================================================
// Zod Schema for URL Parameter Validation
// ============================================================================
const paramsSchema = z.object({
  id: z.string().uuid({ message: "Invalid user ID format" })
});

// ============================================================================
// Zod Schema for User Update Validation
// ============================================================================
const userUpdateSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  is_active: z.boolean().optional(),
  role: z.enum(['admin', 'dealer', 'tipper', 'buyer']).optional()
});

// ============================================================================
// Helper Function to Create Supabase Client
// ============================================================================
function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch (error) { }
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) { }
        },
      },
    }
  );
}

// ============================================================================
// GET /api/users/:id — Retrieve a user by ID (admin or self-access)
// ============================================================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  // 1. Validate URL parameters
  const parseResult = paramsSchema.safeParse(params);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { id } = parseResult.data;

  try {
    // 2. Authenticate the request
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Check if the requester is either an admin or the same user as requested
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      console.error('Error verifying user role:', roleError);
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }

    const isAuthorized = currentUser.role === 'admin' || user.id === id;
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Not authorized to access this user' }, { status: 403 });
    }

    // 4. Fetch the requested user from the "users" table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in GET /api/users/:id:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/users/:id — Update a user by ID (admin-only update)
// ============================================================================
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  // Validate URL parameters
  const parseResult = paramsSchema.safeParse(params);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { id } = parseResult.data;

  try {
    // Authenticate the request
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure that only an admin can update user details
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      console.error('Error verifying user role:', roleError);
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can update user details' }, { status: 403 });
    }

    // Parse and validate the request body using Zod
    const body = await request.json();
    const updateResult = userUpdateSchema.safeParse(body);
    if (!updateResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: updateResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const validatedData = updateResult.data;

    // Update the user in the "users" table
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ ...validatedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to update user', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in PATCH /api/users/:id:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/users/:id — Delete a user by ID (admin-only)
// ============================================================================
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const supabase = createSupabaseClient();
  
    // 1. Validate URL param
    const parseResult = paramsSchema.safeParse(params);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { id } = parseResult.data;
  
    try {
      // 2. Authenticate the request
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      // 3. Check if the requester is an admin
      const { data: currentUser, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
  
      if (roleError || !currentUser) {
        console.error('Error verifying user role:', roleError);
        return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
      }
  
      if (currentUser.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only admins can delete users' }, { status: 403 });
      }
  
      // 4. Perform the deletion
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
  
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return NextResponse.json({ error: 'Failed to delete user', details: deleteError.message }, { status: 500 });
      }
  
      return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  
    } catch (error) {
      console.error('Unexpected error in DELETE /api/users/:id:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
  