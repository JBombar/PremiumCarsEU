import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Ensure types are regenerated after schema change
import { z } from 'zod';

// --- Zod schema for POST body ---
const pendingListingSchema = z.object({
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().optional(),
    price: z.number().nonnegative().optional(),
    mileage: z.number().int().nonnegative().optional(),
    fuel_type: z.string().optional(),
    transmission: z.string().optional(),
    condition: z.string(), // Assuming condition is required
    location_city: z.string().optional(),
    location_country: z.string().optional(),
    images: z.array(z.string().url()).optional(),
    description: z.string().optional(),
    body_type: z.string().optional(),
    exterior_color: z.string().optional(),
    interior_color: z.string().optional(),
    engine: z.string().optional(),
    vin: z.string().optional(),
    features: z.array(z.string()).optional(),
    seller_name: z.string().optional(), // Consider if this should come from user/partner data
    seller_since: z.string().optional(), // Consider if this should come from user/partner data
    is_special_offer: z.boolean().optional(),
    special_offer_label: z.string().optional(),
    is_shared_with_network: z.boolean().optional(), // Added new field for network sharing
});
type PendingListing = z.infer<typeof pendingListingSchema>;

// Helper to spin up Supabase client
function createSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (name) => cookieStore.get(name)?.value,
                set: (name, value, opts) => { try { cookieStore.set({ name, value, ...opts }) } catch (e) { console.error("Cookie set error:", e); } },
                remove: (name, opts) => { try { cookieStore.set({ name, value: '', ...opts }) } catch (e) { console.error("Cookie remove error:", e); } },
            },
        }
    );
}

// GET all pending listings for _this_ dealer (associated or independent)
export async function GET(req: NextRequest) {
    const supabase = createSupabaseClient();

    // 1) Authenticate user
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        console.error("GET /pending-listings: Auth Error", authErr);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2) Find their approved partnership record (dealership_id can be null now)
    const { data: partner, error: partErr } = await supabase
        .from('dealer_partners')
        .select('dealership_id') // Select the potentially null dealership_id
        .eq('dealer_user_id', user.id)
        .eq('is_approved', true) // Ensure the partner is approved
        .maybeSingle(); // Use maybeSingle as single() errors if no record found

    // Handle cases where partner record doesn't exist or isn't approved
    if (partErr) {
        console.error("GET /pending-listings: Error fetching partner", partErr);
        return NextResponse.json({ error: 'Failed to verify dealer status' }, { status: 500 });
    }
    if (!partner) {
        console.log(`GET /pending-listings: No approved partner record found for user ${user.id}`);
        return NextResponse.json({ error: 'Forbidden: Dealer not found or not approved' }, { status: 403 });
    }

    // 3) Fetch pending_listings based on dealership_id (or null)
    let query = supabase
        .from('pending_listings')
        .select('*');

    // --- MODIFICATION START ---
    // Apply the correct filter based on whether the partner has a dealership_id
    if (partner.dealership_id) {
        // If partner has a dealership_id, filter by that ID
        query = query.eq('dealership_id', partner.dealership_id); // Error 1 (Line 71) is resolved here
    } else {
        // If partner's dealership_id is null, filter for listings where dealership_id IS NULL
        query = query.is('dealership_id', null);
    }
    // --- MODIFICATION END ---

    const { data, error: fetchError } = await query;

    if (fetchError) {
        console.error("GET /pending-listings: Error fetching listings", fetchError);
        return NextResponse.json({ error: 'Failed to fetch pending listings' }, { status: 500 });
    }

    console.log(`GET /pending-listings: Found ${data?.length ?? 0} listings for user ${user.id} (dealership_id: ${partner.dealership_id ?? 'null'})`);
    return NextResponse.json(data ?? [], { status: 200 }); // Return empty array if data is null
}

// POST a new pending listing (dealer can be associated or independent)
export async function POST(req: NextRequest) {
    const supabase = createSupabaseClient();

    // 1) Authenticate user
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        console.error("POST /pending-listings: Auth Error", authErr);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2) Find their approved partnership record
    const { data: partner, error: partErr } = await supabase
        .from('dealer_partners')
        .select('dealership_id') // Select the potentially null dealership_id
        .eq('dealer_user_id', user.id)
        .eq('is_approved', true)
        .maybeSingle(); // Use maybeSingle

    if (partErr) {
        console.error("POST /pending-listings: Error fetching partner", partErr);
        return NextResponse.json({ error: 'Failed to verify dealer status' }, { status: 500 });
    }
    if (!partner) {
        console.log(`POST /pending-listings: No approved partner record found for user ${user.id}`);
        return NextResponse.json({ error: 'Forbidden: Dealer not found or not approved' }, { status: 403 });
    }

    // 3) Parse and validate request body
    let body: unknown;
    try {
        body = await req.json();
    } catch (e) {
        console.error("POST /pending-listings: Invalid JSON", e);
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = pendingListingSchema.safeParse(body);
    if (!parsed.success) {
        console.error("POST /pending-listings: Validation Error", parsed.error.flatten().fieldErrors);
        return NextResponse.json({ error: 'Invalid input data', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    // 4) Prepare data for insertion
    // --- MODIFICATION START ---
    // The dealership_id from the partner record (string | null) is now directly usable,
    // ASSUMING you've made pending_listings.dealership_id nullable in the DB
    // and regenerated types. TypeScript error (Line 112) should be resolved by this.
    const toInsert = {
        ...parsed.data, // Validated listing data
        dealership_id: partner.dealership_id, // This can be string OR null
        created_by: user.id, // Track which user created the listing
        is_approved: false, // Listings start as pending approval
        // Add other necessary fields or defaults
    };
    // --- MODIFICATION END ---


    // 5) Insert into pending_listings
    const { data: insertedData, error: insertError } = await supabase
        .from('pending_listings')
        .insert(toInsert) // Insert the prepared data
        .select() // Select the newly inserted row
        .single(); // Expect one row back

    if (insertError) {
        console.error("POST /pending-listings: Insert Error", insertError);
        // Provide more specific feedback if possible (e.g., unique constraint violation)
        return NextResponse.json({ error: 'Failed to create pending listing', details: insertError.message }, { status: 500 });
    }

    console.log(`POST /pending-listings: Listing created with ID ${insertedData.id} for user ${user.id}`);
    return NextResponse.json(insertedData, { status: 201 }); // 201 Created
}