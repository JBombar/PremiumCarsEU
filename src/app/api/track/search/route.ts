import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Database } from '@/types/supabase';

// Zod schema for validating the request body
const SearchInteractionSchema = z.object({
    session_id: z.string().min(1, "Session ID is required"),
    make_id: z.string().uuid().nullable().optional(),
    model_id: z.string().uuid().nullable().optional(),
    filters: z.record(z.any()).or(z.string()), // Object or JSON string
    clicked_listing_id: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json();

        // Validate the request body
        const result = SearchInteractionSchema.safeParse(body);

        if (!result.success) {
            // Return validation errors
            return NextResponse.json(
                { error: "Validation failed", details: result.error.format() },
                { status: 400 }
            );
        }

        // Create Supabase client
        const cookieStore = cookies();
        const supabase = createServerClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        // Process the filters if it's a string (convert to object)
        const processedData = {
            ...result.data,
            filters: typeof result.data.filters === 'string'
                ? JSON.parse(result.data.filters)
                : result.data.filters,
        };

        // Insert data into search_interactions table
        const { error } = await supabase
            .from('search_interactions')
            .insert({
                session_id: processedData.session_id,
                make_id: processedData.make_id || null,
                model_id: processedData.model_id || null,
                filters: processedData.filters,
                clicked_listing_id: processedData.clicked_listing_id || null,
                // id and timestamp will be handled by the database
            });

        if (error) {
            console.error('Error inserting search interaction:', error);
            return NextResponse.json(
                { error: "Failed to save search interaction", details: error.message },
                { status: 500 }
            );
        }

        // Return success response
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Unexpected error in search tracking API:', error);
        return NextResponse.json(
            { error: "Internal server error", details: String(error) },
            { status: 500 }
        );
    }
} 