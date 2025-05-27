// src/components/home/MostSearchedCarsClient.tsx
"use client";

import { useState, useEffect } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { CarCard } from '@/app/inventory/components/CarCard';

// Car data type
interface Car {
    id: string; make: string; model: string; year: number; price: number;
    mileage: number; fuel_type: string; transmission: string; condition: string;
    body_type?: string | null; exterior_color?: string | null; interior_color?: string | null;
    status: string; images?: string[] | null; created_at: string; view_count: number;
    seller_name?: string | null; location_city?: string | null; location_country?: string | null;
    is_public?: boolean;
}

// --- Helper Functions ---
function isValidUuid(uuid: string | null): boolean {
    if (!uuid) return false;
    return uuid.trim().length > 0;
}

// isValidCar function
function isValidCar(car: Car | null | undefined): boolean {
    if (!car) return false;

    // Debug
    if (car.id) {
        console.log(`Client validating car ${car.id} with is_public:`, car.is_public);
    }

    // Check if is_public field is not set in the database schema
    // In this case, we'll accept the car as valid regardless of is_public
    if (car.is_public === undefined || car.is_public === null) {
        // We'll let these pass through only if the parent component already did filtering
        return Boolean(car.id && car.make && car.model && car.year);
    }

    // More lenient check for is_public with proper type checking
    let isPublic = false;
    if (typeof car.is_public === 'boolean') {
        isPublic = car.is_public === true;
    } else if (typeof car.is_public === 'number') {
        isPublic = car.is_public === 1;
    } else if (typeof car.is_public === 'string') {
        isPublic = car.is_public === 'true';
    }

    const isValid = Boolean(
        car.id && car.make && car.model && car.year && isPublic
    );

    return isValid;
}

type MostSearchedCarsClientProps = { cars: Car[]; };

// --- Component Function Start ---
export function MostSearchedCarsClient({ cars }: MostSearchedCarsClientProps) {
    const t = useTranslations('MostSearchedCars');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // State for managing image carousel for each car
    const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});

    // Responsive number of visible cars based on screen size
    const [visibleCars, setVisibleCars] = useState(4);

    useEffect(() => {
        // Set initial value based on window width
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setVisibleCars(1); // Mobile: 1 card
            } else if (window.innerWidth < 1024) {
                setVisibleCars(2); // Tablet: 2 cards
            } else {
                setVisibleCars(4); // Desktop: 4 cards
            }
        };

        // Set initial value
        handleResize();

        // Update on resize
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const validCars = Array.isArray(cars) ? cars.filter(isValidCar) : [];
    const safeCars = validCars;
    const maxIndex = Math.max(0, safeCars.length - visibleCars);

    // Reset current index if it's out of bounds after a resize
    useEffect(() => {
        if (currentIndex > maxIndex) {
            setCurrentIndex(maxIndex);
        }
    }, [visibleCars, maxIndex, currentIndex]);

    // Image navigation handlers
    const handleNextImage = (carId: string) => {
        const car = safeCars.find(c => c.id === carId);
        if (!car?.images || !Array.isArray(car.images) || car.images.length <= 1) return;

        setActiveImageIndex(prev => ({
            ...prev,
            [carId]: ((prev[carId] || 0) + 1) % car.images!.length
        }));
    };

    const handlePrevImage = (carId: string) => {
        const car = safeCars.find(c => c.id === carId);
        if (!car?.images || !Array.isArray(car.images) || car.images.length <= 1) return;

        setActiveImageIndex(prev => ({
            ...prev,
            [carId]: ((prev[carId] || 0) - 1 + car.images!.length) % car.images!.length
        }));
    };

    // Track interaction handler (placeholder for now)
    const handleTrackInteraction = (carId: string) => {
        // This can be expanded to track user interactions
        console.log('Car interaction tracked:', carId);
    };

    const slideLeft = () => {
        if (currentIndex > 0 && !isAnimating) {
            setIsAnimating(true);
            setCurrentIndex(prev => prev - 1);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    const slideRight = () => {
        if (currentIndex < maxIndex && !isAnimating) {
            setIsAnimating(true);
            setCurrentIndex(prev => prev + 1);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    if (safeCars.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">{t('empty')}</div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Left arrow */}
            <Button
                variant="outline"
                size="icon"
                className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow-md border-gray-200",
                    currentIndex === 0 ? "text-gray-300" : "text-gray-700 hover:bg-gray-50"
                )}
                onClick={slideLeft}
                disabled={currentIndex === 0}
            >
                <LuChevronLeft size={24} />
            </Button>

            {/* Cars container */}
            <div className="overflow-hidden mx-12">
                <div
                    className="flex transition-transform duration-300 ease-in-out h-[500px]"
                    style={{ transform: `translateX(-${currentIndex * (100 / visibleCars)}%)` }}
                >
                    {safeCars.map((car, carIndex) => {
                        if (!car?.id) {
                            console.warn("MostSearchedCarsClient: Car missing ID, skipping render:", car);
                            return null;
                        }

                        const carImageCount = car.images?.length || 0;
                        const currentImageIndex = activeImageIndex[car.id] || 0;

                        return (
                            <div
                                key={car.id}
                                style={{ width: `${100 / visibleCars}%` }}
                                className="p-3 flex-shrink-0 h-full"
                            >
                                <div className="h-full">
                                    <CarCard
                                        car={car as any}
                                        t={t}
                                        imageIndex={currentImageIndex}
                                        imageCount={carImageCount}
                                        onNextImage={handleNextImage}
                                        onPrevImage={handlePrevImage}
                                        onTrackInteraction={handleTrackInteraction}
                                        priority={carIndex < 3}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right arrow */}
            <Button
                variant="outline"
                size="icon"
                className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow-md border-gray-200",
                    currentIndex >= maxIndex ? "text-gray-300" : "text-gray-700 hover:bg-gray-50"
                )}
                onClick={slideRight}
                disabled={currentIndex >= maxIndex}
            >
                <LuChevronRight size={24} />
            </Button>
        </div>
    );
}
// --- Component Function End ---