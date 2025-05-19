import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Validation schema for client request
const marketAnalysisRequestSchema = z.object({
    vehicles: z.array(
        z.object({
            inventory_item_id: z.string(),
            make: z.string(),
            model: z.string(),
            year: z.number(),
            mileage: z.number(),
        })
    ).min(1, { message: "At least one vehicle must be provided" }),
});

// Type definitions for FastAPI
interface VehicleToAnalyzeForFastAPI {
    carbiz_vehicle_id: string; // This will be inventory_item_id
    make: string;
    model: string;
    year: number;
    mileage: number;
}

interface ScanApiRequestForFastAPI {
    scan_request_id: string;
    user_id: string;
    vehicles: VehicleToAnalyzeForFastAPI[];
}

// Helper function to create Supabase client
function createSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value, ...options }); } catch (error) { }
                },
                remove(name: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value: '', ...options }); } catch (error) { }
                },
            },
        }
    );
}

export async function POST(request: NextRequest) {
    const supabase = createSupabaseClient();

    try {
        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('Authentication error:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.id;

        // 2. Parse and validate request body
        const body = await request.json();
        const parseResult = marketAnalysisRequestSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({
                error: 'Invalid request data',
                details: parseResult.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const clientVehiclesData = parseResult.data.vehicles;

        // 3. Generate scan request ID
        const scanRequestId = uuidv4();

        // 4. Prepare payload for FastAPI
        const fastApiPayload: ScanApiRequestForFastAPI = {
            scan_request_id: scanRequestId,
            user_id: userId,
            vehicles: clientVehiclesData.map(v => ({
                carbiz_vehicle_id: v.inventory_item_id,
                make: v.make,
                model: v.model,
                year: v.year,
                mileage: v.mileage
            }))
        };

        // 5. Get FastAPI base URL from environment variable
        let fastApiBaseUrl = process.env.FASTAPI_BASE_URL;
        if (!fastApiBaseUrl) {
            console.error("CRITICAL: FASTAPI_BASE_URL environment variable is not set. Using fallback URL for development.");
            fastApiBaseUrl = 'https://v2qgpy7pbr.eu-central-1.awsapprunner.com'; // Fallback
        }

        // 6. Call FastAPI service
        const fastApiResponse = await fetch(`${fastApiBaseUrl}/analyze-prices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(fastApiPayload),
        });

        // 7. Handle FastAPI response
        if (fastApiResponse.status === 202) {
            return NextResponse.json({
                message: "Market analysis request successfully forwarded to processing service.",
                scan_request_id: scanRequestId
            }, { status: 200 });
        } else {
            // Log the error details
            let errorData: any = {};
            try {
                errorData = await fastApiResponse.json();
            } catch {
                errorData = { raw: await fastApiResponse.text() };
            }
            console.error('FastAPI service error:', {
                status: fastApiResponse.status,
                statusText: fastApiResponse.statusText,
                data: errorData,
                payload: fastApiPayload
            });

            return NextResponse.json({
                error: 'Error forwarding request to analysis service',
                details: errorData
            }, { status: 502 });
        }

    } catch (error) {
        console.error('Unexpected error in market analysis initiation:', error);
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 });
    }
}
