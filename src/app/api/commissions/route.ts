import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { z } from 'zod'

// ============================================================================
// Helper: Create Supabase Client
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

// Zod schemas
// Basic create schema for commissions
const commissionCreateSchema = z.object({
  tipper_id: z.string().uuid(),
  transaction_id: z.string().uuid(),
  amount: z.number().nonnegative(),
  status: z.enum(['pending', 'paid']).optional().default('pending')
})

// ============================================================================
// GET /api/commissions
// => admin => sees all
// => tipper => sees their own commissions
// ============================================================================
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // check user role or tipper association
  const { data: currentUser, error: roleErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (roleErr || !currentUser) {
    return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 })
  }

  let query = supabase.from('commissions').select('*')

  if (currentUser.role === 'admin') {
    // admin => no filter needed
  } else if (currentUser.role === 'tipper') {
    // tipper => need to find their tipper_id
    const { data: tipperRec } = await supabase
      .from('tippers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!tipperRec) {
      return NextResponse.json({ error: 'You are not recognized as a tipper' }, { status: 403 })
    }

    query = query.eq('tipper_id', tipperRec.id)
  } else {
    // normal user => not allowed to see any commissions
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: commissions, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch commissions', details: error.message }, { status: 500 })
  }

  return NextResponse.json(commissions, { status: 200 })
}

// ============================================================================
// POST /api/commissions
// => typically admin or system. If tipper or other role can do it, adapt
// ============================================================================
export async function POST(req: Request) {
  const supabase = createSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // parse body
  const rawBody = await req.json()
  const parseResult = commissionCreateSchema.safeParse(rawBody)
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten() }, { status: 400 })
  }
  const validated = parseResult.data

  // check if user is admin
  const { data: currentUser, error: roleErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (roleErr || !currentUser) {
    return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 })
  }

  // If only admin can create commissions
  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Only admin can create commissions' }, { status: 403 })
  }

  // insert commission
  const { data: newCommission, error: insertErr } = await supabase
    .from('commissions')
    .insert({
      tipper_id: validated.tipper_id,
      transaction_id: validated.transaction_id,
      amount: validated.amount,
      status: validated.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (insertErr) {
    return NextResponse.json({ error: 'Failed to create commission', details: insertErr.message }, { status: 500 })
  }

  return NextResponse.json(newCommission, { status: 201 })
}
