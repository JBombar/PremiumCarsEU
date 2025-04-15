import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { z } from 'zod'

// ============================================================================
// Zod schema for creating a profile
// ============================================================================
const profileCreateSchema = z.object({
  user_id: z.string().uuid({ message: 'user_id must be a valid UUID' }).optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().optional()
})

// ============================================================================
// Helper: createSupabaseClient with SSR cookies
// ============================================================================
function createSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
}

// ============================================================================
// GET /api/profiles — List all profiles (admin-only)
// ============================================================================
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient()

  try {
    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch current user role from users table
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 })
    }

    // 3. Only admin can see all profiles
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admin can list all profiles' }, { status: 403 })
    }

    // 4. Fetch all profiles
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch profiles', details: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ profiles }, { status: 200 })

  } catch (err) {
    console.error('GET /api/profiles error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST /api/profiles — Create new profile
// - If admin: can specify any user_id
// - If non-admin: must only create profile for themselves
// ============================================================================
export async function POST(req: Request) {
  const supabase = createSupabaseClient()

  try {
    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate request body
    const body = await req.json()
    const parseResult = profileCreateSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Invalid input',
        details: parseResult.error.flatten().fieldErrors
      }, { status: 400 })
    }

    const validatedData = parseResult.data

    // 3. Fetch current user role from users table
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !currentUser) {
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 })
    }

    // If non-admin, force user_id = the authenticated user's ID
    // If admin, can optionally set user_id in the body. If missing, also fallback to user.id
    let targetUserId = validatedData.user_id
    if (currentUser.role !== 'admin') {
      targetUserId = user.id
    } else {
      targetUserId = targetUserId || user.id
    }

    // 4. Insert the profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: targetUserId,
        name: validatedData.name || '',
        phone: validatedData.phone || '',
        city: validatedData.city || '',
        country: validatedData.country || '',
        avatar_url: validatedData.avatar_url || '',
        bio: validatedData.bio || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating profile:', insertError)
      return NextResponse.json({ error: 'Failed to create profile', details: insertError.message }, { status: 500 })
    }

    return NextResponse.json(newProfile, { status: 201 })

  } catch (err) {
    console.error('POST /api/profiles error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
