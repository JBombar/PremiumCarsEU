// src/app/inventory/hooks/useAiSearch.ts
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/components/ui/use-toast"; // Assuming toast is accessible globally or adjust path
import type { FilterState, ParsedAiFilters, AiIntentApiResponse, AiIntentApiErrorResponse } from '../types';
import { isAiIntentApiError } from '../types'; // Import type guard

interface UseAiSearchProps {
    // Callback to apply the filters returned by the AI
    applySpecificFilters: (filtersToApply: FilterState) => void;
    // Callback to track the AI search interaction
    trackSearchInteraction: (appliedFilters: FilterState, clickedListingId?: string | null) => void;
    // Function to get current filters (needed for merging AI results)
    getCurrentFilters: () => FilterState;
    // Function to get current sort option (needed for tracking/applying)
    getCurrentSortOption: () => string;
    // Translation function
    t: (key: string, values?: Record<string, any>) => string;
}

interface UseAiSearchReturn {
    aiSearchInput: string;
    setAiSearchInput: React.Dispatch<React.SetStateAction<string>>;
    aiSearchLoading: boolean;
    searchError: string | null;
    submitAiSearch: (e: React.FormEvent) => Promise<void>;
}

export function useAiSearch({
    applySpecificFilters,
    trackSearchInteraction,
    getCurrentFilters,
    getCurrentSortOption,
    t
}: UseAiSearchProps): UseAiSearchReturn {
    const [aiSearchInput, setAiSearchInput] = useState("");
    const [aiSearchLoading, setAiSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const submitAiSearch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = aiSearchInput.trim();
        if (!trimmedInput) return;

        setAiSearchLoading(true);
        setSearchError(null);
        console.log("useAiSearch: Submitting AI search for:", trimmedInput);

        try {
            // Session ID logic could also live in useTracking hook if created
            let sessionId = localStorage.getItem('session_id');
            if (!sessionId) { sessionId = uuidv4(); localStorage.setItem('session_id', sessionId); }

            const response = await fetch('/api/ai-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userInput: trimmedInput }),
            });

            const result: AiIntentApiResponse | AiIntentApiErrorResponse = await response.json();

            if (!response.ok || isAiIntentApiError(result)) {
                const message = result?.error || (result as any)?.n8n_details || t('aiSearch.errorPrefix');
                if (message?.toLowerCase().includes('could not understand')) throw new Error(t('aiSearch.errorCouldNotUnderstand'));
                throw new Error(message);
            }

            // Success case (result is AiIntentApiResponse)
            const parsed_filters = result.parsed_filters;

            if (!parsed_filters || Object.keys(parsed_filters).length === 0) {
                console.log("useAiSearch: AI search successful but no filters parsed.");
                toast({ title: t('aiSearch.toastTitle'), description: t('aiSearch.toastDescNoFilters'), variant: "default" });
                // Don't apply filters if none were parsed
            } else {
                console.log('useAiSearch: Parsed filters received:', parsed_filters);

                // Get current filters state from the parent page/hook
                const currentFilters = getCurrentFilters();
                const newFiltersFromAI = { ...currentFilters };

                // --- Map parsed filters to FilterState ---
                newFiltersFromAI.make = parsed_filters.make ?? newFiltersFromAI.make;
                if (parsed_filters.make) newFiltersFromAI.model = parsed_filters.model ?? 'Any';
                else newFiltersFromAI.model = parsed_filters.model ?? newFiltersFromAI.model;
                newFiltersFromAI.bodyType = parsed_filters.body_type ?? newFiltersFromAI.bodyType;
                newFiltersFromAI.yearMin = parsed_filters.year?.gte ?? newFiltersFromAI.yearMin;
                newFiltersFromAI.yearMax = parsed_filters.year?.lte ?? newFiltersFromAI.yearMax;
                newFiltersFromAI.priceMin = parsed_filters.price?.gte ?? newFiltersFromAI.priceMin;
                newFiltersFromAI.priceMax = parsed_filters.price?.lte ?? newFiltersFromAI.priceMax;
                newFiltersFromAI.mileageMin = parsed_filters.mileage?.gte ?? newFiltersFromAI.mileageMin;
                newFiltersFromAI.mileageMax = parsed_filters.mileage?.lte ?? newFiltersFromAI.mileageMax;
                newFiltersFromAI.fuelType = parsed_filters.fuel_type ?? newFiltersFromAI.fuelType;
                newFiltersFromAI.transmission = parsed_filters.transmission ?? newFiltersFromAI.transmission;
                newFiltersFromAI.condition = parsed_filters.condition ?? newFiltersFromAI.condition;
                newFiltersFromAI.exteriorColor = parsed_filters.exterior_color ?? newFiltersFromAI.exteriorColor;
                newFiltersFromAI.interiorColor = parsed_filters.interior_color ?? newFiltersFromAI.interiorColor;
                if (parsed_filters.make && parsed_filters.make !== currentFilters.make && !parsed_filters.model) newFiltersFromAI.model = 'Any';
                // --- End Mapping ---

                console.log('useAiSearch: Applying specific filters from AI results.');
                applySpecificFilters(newFiltersFromAI); // Call the callback from useInventoryFilters

                toast({ title: t('aiSearch.toastTitle'), description: t('aiSearch.toastDescSuccess'), variant: "default" });
                trackSearchInteraction(newFiltersFromAI); // Track AI search interaction
            }

        } catch (error) {
            console.error('useAiSearch: AI search error:', error);
            const errorMessage = error instanceof Error ? error.message : t('aiSearch.errorPrefix');
            const knownErrors = [t('aiSearch.errorCouldNotUnderstand'), t('aiSearch.errorPrefix')];
            const displayError = knownErrors.includes(errorMessage) ? errorMessage : `${t('aiSearch.errorPrefix')}: ${errorMessage}`;
            setSearchError(displayError);
        } finally {
            setAiSearchLoading(false);
        }
    }, [aiSearchInput, applySpecificFilters, getCurrentFilters, t, trackSearchInteraction]); // Add dependencies

    return {
        aiSearchInput,
        setAiSearchInput,
        aiSearchLoading,
        searchError,
        submitAiSearch,
    };
}