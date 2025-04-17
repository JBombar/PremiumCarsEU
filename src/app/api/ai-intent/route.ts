import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

// Helper function to create Supabase client (unchanged)
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
                    } catch (e) { console.warn("Failed setting cookie", e) } // Added warn
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (e) { console.warn("Failed removing cookie", e) } // Added warn
                },
            },
        }
    );
}

export async function POST(request: NextRequest) {
    console.log("[/api/ai-intent] Received POST request."); // LOG: Start of request

    try {
        let body;
        try {
            body = await request.json();
            console.log("[/api/ai-intent] Request body parsed successfully:", body); // LOG: Body content
        } catch (parseError: any) {
            console.error("[/api/ai-intent] Error parsing request body:", parseError); // LOG: Body parsing error
            return NextResponse.json({ error: `Invalid request body: ${parseError.message}` }, { status: 400 });
        }

        const userInput = body.userInput;

        if (!userInput || typeof userInput !== 'string') {
            console.warn("[/api/ai-intent] Invalid user input received:", userInput); // LOG: Invalid input
            return NextResponse.json(
                { error: 'User input is required and must be a string' },
                { status: 400 }
            );
        }
        console.log("[/api/ai-intent] Valid user input:", userInput); // LOG: Valid input

        const supabase = createSupabaseClient();
        console.log("[/api/ai-intent] Supabase client created."); // LOG: Supabase client init

        // Authenticate user
        console.log("[/api/ai-intent] Attempting to authenticate user..."); // LOG: Auth attempt
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            console.error("[/api/ai-intent] Authentication error:", authError); // LOG: Auth error detail
        }
        if (!user) {
            console.warn("[/api/ai-intent] User not authenticated or error occurred."); // LOG: Auth failure
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log("[/api/ai-intent] User authenticated successfully. User ID:", user.id); // LOG: Auth success

        const session_id = uuidv4();
        console.log("[/api/ai-intent] Generated session_id:", session_id); // LOG: Session ID

        // Insert user input into ai_search_intents
        console.log("[/api/ai-intent] Attempting to insert search intent into DB..."); // LOG: DB insert attempt
        const { data: insertData, error: insertError } = await supabase
            .from('ai_search_intents')
            .insert({
                user_id: user.id,
                raw_input: userInput,
                session_id,
            })
            .select()
            .single();

        if (insertError || !insertData) {
            console.error('[api/ai-intent] DB insert error:', insertError); // LOG: DB insert failure detail
            return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
        }
        console.log("[/api/ai-intent] Search intent inserted successfully. Record ID:", insertData.id); // LOG: DB insert success

        const recordId = insertData.id;

        // --- Environment Variable Check ---
        console.log("[/api/ai-intent] Attempting to read N8N_AI_INTENT_WEBHOOK environment variable..."); // LOG: Env var read attempt
        const webhookUrl = process.env.N8N_AI_INTENT_WEBHOOK;
        // Use JSON.stringify to clearly distinguish undefined, null, empty string
        console.log("[/api/ai-intent] Value read from process.env.N8N_AI_INTENT_WEBHOOK:", JSON.stringify(webhookUrl)); // LOG: **** CRUCIAL LOG ****

        if (!webhookUrl) {
            // Log again right before returning the error
            console.error('[api/ai-intent] N8N_AI_INTENT_WEBHOOK is missing or empty. Value was:', JSON.stringify(webhookUrl)); // LOG: Env var failure confirmation
            return NextResponse.json({ error: 'n8n webhook not configured' }, { status: 500 });
        }
        console.log("[/api/ai-intent] N8N_AI_INTENT_WEBHOOK found:", webhookUrl); // LOG: Env var success

        // Call n8n webhook
        const n8nPayload = {
            userInput,
            recordId,
            session_id,
        };

        console.log('[api/ai-intent] Preparing to send request to n8n webhook.'); // LOG: n8n call prep
        console.log('[api/ai-intent] n8n URL:', webhookUrl); // LOG: n8n URL
        console.log('[api/ai-intent] n8n Payload:', JSON.stringify(n8nPayload)); // LOG: n8n payload

        let n8nResponse;
        try {
            n8nResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(n8nPayload),
            });
            console.log('[api/ai-intent] n8n fetch completed. Status:', n8nResponse.status); // LOG: n8n fetch status

        } catch (fetchError: any) {
            console.error('[api/ai-intent] Error fetching n8n webhook:', fetchError); // LOG: n8n fetch network error
            return NextResponse.json({ error: `Failed to connect to n8n webhook: ${fetchError.message}` }, { status: 502 }); // Bad Gateway
        }


        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            console.error(`[api/ai-intent] n8n returned non-OK status (${n8nResponse.status}). Response text:`, errorText); // LOG: n8n non-OK response
            return NextResponse.json({ error: 'n8n processing failed', n8n_details: errorText }, { status: n8nResponse.status < 600 ? n8nResponse.status : 500 }); // Return n8n status if reasonable
        }

        console.log("[api/ai-intent] n8n response OK. Attempting to parse JSON..."); // LOG: n8n OK response
        let result;
        try {
            result = await n8nResponse.json();
            console.log("[api/ai-intent] n8n JSON parsed successfully:", result); // LOG: n8n result parsed
        } catch (jsonError: any) {
            console.error("[api/ai-intent] Error parsing JSON response from n8n:", jsonError); // LOG: n8n JSON parse error
            // It's possible n8n sent 200 OK but with non-JSON body, though unlikely with Respond node
            const rawText = await n8nResponse.text(); // Try to get raw text
            console.error("[api/ai-intent] Raw text response from n8n:", rawText);
            return NextResponse.json({ error: 'Failed to parse n8n response', n8n_raw_response: rawText }, { status: 500 });
        }

        // Ensure parsed_filters exists, even if empty, for robustness
        const parsed_filters = result?.parsed_filters ?? {};
        const confidence = result?.confidence; // Confidence might be optional
        console.log("[api/ai-intent] Extracted parsed_filters:", parsed_filters); // LOG: Extracted filters
        console.log("[api/ai-intent] Extracted confidence:", confidence); // LOG: Extracted confidence

        console.log("[api/ai-intent] Attempting to update search intent in DB with parsed results..."); // LOG: DB update attempt
        const { error: updateError } = await supabase
            .from('ai_search_intents')
            .update({ parsed_filters: parsed_filters, confidence: confidence }) // Ensure sending valid JSON/null
            .eq('id', recordId);

        if (updateError) {
            console.error('[api/ai-intent] DB update error:', updateError); // LOG: DB update failure detail
            // Don't fail the whole request just because logging failed, but log it.
            // Maybe return a slightly different success response? For now, just log.
        } else {
            console.log("[api/ai-intent] Search intent DB update successful."); // LOG: DB update success
        }

        console.log("[api/ai-intent] Processing complete. Sending success response to frontend."); // LOG: Final success log
        return NextResponse.json({ success: true, parsed_filters, confidence });

    } catch (error: any) {
        // Catch any unexpected errors not caught elsewhere
        console.error('[api/ai-intent] UNEXPECTED TOP-LEVEL ERROR:', error.message, error.stack); // LOG: Unexpected error details
        return NextResponse.json({ error: 'Unexpected server error occurred.' }, { status: 500 });
    }
}