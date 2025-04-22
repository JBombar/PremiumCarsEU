// src/app/api/car_listings/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database, Json } from '@/types/supabase';
import { z } from 'zod';
import { PostgrestError } from '@supabase/supabase-js';

// ============================================================================
// Zod Schemas
// ============================================================================

// --- UPDATED Schema for Direct POST Requests (Reflects car_listings table more accurately) ---
const carListingPostSchema = z.object({
    // Core Required Fields
    make: z.string().min(1, { message: "Make is required" }),
    model: z.string().min(1, { message: "Model is required" }),
    year: z.number().int().gt(1900).lt(2100),
    price: z.number().positive(),
    condition: z.enum(['new', 'used']), // Assuming 'new'/'used' are the only valid inputs here
    listing_type: z.enum(['sale', 'rent', 'both']),

    // Optional Fields from Original Schema
    mileage: z.number().int().nonnegative().optional(),
    location_city: z.string().optional().nullable(),
    location_country: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    images: z.array(z.string().url()).optional().nullable(),
    is_public: z.boolean().optional().default(true), // Default handled by DB too
    is_shared_with_network: z.boolean().optional().default(false), // Default handled by DB too
    fuel_type: z.string().optional().nullable(),
    transmission: z.string().optional().nullable(),

    // Rental Fields (Kept as is)
    rental_daily_price: z.number().positive().optional().nullable(),
    rental_deposit_required: z.number().nonnegative().optional().nullable(),
    rental_status: z.enum(['available', 'rented', 'maintenance']).optional().nullable(),
    min_rental_days: z.number().int().positive().optional().nullable(),
    max_rental_days: z.number().int().positive().optional().nullable(),

    // --- Fields ADDED based on car_listings table schema ---
    body_type: z.string().optional().nullable(),
    exterior_color: z.string().optional().nullable(),
    interior_color: z.string().optional().nullable(),
    engine: z.string().optional().nullable(),
    vin: z.string().optional().nullable(), // Add length validation if desired: .length(17)
    features: z.array(z.string()).optional().nullable(),
    is_special_offer: z.boolean().optional().nullable(), // DB default is false
    special_offer_label: z.string().optional().nullable(),
    // Note: Fields like status, seller_*, purchasing_price, etc., are typically not set via direct creation API
});


// --- Schema for GET requests (Unchanged) ---
const carListingGetSchema = z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    year_from: z.coerce.number().int().optional(),
    year_to: z.coerce.number().int().optional(),
    price_min: z.coerce.number().nonnegative().optional(),
    price_max: z.coerce.number().positive().optional(),
    condition: z.enum(['new', 'used']).optional(),
    listing_type: z.enum(['sale', 'rent', 'both']).optional(),
    status: z.enum(['available', 'reserved', 'sold']).optional(),
    location_country: z.string().optional(),
    location_city: z.string().optional(),
    dealer_id: z.string().uuid().optional(),
    sortBy: z.enum(['created_at', 'price', 'year', 'mileage']).default('created_at').optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
});

// --- Schema specifically for the "Add from Partner" request (Unchanged) ---
const addFromPartnerSchema = z.object({
    source_partner_listing_id: z.string().uuid({ message: "Valid Partner Listing ID is required" })
});

// Type for the response of the GET endpoint, including pagination
type CarListingGetResponse = {
    data: Database['public']['Tables']['car_listings']['Row'][];
    count: number | null;
    page: number;
    limit: number;
};

// Type alias for the data needed to insert into car_listings
type CarListingInsertData = Database['public']['Tables']['car_listings']['Insert'];


// ============================================================================
// Helper Function to Create Supabase Client (Unchanged)
// ============================================================================
function createSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) { /* Ignored */ } },
                remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) { /* Ignored */ } },
            },
        }
    );
}

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * @swagger
 * /api/car_listings:
 *   post:
 *     summary: Create a new car listing or add from a partner listing
 *     description: >
 *       Creates a new car listing associated with the authenticated user.
 *       Requires authentication.
 *       - If called by 'dealer' or 'admin' with standard fields (now including body_type, colors, engine, vin, features, etc.): Creates a listing directly.
 *       - If called by 'admin' with `source_partner_listing_id`: Copies data from an approved partner listing.
 *     tags: [Car Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/DirectCarListingInput' # Now reflects updated schema
 *               - $ref: '#/components/schemas/AddFromPartnerInput'
 *     responses:
 *       # ... responses remain the same ...
 *       '201': { description: "Car listing created/added successfully." }
 *       '400': { description: "Invalid input data or invalid request logic." }
 *       '401': { description: "Unauthorized." }
 *       '403': { description: "Forbidden (Incorrect role for action)." }
 *       '404': { description: "Partner listing not found." }
 *       '409': { description: "Conflict (Partner listing already added)." }
 *       '500': { description: "Internal server error." }
 */
export async function POST(request: Request) {
    const supabase = createSupabaseClient();

    try {
        // --- Step 1 & 2: Authentication & Role Check (Unchanged) ---
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: userData, error: userRoleError } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (userRoleError || !userData) {
            console.error('Error fetching user role:', userRoleError);
            return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
        }
        const userRole = userData.role;

        // --- Step 3: Parse Body ---
        const body = await request.json();

        // --- Path A: Add from Partner Listing (Admin Only) ---
        if (body.source_partner_listing_id) {
            // A1: Authorization Check
            if (userRole !== 'admin') {
                return NextResponse.json({ error: 'Forbidden: Only admins can add listings from partners' }, { status: 403 });
            }

            // A2: Validate Input ID
            const parsePartnerIdResult = addFromPartnerSchema.safeParse(body);
            if (!parsePartnerIdResult.success) {
                return NextResponse.json({ error: 'Invalid input for adding from partner', details: parsePartnerIdResult.error.flatten().fieldErrors }, { status: 400 });
            }
            const partnerListingId = parsePartnerIdResult.data.source_partner_listing_id;

            // A3: Fetch Partner Listing
            const { data: partnerListing, error: fetchPartnerError } = await supabase
                .from('partner_listings')
                .select('*') // Fetch all columns from partner_listings
                .eq('id', partnerListingId)
                .single();

            if (fetchPartnerError || !partnerListing) {
                console.error('Error fetching partner listing:', fetchPartnerError);
                return NextResponse.json({ error: 'Partner listing not found' }, { status: 404 });
            }

            // A4: Validate Partner Listing Status
            if (partnerListing.approval_status !== 'approved') {
                return NextResponse.json({ error: 'Partner listing must be approved first' }, { status: 400 });
            }
            if (partnerListing.is_added_to_main_listings === true) {
                return NextResponse.json({ error: 'Partner listing has already been added' }, { status: 409 });
            }

            // A5: Map Data (Unchanged from previous correct version)
            const mapListingType = (type: string | null): 'sale' | 'rent' | 'both' => {
                if (type === 'rental') return 'rent';
                if (type === 'sale' || type === 'rent' || type === 'both') return type;
                return 'sale'; // Default
            };
            const mapCondition = (cond: string | null): 'new' | 'used' => {
                if (cond === 'new') return 'new';
                return 'used'; // Default
            };

            const insertData: CarListingInsertData = {
                dealer_id: user.id, // Admin's ID performs the action
                make: partnerListing.vehicle_make,
                model: partnerListing.vehicle_model,
                year: partnerListing.vehicle_year,
                price: partnerListing.price,
                mileage: partnerListing.mileage,
                fuel_type: partnerListing.fuel_type,
                transmission: partnerListing.transmission,
                condition: mapCondition(partnerListing.condition),
                location_city: partnerListing.location_city,
                location_country: partnerListing.location_country,
                images: partnerListing.images,
                description: partnerListing.description,
                vin: partnerListing.vin,
                body_type: partnerListing.body_type,
                engine: partnerListing.engine,
                exterior_color: partnerListing.exterior_color,
                interior_color: partnerListing.interior_color,
                features: partnerListing.features,
                is_special_offer: partnerListing.is_special_offer,
                special_offer_label: partnerListing.special_offer_label,
                is_public: partnerListing.is_public ?? true,
                listing_type: mapListingType(partnerListing.listing_type),
                // Other fields use DB defaults or remain null
            };

            // A6: Insert into car_listings (Unchanged)
            const { data: newListing, error: insertError } = await supabase
                .from('car_listings')
                .insert(insertData)
                .select()
                .single();

            if (insertError) {
                console.error('Error inserting copied listing:', insertError);
                return NextResponse.json({ error: 'Failed to add listing to inventory', details: insertError.message }, { status: 500 });
            }

            // A7: Update partner listing flag (Unchanged)
            console.log(`API: Attempting to set is_added_to_main_listings=true for partner_listing ID: ${partnerListingId}`); // TO BE DELETED

            const { error: updateFlagError } = await supabase
                .from('partner_listings')
                .update({ is_added_to_main_listings: true })
                .eq('id', partnerListingId);

            if (updateFlagError) {
                console.error(`CRITICAL: Failed to update is_added_to_main_listings flag for partner listing ${partnerListingId}`, updateFlagError);
            }

            return NextResponse.json(newListing, { status: 201 });

        } else {
            // --- Path B: Direct Listing Creation (Dealer or Admin) ---

            // B1: Authorization Check (Unchanged)
            if (userRole !== 'dealer' && userRole !== 'admin') {
                return NextResponse.json({ error: 'Forbidden: Only dealers or admins can create listings directly' }, { status: 403 });
            }

            // B2: Validate Input using the *UPDATED* schema
            const parseResult = carListingPostSchema.safeParse(body); // Use the updated schema here
            if (!parseResult.success) {
                // Log the specific validation errors for debugging
                console.error("Direct listing creation validation failed:", parseResult.error.flatten().fieldErrors);
                return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
            }
            // validatedData now contains all fields defined in the updated schema if provided in the body
            const validatedData = parseResult.data;

            // B3: Insert into car_listings (Logic remains the same, but uses more complete validatedData)
            const { data: newListing, error: insertError } = await supabase
                .from('car_listings')
                .insert({ dealer_id: user.id, ...validatedData }) // Spread the validated data
                .select()
                .single();

            if (insertError) {
                console.error('Error creating car listing directly:', insertError);
                if (insertError.code === '42501') {
                    return NextResponse.json({ error: 'Database permission denied.' }, { status: 403 });
                }
                // Check for unique constraint violations if needed (e.g., VIN)
                if (insertError.code === '23505' && insertError.message.includes('vin')) {
                    return NextResponse.json({ error: 'VIN already exists in inventory.', details: insertError.message }, { status: 409 }); // Conflict
                }
                return NextResponse.json({ error: 'Failed to create car listing', details: insertError.message }, { status: 500 });
            }

            return NextResponse.json(newListing, { status: 201 });
        }

    } catch (error) {
        console.error('Unexpected error in POST /api/car_listings:', error);
        if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


// --- GET Handler (Unchanged) ---
export async function GET(request: NextRequest) {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);

    try {
        const queryParams = Object.fromEntries(searchParams.entries());
        const parseResult = carListingGetSchema.safeParse(queryParams);
        if (!parseResult.success) return NextResponse.json({ error: 'Invalid query parameters', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
        const { page, limit, sortBy, sortOrder, ...filters } = parseResult.data;

        let queryBuilder = supabase.from('car_listings').select('*', { count: 'exact' });

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                switch (key) {
                    case 'make': case 'model': case 'location_city':
                        queryBuilder = queryBuilder.ilike(key, `%${value}%`); break;
                    case 'year_from': queryBuilder = queryBuilder.gte('year', value as number); break;
                    case 'year_to': queryBuilder = queryBuilder.lte('year', value as number); break;
                    case 'price_min': queryBuilder = queryBuilder.gte('price', value as number); break;
                    case 'price_max': queryBuilder = queryBuilder.lte('price', value as number); break;
                    case 'condition': case 'listing_type': case 'status': case 'location_country': case 'dealer_id':
                        queryBuilder = queryBuilder.eq(key, value as string); break;
                }
            }
        });

        queryBuilder = queryBuilder.order(sortBy!, { ascending: sortOrder === 'asc' });
        const rangeFrom = (page! - 1) * limit!;
        const rangeTo = rangeFrom + limit! - 1;
        queryBuilder = queryBuilder.range(rangeFrom, rangeTo);

        const { data, error, count } = await queryBuilder;

        if (error) {
            console.error('Error fetching car listings:', error);
            return NextResponse.json({ error: 'Failed to fetch car listings', details: error.message }, { status: 500 });
        }

        const response: CarListingGetResponse = { data: data || [], count: count, page: page!, limit: limit! };
        return NextResponse.json(response, { status: 200 });

    } catch (error) {
        console.error('Unexpected error in GET /api/car_listings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


// --- Swagger Definitions (Update DirectCarListingInput) ---
/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorUnauthorized: { type: object, properties: { error: { type: string, example: "Unauthorized" } } }
 *     ErrorForbidden: { type: object, properties: { error: { type: string, example: "Forbidden" } } }
 *     ErrorInternalServer: { type: object, properties: { error: { type: string, example: "Internal server error" } } }
 *     ErrorBadRequest: { type: object, properties: { error: { type: string, example: "Invalid input" }, details: { type: object } } }
 *     ErrorNotFound: { type: object, properties: { error: { type: string, example: "Resource not found" } } }
 *     ErrorConflict: { type: object, properties: { error: { type: string, example: "Conflict/Already exists" } } }
 *     # Updated schema for direct input
 *     DirectCarListingInput:
 *       type: object
 *       required: [make, model, year, price, condition, listing_type]
 *       properties:
 *         make: { type: string }
 *         model: { type: string }
 *         year: { type: integer }
 *         price: { type: number }
 *         mileage: { type: integer, nullable: true }
 *         condition: { type: string, enum: [new, used] }
 *         listing_type: { type: string, enum: [sale, rent, both] }
 *         location_city: { type: string, nullable: true }
 *         location_country: { type: string, nullable: true }
 *         description: { type: string, nullable: true }
 *         images: { type: array, items: { type: string, format: url }, nullable: true }
 *         is_public: { type: boolean }
 *         is_shared_with_network: { type: boolean }
 *         fuel_type: { type: string, nullable: true }
 *         transmission: { type: string, nullable: true }
 *         rental_daily_price: { type: number, nullable: true }
 *         rental_deposit_required: { type: number, nullable: true }
 *         rental_status: { type: string, enum: [available, rented, maintenance], nullable: true }
 *         min_rental_days: { type: integer, nullable: true }
 *         max_rental_days: { type: integer, nullable: true }
 *         # Added fields
 *         body_type: { type: string, nullable: true }
 *         exterior_color: { type: string, nullable: true }
 *         interior_color: { type: string, nullable: true }
 *         engine: { type: string, nullable: true }
 *         vin: { type: string, nullable: true }
 *         features: { type: array, items: { type: string }, nullable: true }
 *         is_special_offer: { type: boolean, nullable: true }
 *         special_offer_label: { type: string, nullable: true }
 *     # Schema for adding from partner (Unchanged)
 *     AddFromPartnerInput:
 *       type: object
 *       required: [source_partner_listing_id]
 *       properties:
 *         source_partner_listing_id: { type: string, format: uuid }
 *     # Existing CarListing schema (Unchanged)
 *     CarListing:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         # ... other properties ...
 *   securitySchemes:
 *     bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
 */