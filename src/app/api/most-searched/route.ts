import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Make sure this was regenerated after DB function change

// ============================================================================
// Helper Function to Create Supabase Client (No changes needed)
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
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        /* Ignored */
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        /* Ignored */
                    }
                },
            },
        }
    );
}

// ============================================================================
// GET Most Viewed Cars Endpoint
// ============================================================================
/**
 * @swagger
 * /api/most-searched:
 *   get:
 *     summary: Get most viewed cars
 *     description: Fetches the top 10 most viewed cars using Supabase RPC. Only returns cars that are 'available' and 'is_public'.
 *     tags: [Analytics]
 *     responses:
 *       '200':
 *         description: Successful fetch of most viewed cars.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object # These properties should now match the SQL function's RETURNS TABLE
 *                 properties:
 *                   id: { type: string, format: uuid }
 *                   make: { type: string }
 *                   model: { type: string }
 *                   year: { type: integer }
 *                   price: { type: number, format: float } # Or double, depending on precision
 *                   mileage: { type: integer }
 *                   fuel_type: { type: string }
 *                   transmission: { type: string }
 *                   condition: { type: string } # Represents public.car_condition enum
 *                   body_type: { type: string }
 *                   exterior_color: { type: string }
 *                   interior_color: { type: string }
 *                   status: { type: string }    # Represents public.listing_status enum
 *                   images: { type: array, items: { type: string } } # Assuming URLs or paths
 *                   created_at: { type: string, format: 'date-time' }
 *                   view_count: { type: integer }
 *                   seller_name: { type: string }
 *                   location_city: { type: string }
 *                   location_country: { type: string }
 *                   is_public: { type: boolean } # <<< ADDED is_public
 *       '500':
 *         description: Failed to fetch data
 */
export async function GET(request: NextRequest) {
    const supabase = createSupabaseClient();

    try {
        // Call the updated SQL function.
        // The 'limit_count' parameter name must match the SQL function's parameter name.
        const { data, error } = await supabase
            .rpc('get_most_viewed_cars', { limit_count: 10 });

        if (error) {
            console.error('Error fetching most viewed cars from Supabase RPC:', error);
            return NextResponse.json({ error: 'Failed to fetch most viewed cars', details: error.message }, { status: 500 });
        }

        const carsToReturn = data || []; // If data is null, return an empty array.

        return NextResponse.json(carsToReturn, { status: 200 });

    } catch (error) {
        console.error('Unexpected error in GET /api/most-searched:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}