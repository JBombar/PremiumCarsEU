// src/components/home/MostSearchedCarsClient.tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LuChevronLeft, LuChevronRight, LuFuel, LuGauge } from 'react-icons/lu';
import { PiGearFineBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

// Car data type
interface Car { /* ... same interface definition ... */
    id: string; make: string; model: string; year: number; price: number;
    mileage: number; fuel_type: string; transmission: string; condition: string;
    body_type?: string | null; exterior_color?: string | null; interior_color?: string | null;
    status: string; images?: string[] | null; created_at: string; view_count: number;
    seller_name?: string | null; location_city?: string | null; location_country?: string | null;
}

// --- Helper Functions (Keep these) ---
function getColorHex(colorName: string | null): string { /* ... implementation ... */
    if (!colorName) return '#CCCCCC'; const colorMap: Record<string, string> = { black: '#000000', white: '#FFFFFF', silver: '#C0C0C0', gray: '#808080', red: '#FF0000', blue: '#0000FF', green: '#008000', yellow: '#FFFF00', orange: '#FFA500', brown: '#A52A2A', purple: '#800080', }; const lowerCaseColor = colorName.toLowerCase(); for (const [key, value] of Object.entries(colorMap)) { if (lowerCaseColor.includes(key)) return value; } return '#CCCCCC';
}
function isValidUuid(uuid: string | null): boolean { /* ... implementation ... */
    if (!uuid) return false; return uuid.trim().length > 0;
}
function formatFuelTypeKey(fuelType: string | null): string { /* ... implementation ... */
    if (!fuelType) return 'Unknown'; const type = fuelType.toLowerCase(); if (type === 'electric') return 'Electric'; if (type === 'hybrid' || type === 'phev') return 'Hybrid'; if (type === 'diesel') return 'Diesel'; if (type === 'gasoline') return 'Gasoline'; return 'Unknown';
}
function formatTransmissionKey(transmission: string | null): string { /* ... implementation ... */
    if (!transmission) return 'Unknown'; const type = transmission.toLowerCase(); if (type === 'manual') return 'Manual'; if (type === 'cvt') return 'CVT'; if (type === 'dct') return 'DCT'; if (type === 'automatic') return 'Automatic'; return 'Unknown';
}
// --- End Helper Functions ---


// Car Card Component (Keep as it was)
const CarCard = ({ car, t }: { car: Car, t: ReturnType<typeof useTranslations<'MostSearchedCars'>> }) => { /* ... implementation ... */
    if (!car) return null;
    const carId = car.id && isValidUuid(car.id) ? car.id : "00000000-0000-4000-a000-000000000000";
    const imageUrl = car.images && Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : "/images/car-placeholder.jpg";
    const mileageStr = typeof car.mileage === 'number' ? Math.floor(car.mileage).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : "0";
    const priceStr = typeof car.price === 'number' ? `$${Math.floor(car.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : "$0";
    const isNew = car.condition && car.condition.toLowerCase() === 'new';
    const isAvailable = car.status && car.status.toLowerCase() === 'available';
    const carTitle = `${car.year || ''} ${car.make || ''} ${car.model || ''}`.trim();
    const fuelTypeKey = formatFuelTypeKey(car.fuel_type);
    const transmissionKey = formatTransmissionKey(car.transmission);

    return (<div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col"> {/* Image Div */} <div className="relative h-48 w-full"> <Image src={imageUrl} alt={carTitle || t('card.imageAltFallback')} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" priority={false} /> <div className="absolute top-2 left-2 flex flex-col gap-1"> {isNew && <Badge variant="default">{t('card.badgeNew')}</Badge>} {!isAvailable && <Badge variant="destructive">{t('card.badgeSold')}</Badge>} </div> <div className="absolute bottom-2 right-2"> <Badge variant="secondary" className="text-lg px-3 py-1 font-semibold bg-white/90">{priceStr}</Badge> </div> </div> {/* Details Div */} <div className="p-4 flex-grow flex flex-col"> <div className="flex-grow"> <h3 className="font-bold text-lg">{carTitle}</h3> {(car.location_city || car.location_country) && (<p className="text-sm text-gray-500 mb-2">{[car.location_city, car.location_country].filter(Boolean).join(', ')}</p>)} <div className="grid grid-cols-2 gap-3 mt-3"> <div className="flex items-center"><LuGauge className="text-gray-400 mr-2" size={16} /><span className="text-sm text-gray-600">{mileageStr} {t('card.unitMiles')}</span></div> <div className="flex items-center"><LuFuel className="text-gray-400 mr-2" size={16} /><span className="text-sm text-gray-600">{t(`fuelTypes.${fuelTypeKey}`)}</span></div> <div className="flex items-center"><PiGearFineBold className="text-gray-400 mr-2" size={16} /><span className="text-sm text-gray-600">{t(`transmissions.${transmissionKey}`)}</span></div> {car.exterior_color && (<div className="flex items-center"><div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getColorHex(car.exterior_color), border: '1px solid #e1e1e1' }}></div><span className="text-sm text-gray-600">{car.exterior_color}</span></div>)} </div> </div> <Link href={`/inventory/${carId}`} className="mt-4 inline-block w-full bg-primary text-white px-4 py-2 rounded text-center hover:bg-primary/90 transition"> {t('card.viewDetailsButton')} </Link> </div> </div>);
};


type MostSearchedCarsClientProps = { cars: Car[]; };

// isValidCar function (Keep as it was)
function isValidCar(car: Car | null | undefined): boolean { /* ... same logic ... */
    if (!car) return false; const isValid = Boolean(car.id && car.make && car.model && car.year); return isValid;
}

// --- Component Function Start ---
export function MostSearchedCarsClient({ cars }: MostSearchedCarsClientProps) {
    const t = useTranslations('MostSearchedCars');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const validCars = Array.isArray(cars) ? cars.filter(isValidCar) : [];
    const safeCars = validCars;
    const visibleCars = 4; // Assuming 4 visible cars
    const maxIndex = Math.max(0, safeCars.length - visibleCars);

    const slideLeft = () => { if (currentIndex > 0 && !isAnimating) { setIsAnimating(true); setCurrentIndex(prev => prev - 1); setTimeout(() => setIsAnimating(false), 300); } };
    const slideRight = () => { if (currentIndex < maxIndex && !isAnimating) { setIsAnimating(true); setCurrentIndex(prev => prev + 1); setTimeout(() => setIsAnimating(false), 300); } };

    if (safeCars.length === 0) {
        return (<div className="flex justify-center items-center h-64"><div className="text-gray-500">{t('empty')}</div></div>);
    }

    // --- *** Return Statement Start (Ensure this part is correct) *** ---
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
                    style={{ transform: `translateX(-${currentIndex * (100 / visibleCars)}%)` }} // Correct transform calculation
                >
                    {safeCars.map((car) => (
                        // Correct JSX syntax for the mapped element
                        <div
                            key={car.id || Math.random().toString()} // Key prop
                            style={{ width: `${100 / visibleCars}%` }} // Style prop with correct width
                            className="p-3 flex-shrink-0" // ClassName prop
                        >
                            <CarCard car={car} t={t} />
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
    // --- *** Return Statement End *** ---
}
// --- Component Function End ---