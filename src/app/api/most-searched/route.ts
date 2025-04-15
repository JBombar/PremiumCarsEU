import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// ============================================================================
// Helper Function to Create Supabase Client
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
 *     description: Fetches the top 10 most viewed cars using Supabase RPC. Only returns cars marked as 'available'.
 *     tags: [Analytics]
 *     responses:
 *       '200':
 *         description: Successful fetch of most viewed cars.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string, format: uuid }
 *                   make: { type: string }
 *                   model: { type: string }
 *                   year: { type: integer }
 *                   price: { type: number }
 *                   mileage: { type: integer }
 *                   fuel_type: { type: string }
 *                   transmission: { type: string }
 *                   condition: { type: string }
 *                   status: { type: string }
 *                   images: { type: array, items: { type: string, format: url } }
 *       '500':
 *         description: Failed to fetch data
 */
export async function GET(request: NextRequest) {
    const supabase = createSupabaseClient();

    try {
        const { data, error } = await supabase
            .rpc('get_most_viewed_cars', { limit_count: 10 });

        if (error) {
            console.error('Error fetching most viewed cars from Supabase RPC:', error);
            return NextResponse.json({ error: 'Failed to fetch most viewed cars', details: error.message }, { status: 500 });
        }

        // Filter on API side to avoid returning deleted or sold cars
        const filteredCars = (data || []).filter(car =>
            car &&
            car.id &&
            car.make &&
            car.model &&
            car.year &&
            car.status &&
            car.status.toLowerCase() === 'available'
        );

        return NextResponse.json(filteredCars, { status: 200 });
    } catch (error) {
        console.error('Unexpected error in GET /api/most-searched:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
