import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database, Json } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

// Create Supabase SSR client
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
                    } catch (e) { }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (e) { }
                },
            },
        }
    );
}

export async function POST(request: NextRequest) {
    try {
        const { userInput } = await request.json();

        if (!userInput || typeof userInput !== 'string') {
            return NextResponse.json(
                { error: 'User input is required and must be a string' },
                { status: 400 }
            );
        }

        const supabase = createSupabaseClient();

        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session_id = uuidv4();

        // 1. Insert raw input
        const { data: insertData, error: insertError } = await supabase
            .from('ai_search_intents')
            .insert({
                user_id: user.id,
                raw_input: userInput,
                session_id: session_id,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
        }

        const recordId = insertData.id;
        const n8nUrl = process.env.N8N_AI_INTENT_WEBHOOK;

        if (!n8nUrl) {
            return NextResponse.json({ error: 'n8n webhook not configured' }, { status: 500 });
        }

        // 2. Call n8n webhook
        const n8nResponse = await fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput, recordId, session_id }),
        });

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            console.error('n8n error:', errorText);
            return NextResponse.json({ error: 'n8n processing failed' }, { status: 500 });
        }

        const { parsed_filters, confidence } = await n8nResponse.json();

        // 3. Update record with parsed results
        const { error: updateError } = await supabase
            .from('ai_search_intents')
            .update({ parsed_filters, confidence })
            .eq('id', recordId);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({ error: 'Failed to update parsed filters' }, { status: 500 });
        }

        return NextResponse.json({ success: true, parsed_filters, confidence });

    } catch (error) {
        console.error('Unexpected error in /api/ai-intent:', error);
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
    }
}
