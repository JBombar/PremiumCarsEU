import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Ensure this path is correct
import { z } from 'zod';

// ============================================================================
// Helper Function to Create Supabase Client
// ============================================================================
// Note: If this becomes repetitive, consider moving it to a shared utility file
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
// Zod Schema for URL Parameter Validation
// ============================================================================
const paramsSchema = z.object({
    id: z.string().uuid({ message: "Invalid car listing ID format" })
});

// Schema for updating car listing - all fields are optional
const carListingUpdateSchema = z.object({
    make: z.string().min(1, { message: "Make is required" }).optional(),
    model: z.string().min(1, { message: "Model is required" }).optional(),
    year: z.number().int().gt(1900).lt(2100).optional(),
    price: z.number().positive().optional(),
    mileage: z.number().int().nonnegative().optional(),
    condition: z.enum(['new', 'used']).optional(),
    listing_type: z.enum(['sale', 'rent', 'both']).optional(),
    location_city: z.string().optional(),
    location_country: z.string().optional(),
    description: z.string().optional(),
    images: z.array(z.string().url()).optional(),
    is_public: z.boolean().optional(),
    is_shared_with_network: z.boolean().optional(),
    fuel_type: z.string().optional(),
    transmission: z.string().optional(),
    rental_daily_price: z.number().positive().optional().nullable(),
    rental_deposit_required: z.number().nonnegative().optional().nullable(),
    rental_status: z.enum(['available', 'rented', 'maintenance']).optional().nullable(),
    min_rental_days: z.number().int().positive().optional().nullable(),
    max_rental_days: z.number().int().positive().optional().nullable(),
    status: z.enum(['available', 'reserved', 'sold']).optional(),
});

// ============================================================================
// Route Handler for GET /[id]
// ============================================================================

/**
 * @swagger
 * /api/car_listings/{id}:
 *   get:
 *     summary: Retrieve a single car listing by ID
 *     description: >
 *       Fetches details for a specific car listing using its UUID.
 *       Visibility is controlled by RLS policies (public listings are visible to all,
 *       private listings only visible to the owning dealer or admins).
 *     tags: [Car Listings]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The UUID of the car listing to retrieve.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Successfully retrieved the car listing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarListing' # Reference the schema defined elsewhere or inline
 *       '400':
 *         description: Invalid ID format supplied.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Invalid input" }
 *                 details: { type: object } # Zod error details
 *       '404':
 *         description: Car listing not found or user lacks permission to view it (due to RLS).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Listing not found" }
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorInternalServer'
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const supabase = createSupabaseClient();

    // 1. Validate the ID from the URL path
    const validationResult = paramsSchema.safeParse(params);
    if (!validationResult.success) {
        return NextResponse.json(
            { error: 'Invalid input', details: validationResult.error.flatten().fieldErrors },
            { status: 400 }
        );
    }
    const { id } = validationResult.data; // Use the validated ID

    try {
        // 2. Fetch the listing by ID
        // RLS policies handle authorization implicitly.
        const { data: listing, error } = await supabase
            .from('car_listings')
            .select('*') // Select all columns for the detail view
            .eq('id', id)
            .single(); // Expect exactly one row or null

        // 3. Handle Errors and Not Found
        if (error) {
            // Log the actual error for debugging, but don't expose details generally
            console.error(`Error fetching listing ${id}:`, error);
            // Don't distinguish between DB error and RLS denial for security
            // A denied row by RLS on .single() might return an error or just null data depending on Supabase version/config
            // So, we treat generic errors as potential "not found" or permission issues from the client's perspective.
            // A more specific check could be done on error.code if needed.
            return NextResponse.json({ error: 'Failed to retrieve listing' }, { status: 500 });
        }

        // If data is null after .single() without an error, it means not found OR RLS prevented access
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // 4. Return the found listing
        return NextResponse.json(listing, { status: 200 });

    } catch (error) {
        // Catch unexpected errors during the process
        console.error(`Unexpected error fetching listing ${id}:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/car_listings/{id}:
 *   put:
 *     summary: Update a car listing
 *     description: >
 *       Updates an existing car listing. 
 *       Only the authenticated dealer who created the listing or an admin can update it.
 *       Supports partial updates - only the fields provided will be updated.
 *     tags: [Car Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the car listing to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               is_public: { type: boolean, example: true }
 *               is_shared_with_network: { type: boolean, example: false }
 *               fuel_type: { type: string, example: "Petrol" }
 *               transmission: { type: string, example: "Automatic" }
 *               rental_daily_price: { type: number, format: float, example: 50.00 }
 *               rental_deposit_required: { type: number, format: float, example: 500.00 }
 *               rental_status: { type: string, enum: [available, rented, maintenance], example: "available" }
 *               min_rental_days: { type: integer, example: 3 }
 *               max_rental_days: { type: integer, example: 30 }
 *               status: { type: string, enum: [available, reserved, sold], example: "available" }
 *     responses:
 *       '200':
 *         description: Car listing updated successfully. Returns the updated listing object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarListing'
 *       '400':
 *         description: Invalid input data or parameters. Response contains error details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Invalid input" }
 *                 details: { type: object }
 *       '401':
 *         description: Unauthorized. User session is invalid or expired.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorUnauthorized' }
 *       '403':
 *         description: Forbidden. User doesn't have permission to update this listing.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorForbidden' }
 *       '404':
 *         description: Car listing not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Car listing not found" }
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorInternalServer' }
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const supabase = createSupabaseClient();

    try {
        // Validate ID parameter
        const paramResult = paramsSchema.safeParse(params);
        if (!paramResult.success) {
            return NextResponse.json({ 
                error: 'Invalid car listing ID', 
                details: paramResult.error.flatten().fieldErrors 
            }, { status: 400 });
        }
        const { id } = paramResult.data;

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse and validate request body
        const body = await request.json();
        const parseResult = carListingUpdateSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({ 
                error: 'Invalid input', 
                details: parseResult.error.flatten().fieldErrors 
            }, { status: 400 });
        }
        const validatedData = parseResult.data;

        // Get the existing listing to check authorization
        const { data: existingListing, error: fetchError } = await supabase
            .from('car_listings')
            .select('dealer_id')
            .eq('id', id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') { // No rows returned
                return NextResponse.json({ error: 'Car listing not found' }, { status: 404 });
            }
            console.error('Error fetching car listing:', fetchError);
            return NextResponse.json({ 
                error: 'Failed to fetch car listing', 
                details: fetchError.message 
            }, { status: 500 });
        }

        // Get the user's role
        const { data: userData, error: userRoleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userRoleError) {
            console.error('Error fetching user role:', userRoleError);
            return NextResponse.json({ 
                error: 'Failed to verify user role', 
                details: userRoleError.message 
            }, { status: 500 });
        }

        // Check authorization - only dealer who owns the listing or admin can update
        if (userData.role !== 'admin' && existingListing.dealer_id !== user.id) {
            return NextResponse.json({ 
                error: 'Forbidden: You do not have permission to update this listing' 
            }, { status: 403 });
        }

        // Update the listing
        const { data: updatedListing, error: updateError } = await supabase
            .from('car_listings')
            .update(validatedData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating car listing:', updateError);
            return NextResponse.json({ 
                error: 'Failed to update car listing', 
                details: updateError.message 
            }, { status: 500 });
        }

        return NextResponse.json(updatedListing, { status: 200 });

    } catch (error) {
        console.error('Unexpected error in PUT /api/car_listings/[id]:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/car_listings/{id}:
 *   delete:
 *     summary: Delete a car listing
 *     description: >
 *       Deletes an existing car listing.
 *       Only the authenticated dealer who created the listing or an admin can delete it.
 *     tags: [Car Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the car listing to delete
 *     responses:
 *       '204':
 *         description: Car listing deleted successfully. No content returned.
 *       '400':
 *         description: Invalid ID parameter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Invalid car listing ID" }
 *                 details: { type: object }
 *       '401':
 *         description: Unauthorized. User session is invalid or expired.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorUnauthorized' }
 *       '403':
 *         description: Forbidden. User doesn't have permission to delete this listing.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorForbidden' }
 *       '404':
 *         description: Car listing not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Car listing not found" }
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorInternalServer' }
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const supabase = createSupabaseClient();

    try {
        // Validate ID parameter
        const paramResult = paramsSchema.safeParse(params);
        if (!paramResult.success) {
            return NextResponse.json({ 
                error: 'Invalid car listing ID', 
                details: paramResult.error.flatten().fieldErrors 
            }, { status: 400 });
        }
        const { id } = paramResult.data;

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the existing listing to check authorization
        const { data: existingListing, error: fetchError } = await supabase
            .from('car_listings')
            .select('dealer_id')
            .eq('id', id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') { // No rows returned
                return NextResponse.json({ error: 'Car listing not found' }, { status: 404 });
            }
            console.error('Error fetching car listing:', fetchError);
            return NextResponse.json({ 
                error: 'Failed to fetch car listing', 
                details: fetchError.message 
            }, { status: 500 });
        }

        // Get the user's role
        const { data: userData, error: userRoleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userRoleError) {
            console.error('Error fetching user role:', userRoleError);
            return NextResponse.json({ 
                error: 'Failed to verify user role', 
                details: userRoleError.message 
            }, { status: 500 });
        }

        // Check authorization - only dealer who owns the listing or admin can delete
        if (userData.role !== 'admin' && existingListing.dealer_id !== user.id) {
            return NextResponse.json({ 
                error: 'Forbidden: You do not have permission to delete this listing' 
            }, { status: 403 });
        }

        // Delete the listing
        const { error: deleteError } = await supabase
            .from('car_listings')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting car listing:', deleteError);
            return NextResponse.json({ 
                error: 'Failed to delete car listing', 
                details: deleteError.message 
            }, { status: 500 });
        }

        // Return 204 No Content on successful deletion
        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error('Unexpected error in DELETE /api/car_listings/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// NOTE: Swagger component definitions would ideally live in a shared place
// or be generated, but including placeholders for context.
/**
 * @swagger
 * components:
 *   schemas:
 *     CarListing:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         # ... all other properties from the car_listings table ...
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     ErrorInternalServer:
 *       type: object
 *       properties: { error: { type: string, example: "Internal server error" } }
 *     ErrorUnauthorized:
 *       type: object
 *       properties: { error: { type: string, example: "Unauthorized" } }
 *     ErrorForbidden:
 *       type: object
 *       properties: { error: { type: string, example: "Forbidden" } }
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */