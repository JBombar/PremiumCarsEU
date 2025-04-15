"use client";

import { useState, useEffect } from 'react';
import { MostSearchedCarsClient } from './MostSearchedCarsClient';

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic';

// Import Car type from MostSearchedCarsClient or define it here
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

export function MostSearchedCars() {
  // Fix type declarations to resolve TypeScript errors
  const [cars, setCars] = useState<Car[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMostSearchedCars = async () => {
      try {
        setIsLoading(true);
        // Fetch data from the API endpoint
        const response = await fetch('/api/most-searched');

        if (!response.ok) {
          throw new Error(`Failed to fetch cars: ${response.status}`);
        }

        const data = await response.json();

        // Log raw data from API call for debugging
        console.log('Raw data from /api/most-searched:',
          data?.map((car: any) => ({ id: car.id, make: car.make, model: car.model, status: car.status })));

        // Additional client-side filtering as a safeguard
        if (data && Array.isArray(data)) {
          const filteredCars = data.filter(car =>
            car &&
            car.id &&
            car.make &&
            car.model &&
            car.year &&
            car.status &&
            car.status.toLowerCase() === 'available'
          );

          // Add more detailed console log for debugging
          console.log(`Found ${filteredCars.length} available cars after client filtering. IDs:`,
            filteredCars.map(car => car.id));

          setCars(filteredCars);
        } else {
          setCars([]);
        }
      } catch (e) {
        console.error('Error fetching most viewed cars:', e);
        setError(e instanceof Error ? e.message : 'Failed to load popular cars');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMostSearchedCars();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <h2 className="text-3xl font-bold text-center mb-10">Most Searched Cars</h2>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading popular vehicles...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">Failed to load popular cars. Please try again later.</div>
          </div>
        ) : cars.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">No popular vehicles found at the moment.</div>
          </div>
        ) : (
          <MostSearchedCarsClient cars={cars} />
        )}
      </div>
    </section>
  );
} 