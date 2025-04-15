import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// Helper: Create Supabase Client
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

// Zod schemas
// GET might have advanced filters if needed
// For POST, define the required fields to create a transaction
const transactionCreateSchema = z.object({
  listing_id: z.string().uuid(),
  agreed_price: z.number().positive()
  // Could allow specifying buyer_id or seller_id if admin, etc.
});

// ============================================================================
// GET /api/transactions
// => Admin: sees all
// => Buyer: sees transactions where buyer_id = user.id
// => Dealer: sees transactions where seller_id = user.id
// ============================================================================
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient();

  // Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user) {
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

  let query = supabase.from('transactions').select('*');

  if (currentUser.role === 'admin') {
    // admin => no filter
  } else if (currentUser.role === 'dealer') {
    // dealer => see transactions where seller_id = user.id
    query = query.eq('seller_id', user.id);
  } else {
    // normal user => see transactions where buyer_id = user.id
    query = query.eq('buyer_id', user.id);
  }

  const { data: tx, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions', details: error.message }, { status: 500 });
  }

  return NextResponse.json(tx, { status: 200 });
}

// ============================================================================
// POST /api/transactions
// => e.g. buyer initiates transaction or admin can create on behalf of buyer
// => If role=dealer, they might create a transaction on behalf of a buyer? adapt if needed
// ============================================================================
export async function POST(req: Request) {
  const supabase = createSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // parse body
  const body = await req.json();
  const parsed = transactionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }
  const validated = parsed.data;

  // role check
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 });
  }

  // We'll assume a buyer can create a transaction for a listing
  // The listing belongs to a dealer => We'll fetch the listing to find the seller
  // e.g. if you want the user to pass "seller_id", that's an alternative
  const { data: listing, error: listingErr } = await supabase
    .from('car_listings')
    .select('dealer_id')
    .eq('id', validated.listing_id)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  let buyerId = user.id;
  let sellerId = listing.dealer_id; 

  // If admin => might override buyer or seller
  // For now, let's keep it simple: user is buyer, listing's dealer is seller

  const { data: newTx, error: insertErr } = await supabase
    .from('transactions')
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: validated.listing_id,
      agreed_price: validated.agreed_price,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: 'Failed to create transaction', details: insertErr.message }, { status: 500 });
  }

  return NextResponse.json(newTx, { status: 201 });
}
