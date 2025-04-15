import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// ============================================================================
// ✅ Zod Schema for Request Validation (fixed role enum)
// ============================================================================
const userCreateSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  role: z.enum(['dealer', 'admin', 'tipper', 'buyer'], {
    errorMap: () => ({ message: "Role must be one of: dealer, admin, tipper, buyer" })
  }),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

// ============================================================================
// 🔧 Helper Function to Create Supabase Client
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
// POST /api/users — Create New User
// ============================================================================
export async function POST(request: Request) {
  const supabase = createSupabaseClient();

  try {
    // 🔐 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Valid authentication is required' }, { status: 401 });
    }

    // 🔍 2. Check Role
    const { data: userData, error: userRoleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userRoleError) {
      console.error('Error fetching user role:', userRoleError);
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }

    if (userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only administrators can create users' }, { status: 403 });
    }

    // 🧪 3. Validate Body
    const body = await request.json();
    const parseResult = userCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const validatedData = parseResult.data;

    // 🧱 4. Insert
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        ...validatedData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Insert failed', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/users:', error);
    return NextResponse.json(
      { error: error instanceof SyntaxError ? 'Invalid JSON format' : 'Internal server error' },
      { status: error instanceof SyntaxError ? 400 : 500 }
    );
  }
}
