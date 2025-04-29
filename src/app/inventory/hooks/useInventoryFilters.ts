// src/app/inventory/hooks/useInventoryFilters.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { FilterState } from '../types';

// Helper function to parse sort option (can live here or be imported)
const parseSortOption = (option: string): [string, string] => {
    if (!option || !option.includes('-')) return ['created_at', 'desc']; // Default sort
    const [field, direction] = option.split('-');
    return [field, direction];
};

// Define the return type of the hook including pagination and applySpecificFilters
interface UseInventoryFiltersReturn {
    filters: FilterState; // Current UI state
    appliedFilters: FilterState; // State used for fetching data
    sortOption: string; // Current sort state
    currentPage: number; // Current pagination page
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>; // To allow external updates (e.g., AI, FilterSection)
    handleFilterChange: (name: keyof FilterState, value: string | number) => void; // Update single filter in UI state
    handleSliderChange: (nameMin: keyof FilterState, nameMax: keyof FilterState, value: number[]) => void; // Update range filters in UI state
    applyFilters: () => void; // Explicitly apply current UI filters to appliedFilters
    resetFilters: () => void; // Reset all filters and sort to defaults
    handleSortChange: (value: string) => void; // Handle sort option changes
    applySpecificFilters: (filtersToApply: FilterState) => void; // Apply a full set of filters externally
    handlePageChange: (newPage: number) => void; // Handle pagination changes
    listingType: 'sale' | 'rent' | 'both'; // Expose current UI listing type
    handleListingTypeChange: (type: 'sale' | 'rent' | 'both') => void; // Handle listing type toggle changes (applies immediately)
}

export function useInventoryFilters(
    defaultFilters: FilterState,
    itemsPerPage: number = 24 // Default items per page (used for pagination logic if needed here, though primarily in useInventoryData)
): UseInventoryFiltersReturn {

    const router = useRouter();
    const searchParams = useSearchParams();

    // --- State Initialization Helpers ---
    const getIntParam = useCallback((name: string, defaultValue?: number): number | undefined => {
        const param = searchParams?.get(name);
        if (param === null || param === undefined) return defaultValue;
        const parsed = parseInt(param, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }, [searchParams]);

    const getStringParam = useCallback((name: string, defaultValue: string): string => {
        return searchParams?.get(name) || defaultValue;
    }, [searchParams]);

    // Initialize state from URL search params or defaults
    const initializeState = useCallback((): FilterState => {
        console.log("useInventoryFilters: Initializing filter states from URL or defaults.");
        const params = searchParams;
        if (!params) return defaultFilters;

        // Get listing type from URL or use default ('both')
        const listingTypeParam = params.get('listing_type'); // Use 'listing_type' to match URL param
        const listingType = (listingTypeParam === 'sale' || listingTypeParam === 'rent')
            ? listingTypeParam
            : defaultFilters.listingType || 'both'; // Fallback to default

        return {
            make: getStringParam('make', defaultFilters.make),
            model: getStringParam('model', defaultFilters.model),
            fuelType: getStringParam('fuel_type', defaultFilters.fuelType),
            transmission: getStringParam('transmission', defaultFilters.transmission),
            condition: getStringParam('condition', defaultFilters.condition),
            bodyType: getStringParam('body_type', defaultFilters.bodyType),
            exteriorColor: getStringParam('exterior_color', defaultFilters.exteriorColor),
            interiorColor: getStringParam('interior_color', defaultFilters.interiorColor),
            priceMin: getIntParam('price_min', defaultFilters.priceMin) ?? defaultFilters.priceMin,
            priceMax: getIntParam('price_max', defaultFilters.priceMax) ?? defaultFilters.priceMax,
            yearMin: getIntParam('year_from', defaultFilters.yearMin) ?? defaultFilters.yearMin,
            yearMax: getIntParam('year_to', defaultFilters.yearMax) ?? defaultFilters.yearMax,
            mileageMin: getIntParam('mileage_min', defaultFilters.mileageMin) ?? defaultFilters.mileageMin,
            mileageMax: getIntParam('mileage_max', defaultFilters.mileageMax) ?? defaultFilters.mileageMax,
            horsepowerMin: getIntParam('hp_min'), // Allow undefined if not in URL/default
            horsepowerMax: getIntParam('hp_max'),
            displacementMin: getIntParam('disp_min'),
            displacementMax: getIntParam('disp_max'),
            cylindersMin: getIntParam('cyl_min'),
            cylindersMax: getIntParam('cyl_max'),
            listingType: listingType as 'sale' | 'rent' | 'both', // Set initialized listing type
        };
    }, [searchParams, getStringParam, getIntParam, defaultFilters]);

    // State for filters reflected in the UI inputs
    const [filters, setFilters] = useState<FilterState>(initializeState);
    // State for filters that have been explicitly applied (triggers data fetch via useInventoryData)
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(initializeState);
    // State for sorting
    const [sortOption, setSortOption] = useState<string>(() => {
        if (!searchParams) return "price-asc"; // Default sort
        return searchParams.get('sort') || "price-asc";
    });
    // State for pagination
    const [currentPage, setCurrentPage] = useState<number>(() => {
        const pageParam = searchParams?.get('page');
        const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
        return !isNaN(initialPage) && initialPage > 0 ? initialPage : 1;
    });

    // Ref to prevent initial URL update on mount before state is fully settled
    const isInitialSetupDone = useRef(false);
    useEffect(() => {
        // Only mark as done after the first render completes
        isInitialSetupDone.current = true;
    }, []);


    // --- URL Update Logic ---
    // Updates the browser URL query string based on applied filters, sort, and page
    const updateUrl = useCallback((filtersToApply: FilterState, sortToApply: string, pageToApply: number) => {
        // Prevent unnecessary URL updates during initial hydration/setup
        if (!isInitialSetupDone.current) {
            console.log("useInventoryFilters: Initial setup not done, skipping URL update.");
            return;
        }

        const queryParams = new URLSearchParams();

        // Add filter params only if they differ from defaults
        if (filtersToApply.make !== defaultFilters.make) queryParams.append('make', filtersToApply.make);
        if (filtersToApply.model && filtersToApply.model !== "Any") queryParams.append('model', filtersToApply.model); // Ensure model is not default "Any"
        if (filtersToApply.yearMin !== defaultFilters.yearMin) queryParams.append('year_from', filtersToApply.yearMin.toString());
        if (filtersToApply.yearMax !== defaultFilters.yearMax) queryParams.append('year_to', filtersToApply.yearMax.toString());
        if (filtersToApply.priceMin !== defaultFilters.priceMin) queryParams.append('price_min', filtersToApply.priceMin.toString());
        if (filtersToApply.priceMax !== defaultFilters.priceMax) queryParams.append('price_max', filtersToApply.priceMax.toString());
        if (filtersToApply.mileageMin !== defaultFilters.mileageMin) queryParams.append('mileage_min', filtersToApply.mileageMin.toString());
        if (filtersToApply.mileageMax !== defaultFilters.mileageMax) queryParams.append('mileage_max', filtersToApply.mileageMax.toString());
        if (filtersToApply.fuelType !== defaultFilters.fuelType) queryParams.append('fuel_type', filtersToApply.fuelType);
        if (filtersToApply.transmission !== defaultFilters.transmission) queryParams.append('transmission', filtersToApply.transmission);
        if (filtersToApply.condition !== defaultFilters.condition) queryParams.append('condition', filtersToApply.condition);
        if (filtersToApply.bodyType !== defaultFilters.bodyType) queryParams.append('body_type', filtersToApply.bodyType);
        if (filtersToApply.exteriorColor !== defaultFilters.exteriorColor) queryParams.append('exterior_color', filtersToApply.exteriorColor);
        if (filtersToApply.interiorColor !== defaultFilters.interiorColor) queryParams.append('interior_color', filtersToApply.interiorColor);

        // Add optional numeric filters if they have a value
        if (filtersToApply.horsepowerMin !== undefined) queryParams.append('hp_min', filtersToApply.horsepowerMin.toString());
        if (filtersToApply.horsepowerMax !== undefined) queryParams.append('hp_max', filtersToApply.horsepowerMax.toString());
        if (filtersToApply.displacementMin !== undefined) queryParams.append('disp_min', filtersToApply.displacementMin.toString());
        if (filtersToApply.displacementMax !== undefined) queryParams.append('disp_max', filtersToApply.displacementMax.toString());
        if (filtersToApply.cylindersMin !== undefined) queryParams.append('cyl_min', filtersToApply.cylindersMin.toString());
        if (filtersToApply.cylindersMax !== undefined) queryParams.append('cyl_max', filtersToApply.cylindersMax.toString());

        // ✅ Add listing type param if it's not the default ('both')
        if (filtersToApply.listingType && filtersToApply.listingType !== 'both') {
            queryParams.append('listing_type', filtersToApply.listingType);
        } else {
            // Ensure it's removed if it was previously set and now is 'both'
            queryParams.delete('listing_type');
        }

        // Add sort param if it's not the default ("price-asc")
        if (sortToApply !== "price-asc") {
            queryParams.append('sort', sortToApply);
        } else {
            queryParams.delete('sort'); // Remove if default
        }

        // Add page param only if it's not page 1
        if (pageToApply > 1) {
            queryParams.append('page', pageToApply.toString());
        } else {
            queryParams.delete('page'); // Remove if page 1
        }


        const searchString = queryParams.toString();
        const currentPath = window.location.pathname; // Use window location for current path
        const currentSearchString = searchParams?.toString() ?? ""; // Get current search params string

        // Only push history state if the search string actually changes
        if (searchString !== currentSearchString) {
            console.log("useInventoryFilters: Updating URL with params:", searchString);
            // Use replace to avoid polluting browser history unnecessarily for filter changes
            router.replace(`${currentPath}?${searchString}`, { scroll: false });
        } else {
            console.log("useInventoryFilters: URL params unchanged, skipping update.");
        }
    }, [defaultFilters, router, searchParams]); // Dependencies for URL update logic


    // --- Event Handlers ---

    // Updates only the UI state (filters) for standard input changes
    const handleFilterChange = useCallback((name: keyof FilterState, value: string | number) => {
        setFilters(prev => {
            const newState = { ...prev, [name]: value };
            // Reset model if make changes
            if (name === "make" && value !== prev.make) {
                newState.model = "Any"; // Reset model to default when make changes
            }
            return newState;
        });
    }, []); // No dependencies needed as it only uses setFilters

    // Updates only the UI state (filters) for slider changes
    const handleSliderChange = useCallback((nameMin: keyof FilterState, nameMax: keyof FilterState, value: number[]) => {
        const [numValue0, numValue1] = value; // Destructure for clarity
        setFilters(prev => {
            // Only update state if values have actually changed
            if (prev[nameMin] !== numValue0 || prev[nameMax] !== numValue1) {
                return { ...prev, [nameMin]: numValue0, [nameMax]: numValue1 };
            }
            return prev; // Return previous state if no change
        });
    }, []); // No dependencies needed

    // Applies the current UI state (filters) to the appliedFilters state, RESETS page, and updates URL
    const applyFilters = useCallback(() => {
        console.log("useInventoryFilters: Apply button clicked. Applying UI filters and resetting page.");
        // Check if filters actually changed compared to applied filters to avoid unnecessary updates
        if (JSON.stringify(filters) === JSON.stringify(appliedFilters)) {
            console.log("useInventoryFilters: Filters haven't changed, apply skipped.");
            return;
        }
        setCurrentPage(1); // Reset to page 1 when applying new filters
        setAppliedFilters(filters); // Apply the current UI filters
        updateUrl(filters, sortOption, 1); // Update URL with current filters, sort, and page 1
    }, [filters, appliedFilters, sortOption, updateUrl]); // Dependencies

    // Function to apply a specific filter set (e.g., from AI), RESETS page
    const applySpecificFilters = useCallback((filtersToApply: FilterState) => {
        console.log("useInventoryFilters: Applying specific filters and resetting page.");
        setCurrentPage(1); // Reset to page 1
        setFilters(filtersToApply); // Update UI state to match
        setAppliedFilters(filtersToApply); // Update applied state directly
        updateUrl(filtersToApply, sortOption, 1); // Update URL with new filters, current sort, page 1
    }, [sortOption, updateUrl]); // Dependencies

    // Resets both UI and applied state, RESETS page and sort, updates URL
    const resetFilters = useCallback(() => {
        console.log("useInventoryFilters: Reset button clicked.");
        // Check if already at default state to avoid unnecessary updates
        if (JSON.stringify(appliedFilters) === JSON.stringify(defaultFilters) &&
            sortOption === "price-asc" &&
            currentPage === 1) {
            console.log("useInventoryFilters: Filters already at default, reset skipped.");
            return;
        }
        setCurrentPage(1); // Reset to page 1
        setFilters(defaultFilters); // Reset UI filters
        setAppliedFilters(defaultFilters); // Reset applied filters
        setSortOption("price-asc"); // Reset sort option
        updateUrl(defaultFilters, "price-asc", 1); // Update URL to default state
    }, [appliedFilters, sortOption, currentPage, defaultFilters, updateUrl]); // Dependencies

    // Updates sort state, RESETS page, and updates URL
    const handleSortChange = useCallback((value: string) => {
        if (value === sortOption) return; // No change if sort option is the same
        console.log("useInventoryFilters: Sort changed to:", value);
        setCurrentPage(1); // Reset to page 1 when sort changes
        setSortOption(value);
        // Update URL with *currently applied* filters, the NEW sort option, and page 1
        updateUrl(appliedFilters, value, 1);
    }, [sortOption, appliedFilters, updateUrl]); // Dependencies

    // Handle page change - updates URL with new page number
    const handlePageChange = useCallback((newPage: number) => {
        if (newPage === currentPage) return; // No change if page is the same
        console.log("useInventoryFilters: Page changed to:", newPage);
        setCurrentPage(newPage);
        // Update URL with the new page number and *currently applied* filters/sort
        updateUrl(appliedFilters, sortOption, newPage);
        // Optional: Scroll to top after page change
        // window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage, appliedFilters, sortOption, updateUrl]); // Dependencies

    // ✅ MODIFIED Handler for listing type changes - Applies immediately
    const handleListingTypeChange = useCallback((type: 'sale' | 'rent' | 'both') => {
        // Check if the type actually changed compared to the *current UI state*
        if (filters.listingType === type) {
            console.log("useInventoryFilters: Listing type unchanged, skipping update.");
            return;
        }

        console.log("useInventoryFilters: Listing type changed to:", type, " Applying immediately.");

        // 1. Create the new filter state based on the incoming type
        //    Use the *current* filters state as the base, only changing listingType
        const newFilters = { ...filters, listingType: type };

        // 2. Update the UI state (important for the toggle to reflect the change)
        setFilters(newFilters);

        // 3. Update the applied state immediately to trigger data fetch
        setAppliedFilters(newFilters);

        // 4. Reset to page 1 because the filter criteria changed
        setCurrentPage(1);

        // 5. Update the URL with the new applied filters, current sort, and page 1
        updateUrl(newFilters, sortOption, 1);

    }, [filters, sortOption, updateUrl, setFilters, setAppliedFilters, setCurrentPage]); // Added dependencies


    // Return all necessary states and handlers for the consuming component
    return {
        filters,
        appliedFilters,
        sortOption,
        currentPage,
        setFilters, // Expose setFilters
        handleFilterChange,
        handleSliderChange,
        applyFilters, // Expose the original applyFilters function
        resetFilters,
        handleSortChange,
        applySpecificFilters,
        handlePageChange,
        listingType: filters.listingType, // Expose current UI listing type from filters state
        handleListingTypeChange // Expose the MODIFIED handler
    };
}