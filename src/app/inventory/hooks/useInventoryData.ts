// src/app/inventory/hooks/useInventoryData.ts
import { useState, useEffect, useCallback } from 'react';
import type { CarListing, FilterState, InventoryApiResponse, InventoryApiErrorResponse } from '../types';
import { isInventoryApiError } from '../types';

// Helper function to parse sort option
const parseSortOption = (option: string): [string, string] => { /* ... unchanged ... */ if (!option || !option.includes('-')) return ['created_at', 'desc']; const [field, direction] = option.split('-'); return [field, direction]; };

interface UseInventoryDataReturn {
    cars: CarListing[];
    loading: boolean;
    error: string | null;
}

// Default filters for query building comparison
const defaultFiltersData: FilterState = { /* ... unchanged ... */ make: "Any", model: "Any", yearMin: 2010, yearMax: new Date().getFullYear(), priceMin: 0, priceMax: 150000, mileageMin: 0, mileageMax: 100000, fuelType: "Any", transmission: "Any", condition: "Any", bodyType: "Any", exteriorColor: "Any", interiorColor: "Any", };

export function useInventoryData(
    // Depend on the filters that were *explicitly applied*
    appliedFilters: FilterState,
    sortOption: string
    // REMOVED initialFetchTriggered flag
): UseInventoryDataReturn {
    const [cars, setCars] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true); // Start loading initially
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (currentFilters: FilterState, currentSort: string) => {
        console.log("useInventoryData: Fetching data with filters:", currentFilters, "and sort:", currentSort);
        setLoading(true);
        setError(null);
        const queryParams = new URLSearchParams();
        // Build query params (logic remains the same)
        queryParams.append('is_public', 'true');
        if (currentFilters.make !== defaultFiltersData.make) queryParams.append('make', currentFilters.make);
        if (currentFilters.model && currentFilters.model !== defaultFiltersData.model && currentFilters.model !== "Any") queryParams.append('model', currentFilters.model);
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
        const searchString = queryParams.toString();

        try {
            const response = await fetch(`/api/inventory?${searchString}`);
            const result: InventoryApiResponse | InventoryApiErrorResponse = await response.json();
            if (!response.ok || isInventoryApiError(result)) {
                const errorMessage = isInventoryApiError(result) ? result.error : `API Error (${response.status})`;
                const errorDetails = isInventoryApiError(result) ? result.details : await response.text().catch(() => '');
                console.error("API Error fetching inventory:", errorMessage, errorDetails);
                throw new Error(errorMessage || `API Error (${response.status})`);
            }
            console.log("useInventoryData: Fetch successful.");
            setCars(result.data);
            setError(null);
        } catch (err) {
            console.error('useInventoryData: Error in fetchData:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            setCars([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect to trigger fetch when appliedFilters or sortOption change
    useEffect(() => {
        console.log("useInventoryData: Applied filters or sort changed, triggering fetch.");
        // Fetch data using the appliedFilters and current sortOption
        fetchData(appliedFilters, sortOption);
        // Depend on the appliedFilters and sortOption props
    }, [appliedFilters, sortOption, fetchData]);

    return { cars, loading, error };
}