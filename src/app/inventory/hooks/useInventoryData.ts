// src/app/inventory/hooks/useInventoryData.ts
import { useState, useEffect, useCallback } from 'react';
import type { CarListing, FilterState, InventoryApiResponse, InventoryApiErrorResponse } from '../types';
import { isInventoryApiError } from '../types'; // Import the type guard

// Helper function to parse sort option (consistent with useInventoryFilters)
const parseSortOption = (option: string): [string, string] => {
    if (!option || !option.includes('-')) return ['created_at', 'desc'];
    const [field, direction] = option.split('-');
    return [field, direction];
};

// Define the return type including totalCount for pagination
interface UseInventoryDataReturn {
    cars: CarListing[];
    loading: boolean;
    error: string | null;
    totalCount: number; // Total number of items matching filters
}

// Define default filters *used only for comparison* when building query params.
// Should ideally match the defaults used in useInventoryFilters for consistency.
const defaultFiltersData: Partial<FilterState> = { // Use Partial if not all defaults are needed for comparison
    make: "Any", model: "Any", yearMin: 2010, yearMax: new Date().getFullYear(),
    priceMin: 0, priceMax: 150000, mileageMin: 0, mileageMax: 100000,
    fuelType: "Any", transmission: "Any", condition: "Any", bodyType: "Any",
    exteriorColor: "Any", interiorColor: "Any",
    listingType: 'both' // Include listingType default for comparison
};

export function useInventoryData(
    appliedFilters: FilterState, // Filters that should be used for the API request
    sortOption: string,
    currentPage: number,
    limit: number = 24 // Items per page
): UseInventoryDataReturn {
    const [cars, setCars] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true); // Start loading initially
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0); // State for total count from API

    // useCallback memoizes the fetchData function itself.
    // It will re-run via useEffect when its dependencies change.
    const fetchData = useCallback(async (currentFilters: FilterState, currentSort: string, page: number, itemsLimit: number) => {
        console.log(`useInventoryData: Fetching data page ${page} limit ${itemsLimit} with filters/sort...`);
        setLoading(true);
        setError(null); // Clear previous errors on new fetch
        const queryParams = new URLSearchParams();

        // --- Build query params based on currentFilters ---

        // Always include is_public=true unless explicitly handled otherwise
        queryParams.append('is_public', 'true');

        // Add filters only if they differ from the conceptual "default" or "Any" state
        if (currentFilters.make !== defaultFiltersData.make) queryParams.append('make', currentFilters.make);
        if (currentFilters.model && currentFilters.model !== "Any") queryParams.append('model', currentFilters.model);
        if (currentFilters.yearMin !== defaultFiltersData.yearMin) queryParams.append('year_from', currentFilters.yearMin.toString());
        if (currentFilters.yearMax !== defaultFiltersData.yearMax) queryParams.append('year_to', currentFilters.yearMax.toString());
        if (currentFilters.priceMin !== defaultFiltersData.priceMin) queryParams.append('price_min', currentFilters.priceMin.toString());
        if (currentFilters.priceMax !== defaultFiltersData.priceMax) queryParams.append('price_max', currentFilters.priceMax.toString());
        if (currentFilters.mileageMin !== defaultFiltersData.mileageMin) queryParams.append('mileage_min', currentFilters.mileageMin.toString());
        if (currentFilters.mileageMax !== defaultFiltersData.mileageMax) queryParams.append('mileage_max', currentFilters.mileageMax.toString());
        if (currentFilters.fuelType !== defaultFiltersData.fuelType) queryParams.append('fuel_type', currentFilters.fuelType);
        if (currentFilters.transmission !== defaultFiltersData.transmission) queryParams.append('transmission', currentFilters.transmission);
        if (currentFilters.condition !== defaultFiltersData.condition) queryParams.append('condition', currentFilters.condition);
        if (currentFilters.bodyType !== defaultFiltersData.bodyType) queryParams.append('body_type', currentFilters.bodyType);
        if (currentFilters.exteriorColor !== defaultFiltersData.exteriorColor) queryParams.append('exterior_color', currentFilters.exteriorColor);
        if (currentFilters.interiorColor !== defaultFiltersData.interiorColor) queryParams.append('interior_color', currentFilters.interiorColor);

        // Optional numeric filters
        if (currentFilters.horsepowerMin !== undefined) queryParams.append('hp_min', currentFilters.horsepowerMin.toString());
        if (currentFilters.horsepowerMax !== undefined) queryParams.append('hp_max', currentFilters.horsepowerMax.toString());
        if (currentFilters.displacementMin !== undefined) queryParams.append('disp_min', currentFilters.displacementMin.toString());
        if (currentFilters.displacementMax !== undefined) queryParams.append('disp_max', currentFilters.displacementMax.toString());
        if (currentFilters.cylindersMin !== undefined) queryParams.append('cyl_min', currentFilters.cylindersMin.toString());
        if (currentFilters.cylindersMax !== undefined) queryParams.append('cyl_max', currentFilters.cylindersMax.toString());

        // ✅ ADDED: Listing Type Parameter Logic
        // Add the parameter only if it's 'sale' or 'rent' (not the default 'both')
        if (currentFilters.listingType && currentFilters.listingType !== 'both') {
            queryParams.append('listing_type', currentFilters.listingType);
            console.log(`useInventoryData: Adding listing_type param: ${currentFilters.listingType}`);
        } else {
            console.log(`useInventoryData: Listing type is 'both' or default, not adding param.`);
        }
        // --- END OF ADDED LOGIC ---

        // Add sorting parameters
        const [sortBy, sortOrder] = parseSortOption(currentSort);
        queryParams.append('sortBy', sortBy);
        queryParams.append('sortOrder', sortOrder);

        // Add pagination parameters
        queryParams.append('page', page.toString());
        queryParams.append('limit', itemsLimit.toString());

        const searchString = queryParams.toString();
        const apiUrl = `/api/inventory?${searchString}`;
        console.log("useInventoryData: Fetching URL:", apiUrl);

        try {
            const response = await fetch(apiUrl);
            // Try to parse JSON regardless of response.ok, as API might return error details in JSON
            const result: InventoryApiResponse | InventoryApiErrorResponse = await response.json();

            // Check if the response was not ok OR if the parsed result indicates an API error
            if (!response.ok || isInventoryApiError(result)) {
                const errorMessage = isInventoryApiError(result) ? result.error : `API Error (${response.status})`;
                const errorDetails = isInventoryApiError(result) ? result.details : (await response.text().catch(() => '')); // Try to get text details if JSON parsing failed or no details provided
                console.error("API Error fetching inventory:", errorMessage, errorDetails);
                throw new Error(errorMessage || `Failed to fetch data (${response.status})`);
            }

            // Success case: result is InventoryApiResponse
            console.log(`useInventoryData: Fetch successful. Received ${result.data.length} cars. Total count: ${result.count}`);
            setCars(result.data);
            setTotalCount(result.count ?? 0); // Set total count from API response
            setError(null); // Clear previous errors on success

        } catch (err) {
            console.error('useInventoryData: Error in fetchData:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during fetch');
            setCars([]); // Clear cars on error
            setTotalCount(0); // Reset count on error
        } finally {
            setLoading(false); // Ensure loading is set to false in both success and error cases
        }
    }, []); // Empty dependency array for useCallback: the function definition doesn't depend on external state/props

    // Effect to trigger fetch when appliedFilters, sortOption, currentPage, or limit change
    useEffect(() => {
        console.log("useInventoryData: Dependencies changed (filters/sort/page/limit), triggering fetch.");
        // Fetch data using the current state values passed as arguments to the hook
        fetchData(appliedFilters, sortOption, currentPage, limit);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters, sortOption, currentPage, limit]); // Add fetchData to dependency array if ESLint complains, although it's stable due to useCallback

    // Return the stateful values and loading/error status
    return { cars, loading, error, totalCount };
}