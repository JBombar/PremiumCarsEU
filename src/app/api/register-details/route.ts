import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js'; // Import standard client for service role
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Make sure this path is correct and types are generated
import { z } from 'zod';

// Define the allowed role types directly or import from a shared types file
// Ensure these match your 'user_role' enum in Supabase and the Zod schema
type UserRole = 'dealer' | 'tipper' | 'admin' | 'buyer';

// =================================================================================
// ✅ Zod schema for registration details
// =================================================================================
const registerDetailsSchema = z.object({
    // Add other fields here if you collect them on the frontend and want to save them
    // e.g., firstName: z.string().min(1).optional(),
    //       lastName: z.string().min(1).optional(),
    role: z.enum(['buyer', 'dealer', 'tipper', 'admin']), // Use the UserRole type values
});

// =================================================================================
// ✅ POST /api/register-details
// This route should be called AFTER user signs up (and potentially confirms email, depending on your flow)
// It securely writes user details (like role) into `public.users` using elevated privileges.
// =================================================================================
export async function POST(req: NextRequest) {
    const cookieStore = cookies();

    // 1. --- Authentication Client (using ANON key - standard SSR) ---
    // Used ONLY to verify the user's session and get their auth details (ID, email).
    const supabaseAuthClient = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ANON key is CORRECT here for getUser
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value, ...options }); } catch (error) { /* Handle potential error */ }
                },
                remove(name: string, options: CookieOptions) {
                    try { cookieStore.set({ name, value: '', ...options }); } catch (error) { /* Handle potential error */ }
                },
            },
        }
    );

    // Get the user session based on the cookies provided in the request
    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();

    // If no valid session, user is not authorized
    if (authError || !user) {
        console.error('API /register-details: Auth Error or No User', authError);
        return NextResponse.json({ error: 'Unauthorized: No active session found.' }, { status: 401 });
    }

    // We have a valid user session (user.id, user.email is potentially defined)

    // 2. --- Input Validation ---
    let body: unknown;
    try {
        body = await req.json();
    } catch (error) {
        console.error('API /register-details: Invalid JSON:', error);
        return NextResponse.json({ error: 'Invalid request body: Malformed JSON.' }, { status: 400 });
    }

    // Validate the parsed body against our schema
    const validationResult = registerDetailsSchema.safeParse(body);
    if (!validationResult.success) {
        console.error('API /register-details: Validation Errors:', validationResult.error.errors);
        return NextResponse.json(
            { error: 'Invalid input data', details: validationResult.error.flatten() },
            { status: 400 }
        );
    }
    // Extract validated data (only 'role' for now, add others if schema changes)
    const { role } = validationResult.data;

    // 3. --- Database Operations Client (using SERVICE ROLE key) ---
    // Required to bypass RLS for inserting/updating the public.users table.
    // Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables.
    const supabaseAdminClient = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // SERVICE ROLE KEY grants admin privileges
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // 4. --- Database Logic ---
    try {
        // Check if the user record already exists in public.users using their auth ID
        const { data: existingUser, error: checkError } = await supabaseAdminClient
            .from('users')
            .select('id, role') // Select current role to check if update is needed
            .eq('id', user.id) // Match based on the authenticated user's ID
            .maybeSingle(); // Expect 0 or 1 result

        if (checkError) {
            console.error('API /register-details: Error checking existing user:', checkError);
            throw new Error(`Database error checking user: ${checkError.message}`); // Propagate error to catch block
        }

        let userRecordId = user.id; // Default to the auth user ID
        let operationPerformed: 'insert' | 'update' | 'none' = 'none';

        if (existingUser) {
            // --- User record exists in public.users ---
            userRecordId = existingUser.id; // Confirm using the ID from the table
            if (existingUser.role !== role) { // Only perform update if the role is different
                const { error: updateError } = await supabaseAdminClient
                    .from('users')
                    .update({
                        role: role,
                        updated_at: new Date().toISOString(), // Explicitly set updated_at timestamp
                        // Add other validated fields if needed:
                        // first_name: validationResult.data.firstName,
                        // last_name: validationResult.data.lastName,
                    })
                    .eq('id', user.id); // Update the record matching the user's ID

                if (updateError) {
                    console.error('API /register-details: Supabase update error:', updateError);
                    throw new Error(`Failed to update user role: ${updateError.message}`);
                }
                operationPerformed = 'update';
                console.log(`API /register-details: User ${user.id} role updated to ${role}`);
            } else {
                // Role is the same, no database update needed for 'users' table
                operationPerformed = 'none';
                console.log(`API /register-details: User ${user.id} already has role ${role}. No update needed.`);
            }

        } else {
            // --- User record does NOT exist in public.users, Insert new record ---

            // !! CRITICAL CHECK !!: Ensure the authenticated user has an email, as 'public.users' requires it.
            if (!user.email) {
                console.error(`API /register-details: User ${user.id} attempted insert but lacks an email address.`);
                // Return a specific error because the 'users' table schema requires 'email'
                return NextResponse.json({ error: 'Cannot create user profile without an email address.' }, { status: 400 }); // Bad Request
            }

            // At this point, TypeScript knows user.email is a string due to the check above
            const { data: insertedUser, error: insertError } = await supabaseAdminClient
                .from('users')
                .insert({
                    id: user.id,          // Primary key, matches auth.users.id
                    email: user.email,    // Email from auth user (now guaranteed to be string)
                    role: role,           // Role from validated request body
                    // Add other validated fields if needed:
                    // first_name: validationResult.data.firstName,
                    // last_name: validationResult.data.lastName,
                    // created_at and updated_at should have defaults in the DB schema
                })
                .select('id') // Select the ID of the newly inserted row
                .single();    // Expect exactly one row to be inserted and returned

            if (insertError) {
                console.error('API /register-details: Supabase insert error:', insertError);
                if (insertError.code === '23505') { // Handle unique constraint violation (e.g., duplicate ID)
                    return NextResponse.json({ error: 'User record conflict. A profile for this user might already exist.' }, { status: 409 }); // 409 Conflict
                }
                // For other insert errors
                throw new Error(`Failed to insert user record: ${insertError.message}`);
            }

            // Use the ID returned from the insert operation
            userRecordId = insertedUser.id;
            operationPerformed = 'insert';
            console.log(`API /register-details: User ${user.id} record inserted with role ${role}`);
        }

        // --- Additional Logic: Create Dealer Partner Record ---
        // This runs if the role is 'dealer', regardless of whether user was inserted or updated
        if (role === 'dealer' && userRecordId) {
            // Check if a dealer partner record *already* exists for this user ID to prevent duplicates
            const { data: existingDealer, error: checkDealerError } = await supabaseAdminClient
                .from('dealer_partners') // Target the dealer_partners table
                .select('dealer_user_id') // Just need to check existence
                .eq('dealer_user_id', userRecordId) // Match on the foreign key
                .maybeSingle(); // Expect 0 or 1

            if (checkDealerError) {
                // Log the error but don't necessarily fail the whole request
                console.error('API /register-details: Error checking existing dealer partner:', checkDealerError);
                // Consider if this should throw or just be logged based on business logic
            } else if (!existingDealer) {
                // Only insert if no dealer record exists for this user ID
                const { error: dealerInsertError } = await supabaseAdminClient
                    .from('dealer_partners')
                    .insert({
                        dealer_user_id: userRecordId, // Link to the users table ID
                        // dealership_id: null, // Set explicitly if needed, otherwise rely on DB default or set later
                        // Add other relevant fields if any (e.g., status, created_at if not defaulted)
                    });

                if (dealerInsertError) {
                    // Log the error, maybe return a specific warning or status?
                    console.error('API /register-details: Error inserting dealer partner record:', dealerInsertError);
                    // Decide how to handle - log and continue, or throw?
                } else {
                    console.log(`API /register-details: Dealer partner record created for user ${userRecordId}`);
                }
            } else {
                // Dealer record already exists, no action needed here
                console.log(`API /register-details: Dealer partner record already exists for user ${userRecordId}.`);
            }
        }

        // --- Success Response ---
        // Determine appropriate status code based on the primary operation
        const status = operationPerformed === 'insert' ? 201 : 200; // 201 Created for insert, 200 OK for update/none
        return NextResponse.json({
            message: 'User details processed successfully.',
            userId: userRecordId,
            operation: operationPerformed // 'insert', 'update', or 'none'
        },
            { status }
        );

    } catch (error) {
        // Catch any errors thrown during the database logic phase
        console.error('API Route Error in /api/register-details:', error);
        const message = error instanceof Error ? error.message : 'An unexpected server error occurred processing user details.';
        // Return a generic server error response
        return NextResponse.json({ error: 'Server Error', details: message }, { status: 500 });
    }
}