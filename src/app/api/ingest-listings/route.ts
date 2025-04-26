// src/app/api/internal/ingest-listing/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

// --- Configuration ---
// !! IMPORTANT: Replace with the actual partner_id generated in the previous step !!
const WHATSAPP_BOT_PARTNER_ID = '6d3de6dd-2b0b-4df1-8a25-f8354de0df4a';
// !! IMPORTANT: Store your actual API key securely, preferably in environment variables !!
const EXPECTED_API_KEY = process.env.N8N_INGEST_API_KEY; // Use env var

// --- Zod Schema for Incoming Payload from n8n ---
// Adjust this based on fields your LLM reliably extracts
const ingestPayloadSchema = z.object({
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().optional().nullable(),
    price: z.number().positive().optional().nullable(),
    mileage: z.number().int().nonnegative().optional().nullable(),
    description: z.string().optional().nullable(),
    vin: z.string().optional().nullable(),
    condition: z.string().optional().nullable(), // e.g., 'new', 'used', or could be parsed text
    fuel_type: z.string().optional().nullable(),
    transmission: z.string().optional().nullable(),
    exterior_color: z.string().optional().nullable(),
    interior_color: z.string().optional().nullable(),
    body_type: z.string().optional().nullable(),
    engine: z.string().optional().nullable(),
    features: z.array(z.string()).optional().nullable(), // Array of feature strings
    images: z.array(z.string().url()).optional().nullable(), // Array of image URLs from Supabase Storage
    // Add any other fields n8n might send
});
type IngestPayload = z.infer<typeof ingestPayloadSchema>;

// Helper to create Supabase client (server-side)
function createSupabaseClient() {
    const cookieStore = cookies(); // Required even if not using user auth cookies here
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Using anon key is fine if RLS/API key handles security
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) { /* Ignored */ } },
                remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (error) { /* Ignored */ } },
            },
        }
    );
}

// --- POST Handler ---
export async function POST(request: NextRequest) {
    // 1. API Key Authentication
    const authHeader = request.headers.get('Authorization');
    const providedApiKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!providedApiKey || providedApiKey !== EXPECTED_API_KEY) {
        console.warn('Ingest API: Invalid or missing API key');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if partner ID is configured
    if (!WHATSAPP_BOT_PARTNER_ID || WHATSAPP_BOT_PARTNER_ID === '6d3de6dd-2b0b-4df1-8a25-f8354de0df4a') {
        console.error('Ingest API: WHATSAPP_BOT_PARTNER_ID is not configured in the API route.');
        return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 });
    }
    // Check if API key is configured
    if (!EXPECTED_API_KEY || EXPECTED_API_KEY === 'YOUR_FALLBACK_SECURE_API_KEY_HERE') {
        console.error('Ingest API: N8N_INGEST_API_KEY environment variable is not set.');
        // Avoid leaking key info in production errors
        const errorMsg = process.env.NODE_ENV === 'development' ? 'API Key not configured' : 'Internal server configuration error';
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }


    const supabase = createSupabaseClient();

    try {
        // 2. Parse and Validate Incoming JSON Body
        const body = await request.json();
        const parseResult = ingestPayloadSchema.safeParse(body);

        if (!parseResult.success) {
            console.error('Ingest API: Invalid payload:', parseResult.error.flatten().fieldErrors);
            return NextResponse.json({ error: 'Invalid input payload', details: parseResult.error.flatten().fieldErrors }, { status: 400 });
        }
        const validatedData = parseResult.data;

        // 3. Prepare Data for Insertion into partner_listings
        // Map fields from validatedData to partner_listings columns
        const insertPayload = {
            partner_id: WHATSAPP_BOT_PARTNER_ID, // Use the pre-configured ID
            vehicle_make: validatedData.make,
            vehicle_model: validatedData.model,
            vehicle_year: validatedData.year ?? 0, // Assumes LLM provides integer
            price: validatedData.price,
            mileage: validatedData.mileage,
            condition: validatedData.condition, // Use parsed condition
            description: validatedData.description,
            images: validatedData.images, // Array of URLs
            location_city: null, // Add if parsed, otherwise null
            location_country: null, // Add if parsed, otherwise null
            vin: validatedData.vin,
            body_type: validatedData.body_type,
            engine: validatedData.engine,
            exterior_color: validatedData.exterior_color,
            interior_color: validatedData.interior_color,
            fuel_type: validatedData.fuel_type,
            transmission: validatedData.transmission,
            features: validatedData.features,
            is_special_offer: false, // Default, unless parsed
            special_offer_label: null, // Default, unless parsed
            listing_type: 'sale', // Default to 'sale' for these imports? Or parse?
            is_public: false, // Default to NOT public until admin approves?
            status: 'available', // Default the dealer status to 'available'
            // is_added_to_main_listings defaults to false in DB
        };

        // 4. Insert into partner_listings table
        const { data: newListing, error: insertError } = await supabase
            .from('partner_listings')
            .insert(insertPayload)
            .select() // Select the newly created record
            .single(); // Expect only one record

        if (insertError) {
            console.error('Ingest API: Error inserting into partner_listings:', insertError);
            return NextResponse.json({ error: 'Failed to save listing data', details: insertError.message }, { status: 500 });
        }

        console.log(`Ingest API: Successfully ingested listing ${newListing.id} for partner ${WHATSAPP_BOT_PARTNER_ID}`);
        // 5. Return Success Response
        return NextResponse.json({ message: 'Listing ingested successfully', listingId: newListing.id }, { status: 201 });

    } catch (error) {
        console.error('Ingest API: Unexpected error:', error);
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON format in request body' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}