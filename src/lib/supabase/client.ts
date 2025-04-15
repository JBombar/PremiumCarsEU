/* /lib/supabase/client.ts */

// Use createBrowserClient for client-side Supabase access in Next.js App Router
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase'; // Your generated DB types

// Check if environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Create and export a single shared Supabase client instance for the browser
// createBrowserClient handles session persistence via cookies automatically
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Optional: If you absolutely needed the function pattern (less common now):
// let clientInstance: ReturnType<typeof createBrowserClient<Database>>;
// export function getSupabaseBrowserClient() {
//   if (clientInstance) {
//     return clientInstance;
//   }
//   clientInstance = createBrowserClient<Database>(
//      process.env.NEXT_PUBLIC_SUPABASE_URL!,
//      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   );
//   return clientInstance;
// }