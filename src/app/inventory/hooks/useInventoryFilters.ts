// src/app/inventory/hooks/useInventoryFilters.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { FilterState } from '../types';

// Helper function to parse sort option (can live here or be imported)
const parseSortOption = (option: string): [string, string] => {
    if (!option || !option.includes('-')) return ['created_at', 'desc'];
    const [field, direction] = option.split('-');
    return [field, direction];
};

// Define the return type of the hook including pagination and applySpecificFilters
interface UseInventoryFiltersReturn {
    filters: FilterState; // Current UI state
    appliedFilters: FilterState; // State used for fetching
    sortOption: string; // Current sort state
    currentPage: number; // <-- Added pagination state
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>; // To allow external updates (e.g., AI)
    handleFilterChange: (name: keyof FilterState, value: string | number) => void;
    handleSliderChange: (nameMin: keyof FilterState, nameMax: keyof FilterState, value: number[]) => void;
    applyFilters: () => void; // Explicitly apply current UI filters
    resetFilters: () => void;
    handleSortChange: (value: string) => void;
    applySpecificFilters: (filtersToApply: FilterState) => void;
    handlePageChange: (newPage: number) => void; // <-- Added pagination handler
}

export function useInventoryFilters(
    defaultFilters: FilterState,
    itemsPerPage: number = 24 // Default items per page if not provided
): UseInventoryFiltersReturn { // <-- Ensure return type matches interface

    const router = useRouter();
    const searchParams = useSearchParams();

    // --- State Initialization ---
    // Restore initialization helpers
    const getIntParam = useCallback((name: string, defaultValue?: number): number | undefined => {
        const param = searchParams?.get(name);
        if (param === null || param === undefined) return defaultValue;
        const parsed = parseInt(param, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }, [searchParams]);

    const getStringParam = useCallback((name: string, defaultValue: string): string => {
        return searchParams?.get(name) || defaultValue;
    }, [searchParams]);

    // Restore full initializeState function
    const initializeState = useCallback((): FilterState => {
        console.log("useInventoryFilters: Initializing filter states from URL or defaults.");
        const params = searchParams;
        if (!params) return defaultFilters;
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
            horsepowerMin: getIntParam('hp_min'),
            horsepowerMax: getIntParam('hp_max'),
            displacementMin: getIntParam('disp_min'),
            displacementMax: getIntParam('disp_max'),
            cylindersMin: getIntParam('cyl_min'),
            cylindersMax: getIntParam('cyl_max'),
        };
    }, [searchParams, getStringParam, getIntParam, defaultFilters]);

    // State for filters reflected in the UI inputs
    const [filters, setFilters] = useState<FilterState>(initializeState);
    // State for filters that have been explicitly applied (triggers data fetch)
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(initializeState);
    // State for sorting
    const [sortOption, setSortOption] = useState<string>(() => {
        if (!searchParams) return "price-asc";
        return searchParams.get('sort') || "price-asc";
    });
    // State for pagination <-- ADDED
    const [currentPage, setCurrentPage] = useState<number>(() => {
        const pageParam = searchParams?.get('page');
        const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
        return !isNaN(initialPage) && initialPage > 0 ? initialPage : 1;
    });


    // Ref to track if initial state setting is done
    const isInitialSetupDone = useRef(false);
    useEffect(() => {
        isInitialSetupDone.current = true;
    }, []);


    // --- URL Update Logic (Includes Page) ---
    const updateUrl = useCallback((filtersToApply: FilterState, sortToApply: string, pageToApply: number) => { // <-- Added pageToApply
        if (!isInitialSetupDone.current) {
            console.log("useInventoryFilters: Initial setup not done, skipping URL update.");
            return;
        }

        const queryParams = new URLSearchParams();
        // Build filter query params (unchanged logic, simplified model check)
        if (filtersToApply.make !== defaultFilters.make) queryParams.append('make', filtersToApply.make);
        if (filtersToApply.model && filtersToApply.model !== "Any") queryParams.append('model', filtersToApply.model);
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
        if (filtersToApply.horsepowerMin !== undefined) queryParams.append('hp_min', filtersToApply.horsepowerMin.toString());
        if (filtersToApply.horsepowerMax !== undefined) queryParams.append('hp_max', filtersToApply.horsepowerMax.toString());
        if (filtersToApply.displacementMin !== undefined) queryParams.append('disp_min', filtersToApply.displacementMin.toString());
        if (filtersToApply.displacementMax !== undefined) queryParams.append('disp_max', filtersToApply.displacementMax.toString());
        if (filtersToApply.cylindersMin !== undefined) queryParams.append('cyl_min', filtersToApply.cylindersMin.toString());
        if (filtersToApply.cylindersMax !== undefined) queryParams.append('cyl_max', filtersToApply.cylindersMax.toString());

        // Add sort param
        if (sortToApply !== "price-asc") queryParams.append('sort', sortToApply);
        // Add page param if not page 1 <-- ADDED
        if (pageToApply > 1) {
            queryParams.append('page', pageToApply.toString());
        }

        const searchString = queryParams.toString();
        const currentSearchString = searchParams?.toString() ?? "";

        if (searchString !== currentSearchString) {
            console.log("useInventoryFilters: Updating URL with params:", searchString);
            router.replace(`/inventory?${searchString}`, { scroll: false });
        } else {
            console.log("useInventoryFilters: URL params unchanged, skipping update.");
        }
    }, [defaultFilters, router, searchParams]); // Added searchParams


    // --- Event Handlers ---

    // Updates only the UI state (filters)
    const handleFilterChange = useCallback((name: keyof FilterState, value: string | number) => {
        setFilters(prev => {
            const newState = { ...prev, [name]: value };
            if (name === "make" && value !== prev.make) {
                newState.model = "Any";
            }
            return newState;
        });
    }, []);

    // Updates only the UI state (filters)
    const handleSliderChange = useCallback((nameMin: keyof FilterState, nameMax: keyof FilterState, value: number[]) => {
        const numValue0 = value[0]; const numValue1 = value[1];
        setFilters(prev => {
            if (prev[nameMin] !== numValue0 || prev[nameMax] !== numValue1) {
                return { ...prev, [nameMin]: numValue0, [nameMax]: numValue1 };
            } return prev;
        });
    }, []);

    // Applies the current UI state (filters) to the appliedFilters state, RESETS page, and updates URL
    const applyFilters = useCallback(() => {
        console.log("useInventoryFilters: Apply button clicked. Applying UI filters and resetting page.");
        setCurrentPage(1); // <-- Reset to page 1
        setAppliedFilters(filters);
        updateUrl(filters, sortOption, 1); // <-- Pass page 1
    }, [filters, sortOption, updateUrl]);

    // Function to apply a specific filter set (e.g., from AI), RESETS page
    const applySpecificFilters = useCallback((filtersToApply: FilterState) => {
        console.log("useInventoryFilters: Applying specific filters and resetting page.");
        setCurrentPage(1); // <-- Reset to page 1
        setFilters(filtersToApply); // Update UI state to match
        setAppliedFilters(filtersToApply); // Update applied state directly
        updateUrl(filtersToApply, sortOption, 1); // <-- Pass page 1
    }, [sortOption, updateUrl]);

    // Resets both UI and applied state, RESETS page, updates URL
    const resetFilters = useCallback(() => {
        console.log("useInventoryFilters: Reset button clicked.");
        // Check against applied filters as well
        if (JSON.stringify(appliedFilters) === JSON.stringify(defaultFilters) && sortOption === "price-asc" && currentPage === 1) { // <-- Check page too
            console.log("useInventoryFilters: Filters already at default, reset skipped.");
            return;
        }
        setCurrentPage(1); // <-- Reset to page 1
        setFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
        setSortOption("price-asc");
        updateUrl(defaultFilters, "price-asc", 1); // <-- Pass page 1
    }, [appliedFilters, sortOption, currentPage, defaultFilters, updateUrl]); // Added currentPage

    // Updates sort state, RESETS page, and updates URL
    const handleSortChange = useCallback((value: string) => {
        if (value === sortOption) return;
        console.log("useInventoryFilters: Sort changed to:", value);
        setCurrentPage(1); // <-- Reset to page 1
        setSortOption(value);
        // IMPORTANT: Update URL with NEW sort and CURRENT applied filters, but page 1
        updateUrl(appliedFilters, value, 1); // <-- Pass page 1
    }, [sortOption, appliedFilters, updateUrl]);

    // Handle page change <-- ADDED
    const handlePageChange = useCallback((newPage: number) => {
        if (newPage === currentPage) return;
        console.log("useInventoryFilters: Page changed to:", newPage);
        setCurrentPage(newPage);
        // Update URL with the new page number and *currently applied* filters/sort
        updateUrl(appliedFilters, sortOption, newPage);
        // Optional: Scroll to top
        // window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage, appliedFilters, sortOption, updateUrl]);


    // Return all necessary states and handlers
    return {
        filters,
        appliedFilters,
        sortOption,
        currentPage, // <-- Return currentPage
        setFilters,
        handleFilterChange,
        handleSliderChange,
        applyFilters,
        resetFilters,
        handleSortChange,
        applySpecificFilters,
        handlePageChange // <-- Return handlePageChange
    };
}