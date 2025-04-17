/**
 * Safely retrieves the current user without throwing errors for unauthenticated sessions.
 * 
 * @param supabaseClient - The Supabase client instance
 * @returns Object containing user (null if not authenticated) and any error (excluding auth session errors)
 */
export async function getOptionalUser(supabaseClient: any) {
    try {
        const { data, error } = await supabaseClient.auth.getUser();

        // If error is AuthSessionMissingError, suppress it and return null user
        if (error && error.name === 'AuthSessionMissingError') {
            return { user: null, error: null };
        }

        // Return any other errors as they might be important
        return { user: data?.user || null, error };
    } catch (error) {
        console.error('Unexpected error in getOptionalUser:', error);
        return { user: null, error };
    }
} 