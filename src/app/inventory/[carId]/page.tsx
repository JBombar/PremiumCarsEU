// app/inventory/[carId]/page.tsx

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Gauge,
  Fuel,
  MapPin,
  Tag,
  AlertCircle,
  Car
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils"; // Keep using this for price formatting unless locale-specific is needed
import { TestDriveModal } from "@/components/test-drive-modal";
import { ContactFormModal } from "@/components/contact-form-modal";
import { ReservationModal } from "@/components/reservation-modal";
import { TrackListingView } from "@/components/tracking/TrackListingView";
import { CarImageGallery } from "@/components/car-image-gallery";
import { getTranslations } from 'next-intl/server'; // Import getTranslations

// UUID validation function (unchanged)
function isValidUuid(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// TypeScript interface for car listing (unchanged)
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

export default async function CarListingPage({ params }: CarListingParams) {
  const t = await getTranslations('CarListingPage'); // Get translations
  const { carId } = params;

  // Log carId for debugging
  console.log("Fetching car with ID:", carId);

  // Validate UUID format before querying
  if (!isValidUuid(carId)) {
    console.log("Invalid UUID format:", carId);
    notFound(); // Return 404 for invalid UUIDs
  }

  // Create Supabase client
  const supabase = createClient();

  // Fetch car listing data with maybeSingle for graceful handling
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

  // Use car data or provide fallbacks (unchanged)
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

  // TASK 1: Add redirect for rent-only listings
  if (carData.listing_type === 'rent') {
    console.log("Car is rent-only, redirecting to rental page");
    redirect(`/inventory/${carData.id}/rent`);
  }

  // Check if the car has valid images (unchanged)
  const hasValidImages = carData.images && Array.isArray(carData.images) && carData.images.length > 0;

  // Helper for formatting mileage with translation
  const formatMileage = (mileage: number | null | undefined): string => {
    if (mileage == null) return t('quickFacts.notAvailable');
    return `${new Intl.NumberFormat('en-US').format(mileage)} ${t('quickFacts.unitMiles')}`;
  };

  // Helper to get translated condition or fallback
  const getConditionText = (condition: 'new' | 'used' | null | undefined): string => {
    if (!condition) return t('specifications.notAvailable');
    // Use dynamic key access for condition translation
    return t(`conditionValues.${condition}`);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Add view tracking component - it doesn't render anything visible */}
      <TrackListingView carId={carData.id} />

      {/* Back navigation - Add more consistent padding */}
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link href="/inventory" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t('backToInventory')}
        </Link>
      </div>

      {/* Main content - Increase padding and ensure proper centering */}
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Car Title + ID Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{carData.year} {carData.make} {carData.model}</h1>
          <p className="text-sm text-muted-foreground mt-1 text-gray-400">{t('carIdLabel')} {carData.id}</p>
        </div>

        {/* Car Info Grid - Add better spacing and padding */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-2 h-full bg-white rounded-lg p-4 shadow-sm">
            {/* Pass translation keys/function if CarImageGallery needs them */}
            <CarImageGallery
              images={carData.images}
              make={carData.make}
              model={carData.model}
              year={carData.year}
              condition={carData.condition}
              bodyType={carData.body_type}
              listingType={carData.listing_type}
            // Example: Pass translation keys needed by the gallery
            // altTextTemplate={t('imageGallery.imageAlt')}
            // altTextFallbackTemplate={t('imageGallery.imageAltFallback')}
            // conditionBadgeNewText={t('imageGallery.conditionBadgeNew')}
            // conditionBadgeUsedText={t('imageGallery.conditionBadgeUsed')}
            // listingTypeBadgeSaleText={t('imageGallery.listingTypeBadgeSale')}
            // listingTypeBadgeRentText={t('imageGallery.listingTypeBadgeRent')}
            />

            {/* TASK 2: Add "View Rental Info" button for dual-type listings */}
            {carData.listing_type === 'both' && (
              <Link href={`/inventory/${carData.id}/rent`}>
                <Button variant="outline" className="mt-4 w-full">
                  {t('buttons.viewRentalInfo')}
                </Button>
              </Link>
            )}

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
                        <span className="text-muted-foreground">{t('specifications.bodyType')}</span>
                        <span className="font-medium">{carData.body_type || t('specifications.notAvailable')}</span>
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
                        <span className="text-muted-foreground">{t('specifications.mileage')}</span>
                        <span className="font-medium">{formatMileage(carData.mileage)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">{t('specifications.interiorColor')}</span>
                        <span className="font-medium">{carData.interior_color || t('specifications.notAvailable')}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">{t('specifications.exteriorColor')}</span>
                        <span className="font-medium">{carData.exterior_color || t('specifications.notAvailable')}</span>
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
                            <span>{feature}</span> {/* Assuming features are already translated or don't need it */}
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

          {/* Right Column: Make it match the design of the left column */}
          <div className="lg:col-span-1 h-full flex flex-col">
            <Card className="flex-grow shadow-sm">
              <CardContent className="p-6">
                {/* Price section with full-width background */}
                <div className="mb-6 -mx-6 -mt-6 bg-gray-50 p-6 flex justify-center">
                  {carData.price && carData.price > 0 ? (
                    <span className="text-3xl font-bold">{formatPrice(carData.price)}</span>
                  ) : (
                    <span className="text-xl font-medium">{t('pricing.contactForPrice')}</span>
                  )}
                </div>

                {/* If it's available for rent */}
                {carData.listing_type === 'rent' && carData.rental_daily_price && (
                  <div className="flex items-center justify-between text-sm mb-4"> {/* Added margin */}
                    <span className="text-muted-foreground">{t('pricing.dailyRentalLabel')}</span>
                    <span className="font-medium">{formatPrice(carData.rental_daily_price)}{t('pricing.perDaySuffix')}</span>
                  </div>
                )}

                {/* Quick Facts */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <CalendarIcon className="h-5 w-5 mb-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t('quickFacts.year')}</span>
                    <span className="font-medium">{carData.year || t('quickFacts.notAvailable')}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <Gauge className="h-5 w-5 mb-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t('quickFacts.mileage')}</span>
                    <span className="font-medium">{formatMileage(carData.mileage)}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <Fuel className="h-5 w-5 mb-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t('quickFacts.fuel')}</span>
                    <span className="font-medium">{carData.fuel_type || t('quickFacts.notAvailable')}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <Tag className="h-5 w-5 mb-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t('quickFacts.transmission')}</span>
                    <span className="font-medium">{carData.transmission || t('quickFacts.notAvailable')}</span>
                  </div>
                </div>

                {/* Call to Action Buttons - Modals handle their own internal translations */}
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