import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// ============================================================================
// Zod Schemas
// ============================================================================
// Validate URL param: must be a UUID
const paramSchema = z.object({
  id: z.string().uuid({ message: 'Invalid profile ID format' })
});

// Validate partial updates to profile
const profileUpdateSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().optional(),
  is_active: z.boolean().optional(), // If you store is_active in profiles
});

// ============================================================================
// Helper: createSupabaseClient
// ============================================================================
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
// GET /api/profiles/:id — Only admin or profile owner can fetch
// ============================================================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  // Validate param
  const parseResult = paramSchema.safeParse(params);
  if (!parseResult.success) {
    return NextResponse.json({
      error: 'Invalid profile ID',
      details: parseResult.error.flatten().fieldErrors
    }, { status: 400 });
  }
  const { id } = parseResult.data;

  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }

    // Fetch the profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if this user is either admin or the owner of the profile
    const isAuthorized = (currentUser.role === 'admin') || (profile.user_id === user.id);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Not authorized to access this profile' }, { status: 403 });
    }

    return NextResponse.json(profile, { status: 200 });

  } catch (err) {
    console.error('Error in GET /api/profiles/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/profiles/:id — Only admin or profile owner can update
// ============================================================================
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  // Param check
  const paramResult = paramSchema.safeParse(params);
  if (!paramResult.success) {
    return NextResponse.json(
      { error: 'Invalid profile ID', details: paramResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { id } = paramResult.data;

  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate body
    const body = await request.json();
    const parseBody = profileUpdateSchema.safeParse(body);
    if (!parseBody.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseBody.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const updatedFields = parseBody.data;

    // Fetch the existing profile
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError || !existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get current user role to see if they're admin
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }

    // Only admin or the profile owner can update
    const isOwnerOrAdmin = (currentUser.role === 'admin') || (existingProfile.user_id === user.id);
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Not allowed to update this profile' }, { status: 403 });
    }

    // Perform the update
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...updatedFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProfile, { status: 200 });

  } catch (err) {
    console.error('Error in PATCH /api/profiles/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/profiles/:id — Only admin or profile owner can delete
// ============================================================================
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseClient();

  // Param check
  const paramResult = paramSchema.safeParse(params);
  if (!paramResult.success) {
    return NextResponse.json(
      { error: 'Invalid profile ID', details: paramResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { id } = paramResult.data;

  try {
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the existing profile
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', id)
      .single();

    if (profileError || !existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user is admin or owner of the profile
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }

    const isOwnerOrAdmin = (currentUser.role === 'admin') || (existingProfile.user_id === user.id);
    if (!isOwnerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Not allowed to delete this profile' }, { status: 403 });
    }

    // Perform deletion
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting profile:', deleteError);
      return NextResponse.json({ error: 'Failed to delete profile', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Profile deleted successfully' }, { status: 200 });

  } catch (err) {
    console.error('Error in DELETE /api/profiles/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
