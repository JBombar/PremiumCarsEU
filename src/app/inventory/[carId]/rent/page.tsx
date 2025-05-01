import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft,
    Calendar as CalendarIcon,
    Gauge,
    Fuel,
    MapPin,
    Tag,
    Clock,
    Shield,
    Car
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { ContactRenterModal } from "@/components/contact-renter-modal";
import { RentReservationModal } from "@/components/contact-renter-reservation-modal";
import { TrackListingView } from "@/components/tracking/TrackListingView";
import { CarImageGallery } from "@/components/car-image-gallery";
import { getTranslations } from 'next-intl/server';

// UUID validation function
function isValidUuid(uuid: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// TypeScript interface for car listing
interface CarListing {
    id: string;
    make: string;
    model: string;
    year: number | null;
    price: number | null;
    mileage: number | null;
    fuel_type: string | null;
    transmission: string | null;
    condition: "new" | "used";
    location_city: string | null;
    location_country: string | null;
    images: string[] | null;
    description: string | null;
    dealer_id: string;
    status: string | null;
    is_public: boolean;
    is_shared_with_network: boolean;
    listing_type: string | null;
    rental_daily_price: number | null;
    rental_deposit_required: number | null;
    rental_status: string | null;
    min_rental_days: number | null;
    max_rental_days: number | null;
    created_at: string;
    updated_at: string | null;
    body_type: string | null;
    exterior_color: string | null;
    interior_color: string | null;
    engine: string | null;
    vin: string | null;
    features: string[] | null;
    seller_name: string | null;
    seller_since: string | null;
}

interface CarListingParams {
    params: {
        carId: string;
    };
}

export default async function CarRentPage({ params }: CarListingParams) {
    const t = await getTranslations('CarListingPage');
    const { carId } = params;

    // Log carId for debugging
    console.log("Fetching rental car with ID:", carId);

    // Validate UUID format before querying
    if (!isValidUuid(carId)) {
        console.log("Invalid UUID format:", carId);
        notFound();
    }

    // Create Supabase client
    const supabase = createClient();

    // Fetch car listing data
    const { data: car, error } = await supabase
        .from('car_listings')
        .select('*')
        .eq('id', carId)
        .maybeSingle<CarListing>();

    // Handle errors or not found cases
    if (error) {
        console.error("Supabase error:", error);
        notFound();
    }

    if (!car) {
        console.log("Car not found with ID:", carId);
        notFound();
    }

    // Check if the car is available for rent
    if (car.listing_type !== 'rent' && car.listing_type !== 'both') {
        console.log("Car not available for rent, redirecting to main listing page");
        redirect(`/inventory/${carId}`);
    }

    // If no rental price is set, also redirect to main listing
    if (!car.rental_daily_price) {
        console.log("No rental price available, redirecting to main listing page");
        redirect(`/inventory/${carId}`);
    }

    // Use car data or provide fallbacks
    const carData: CarListing = {
        ...car,
        body_type: car.body_type || null,
        exterior_color: car.exterior_color || null,
        interior_color: car.interior_color || null,
        engine: car.engine || null,
        vin: car.vin || null,
        features: car.features || null,
        seller_name: car.seller_name || null,
        seller_since: car.seller_since || null
    };

    // Check if the car has valid images
    const hasValidImages = carData.images && Array.isArray(carData.images) && carData.images.length > 0;

    // Helper for formatting mileage with translation
    const formatMileage = (mileage: number | null | undefined): string => {
        if (mileage == null) return t('quickFacts.notAvailable');
        return `${new Intl.NumberFormat('en-US').format(mileage)} ${t('quickFacts.unitMiles')}`;
    };

    // Helper to get translated condition or fallback
    const getConditionText = (condition: 'new' | 'used' | null | undefined): string => {
        if (!condition) return t('specifications.notAvailable');
        return t(`conditionValues.${condition}`);
    };

    // Helper to format rental duration
    const formatRentalDuration = (): string => {
        if (carData.min_rental_days && carData.max_rental_days) {
            return `${carData.min_rental_days}-${carData.max_rental_days} ${t('rental.days')}`;
        } else if (carData.min_rental_days) {
            return `${t('rental.minDays', { days: carData.min_rental_days })}`;
        } else if (carData.max_rental_days) {
            return `${t('rental.maxDays', { days: carData.max_rental_days })}`;
        }
        return t('rental.flexible');
    };

    return (
        <div className="bg-background min-h-screen">
            {/* Add view tracking component */}
            <TrackListingView carId={carData.id} />

            {/* Back navigation */}
            <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <Link href="/inventory" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {t('backToInventory')}
                </Link>
            </div>

            {/* Main content */}
            <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {/* Car Title + ID Section with Rental Badge */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{carData.year} {carData.make} {carData.model}</h1>
                        <p className="text-sm text-muted-foreground mt-1 text-gray-400">{t('carIdLabel')} {carData.id}</p>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary font-medium px-3 py-1 text-sm">
                        {t('rental.rentalAvailable')}
                    </Badge>
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
                            condition={carData.condition}
                            bodyType={carData.body_type}
                            listingType="rent"
                        />

                        {/* Link back to main listing page */}
                        <Link href={`/inventory/${carId}`}>
                            <Button variant="outline" className="mt-4 w-full">
                                <Car className="mr-2 h-4 w-4" />
                                {t('rental.viewSaleDetails')}
                            </Button>
                        </Link>

                        {/* Tabs under the image */}
                        <div className="mt-6">
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid grid-cols-3 mb-4">
                                    <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{t('tabs.overview')}</TabsTrigger>
                                    <TabsTrigger value="specifications" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{t('tabs.specifications')}</TabsTrigger>
                                    <TabsTrigger value="features" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{t('tabs.features')}</TabsTrigger>
                                </TabsList>

                                {/* Overview Tab */}
                                <TabsContent value="overview" className="space-y-4">
                                    <div className="prose max-w-none">
                                        <h3 className="text-lg font-semibold">{t('overview.descriptionTitle')}</h3>
                                        <p>{carData.description || t('overview.noDescription')}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">{t('overview.locationTitle')}</h3>
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPin className="h-5 w-5 mr-2 text-primary" />
                                            <span>
                                                {carData.location_city ? `${carData.location_city}, ${carData.location_country || ''}` : t('overview.noLocation')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Rental Terms Section (New) */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">{t('rental.termsTitle')}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('rental.dailyRateLabel')}</span>
                                                <span className="font-medium">{formatPrice(carData.rental_daily_price ?? 0)}{t('pricing.perDaySuffix')}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('rental.depositLabel')}</span>
                                                <span className="font-medium">
                                                    {carData.rental_deposit_required ? formatPrice(carData.rental_deposit_required) : t('rental.noDeposit')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('rental.minDaysLabel')}</span>
                                                <span className="font-medium">
                                                    {carData.min_rental_days ? `${carData.min_rental_days} ${t('rental.days')}` : t('rental.flexible')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('rental.maxDaysLabel')}</span>
                                                <span className="font-medium">
                                                    {carData.max_rental_days ? `${carData.max_rental_days} ${t('rental.days')}` : t('rental.noLimit')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Specifications Tab */}
                                <TabsContent value="specifications">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.make')}</span>
                                                <span className="font-medium">{carData.make}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.model')}</span>
                                                <span className="font-medium">{carData.model}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.year')}</span>
                                                <span className="font-medium">{carData.year || t('specifications.notAvailable')}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.mileage')}</span>
                                                <span className="font-medium">{formatMileage(carData.mileage)}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.bodyType')}</span>
                                                <span className="font-medium">{carData.body_type || t('specifications.notAvailable')}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.exteriorColor')}</span>
                                                <span className="font-medium">{carData.exterior_color || t('specifications.notAvailable')}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.interiorColor')}</span>
                                                <span className="font-medium">{carData.interior_color || t('specifications.notAvailable')}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.fuelType')}</span>
                                                <span className="font-medium">{carData.fuel_type || t('specifications.notAvailable')}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.transmission')}</span>
                                                <span className="font-medium">{carData.transmission || t('specifications.notAvailable')}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.vin')}</span>
                                                <span className="font-medium">{carData.vin || t('specifications.notAvailable')}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.engine')}</span>
                                                <span className="font-medium">{carData.engine || t('specifications.notAvailable')}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">{t('specifications.condition')}</span>
                                                <span className="font-medium capitalize">{getConditionText(carData.condition)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Features Tab */}
                                <TabsContent value="features">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">{t('features.title')}</h3>
                                        {carData.features && carData.features.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {carData.features.map((feature, index) => (
                                                    <div key={index} className="flex items-center">
                                                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">{t('features.noFeatures')}</p>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-1 h-full flex flex-col">
                        <Card className="flex-grow shadow-sm">
                            <CardContent className="p-6">
                                {/* Rental Price section with full-width background */}
                                <div className="mb-6 -mx-6 -mt-6 bg-gray-50 p-6 flex flex-col items-center">
                                    <span className="text-3xl font-bold">{formatPrice(carData.rental_daily_price ?? 0)}</span>
                                    <span className="text-muted-foreground">{t('rental.perDayLabel')}</span>
                                </div>

                                {/* Key Information Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                        <CalendarIcon className="h-5 w-5 mb-1 text-primary" />
                                        <span className="text-xs text-muted-foreground">{t('quickFacts.year')}</span>
                                        <span className="font-medium">{carData.year || t('quickFacts.notAvailable')}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                        <Gauge className="h-5 w-5 mb-1 text-primary" />
                                        <span className="text-xs text-muted-foreground">{t('quickFacts.mileage')}</span>
                                        <span className="font-medium">{formatMileage(carData.mileage)}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                        <Clock className="h-5 w-5 mb-1 text-primary" />
                                        <span className="text-xs text-muted-foreground">{t('rental.minDaysLabel')}</span>
                                        <span className="font-medium">{carData.min_rental_days || t('rental.flexible')}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                                        <Shield className="h-5 w-5 mb-1 text-primary" />
                                        <span className="text-xs text-muted-foreground">{t('rental.depositQuickLabel')}</span>
                                        <span className="font-medium text-sm text-center">
                                            {carData.rental_deposit_required ? formatPrice(carData.rental_deposit_required) : t('rental.noDeposit')}
                                        </span>
                                    </div>
                                </div>

                                {/* Rental Duration - Moved to middle for better balance */}
                                <div className="flex flex-col items-center mb-6 p-4 bg-muted/30 rounded-lg">
                                    <span className="text-sm text-muted-foreground mb-1">{t('rental.rentalDurationLabel')}</span>
                                    <span className="font-medium">{formatRentalDuration()}</span>
                                </div>

                                {/* Call to Action Buttons */}
                                <div className="space-y-3 mt-auto">
                                    <ContactRenterModal
                                        carId={carData.id}
                                        carName={`${carData.year} ${carData.make} ${carData.model}`}
                                    />
                                    <div className="mt-3">
                                        <RentReservationModal
                                            carId={carData.id}
                                            carName={`${carData.year} ${carData.make} ${carData.model}`}
                                        />
                                    </div>
                                    <div className="mt-3">
                                        <Link href={`/inventory/${carId}`}>
                                            <Button variant="outline" className="w-full">
                                                <Car className="mr-2 h-4 w-4" />
                                                {t('rental.viewFullDetails')}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Seller Info - Hidden by default on small screens, shown at bottom on larger screens */}
                                <div className="hidden md:block mt-6">
                                    <Separator className="mb-6" />
                                    <h3 className="text-lg font-semibold mb-3">{t('sellerInfo.title')}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                            {carData.seller_name?.charAt(0) || t('sellerInfo.fallbackInitial')}
                                        </div>
                                        <div>
                                            <p className="font-medium">{carData.seller_name || t('sellerInfo.fallbackName')}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {t('sellerInfo.memberSince', { year: carData.seller_since || t('sellerInfo.fallbackYear') })}
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
