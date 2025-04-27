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
                set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) { /* Ignored */ } },
                remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) { /* Ignored */ } },
            },
        }
    );
}

// ============================================================================
// POST /api/partner-shares
// ============================================================================
/**
 * Expected JSON body:
 * {
 *   partner_ids: string[],
 *   dealer_id: string,
 *   channels: string[],
 *   shared_with_trust_levels: string[],
 *   shared_with_contacts?: string[],
 *   message?: string
 * }
 */

const N8N_WEBHOOK_URL = process.env.N8N_PARTNER_SHARES_WEBHOOK_URL;

export async function POST(request: NextRequest) {
    const supabase = createSupabaseClient();

    try {
        const body = await request.json();
        const {
            partner_ids,
            dealer_id,
            channels,
            shared_with_trust_levels,
            shared_with_contacts = [],
            message = ''
        } = body;

        if (!partner_ids || !dealer_id || !channels || !shared_with_trust_levels) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const inserts = [];

        for (const partner_id of partner_ids) {
            const { data: partner, error: partnerError } = await supabase
                .from('partners')
                .select('name, company, location')
                .eq('id', partner_id)
                .single();

            if (partnerError || !partner) {
                console.warn(`Partner not found or error fetching: ${partner_id}`, partnerError);
                continue;
            }

            inserts.push({
                partner_id,
                dealer_id,
                channels,
                shared_with_trust_levels,
                shared_with_contacts,
                message,
                name: partner.name,
                company: partner.company,
                location: partner.location,
                status: 'pending'
            });
        }

        if (inserts.length === 0) {
            return NextResponse.json({ error: 'No valid partners to share' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('partner_shares')
            .insert(inserts)
            .select();

        if (error) {
            console.error('Error inserting into partner_shares:', error);
            return NextResponse.json({ error: 'Failed to share partners', details: error.message }, { status: 500 });
        }

        // --- Trigger n8n Webhook ---
        if (N8N_WEBHOOK_URL) {
            try {
                const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        partner_ids,
                        dealer_id,
                        channels,
                        shared_with_trust_levels,
                        shared_with_contacts,
                        message,
                        shared_entries: data,
                        webhookUrl: N8N_WEBHOOK_URL,
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
            console.warn('N8N_PARTNER_SHARES_WEBHOOK_URL not configured.');
        }

        return NextResponse.json({ success: true, shared: data }, { status: 200 });

    } catch (error) {
        console.error('Unexpected error in POST /api/partner-shares:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
