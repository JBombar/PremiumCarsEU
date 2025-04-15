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
// POST /api/share-listings
// ============================================================================
/**
 * Expected JSON body:
 * {
 *   listing_ids: string[],
 *   dealer_id: string,
 *   channels: string[],
 *   shared_with_trust_levels: string[],
 *   shared_with_contacts?: string[],
 *   message?: string
 * }
 */

export async function POST(request: NextRequest) {
    const supabase = createSupabaseClient();

    try {
        const body = await request.json();
        const {
            listing_ids,
            dealer_id,
            channels,
            shared_with_trust_levels,
            shared_with_contacts = [],
            message = ''
        } = body;

        if (!listing_ids || !dealer_id || !channels || !shared_with_trust_levels) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const inserts = [];

        for (const listing_id of listing_ids) {
            const { data: listing, error: listingError } = await supabase
                .from('car_listings')
                .select('make, model, year')
                .eq('id', listing_id)
                .single();

            if (listingError || !listing) {
                console.warn(`Listing not found or error fetching: ${listing_id}`, listingError);
                continue;
            }

            inserts.push({
                listing_id,
                dealer_id,
                channels,
                shared_with_trust_levels,
                shared_with_contacts,
                message,
                make: listing.make,
                model: listing.model,
                year: listing.year,
                listing_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'}/inventory/${listing_id}`,
                status: 'pending'
            });
        }

        if (inserts.length === 0) {
            return NextResponse.json({ error: 'No valid listings to share' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('listing_shares')
            .insert(inserts)
            .select();

        if (error) {
            console.error('Error inserting into listing_shares:', error);
            return NextResponse.json({ error: 'Failed to share listings', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, shared: data }, { status: 200 });
    } catch (error) {
        console.error('Unexpected error in POST /api/share-listings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
