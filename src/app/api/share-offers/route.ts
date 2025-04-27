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
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch { } },
                remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch { } },
            },
        }
    );
}

// ============================================================================
// POST /api/share-offers
// ============================================================================
/**
 * Expected JSON body:
 * {
 *   offer_ids: string[],
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
            offer_ids,
            dealer_id,
            channels,
            shared_with_trust_levels,
            shared_with_contacts = [],
            message = ''
        } = body;

        if (!offer_ids || !dealer_id || !channels || !shared_with_trust_levels) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const inserts = [];

        for (const offer_id of offer_ids) {
            const { data: offer, error: offerError } = await supabase
                .from('car_offers')
                .select('make, model, year, full_name, email, phone, mileage, fuel_type, transmission, condition, city, asking_price, notes, photo_urls, from_user_id, contacted')
                .eq('id', offer_id)
                .single();

            if (offerError || !offer) {
                console.warn(`Offer not found or error fetching: ${offer_id}`, offerError);
                continue;
            }

            inserts.push({
                offer_id,
                dealer_id,
                channels,
                shared_with_trust_levels,
                shared_with_contacts,
                message,
                make: offer.make,
                model: offer.model,
                year: offer.year,
                full_name: offer.full_name,
                email: offer.email,
                phone: offer.phone,
                mileage: offer.mileage,
                fuel_type: offer.fuel_type,
                transmission: offer.transmission,
                condition: offer.condition,
                city: offer.city,
                asking_price: offer.asking_price,
                notes: offer.notes,
                photo_urls: offer.photo_urls,
                from_user_id: offer.from_user_id,
                contacted: offer.contacted,
                status: 'pending'
            });
        }

        if (inserts.length === 0) {
            return NextResponse.json({ error: 'No valid offers to share' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('car_offer_shares')
            .insert(inserts)
            .select();

        if (error) {
            console.error('Error inserting into car_offer_shares:', error);
            return NextResponse.json({ error: 'Failed to share car offers', details: error.message }, { status: 500 });
        }

        // --- n8n Webhook Trigger ---
        const n8nWebhookUrl = process.env.N8N_SHARE_OFFERS_WEBHOOK_URL;

        if (n8nWebhookUrl) {
            try {
                const webhookResponse = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        offer_ids,
                        dealer_id,
                        channels,
                        shared_with_trust_levels,
                        shared_with_contacts,
                        message,
                        shared_entries: data,
                        webhookUrl: n8nWebhookUrl,
                    }),
                });

                if (!webhookResponse.ok) {
                    const errText = await webhookResponse.text();
                    console.error('Failed to trigger n8n webhook:', errText);
                } else {
                    console.log('Successfully triggered n8n webhook');
                }
            } catch (webhookErr) {
                console.error('Error triggering n8n webhook:', webhookErr);
            }
        } else {
            console.warn('N8N_SHARE_OFFERS_WEBHOOK_URL not configured in environment.');
        }

        return NextResponse.json({ success: true, shared: data }, { status: 200 });

    } catch (error) {
        console.error('Unexpected error in POST /api/share-offers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
