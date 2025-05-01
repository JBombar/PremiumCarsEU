// src/inventory/components/CarCard.tsx
'use client';

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ArrowRight, ChevronLeft, ChevronRight, Fuel, Gauge, Tag, Calendar, AlertCircle } from "lucide-react";
import type { CarListing } from '../types'; // Assuming you'll create a types file or adjust path
import { useCurrency } from '@/contexts/CurrencyContext';

// Define the props the CarCard component expects
interface CarCardProps {
    car: CarListing;
    t: (key: string, values?: Record<string, any>) => string; // Function type from useTranslations
    imageIndex: number; // The actual index of the image to display
    imageCount: number;
    onNextImage: (carId: string) => void;
    onPrevImage: (carId: string) => void;
    onTrackInteraction: (carId: string) => void; // Parent handles adding filters if needed
    priority: boolean; // For image loading priority
}

export function CarCard({
    car,
    t,
    imageIndex,
    imageCount,
    onNextImage,
    onPrevImage,
    onTrackInteraction,
    priority,
}: CarCardProps) {
    // Get currency context
    const { selectedCurrency, formatPrice } = useCurrency();

    // Helper function for accessing the dynamic price field
    const getCarPrice = () => {
        const dynamicPriceKey = `price_${selectedCurrency.toLowerCase()}` as keyof CarListing;

        // Try to get price in selected currency, fallback to base price if not available
        const price = car[dynamicPriceKey] !== undefined && car[dynamicPriceKey] !== null
            ? car[dynamicPriceKey] as number
            : car.price;

        return price;
    };

    // Helper function for mileage formatting (using passed t)
    const formatMileage = (mileage: number | null | undefined): string => {
        if (mileage == null) return t('card.mileageNA');
        return `${new Intl.NumberFormat('de-CH').format(mileage)} ${t('card.unitMiles')}`;
    };

    // Skip rendering if the car doesn't have an ID (handled here instead of parent map)
    if (!car.id) {
        console.warn("CarCard received car missing ID, skipping render:", car);
        return null;
    }

    const altText = car.make && car.model ? t('card.imageAlt', { make: car.make, model: car.model, index: imageIndex + 1 }) : t('card.imageAltFallback');

    return (
        <Card
            key={car.id} // Key is still useful here for React's list rendering
            className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] focus-within:scale-[1.02] focus-within:shadow-xl flex flex-col" // Added flex flex-col
        >
            {/* Image Carousel */}
            <div className="aspect-video relative overflow-hidden bg-muted">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/0 z-10" />

                {/* Carousel Images */}
                <div className="relative w-full h-full">
                    {car.images && car.images.length > 0 ? (
                        // Display the active image based on imageIndex
                        <Image
                            src={car.images[imageIndex]}
                            alt={altText}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-opacity duration-500 opacity-100" // Simplified opacity
                            priority={priority}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/car-placeholder.jpg';
                                (e.target as HTMLImageElement).srcset = '';
                            }}
                        />
                    ) : (
                        // Fallback for no images
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                                <p className="text-sm text-muted-foreground mt-2">{t('card.noImage')}</p>
                            </div>
                        </div>
                    )}

                    {/* Only show carousel controls if there are multiple images */}
                    {imageCount > 1 && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onPrevImage(car.id); // Use prop callback
                                    e.currentTarget.blur();
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white transition-colors bg-black/20 rounded-full p-1"
                                aria-label={t('card.prevImageLabel')}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onNextImage(car.id); // Use prop callback
                                    e.currentTarget.blur();
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white transition-colors bg-black/20 rounded-full p-1"
                                aria-label={t('card.nextImageLabel')}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content below image */}
            <div className="flex flex-col flex-grow"> {/* Added flex-grow */}
                <CardHeader className="pb-2">
                    <div className="flex items-start">
                        <h3 className="font-bold text-lg">
                            {car.year ? `${car.year} ` : ''}{car.make} {car.model}
                        </h3>
                    </div>
                </CardHeader>

                <CardContent className="pb-4 flex-grow"> {/* Added flex-grow */}
                    <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Fuel className="h-4 w-4" />
                            <span>{car.fuel_type || t('card.fuelNA')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Gauge className="h-4 w-4" />
                            <span>{formatMileage(car.mileage)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            <span>{car.transmission || t('card.transmissionNA')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{car.year || t('card.yearNA')}</span>
                        </div>
                    </div>

                    {(car.location_city || car.location_country) && (
                        <div className="mt-3 text-sm text-muted-foreground">
                            <div className="flex items-start gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>
                                    {car.location_city && car.location_country
                                        ? `${car.location_city}, ${car.location_country}`
                                        : car.location_city || car.location_country}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Price display - relocated to bottom of content area with subtle gradient */}
                    <div className="mt-4">
                        <div className="inline-block font-semibold text-lg bg-gradient-to-r from-gray-50/80 to-gray-100/60 text-primary px-4 py-1.5 rounded-md border border-gray-200/50">
                            {formatPrice(getCarPrice())}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-4 mt-auto"> {/* Added mt-auto */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            toast({
                                title: t('toastMessages.compareAddedTitle'),
                                description: t('toastMessages.compareAddedDesc', { make: car.make, model: car.model }),
                            });
                        }}
                    >
                        {t('card.addToCompareButton')}
                    </Button>
                    <Link
                        href={`/inventory/${car.id}`} // Assumes car.id is valid due to check at start
                        onClick={(e) => {
                            // Call the tracking callback passed from the parent
                            try {
                                onTrackInteraction(car.id);
                            } catch (error) {
                                console.error("Error during trackSearchInteraction callback:", error);
                                // Do NOT prevent navigation - let the link proceed even if tracking fails
                            }
                        }}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        {t('card.viewDetailsButton')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </CardFooter>
            </div>
        </Card>
    );
}

