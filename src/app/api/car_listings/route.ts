import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database, Json } from '@/types/supabase'; // Ensure Json is imported if needed
import { z } from 'zod';
import { PostgrestError } from '@supabase/supabase-js'; // Import for error type checking

// ============================================================================
// Zod Schemas (Keep as previously defined)
// ============================================================================
const carListingPostSchema = z.object({
    make: z.string().min(1, { message: "Make is required" }),
    model: z.string().min(1, { message: "Model is required" }),
    year: z.number().int().gt(1900).lt(2100),
    price: z.number().positive(),
    mileage: z.number().int().nonnegative().optional(),
    condition: z.enum(['new', 'used']),
    listing_type: z.enum(['sale', 'rent', 'both']),
    location_city: z.string().optional(),
    location_country: z.string().optional(),
    description: z.string().optional(),
    images: z.array(z.string().url()).optional(),
    is_public: z.boolean().optional().default(true),
    is_shared_with_network: z.boolean().optional().default(false),
    fuel_type: z.string().optional(),
    transmission: z.string().optional(),
    rental_daily_price: z.number().positive().optional().nullable(),
    rental_deposit_required: z.number().nonnegative().optional().nullable(),
    rental_status: z.enum(['available', 'rented', 'maintenance']).optional().nullable(),
    min_rental_days: z.number().int().positive().optional().nullable(),
    max_rental_days: z.number().int().positive().optional().nullable(),
});

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

// Type for the response of the GET endpoint, including pagination
type CarListingGetResponse = {
    data: Database['public']['Tables']['car_listings']['Row'][];
    count: number | null;
    page: number;
    limit: number;
};


// ============================================================================
// Helper Function to Create Supabase Client (Keep as previously defined)
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
 *     summary: Create a new car listing
 *     description: Creates a new car listing associated with the authenticated dealer or admin. Requires authentication and appropriate role ('dealer' or 'admin').
 *     tags: [Car Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [make, model, year, price, condition, listing_type]
 *             properties:
 *               make: { type: string, example: "Volkswagen" }
 *               model: { type: string, example: "Golf" }
 *               year: { type: integer, example: 2021 }
 *               price: { type: number, format: float, example: 25000.50 }
 *               mileage: { type: integer, example: 15000 }
 *               condition: { type: string, enum: [new, used], example: "used" }
 *               listing_type: { type: string, enum: [sale, rent, both], example: "sale" }
 *               location_city: { type: string, example: "Berlin" }
 *               location_country: { type: string, example: "Germany" }
 *               description: { type: string, example: "Well-maintained Golf 8..." }
 *               images: { type: array, items: { type: string, format: url }, example: ["https://example.com/image1.jpg"] }
 *               is_public: { type: boolean, default: true }
 *               is_shared_with_network: { type: boolean, default: false }
 *               fuel_type: { type: string, example: "Petrol" }
 *               transmission: { type: string, example: "Automatic" }
 *               rental_daily_price: { type: number, format: float, example: 50.00 }
 *               rental_deposit_required: { type: number, format: float, example: 500.00 }
 *               rental_status: { type: string, enum: [available, rented, maintenance], example: "available" }
 *               min_rental_days: { type: integer, example: 3 }
 *               max_rental_days: { type: integer, example: 30 }
 *     responses:
 *       '201':
 *         description: Car listing created successfully. Returns the created listing object.
 *         content:
 *           application/json:
 *             schema:
 *               # Ideally, reference a global CarListing schema defined elsewhere
 *               type: object
 *               properties:
 *                 id: { type: string, format: uuid }
 *                 # ... other properties matching the DB row
 *       '400':
 *         description: Invalid input data. Response body contains error details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Invalid input" }
 *                 details: { type: object } # Zod error details
 *       '401':
 *         description: Unauthorized. User session is invalid or expired.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorUnauthorized' }
 *       '403':
 *         description: Forbidden. User does not have the required role ('dealer' or 'admin').
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorForbidden' }
 *       '500':
 *         description: Internal server error. Could be database error or unexpected issue.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorInternalServer' }
 */
export async function POST(request: Request) {
    const supabase = createSupabaseClient();

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: userData, error: userRoleError } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (userRoleError || !userData) {
            console.error('Error fetching user role:', userRoleError);
            return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
        }
        if (userData.role !== 'dealer' && userData.role !== 'admin') return NextResponse.json({ error: 'Forbidden: Only dealers or admins can create listings' }, { status: 403 });

        const body = await request.json();
        const parseResult = carListingPostSchema.safeParse(body);
        if (!parseResult.success) return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
        const validatedData = parseResult.data;

        const { data: newListing, error: insertError } = await supabase
            .from('car_listings')
            .insert({ dealer_id: user.id, ...validatedData })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating car listing:', insertError);
            // Basic check for specific errors (e.g., RLS violation might appear as 403/permission denied)
            if (insertError.code === '42501') { // Example: PostgreSQL permission denied code
                 return NextResponse.json({ error: 'Database permission denied. Check RLS policies or user roles.' }, { status: 403 });
            }
            // Add checks for other specific codes like '23505' for unique constraints if needed later
            return NextResponse.json({ error: 'Failed to create car listing', details: insertError.message }, { status: 500 });
        }

        return NextResponse.json(newListing, { status: 201 });

    } catch (error) {
        console.error('Unexpected error in POST /api/car_listings:', error);
        if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


/**
 * @swagger
 * /api/car_listings:
 *   get:
 *     summary: Retrieve a list of car listings
 *     description: >
 *       Fetches car listings based on query parameters.
 *       RLS policies automatically handle visibility (public sees public, dealers see own, admins see all).
 *       Supports filtering, sorting, and pagination. Returns data along with total count for pagination.
 *     tags: [Car Listings]
 *     parameters:
 *       - { name: make, in: query, schema: { type: string }, description: "Filter by make (case-insensitive partial match)" }
 *       - { name: model, in: query, schema: { type: string }, description: "Filter by model (case-insensitive partial match)" }
 *       - { name: year_from, in: query, schema: { type: integer }, description: "Minimum year" }
 *       - { name: year_to, in: query, schema: { type: integer }, description: "Maximum year" }
 *       - { name: price_min, in: query, schema: { type: number }, description: "Minimum price" }
 *       - { name: price_max, in: query, schema: { type: number }, description: "Maximum price" }
 *       - { name: condition, in: query, schema: { type: string, enum: [new, used] }, description: "Filter by condition" }
 *       - { name: listing_type, in: query, schema: { type: string, enum: [sale, rent, both] }, description: "Filter by listing type" }
 *       - { name: status, in: query, schema: { type: string, enum: [available, reserved, sold] }, description: "Filter by listing status" }
 *       - { name: location_country, in: query, schema: { type: string }, description: "Filter by country (exact match)" }
 *       - { name: location_city, in: query, schema: { type: string }, description: "Filter by city (case-insensitive partial match)" }
 *       - { name: dealer_id, in: query, schema: { type: string, format: uuid }, description: "Filter by dealer ID (primarily for Admins)" }
 *       - { name: sortBy, in: query, schema: { type: string, enum: [created_at, price, year, mileage], default: created_at }, description: "Field to sort by" }
 *       - { name: sortOrder, in: query, schema: { type: string, enum: [asc, desc], default: desc }, description: "Sort order" }
 *       - { name: page, in: query, schema: { type: integer, default: 1, minimum: 1 }, description: "Page number for pagination" }
 *       - { name: limit, in: query, schema: { type: integer, default: 10, minimum: 1, maximum: 100 }, description: "Number of items per page" }
 *     responses:
 *       '200':
 *         description: A list of car listings with pagination details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     # Ideally, reference a global CarListing schema
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       # ... other properties
 *                 count:
 *                   type: integer
 *                   description: Total number of listings matching the filters.
 *                   example: 53
 *                 page:
 *                   type: integer
 *                   description: The current page number.
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   description: The number of items per page.
 *                   example: 10
 *       '400':
 *         description: Invalid query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Invalid query parameters" }
 *                 details: { type: object } # Zod error details
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorInternalServer' }
 */
export async function GET(request: NextRequest) {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);

    try {
        const queryParams = Object.fromEntries(searchParams.entries());
        const parseResult = carListingGetSchema.safeParse(queryParams);
        if (!parseResult.success) return NextResponse.json({ error: 'Invalid query parameters', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
        const { page, limit, sortBy, sortOrder, ...filters } = parseResult.data; // Destructure validated params

        // Base query builder - RLS handles visibility
        // We need two queries: one for the data, one for the count
        let queryBuilder = supabase.from('car_listings').select('*', { count: 'exact' }); // Request count

        // Apply Filters dynamically
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                switch (key) {
                    case 'make':
                    case 'model':
                    case 'location_city':
                        queryBuilder = queryBuilder.ilike(key, `%${value}%`);
                        break;
                    case 'year_from':
                        queryBuilder = queryBuilder.gte('year', value as number);
                        break;
                    case 'year_to':
                        queryBuilder = queryBuilder.lte('year', value as number);
                        break;
                    case 'price_min':
                        queryBuilder = queryBuilder.gte('price', value as number);
                        break;
                    case 'price_max':
                        queryBuilder = queryBuilder.lte('price', value as number);
                        break;
                    // Exact matches for enums, country, dealer_id
                    case 'condition':
                    case 'listing_type':
                    case 'status':
                    case 'location_country':
                    case 'dealer_id':
                      queryBuilder = queryBuilder.eq(key, value as string); // Adjust type assertion if needed
                         break;
                    // Ignore other keys like sortBy, sortOrder, page, limit handled separately
                }
            }
        });

        // Apply Sorting
        queryBuilder = queryBuilder.order(sortBy!, { ascending: sortOrder === 'asc' });

        // Apply Pagination
        const rangeFrom = (page! - 1) * limit!;
        const rangeTo = rangeFrom + limit! - 1;
        queryBuilder = queryBuilder.range(rangeFrom, rangeTo);

        // Execute Query
        const { data, error, count } = await queryBuilder;

        if (error) {
            console.error('Error fetching car listings:', error);
            return NextResponse.json({ error: 'Failed to fetch car listings', details: error.message }, { status: 500 });
        }

        // Structure the response
        const response: CarListingGetResponse = {
            data: data || [],
            count: count, // Total count matching filters
            page: page!,
            limit: limit!
        };

        return NextResponse.json(response, { status: 200 });

    } catch (error) {
        console.error('Unexpected error in GET /api/car_listings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


// Placeholders for Swagger component schemas (ideally defined globally)
/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorUnauthorized:
 *       type: object
 *       properties: { error: { type: string, example: "Unauthorized" } }
 *     ErrorForbidden:
 *       type: object
 *       properties: { error: { type: string, example: "Forbidden" } }
 *     ErrorInternalServer:
 *       type: object
 *       properties: { error: { type: string, example: "Internal server error" } }
 *     # Add CarListing schema definition here or reference global one
 *     CarListing:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         dealer_id: { type: string, format: uuid }
 *         make: { type: string }
 *         model: { type: string }
 *         year: { type: integer }
 *         price: { type: number }
 *         mileage: { type: integer }
 *         fuel_type: { type: string, nullable: true }
 *         transmission: { type: string, nullable: true }
 *         condition: { type: string, enum: [new, used] }
 *         location_city: { type: string, nullable: true }
 *         location_country: { type: string, nullable: true }
 *         images: { type: array, items: { type: string, format: url }, nullable: true }
 *         description: { type: string, nullable: true }
 *         status: { type: string, enum: [available, reserved, sold] }
 *         is_public: { type: boolean }
 *         is_shared_with_network: { type: boolean }
 *         listing_type: { type: string, enum: [sale, rent, both] }
 *         rental_daily_price: { type: number, nullable: true }
 *         rental_deposit_required: { type: number, nullable: true }
 *         rental_status: { type: string, enum: [available, rented, maintenance], nullable: true }
 *         min_rental_days: { type: integer, nullable: true }
 *         max_rental_days: { type: integer, nullable: true }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */