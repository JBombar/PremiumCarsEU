'use client';

import { useEffect } from 'react';

interface TrackListingViewProps {
    carId: string;
}

export function TrackListingView({ carId }: TrackListingViewProps) {
    useEffect(() => {
        const trackView = async () => {
            try {
                // Use the listings-views endpoint to track the view
                const response = await fetch('/api/listings-views', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ car_id: carId }),
                });

                if (!response.ok) {
                    console.error('Failed to track listing view:', await response.text());
                }
            } catch (error) {
                console.error('Error tracking listing view:', error);
            }
        };

        // Track the view whenever the component mounts or carId changes
        trackView();
    }, [carId]);

    // This component doesn't render anything
    return null;
} 