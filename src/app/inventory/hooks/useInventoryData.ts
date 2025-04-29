// src/app/inventory/hooks/useInventoryData.ts
import { useState, useEffect, useCallback } from 'react';
import type { CarListing, FilterState, InventoryApiResponse, InventoryApiErrorResponse } from '../types';
import { isInventoryApiError } from '../types'; // Import the type guard

// Helper function to parse sort option
const parseSortOption = (option: string): [string, string] => {
    if (!option || !option.includes('-')) return ['created_at', 'desc'];
    const [field, direction] = option.split('-');
    return [field, direction];
};

// Define the return type including totalCount <-- MODIFIED
interface UseInventoryDataReturn {
    cars: CarListing[];
    loading: boolean;
    error: string | null;
    totalCount: number; // <-- Added totalCount
}

// Default filters for query building comparison (unchanged)
const defaultFiltersData: FilterState = { make: "Any", model: "Any", yearMin: 2010, yearMax: new Date().getFullYear(), priceMin: 0, priceMax: 150000, mileageMin: 0, mileageMax: 100000, fuelType: "Any", transmission: "Any", condition: "Any", bodyType: "Any", exteriorColor: "Any", interiorColor: "Any", horsepowerMin: undefined, horsepowerMax: undefined, displacementMin: undefined, displacementMax: undefined, cylindersMin: undefined, cylindersMax: undefined };

export function useInventoryData(
    appliedFilters: FilterState,
    sortOption: string,
    currentPage: number, // <-- Added currentPage argument
    limit: number = 24   // <-- Added limit argument with default
): UseInventoryDataReturn { // <-- Updated return type
    const [cars, setCars] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true); // Start loading initially
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0); // <-- Added state for total count

    // Updated fetchData to accept page and limit <-- MODIFIED
    const fetchData = useCallback(async (currentFilters: FilterState, currentSort: string, page: number, itemsLimit: number) => {
        console.log(`useInventoryData: Fetching data page ${page} limit ${itemsLimit} with filters/sort...`);
        setLoading(true);
        setError(null);
        const queryParams = new URLSearchParams();

        // Build query params (logic remains the same)
        queryParams.append('is_public', 'true');
        if (currentFilters.make !== defaultFiltersData.make) queryParams.append('make', currentFilters.make);
        // Simplified model check from previous steps
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
        if (currentFilters.horsepowerMin !== undefined) queryParams.append('hp_min', currentFilters.horsepowerMin.toString());
        if (currentFilters.horsepowerMax !== undefined) queryParams.append('hp_max', currentFilters.horsepowerMax.toString());
        if (currentFilters.displacementMin !== undefined) queryParams.append('disp_min', currentFilters.displacementMin.toString());
        if (currentFilters.displacementMax !== undefined) queryParams.append('disp_max', currentFilters.displacementMax.toString());
        if (currentFilters.cylindersMin !== undefined) queryParams.append('cyl_min', currentFilters.cylindersMin.toString());
        if (currentFilters.cylindersMax !== undefined) queryParams.append('cyl_max', currentFilters.cylindersMax.toString());

        const [sortBy, sortOrder] = parseSortOption(currentSort);
        queryParams.append('sortBy', sortBy);
        queryParams.append('sortOrder', sortOrder);

        // Add pagination params <-- NEW
        queryParams.append('page', page.toString());
        queryParams.append('limit', itemsLimit.toString());

        const searchString = queryParams.toString();
        console.log("useInventoryData: Fetching URL:", `/api/inventory?${searchString}`);

        try {
            const response = await fetch(`/api/inventory?${searchString}`);
            const result: InventoryApiResponse | InventoryApiErrorResponse = await response.json();

            if (!response.ok || isInventoryApiError(result)) {
                const errorMessage = isInventoryApiError(result) ? result.error : `API Error (${response.status})`;
                const errorDetails = isInventoryApiError(result) ? result.details : await response.text().catch(() => '');
                console.error("API Error fetching inventory:", errorMessage, errorDetails);
                throw new Error(errorMessage || `API Error (${response.status})`);
            }

            // Success case: result is InventoryApiResponse
            console.log(`useInventoryData: Fetch successful. Received ${result.data.length} cars. Total count: ${result.count}`);
            setCars(result.data);
            setTotalCount(result.count ?? 0); // <-- Set total count from API response
            setError(null); // Clear previous errors on success

        } catch (err) {
            console.error('useInventoryData: Error in fetchData:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setCars([]); // Clear cars on error
            setTotalCount(0); // Reset count on error
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies needed for the function definition itself

    // Effect to trigger fetch when appliedFilters, sortOption, currentPage, or limit change <-- MODIFIED
    useEffect(() => {
        console.log("useInventoryData: Dependencies changed (filters/sort/page/limit), triggering fetch.");
        // Fetch data using the appliedFilters, current sortOption, currentPage, and limit
        fetchData(appliedFilters, sortOption, currentPage, limit);

    }, [appliedFilters, sortOption, currentPage, limit, fetchData]); // <-- Added currentPage, limit dependencies

    // Return state including totalCount <-- MODIFIED
    return { cars, loading, error, totalCount };
}