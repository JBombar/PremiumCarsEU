// src/app/inventory/types.ts

// --- Core Data Structures ---

/**
 * Represents a single car listing object as returned by the /api/inventory endpoint.
 * Matches the columns selected ('*') from the 'car_listings' table.
 * Ensure all relevant columns from your Supabase table are included here.
 */
export interface CarListing {
    id: string; // uuid, primary key
    make: string;
    model: string;
    year: number | null;
    price: number | null;
    mileage: number | null;
    fuel_type: string | null;
    transmission: string | null;
    condition: 'new' | 'used' | null; // Matches enum in DB/schema if applicable
    location_city: string | null;
    location_country: string | null;
    images: string[] | null; // Assuming this is stored as JSONB or text[]
    description: string | null;
    body_type: string | null;
    exterior_color: string | null;
    interior_color: string | null;
    engine: string | null; // Added from inventory schema
    vin: string | null; // Added from inventory schema
    status: 'available' | 'reserved' | 'sold' | null; // Added from inventory schema
    listing_type: 'sale' | 'rent' | 'both' | null; // Added from inventory schema
    rental_status: 'available' | 'rented' | 'maintenance' | null; // Added from inventory schema
    horsepower: number | null; // Keep if present in DB
    displacement: number | null; // Keep if present in DB
    cylinders: number | null; // Keep if present in DB
    is_public: boolean | null; // Added from inventory schema
    created_at: string; // Timestamptz, likely string format
    // Add any other columns from your 'car_listings' table that you might need
    // user_id?: string; // Example if you need owner info
}

/**
 * Represents a car make object as returned by /api/car-makes.
 * Matches the 'id' and 'name' columns from 'car_makes' table.
 */
export interface CarMake {
    id: string; // uuid
    name: string;
}

/**
 * Represents a car model object as returned by /api/car-models.
 * Matches the 'id', 'name', and 'make_id' columns from 'car_models' table.
 */
export interface CarModel {
    id: string; // uuid
    make_id: string; // uuid, foreign key to car_makes
    name: string;
}

// --- Filter and State Types ---

/**
 * Defines the shape of the filter state object used in the frontend components and hooks.
 * Keys generally align with query parameters sent to /api/inventory, but names might differ (e.g., yearMin vs year_from).
 */
export interface FilterState {
    // Basic Filters
    make: string; // e.g., "BMW", "Any"
    model: string; // e.g., "M3", "Any"
    yearMin: number; // Corresponds to 'year_from' query param
    yearMax: number; // Corresponds to 'year_to' query param
    priceMin: number; // Corresponds to 'price_min' query param
    priceMax: number; // Corresponds to 'price_max' query param
    mileageMin: number; // Corresponds to 'mileage_min' query param
    mileageMax: number; // Corresponds to 'mileage_max' query param
    fuelType: string; // Corresponds to 'fuel_type' query param
    transmission: string; // Corresponds to 'transmission' query param
    condition: string; // Corresponds to 'condition' query param ('new', 'used', 'Any')
    bodyType: string; // Corresponds to 'body_type' query param
    exteriorColor: string; // Corresponds to 'exterior_color' query param
    interiorColor: string; // Corresponds to 'interior_color' query param

    // Advanced Filters (Optional Numbers - can be undefined if not set)
    // Ensure these correspond to query params if implemented in /api/inventory
    horsepowerMin?: number; // Example: 'hp_min' query param
    horsepowerMax?: number; // Example: 'hp_max' query param
    displacementMin?: number; // Example: 'disp_min' query param
    displacementMax?: number; // Example: 'disp_max' query param
    cylindersMin?: number; // Example: 'cyl_min' query param
    cylindersMax?: number; // Example: 'cyl_max' query param
    // Add other advanced filter fields as needed...
    listingType: 'sale' | 'rent' | 'both';
}

// --- API Request/Response Types ---

/**
 * Represents the successful response structure from GET /api/inventory.
 */
export interface InventoryApiResponse {
    data: CarListing[];
    count: number; // Total count matching filters (for pagination)
    page: number; // Current page number returned
    limit: number; // Items per page returned
    error?: never; // Ensures error is not present on success type
}

/**
 * Represents the error response structure from GET /api/inventory.
 */
export interface InventoryApiErrorResponse {
    data: [];
    count: 0;
    page: number;
    limit: number;
    error: string; // Error message
    details?: any; // Optional detailed error info (e.g., Zod issues)
}

/**
 * Type guard to check if the response from /api/inventory is an error.
 */
export function isInventoryApiError(
    response: InventoryApiResponse | InventoryApiErrorResponse
): response is InventoryApiErrorResponse {
    return (response as InventoryApiErrorResponse).error !== undefined;
}


/**
 * Represents the expected JSON body for POST /api/ai-intent.
 */
export interface AiIntentApiRequest {
    userInput: string;
}

/**
 * Represents the structure of the `parsed_filters` object returned by the AI/n8n process.
 * Fields are optional as the AI might not identify all criteria.
 * Ranges use gte (greater than or equal) and lte (less than or equal).
 */
export interface ParsedAiFilters {
    make?: string | null;
    model?: string | null;
    body_type?: string | null;
    year?: { gte?: number; lte?: number } | null;
    price?: { gte?: number; lte?: number } | null;
    mileage?: { gte?: number; lte?: number } | null;
    fuel_type?: string | null;
    transmission?: string | null;
    condition?: 'new' | 'used' | null; // Match DB values if possible
    exterior_color?: string | null;
    interior_color?: string | null;
    // Add other potential fields from AI parsing
}

/**
 * Represents the successful response structure from POST /api/ai-intent.
 */
export interface AiIntentApiResponse {
    success: true;
    parsed_filters: ParsedAiFilters | null; // Can be null if AI fails but process succeeds
    confidence?: number | null; // Optional confidence score
    error?: never;
}

/**
 * Represents the error response structure from POST /api/ai-intent.
 */
export interface AiIntentApiErrorResponse {
    success?: false; // Explicitly false or absent
    error: string;
    n8n_details?: string; // Specific details from n8n failure
    details?: any; // Other potential error details
}

/**
 * Type guard to check if the response from /api/ai-intent is an error.
 */
export function isAiIntentApiError(
    response: AiIntentApiResponse | AiIntentApiErrorResponse
): response is AiIntentApiErrorResponse {
    return (response as AiIntentApiErrorResponse).error !== undefined || response.success === false;
}


/**
 * Represents the expected JSON body for POST /api/track/search.
 * Matches the Zod schema in the route.
 */
export interface SearchTrackingPayload {
    session_id: string;
    make_id?: string | null; // UUID or null
    model_id?: string | null; // UUID or null
    filters: FilterState | Record<string, any>; // Send the structured FilterState object
    clicked_listing_id?: string | null; // UUID or null
}

/**
 * Represents the successful response structure from POST /api/track/search.
 */
export interface SearchTrackingApiResponse {
    success: true;
    error?: never;
}

/**
 * Represents the error response structure from POST /api/track/search.
 */
export interface SearchTrackingApiErrorResponse {
    success?: false;
    error: string;
    details?: any;
}

/**
 * Type guard to check if the response from /api/track/search is an error.
 */
export function isSearchTrackingApiError(
    response: SearchTrackingApiResponse | SearchTrackingApiErrorResponse
): response is SearchTrackingApiErrorResponse {
    return (response as SearchTrackingApiErrorResponse).error !== undefined || response.success === false;
}


// --- Utility Types (Optional) ---

/**
 * Type for sorting options used in the frontend dropdown.
 * Key is the value sent to API (e.g., 'price-asc'), Value is the display text.
 */
export type SortOption = {
    value: string; // e.g., "price-asc", "created_at-desc"
    label: string; // e.g., "Price: Low to High", "Newest Arrivals"
};