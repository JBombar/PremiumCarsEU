"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LuChevronLeft, LuChevronRight, LuFuel, LuGauge } from 'react-icons/lu';
import { PiGearFineBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Car data type
interface Car {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    fuel_type: string;
    transmission: string;
    condition: string;
    body_type?: string | null;
    exterior_color?: string | null;
    interior_color?: string | null;
    status: string;
    images?: string[] | null;
    created_at: string;
    view_count: number;
    seller_name?: string | null;
    location_city?: string | null;
    location_country?: string | null;
}

// Helper function to get hex color from color name
function getColorHex(colorName: string | null): string {
    if (!colorName) return '#CCCCCC';

    const colorMap: Record<string, string> = {
        black: '#000000',
        white: '#FFFFFF',
        silver: '#C0C0C0',
        gray: '#808080',
        red: '#FF0000',
        blue: '#0000FF',
        green: '#008000',
        yellow: '#FFFF00',
        orange: '#FFA500',
        brown: '#A52A2A',
        purple: '#800080',
    };

    const lowerCaseColor = colorName.toLowerCase();
    for (const [key, value] of Object.entries(colorMap)) {
        if (lowerCaseColor.includes(key)) return value;
    }

    return '#CCCCCC'; // Default gray if no match
}

// Helper function to validate UUIDs
function isValidUuid(uuid: string | null): boolean {
    if (!uuid) return false;
    // A more relaxed check - just ensure it's a non-empty string
    return uuid.trim().length > 0;

    // Or keep the original regex but add logging
    // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    // const isValid = uuidRegex.test(uuid);
    // if (!isValid) {
    //   console.log(`Invalid UUID format: ${uuid}`);
    // }
    // return isValid;
}

// Helper function to format fuel type
function formatFuelType(fuelType: string | null): string {
    if (!fuelType) return 'Unknown';

    const type = fuelType.toLowerCase();
    if (type === 'electric') return 'Electric';
    if (type === 'hybrid' || type === 'phev') return 'Hybrid';
    if (type === 'diesel') return 'Diesel';
    return 'Gasoline'; // Default
}

// Helper function to format transmission
function formatTransmission(transmission: string | null): string {
    if (!transmission) return 'Unknown';

    const type = transmission.toLowerCase();
    if (type === 'manual') return 'Manual';
    if (type === 'cvt') return 'CVT';
    if (type === 'dct') return 'DCT';
    return 'Automatic'; // Default
}

// Car Card Component - improved with better null handling
const CarCard = ({ car }: { car: Car }) => {
    if (!car) {
        // Prevent rendering if car data is missing
        return null;
    }

    // Ensure each car has a valid UUID for navigation
    const carId = car.id && isValidUuid(car.id)
        ? car.id
        : "00000000-0000-4000-a000-000000000000"; // Fallback UUID for testing

    // Get first image or use placeholder - safer check
    const imageUrl = car.images && Array.isArray(car.images) && car.images.length > 0
        ? car.images[0]
        : "/images/car-placeholder.jpg";

    // Format mileage - using static approach to avoid hydration mismatch
    const mileageStr = typeof car.mileage === 'number'
        ? Math.floor(car.mileage).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        : "0";

    // Format price - using static approach to avoid hydration mismatch
    const priceStr = typeof car.price === 'number'
        ? `$${Math.floor(car.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
        : "$0";

    // Determine if the car is new based on condition field - safer check
    const isNew = car.condition && car.condition.toLowerCase() === 'new';

    // Format fuel type and transmission for display
    const fuelType = formatFuelType(car.fuel_type);
    const transmission = formatTransmission(car.transmission);

    // Check if car is available - safer check
    const isAvailable = car.status && car.status.toLowerCase() === 'available';

    // Safe concatenation for car title
    const carTitle = `${car.year || ''} ${car.make || ''} ${car.model || ''}`.trim();

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
            {/* Car image */}
            <div className="relative h-48 w-full">
                <Image
                    src={imageUrl}
                    alt={carTitle || 'Car listing'}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority={false}
                />
                {/* Status badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {isNew && <Badge variant="default">New</Badge>}
                    {!isAvailable && <Badge variant="destructive">Sold</Badge>}
                </div>

                {/* Price badge */}
                <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1 font-semibold bg-white/90">
                        {priceStr}
                    </Badge>
                </div>
            </div>

            {/* Car details */}
            <div className="p-4 flex-grow flex flex-col">
                <div className="flex-grow">
                    <h3 className="font-bold text-lg">
                        {carTitle}
                    </h3>

                    {/* Location if available - safer check */}
                    {(car.location_city || car.location_country) && (
                        <p className="text-sm text-gray-500 mb-2">
                            {[car.location_city, car.location_country].filter(Boolean).join(', ')}
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="flex items-center">
                            <LuGauge className="text-gray-400 mr-2" size={16} />
                            <span className="text-sm text-gray-600">{mileageStr} mi</span>
                        </div>

                        <div className="flex items-center">
                            <LuFuel className="text-gray-400 mr-2" size={16} />
                            <span className="text-sm text-gray-600">{fuelType}</span>
                        </div>

                        <div className="flex items-center">
                            <PiGearFineBold className="text-gray-400 mr-2" size={16} />
                            <span className="text-sm text-gray-600">{transmission}</span>
                        </div>

                        {car.exterior_color && (
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-2" style={{
                                    backgroundColor: getColorHex(car.exterior_color),
                                    border: '1px solid #e1e1e1'
                                }}></div>
                                <span className="text-sm text-gray-600">{car.exterior_color}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Link to car details page - fixed href format */}
                <Link
                    href={`/inventory/${carId}`}
                    className="mt-4 inline-block w-full bg-primary text-white px-4 py-2 rounded text-center hover:bg-primary/90 transition"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
};

type MostSearchedCarsClientProps = {
    cars: Car[];
};

// Helper function to validate car data (more comprehensive checks)
function isValidCar(car: Car | null | undefined): boolean {
    if (!car) return false;

    // Log any rejected cars for debugging
    const isValid = Boolean(car.id && car.make && car.model && car.year);
    if (!isValid) {
        console.log('Client rejected car:',
            { id: car?.id, make: car?.make, model: car?.model, year: car?.year, status: car?.status });
    }

    return isValid;
}

export function MostSearchedCarsClient({ cars }: MostSearchedCarsClientProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Log cars received from server component
    console.log('Cars received by client:',
        cars?.map(car => ({ id: car.id, make: car.make, model: car.model, status: car.status })) || []);

    // Filter out any invalid cars first - but with simpler validation
    const validCars = Array.isArray(cars) ? cars.filter(isValidCar) : [];

    // Log after client filtering
    console.log(`After client filtering: ${validCars.length} valid cars remaining`);

    const safeCars = validCars; // Use the filtered array

    const visibleCars = 4; // Number of cars visible at once on desktop
    const maxIndex = Math.max(0, safeCars.length - visibleCars);

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

    // No cars found
    if (safeCars.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">No popular vehicles found at the moment.</div>
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
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 25}%)` }}
                >
                    {safeCars.map((car) => (
                        <div key={car.id || Math.random().toString()} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-3 flex-shrink-0">
                            <CarCard car={car} />
                        </div>
                    ))}
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