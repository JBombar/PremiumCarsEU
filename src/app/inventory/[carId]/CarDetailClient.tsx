'use client';

import Link from "next/link";
import {
    ChevronLeft,
    Calendar as CalendarIcon,
    Gauge,
    Fuel,
    MapPin,
    Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TestDriveModal } from "@/components/test-drive-modal";
import { ContactFormModal } from "@/components/contact-form-modal";
import { ReservationModal } from "@/components/reservation-modal";
import { TrackListingView } from "@/components/tracking/TrackListingView";
import { CarImageGallery } from "@/components/car-image-gallery";
import { useCurrency } from '@/contexts/CurrencyContext';
import { CarListing } from '../types';

interface CarDetailClientProps {
    carData: CarListing;
    translations: {
        backToInventory: string;
        carIdLabel: string;
        tabs: {
            overview: string;
            specifications: string;
            features: string;
        };
        overview: {
            descriptionTitle: string;
            noDescription: string;
            locationTitle: string;
            noLocation: string;
        };
        specifications: {
            make: string;
            model: string;
            year: string;
            bodyType: string;
            fuelType: string;
            transmission: string;
            mileage: string;
            interiorColor: string;
            exteriorColor: string;
            vin: string;
            engine: string;
            condition: string;
            notAvailable: string;
        };
        features: {
            title: string;
            noFeatures: string;
        };
        quickFacts: {
            year: string;
            mileage: string;
            fuel: string;
            transmission: string;
            notAvailable: string;
            unitMiles: string;
        };
        pricing: {
            contactForPrice: string;
            dailyRentalLabel: string;
            perDaySuffix: string;
        };
        buttons: {
            viewRentalInfo: string;
        };
        sellerInfo: {
            title: string;
            fallbackInitial: string;
            fallbackName: string;
            memberSince: string;
            fallbackYear: string;
        };
        conditionValues: {
            new: string;
            used: string;
        };
    };
}

export function CarDetailClient({ carData, translations: t }: CarDetailClientProps) {
    // Get currency context
    const { selectedCurrency, formatPrice: formatCurrencyPrice } = useCurrency();

    // Helper for formatting mileage with translation
    const formatMileage = (mileage: number | null | undefined): string => {
        if (mileage == null) return t.quickFacts.notAvailable;
        return `${new Intl.NumberFormat('en-US').format(mileage)} ${t.quickFacts.unitMiles}`;
    };

    // Helper to get translated condition or fallback
    const getConditionText = (condition: 'new' | 'used' | null | undefined): string => {
        if (!condition) return t.specifications.notAvailable;
        // Use dynamic key access for condition translation
        return condition === 'new' ? t.conditionValues.new : t.conditionValues.used;
    };

    // Helper to get the price in the selected currency
    const getCarPrice = () => {
        const dynamicPriceKey = `price_${selectedCurrency.toLowerCase()}` as keyof CarListing;

        // Try to get price in selected currency, fallback to base price if not available
        return carData[dynamicPriceKey] !== undefined && carData[dynamicPriceKey] !== null
            ? carData[dynamicPriceKey] as number
            : carData.price;
    };

    // Helper to get the rental price in the selected currency
    const getRentalPrice = () => {
        const dynamicRentalPriceKey = `rental_daily_price_${selectedCurrency.toLowerCase()}` as keyof CarListing;

        // Try to get rental price in selected currency, fallback to base rental price if not available
        return carData[dynamicRentalPriceKey] !== undefined && carData[dynamicRentalPriceKey] !== null
            ? carData[dynamicRentalPriceKey] as number
            : carData.rental_daily_price;
    };

    return (
        <div className="bg-background min-h-screen">
            {/* Add view tracking component - it doesn't render anything visible */}
            <TrackListingView carId={carData.id} />

            {/* Back navigation */}
            <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <Link href="/inventory" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {t.backToInventory}
                </Link>
            </div>

            {/* Main content */}
            <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {/* Car Title + ID Section */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">{carData.year} {carData.make} {carData.model}</h1>
                    <p className="text-sm text-muted-foreground mt-1 text-gray-400">{t.carIdLabel} {carData.id}</p>
                </div>

                {/* Car Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column: Image Gallery */}
                    <div className="lg:col-span-2 h-full bg-white rounded-lg p-4 shadow-sm">
                        <CarImageGallery
                            images={carData.images}
                            make={carData.make}
                            model={carData.model}
                            year={carData.year}
                            condition={carData.condition || "used"}
                            bodyType={carData.body_type}
                            listingType={carData.listing_type}
                        />

                        {/* View Rental Info button for dual-type listings */}
                        {carData.listing_type === 'both' && (
                            <Link href={`/inventory/${carData.id}/rent`}>
                                <Button variant="outline" className="mt-4 w-full">
                                    {t.buttons.viewRentalInfo}
                                </Button>
                            </Link>
                        )}

                        {/* Tabs under the image */}
                        <div className="mt-6">
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid grid-cols-3 mb-4">
                                    <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{t.tabs.overview}</TabsTrigger>
                                    <TabsTrigger value="specifications" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{t.tabs.specifications}</TabsTrigger>
                                    <TabsTrigger value="features" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{t.tabs.features}</TabsTrigger>
                                </TabsList>

                                {/* Overview Tab */}
                                <TabsContent value="overview" className="space-y-4">
                                    <div className="prose max-w-none">
                                        <h3 className="text-lg font-semibold">{t.overview.descriptionTitle}</h3>
                                        <p>{carData.description || t.overview.noDescription}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">{t.overview.locationTitle}</h3>
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPin className="h-5 w-5 mr-2 text-primary" />
                                            <span>
                                                {carData.location_city ? `${carData.location_city}, ${carData.location_country || ''}` : t.overview.noLocation}
                                            </span>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Specifications Tab */}
                                <TabsContent value="specifications">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.make}</span>
                                                <span className="font-medium">{carData.make}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.model}</span>
                                                <span className="font-medium">{carData.model}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.year}</span>
                                                <span className="font-medium">{carData.year || t.specifications.notAvailable}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.bodyType}</span>
                                                <span className="font-medium">{carData.body_type || t.specifications.notAvailable}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.fuelType}</span>
                                                <span className="font-medium">{carData.fuel_type || t.specifications.notAvailable}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.transmission}</span>
                                                <span className="font-medium">{carData.transmission || t.specifications.notAvailable}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.mileage}</span>
                                                <span className="font-medium">{formatMileage(carData.mileage)}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.interiorColor}</span>
                                                <span className="font-medium">{carData.interior_color || t.specifications.notAvailable}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.exteriorColor}</span>
                                                <span className="font-medium">{carData.exterior_color || t.specifications.notAvailable}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.vin}</span>
                                                <span className="font-medium">{carData.vin || t.specifications.notAvailable}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.engine}</span>
                                                <span className="font-medium">{carData.engine || t.specifications.notAvailable}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t.specifications.condition}</span>
                                                <span className="font-medium capitalize">{getConditionText(carData.condition)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Features Tab */}
                                <TabsContent value="features">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">{t.features.title}</h3>
                                        {carData.features && carData.features.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {carData.features.map((feature: string, index: number) => (
                                                    <div key={index} className="flex items-center">
                                                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">{t.features.noFeatures}</p>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Right Column: Price and details */}
                    <div className="lg:col-span-1 h-full flex flex-col">
                        <Card className="flex-grow shadow-sm">
                            <CardContent className="p-6">
                                {/* Price section with full-width background */}
                                <div className="mb-6 -mx-6 -mt-6 bg-gray-50 p-6 flex justify-center">
                                    {getCarPrice() ? (
                                        <span className="text-3xl font-bold">{formatCurrencyPrice(getCarPrice())}</span>
                                    ) : (
                                        <span className="text-xl font-medium">{t.pricing.contactForPrice}</span>
                                    )}
                                </div>

                                {/* If it's available for rent */}
                                {carData.listing_type === 'rent' && getRentalPrice() && (
                                    <div className="flex items-center justify-between text-sm mb-4">
                                        <span className="text-muted-foreground">{t.pricing.dailyRentalLabel}</span>
                                        <span className="font-medium">{formatCurrencyPrice(getRentalPrice())}{t.pricing.perDaySuffix}</span>
                                    </div>
                                )}

                                {/* Quick Facts */}
                                <div className="grid grid-cols-2 gap-2 mb-6">
                                    <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                        <CalendarIcon className="h-5 w-5 mb-1 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{t.quickFacts.year}</span>
                                        <span className="font-medium">{carData.year || t.quickFacts.notAvailable}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                        <Gauge className="h-5 w-5 mb-1 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{t.quickFacts.mileage}</span>
                                        <span className="font-medium">{formatMileage(carData.mileage)}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                        <Fuel className="h-5 w-5 mb-1 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{t.quickFacts.fuel}</span>
                                        <span className="font-medium">{carData.fuel_type || t.quickFacts.notAvailable}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                        <Tag className="h-5 w-5 mb-1 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{t.quickFacts.transmission}</span>
                                        <span className="font-medium">{carData.transmission || t.quickFacts.notAvailable}</span>
                                    </div>
                                </div>

                                {/* Call to Action Buttons */}
                                <div className="space-y-3 mt-auto">
                                    <ContactFormModal
                                        carId={carData.id}
                                        carName={`${carData.year} ${carData.make} ${carData.model}`}
                                    />
                                    <TestDriveModal
                                        carId={carData.id}
                                        carName={`${carData.year} ${carData.make} ${carData.model}`}
                                    />
                                    <ReservationModal
                                        carId={carData.id}
                                        carName={`${carData.year} ${carData.make} ${carData.model}`}
                                    />
                                </div>

                                <Separator className="my-6" />

                                {/* Seller Info */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">{t.sellerInfo.title}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                            {carData.seller_name?.charAt(0) || t.sellerInfo.fallbackInitial}
                                        </div>
                                        <div>
                                            <p className="font-medium">{carData.seller_name || t.sellerInfo.fallbackName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {t.sellerInfo.memberSince.replace('{year}', carData.seller_since || t.sellerInfo.fallbackYear)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 