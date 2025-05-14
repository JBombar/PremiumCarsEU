// src/components/home/MostSearchedCars.tsx
"use client";

import { useState, useEffect } from 'react';
import { MostSearchedCarsClient } from './MostSearchedCarsClient';
import { useTranslations } from 'next-intl'; // Import useTranslations

export const dynamic = 'force-dynamic';

// Define Car interface (can be shared or imported)
interface Car {
  id: string; make: string; model: string; year: number; price: number;
  mileage: number; fuel_type: string; transmission: string; condition: string;
  body_type?: string | null; exterior_color?: string | null; interior_color?: string | null;
  status: string; images?: string[] | null; created_at: string; view_count: number;
  seller_name?: string | null; location_city?: string | null; location_country?: string | null;
  is_public?: boolean; // Add is_public to the interface
}

export function MostSearchedCars() {
  const t = useTranslations('MostSearchedCars'); // Initialize hook
  const [cars, setCars] = useState<Car[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMostSearchedCars = async () => {
      try {
        setIsLoading(true);
        setError(null); // Reset error
        const response = await fetch('/api/most-searched');

        if (!response.ok) {
          // Use translated prefix for dynamic errors
          throw new Error(`${t('errorPrefix')}${response.status}`);
        }

        const data = await response.json();

        // Debug: Log the raw data from API
        console.log('API Response:', data);

        // Data processing and filtering logic
        if (data && Array.isArray(data)) {
          // Apply each filter separately for debugging
          const withIds = data.filter(car => car && car.id);
          console.log('Cars with IDs:', withIds.length);

          const withBasicInfo = withIds.filter(car => car.make && car.model && car.year);
          console.log('Cars with basic info:', withBasicInfo.length);

          const availableCars = withBasicInfo.filter(car => car.status && car.status.toLowerCase() === 'available');
          console.log('Available cars:', availableCars.length);

          const publicCars = availableCars.filter(car => {
            console.log(`Car ID: ${car.id}, is_public: ${car.is_public}`);
            return car.is_public === true;
          });
          console.log('Public cars:', publicCars.length);

          // More lenient approach for is_public - check if an issue with boolean comparison
          const filteredCars = availableCars.filter(car => {
            // Handle different possible types for is_public with proper type checking
            let isPublic = false;
            if (typeof car.is_public === 'boolean') {
              isPublic = car.is_public === true;
            } else if (typeof car.is_public === 'number') {
              isPublic = car.is_public === 1;
            } else if (typeof car.is_public === 'string') {
              isPublic = car.is_public === 'true';
            }
            return isPublic;
          });

          console.log('Final filtered cars:', filteredCars.length);

          // If our strict filtering returns no results, 
          // check if the is_public field might not be populated at all in the database
          if (filteredCars.length === 0 && availableCars.length > 0) {
            // Check if any cars have is_public explicitly set to any value
            const anyWithIsPublicSet = availableCars.some(car => car.is_public !== undefined && car.is_public !== null);

            console.log('Any cars with is_public set:', anyWithIsPublicSet);

            if (!anyWithIsPublicSet) {
              // If no cars have is_public set, it might be a schema issue
              // Default to showing available cars without is_public filter
              console.log('No cars have is_public set, defaulting to available cars');
              setCars(availableCars);
              return;
            }
          }

          setCars(filteredCars);
        } else {
          setCars([]);
        }

      } catch (e) {
        console.error('Error fetching most viewed cars:', e);
        // Set error state using the general translated error or the specific one from fetch
        setError(e instanceof Error ? e.message : t('error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMostSearchedCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]); // Add t to dependencies

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Use translated title */}
        <h2 className="text-3xl font-bold text-center mb-10">{t('title')}</h2>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            {/* Use translated loading text */}
            <div className="text-gray-500">{t('loading')}</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            {/* Display the error state variable (which holds translated string) */}
            <div className="text-red-500">{error}</div>
          </div>
        ) : cars.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            {/* Use translated empty state text */}
            <div className="text-gray-500">{t('empty')}</div>
          </div>
        ) : (
          // Pass potentially filtered cars to the client component
          <MostSearchedCarsClient cars={cars} />
        )}
      </div>
    </section>
  );
}