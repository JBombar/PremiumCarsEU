export const dynamic = 'force-dynamic'; // <--- ADD THIS LINE


// app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Database } from '@/types/supabase'; // Ensure this path is correct

// Define a comprehensive Zod schema matching the actual database columns
const inventoryQuerySchema = z.object({
  // String filters - basic text fields
  make: z.string().optional(),
  model: z.string().optional(),
  fuel_type: z.string().optional(),
  transmission: z.string().optional(),
  body_type: z.string().optional(), // Included here
  exterior_color: z.string().optional(),
  interior_color: z.string().optional(),
  engine: z.string().optional(),
  vin: z.string().optional(),
  location_city: z.string().optional(),
  location_country: z.string().optional(),

  // Enum filters - validated against allowed values
  condition: z.enum(['new', 'used', 'Any']).optional(),
  status: z.enum(['available', 'reserved', 'sold', 'Any']).optional(),
  listing_type: z.enum(['sale', 'rent', 'both', 'Any']).optional(),
  rental_status: z.enum(['available', 'rented', 'maintenance', 'Any']).optional(),

  // Numeric range filters
  year_from: z.coerce.number().int().optional(),
  year_to: z.coerce.number().int().optional(),
  price_min: z.coerce.number().nonnegative().optional(),
  price_max: z.coerce.number().positive().optional(),
  mileage_min: z.coerce.number().nonnegative().optional(),
  mileage_max: z.coerce.number().nonnegative().optional(),

  // Pagination and sorting
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  sortBy: z.enum([
    'price', 'year', 'mileage', 'created_at',
    'make', 'model', 'condition', 'status' // Add any other valid sort columns
  ]).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Add is_public as a boolean parameter with string coercion
  is_public: z.union([
    z.literal('true').transform(() => true),
    z.literal('false').transform(() => false),
    z.boolean()
  ]).optional().default(true),
}).passthrough(); // Allow other params to pass through

// Define type for validated query parameters
type InventoryQueryParams = z.infer<typeof inventoryQuerySchema>;

// Valid enum values for reference (optional, but good practice)
const VALID_CONDITIONS = ['new', 'used'];
// Add others if needed: const VALID_STATUSES = ...

// Helper function to create Supabase client
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
          } catch (e) { /* Ignore cookie errors in server components */ }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (e) { /* Ignore cookie errors in server components */ }
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const result = inventoryQuerySchema.safeParse(params);
    if (!result.success) {
      console.warn("Invalid query parameters:", result.error.format());
      return NextResponse.json(
        {
          data: [],
          count: 0,
          page: 1,
          limit: 24, // Use a default or parse safely
          error: "Invalid query parameters",
          details: result.error.format()
        },
        { status: 400 }
      );
    }

    const validatedParams = result.data;
    console.log("Validated Query Params:", validatedParams); // Log validated params

    // Initialize Supabase query
    const supabase = createSupabaseClient();
    // Ensure your table name 'car_listings' is correct
    let query = supabase.from('car_listings').select('*', { count: 'exact' });

    // --- Apply Filters Dynamically ---

    // Make Filter
    if (validatedParams.make && validatedParams.make !== 'Any') {
      query = query.ilike('make', `%${validatedParams.make.trim()}%`);
      console.log(`API: Filtering by make: "%${validatedParams.make.trim()}%"`);
    }

    // Model Filter
    if (validatedParams.model &&
      validatedParams.model !== 'Any' &&
      validatedParams.model.toLowerCase() !== 'any') {
      query = query.ilike('model', `%${validatedParams.model.trim()}%`);
      console.log(`API: Filtering by model: "%${validatedParams.model.trim()}%"`);
    }

    // Year Range Filters
    if (validatedParams.year_from) {
      query = query.gte('year', validatedParams.year_from);
      console.log(`API: Filtering by year_from: >= ${validatedParams.year_from}`);
    }
    if (validatedParams.year_to) {
      query = query.lte('year', validatedParams.year_to);
      console.log(`API: Filtering by year_to: <= ${validatedParams.year_to}`);
    }

    // ****** BODY TYPE FILTER (Added) ******
    if (validatedParams.body_type &&
      validatedParams.body_type !== 'Any' &&
      validatedParams.body_type.toLowerCase() !== 'any') {
      // Use .ilike() for case-insensitive matching (e.g., 'suv' matches 'SUV')
      // Use .eq() for exact case-sensitive matching if needed
      query = query.ilike('body_type', validatedParams.body_type.trim());
      console.log(`API: Filtering by body_type: "${validatedParams.body_type.trim()}"`);
    }
    // **************************************

    // Fuel Type Filter
    if (validatedParams.fuel_type &&
      validatedParams.fuel_type !== 'Any' &&
      validatedParams.fuel_type.toLowerCase() !== 'any') {
      query = query.ilike('fuel_type', validatedParams.fuel_type.trim());
      console.log(`API: Filtering by fuel_type: "${validatedParams.fuel_type.trim()}"`);
    }

    // Condition Filter
    if (validatedParams.condition &&
      validatedParams.condition !== 'Any' &&
      VALID_CONDITIONS.includes(validatedParams.condition)) { // Use .includes for enums
      query = query.eq('condition', validatedParams.condition);
      console.log(`API: Filtering by condition: "${validatedParams.condition}"`);
    }

    // Transmission Filter
    if (validatedParams.transmission &&
      validatedParams.transmission !== 'Any' &&
      validatedParams.transmission.toLowerCase() !== 'any') {
      query = query.ilike('transmission', validatedParams.transmission.trim());
      console.log(`API: Filtering by transmission: "${validatedParams.transmission.trim()}"`);
    }

    // Price Range Filters
    if (validatedParams.price_min !== undefined && validatedParams.price_min >= 0) {
      query = query.gte('price', validatedParams.price_min);
      console.log(`API: Filtering by price_min: >= ${validatedParams.price_min}`);
    }
    if (validatedParams.price_max !== undefined && validatedParams.price_max > 0) { // Check > 0
      query = query.lte('price', validatedParams.price_max);
      console.log(`API: Filtering by price_max: <= ${validatedParams.price_max}`);
    }

    // Mileage Range Filters
    if (validatedParams.mileage_min !== undefined && validatedParams.mileage_min >= 0) {
      query = query.gte('mileage', validatedParams.mileage_min);
      console.log(`API: Filtering by mileage_min: >= ${validatedParams.mileage_min}`);
    }
    if (validatedParams.mileage_max !== undefined && validatedParams.mileage_max >= 0) {
      // If max mileage is 0, this finds cars with exactly 0 mileage.
      // Adjust logic if 0 should mean something else (e.g., "up to 0")
      query = query.lte('mileage', validatedParams.mileage_max);
      console.log(`API: Filtering by mileage_max: <= ${validatedParams.mileage_max}`);
    }

    // After the other filters, add is_public filter
    // Always filter by is_public if it's provided in the params
    if (validatedParams.is_public !== undefined) {
      query = query.eq('is_public', validatedParams.is_public);
      console.log(`API: Filtering by is_public: ${validatedParams.is_public}`);
    }

    // --- Apply Sorting ---
    // Ensure sortBy column exists in your database table
    const validSortBy = ['price', 'year', 'mileage', 'created_at', 'make', 'model', 'condition', 'status'].includes(validatedParams.sortBy)
      ? validatedParams.sortBy
      : 'created_at'; // Fallback to default if invalid sortBy provided

    query = query.order(validSortBy, { ascending: validatedParams.sortOrder === 'asc' });

    // --- Apply Pagination ---
    const startIndex = (validatedParams.page - 1) * validatedParams.limit;
    const endIndex = startIndex + validatedParams.limit - 1;
    query = query.range(startIndex, endIndex);

    // --- Execute Query ---
    console.log("Executing Supabase Query..."); // Log before execution
    const { data: cars, error, count } = await query;

    // --- Handle Results ---
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        {
          data: [],
          count: 0,
          page: validatedParams.page,
          limit: validatedParams.limit,
          error: `Failed to fetch inventory: ${error.message}` // Include Supabase error message
        },
        { status: 500 }
      );
    }

    console.log(`Query successful. Found ${cars?.length || 0} cars. Total count matching filters: ${count}`);

    // Return structured response matching frontend expectations
    return NextResponse.json({
      data: cars || [], // Ensure data is always an array
      count: count || 0, // Ensure count is always a number
      page: validatedParams.page,
      limit: validatedParams.limit
    });

  } catch (error: any) {
    // Catch unexpected errors during setup or validation
    console.error('Unexpected error in GET /api/inventory:', error);
    return NextResponse.json(
      {
        data: [],
        count: 0,
        page: 1, // Sensible defaults on unexpected error
        limit: 24,
        error: "Internal server error",
        details: error.message // Include error message if available
      },
      { status: 500 }
    );
  }
}