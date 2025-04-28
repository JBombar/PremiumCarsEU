// src/app/inventory/hooks/useTracking.ts
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { FilterState, CarMake, CarModel, SearchTrackingPayload, SearchTrackingApiResponse, SearchTrackingApiErrorResponse } from '../types';
import { isSearchTrackingApiError } from '../types'; // Import type guard

interface UseTrackingProps {
    // Pass makes and availableModels so the hook can find IDs
    makes: CarMake[];
    availableModels: CarModel[];
}

interface UseTrackingReturn {
    trackSearchInteraction: (appliedFilters: FilterState, clickedListingId?: string | null) => Promise<void>;
}

export function useTracking({ makes, availableModels }: UseTrackingProps): UseTrackingReturn {

    // Function to get or create session ID
    const getSessionId = (): string => {
        let sessionId = localStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = uuidv4();
            localStorage.setItem('session_id', sessionId);
            console.log("useTracking: Generated new session ID:", sessionId);
        }
        return sessionId;
    };

    const trackSearchInteraction = useCallback(async (appliedFilters: FilterState, clickedListingId: string | null = null) => {
        const sessionId = getSessionId();

        // Extract make_id and model_id based on names in filters state
        let makeId: string | null = null;
        if (appliedFilters.make && appliedFilters.make !== "Any") {
            const selectedMake = makes.find(make => make.name === appliedFilters.make);
            makeId = selectedMake?.id ?? null;
        }

        let modelId: string | null = null;
        // Important: Use availableModels which should be relevant to the selected make
        if (appliedFilters.model && appliedFilters.model !== "Any" && makeId) {
            const selectedModel = availableModels.find(model => model.name === appliedFilters.model && model.make_id === makeId);
            modelId = selectedModel?.id ?? null;
        }

        // Prepare payload matching API expectation (and types.ts)
        const payload: SearchTrackingPayload = {
            session_id: sessionId,
            make_id: makeId,
            model_id: modelId,
            filters: appliedFilters, // Send the structured FilterState object
            clicked_listing_id: clickedListingId ?? null, // Ensure null if undefined
        };

        console.log("useTracking: Tracking search interaction:", payload);

        try {
            const response = await fetch('/api/track/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // Optional: Check response and handle potential errors from tracking API
            if (!response.ok) {
                const errorData: SearchTrackingApiErrorResponse = await response.json().catch(() => ({ error: "Failed to parse tracking error response" }));
                console.warn('useTracking: Failed to track search interaction:', response.status, errorData?.error, errorData?.details);
            } else {
                const successData: SearchTrackingApiResponse = await response.json(); // Assuming success returns { success: true }
                if (successData.success) {
                    console.log("useTracking: Search interaction tracked successfully.");
                } else {
                    console.warn('useTracking: Tracking API reported success false.');
                }
            }
        } catch (trackingError) {
            // Catch network errors etc.
            console.warn('useTracking: Error sending search tracking data:', trackingError);
        }
        // Note: Tracking errors are typically warnings, we don't want to block user flow.
    }, [makes, availableModels]); // Depends on makes/models lists to find IDs

    return {
        trackSearchInteraction,
    };
}