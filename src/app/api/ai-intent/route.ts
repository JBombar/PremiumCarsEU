import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

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
                    } catch { }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch { }
                },
            },
        }
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const userInput = body.userInput;

        if (!userInput || typeof userInput !== 'string') {
            return NextResponse.json(
                { error: 'User input is required and must be a string' },
                { status: 400 }
            );
        }

        const supabase = createSupabaseClient();

        // Authenticate user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session_id = uuidv4();

        // Insert user input into ai_search_intents
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
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
        }

        const recordId = insertData.id;
        const webhookUrl = process.env.N8N_AI_INTENT_WEBHOOK;

        if (!webhookUrl) {
            console.error('Missing N8N_AI_INTENT_WEBHOOK env variable');
            return NextResponse.json({ error: 'n8n webhook not configured' }, { status: 500 });
        }

        // Call n8n webhook
        const n8nPayload = {
            userInput,
            recordId,
            session_id,
        };

        console.log('Sending to n8n webhook:', webhookUrl, n8nPayload);

        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(n8nPayload),
        });

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            console.error('n8n error response:', errorText);
            return NextResponse.json({ error: 'n8n processing failed' }, { status: 500 });
        }

        const result = await n8nResponse.json();
        const { parsed_filters, confidence } = result;

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
