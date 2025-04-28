// src/app/inventory/components/InventoryGrid.tsx
'use client';

import { CarCard } from './CarCard';
import { RequestCarForm } from "@/components/home/RequestCarForm"; // Assuming path is correct relative to root
import type { CarListing, FilterState } from '../types'; // Import necessary types
import { AlertCircle } from 'lucide-react'; // Keep if used in "No Results"

// Define the props the InventoryGrid component expects
interface InventoryGridProps {
    cars: CarListing[];
    loading: boolean; // Combined loading state (initial and refetch)
    error: string | null; // Pass error state if needed for inline display (optional)
    filters: FilterState; // Pass current filters for tracking clicks inside CarCard handler
    activeImageIndex: { [key: string]: number };
    onNextImage: (carId: string) => void;
    onPrevImage: (carId: string) => void;
    onTrackInteraction: (appliedFilters: FilterState, clickedListingId: string | null) => void;
    t: (key: string, values?: Record<string, any>) => string; // Translation function
}

export function InventoryGrid({
    cars,
    loading,
    error, // Currently unused in this structure, but available
    filters,
    activeImageIndex,
    onNextImage,
    onPrevImage,
    onTrackInteraction,
    t,
}: InventoryGridProps) {

    // --- Render Logic ---

    // Initial Loading State (handled by parent, but could show skeleton here too)
    // if (loading && cars.length === 0) {
    //   return (
    //     <div className="relative min-h-[400px] w-full flex justify-center items-center py-16">
    //       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    //     </div>
    //   );
    // }

    // No Results State
    if (!loading && cars.length === 0) {
        return (
            <div className="relative min-h-[400px] w-full p-8">
                <div className="bg-muted/50 rounded-lg p-8 max-w-2xl mx-auto text-center"> {/* Centered text */}
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-75" /> {/* Icon example */}
                    <h3 className="text-xl font-semibold mb-2">{t('results.notFoundTitle')}</h3>
                    <p className="text-muted-foreground mb-6">{t('results.notFoundSubtitle')}</p>
                    <div className="border-t pt-6">
                        <RequestCarForm />
                    </div>
                </div>
            </div>
        );
    }

    // Grid View State
    return (
        <div className="relative min-h-[400px]">
            {/* Car Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {cars.map((car, carIndex) => {
                    // ID check is now inside CarCard, but we still need car.id for keys and state access
                    if (!car || !car.id) {
                        console.warn("InventoryGrid: Car missing ID in map, skipping render:", car);
                        return null;
                    }

                    const carImageCount = car.images?.length || 0;
                    const currentImageIndex = activeImageIndex[car.id] || 0;

                    // Define the specific tracking callback for this card
                    // This now uses the onTrackInteraction prop passed down
                    const handleTrackInteraction = (carId: string) => {
                        onTrackInteraction(filters, carId); // Pass filters state along with ID
                    };

                    return (
                        <CarCard
                            key={car.id} // React key for list rendering
                            car={car}
                            t={t} // Pass the translation function
                            imageIndex={currentImageIndex}
                            imageCount={carImageCount}
                            onNextImage={onNextImage} // Pass the handler from props
                            onPrevImage={onPrevImage} // Pass the handler from props
                            onTrackInteraction={handleTrackInteraction} // Pass the specific handler
                            priority={carIndex < 3} // Calculate priority based on index
                        />
                    );
                })}
            </div>

            {/* Inline loading indicator when refetching */}
            {loading && cars.length > 0 && (
                <div className="absolute inset-0 bg-background/50 flex justify-center items-center z-20 rounded-lg"> {/* Added rounding */}
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            )}
        </div>
    );
}