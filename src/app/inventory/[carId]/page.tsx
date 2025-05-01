// app/inventory/[carId]/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from 'next-intl/server';
import { CarDetailClient } from './CarDetailClient';
import { CarListing } from '../types';

// UUID validation function (unchanged)
function isValidUuid(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

interface CarListingParams {
  params: {
    carId: string;
  };
}

export default async function CarListingPage({ params }: CarListingParams) {
  const t = await getTranslations('CarListingPage');
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

  // Use car data or provide fallbacks including the required fields
  const carData: CarListing = {
    ...car,
    body_type: car.body_type || null,
    exterior_color: car.exterior_color || null,
    interior_color: car.interior_color || null,
    engine: car.engine || null,
    vin: car.vin || null,
    features: car.features || null,
    seller_name: car.seller_name || null,
    seller_since: car.seller_since || null,
    // Add default values for the required fields if they're missing
    horsepower: car.horsepower || null,
    displacement: car.displacement || null,
    cylinders: car.cylinders || null
  };

  // Add redirect for rent-only listings
  if (carData.listing_type === 'rent') {
    console.log("Car is rent-only, redirecting to rental page");
    redirect(`/inventory/${carData.id}/rent`);
  }

  // Prepare translations to pass to client component
  const translations = {
    backToInventory: t('backToInventory'),
    carIdLabel: t('carIdLabel'),
    tabs: {
      overview: t('tabs.overview'),
      specifications: t('tabs.specifications'),
      features: t('tabs.features'),
    },
    overview: {
      descriptionTitle: t('overview.descriptionTitle'),
      noDescription: t('overview.noDescription'),
      locationTitle: t('overview.locationTitle'),
      noLocation: t('overview.noLocation'),
    },
    specifications: {
      make: t('specifications.make'),
      model: t('specifications.model'),
      year: t('specifications.year'),
      bodyType: t('specifications.bodyType'),
      fuelType: t('specifications.fuelType'),
      transmission: t('specifications.transmission'),
      mileage: t('specifications.mileage'),
      interiorColor: t('specifications.interiorColor'),
      exteriorColor: t('specifications.exteriorColor'),
      vin: t('specifications.vin'),
      engine: t('specifications.engine'),
      condition: t('specifications.condition'),
      notAvailable: t('specifications.notAvailable'),
    },
    features: {
      title: t('features.title'),
      noFeatures: t('features.noFeatures'),
    },
    quickFacts: {
      year: t('quickFacts.year'),
      mileage: t('quickFacts.mileage'),
      fuel: t('quickFacts.fuel'),
      transmission: t('quickFacts.transmission'),
      notAvailable: t('quickFacts.notAvailable'),
      unitMiles: t('quickFacts.unitMiles'),
    },
    pricing: {
      contactForPrice: t('pricing.contactForPrice'),
      dailyRentalLabel: t('pricing.dailyRentalLabel'),
      perDaySuffix: t('pricing.perDaySuffix'),
    },
    buttons: {
      viewRentalInfo: t('buttons.viewRentalInfo'),
    },
    sellerInfo: {
      title: t('sellerInfo.title'),
      fallbackInitial: t('sellerInfo.fallbackInitial'),
      fallbackName: t('sellerInfo.fallbackName'),
      memberSince: t('sellerInfo.memberSince'),
      fallbackYear: t('sellerInfo.fallbackYear'),
    },
    conditionValues: {
      new: t('conditionValues.new'),
      used: t('conditionValues.used'),
    },
  };

  // Render the client component with the fetched data and translations
  return <CarDetailClient carData={carData} translations={translations} />;
}