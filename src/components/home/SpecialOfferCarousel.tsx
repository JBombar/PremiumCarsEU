"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

// Define the type for our car listings
interface SpecialOffer {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  special_offer_label: string | null;
  images: string[] | null;
  status: string;
}

export function SpecialOfferCarousel() {
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [animating, setAnimating] = useState(false);

  // Fetch special offers from Supabase
  useEffect(() => {
    const fetchSpecialOffers = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        // Query car_listings table for special offers - now filtering for available status
        const { data, error } = await supabase
          .from('car_listings')
          .select('*')
          .eq('is_special_offer', true)
          .eq('status', 'available') // Only show available cars
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (data && data.length > 0) {
          setSpecialOffers(data);
        } else {
          // No special offers found
          setSpecialOffers([]);
        }
      } catch (err) {
        console.error('Error fetching special offers:', err);
        setError('Failed to load special offers');
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialOffers();
  }, []);

  const prevSlide = () => {
    if (animating) return;
    setAnimating(true);
    setDirection('left');
    setActiveIndex((current) =>
      current === 0 ? specialOffers.length - 1 : current - 1
    );
    setTimeout(() => setAnimating(false), 500); // Match duration to CSS transition
  };

  const nextSlide = () => {
    if (animating) return;
    setAnimating(true);
    setDirection('right');
    setActiveIndex((current) =>
      current === specialOffers.length - 1 ? 0 : current + 1
    );
    setTimeout(() => setAnimating(false), 500); // Match duration to CSS transition
  };

  // Show loading state
  if (loading) {
    return (
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Special Offers</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-300 h-12 w-12"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Special Offers</h2>
          <div className="rounded-lg bg-red-50 p-6 text-center text-red-800">
            {error}
          </div>
        </div>
      </section>
    );
  }

  // No special offers found
  if (specialOffers.length === 0) {
    return (
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Special Offers</h2>
          <div className="rounded-lg bg-white p-6 text-center shadow-sm">
            No special offers available at the moment.
          </div>
        </div>
      </section>
    );
  }

  const currentOffer = specialOffers[activeIndex];

  // Get the first image or use a placeholder
  const imageUrl = currentOffer.images && currentOffer.images.length > 0
    ? currentOffer.images[0]
    : '/images/car-placeholder.jpg';

  // Format the car title
  const carTitle = `${currentOffer.year} ${currentOffer.make} ${currentOffer.model}`;

  // Format price (without discount calculation)
  const formattedPrice = currentOffer.price?.toLocaleString() || "0";

  // Format mileage with commas
  const formattedMileage = currentOffer.mileage?.toLocaleString() || "0";

  return (
    <section className="py-16 bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Special Offer</h2>

        <div className="relative">
          {/* Navigation - Previous */}
          {specialOffers.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/70 hover:bg-white/90 shadow-md border-gray-200 -ml-4 md:ml-0"
              onClick={prevSlide}
              disabled={animating}
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Previous</span>
            </Button>
          )}

          {/* Offer Card - with animation only when multiple offers */}
          <div
            className={cn(
              specialOffers.length > 1 ? "transition-all duration-500 ease-in-out transform" : "",
              specialOffers.length > 1 && direction === 'left' ? "translate-x-full opacity-0" : "",
              specialOffers.length > 1 && direction === 'right' ? "-translate-x-full opacity-0" : "",
              specialOffers.length > 1 && animating ? "animate-in fade-in slide-in-from-right" : ""
            )}
          >
            <div className="overflow-hidden rounded-xl shadow-lg bg-white">
              <div className="flex flex-col md:flex-row">
                {/* Left side - Image - Fixed height at all screen sizes */}
                <div className="relative w-full md:w-1/2 h-64 md:h-96">
                  <div className="absolute top-4 left-4 z-10 bg-primary text-white text-sm font-bold px-4 py-1 rounded-full">
                    {currentOffer.special_offer_label || '🔥 Special Offer'}
                  </div>
                  <Image
                    src={imageUrl}
                    alt={carTitle}
                    className="object-cover h-full w-full"
                    width={600}
                    height={400}
                    priority
                  />
                </div>

                {/* Right side - Details - Fixed height to match image */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-center md:h-96">
                  <h3 className="text-2xl font-bold mb-2">{carTitle}</h3>

                  {/* Simplified price display - no discounts */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-primary">
                      ${formattedPrice}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-6">
                    {formattedMileage} km · {currentOffer.fuel_type} · {currentOffer.transmission}
                  </p>

                  <div className="mt-2">
                    <Link
                      href={`/inventory/${currentOffer.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                    >
                      View Offer
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation - Next */}
          {specialOffers.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/70 hover:bg-white/90 shadow-md border-gray-200 -mr-4 md:mr-0"
              onClick={nextSlide}
              disabled={animating}
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Next</span>
            </Button>
          )}

          {/* Indicators - only show when multiple offers */}
          {specialOffers.length > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              {specialOffers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!animating) {
                      setAnimating(true);
                      setDirection(index > activeIndex ? 'right' : 'left');
                      setActiveIndex(index);
                      setTimeout(() => setAnimating(false), 500);
                    }
                  }}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    index === activeIndex ? "bg-primary" : "bg-gray-300 hover:bg-gray-400"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                  disabled={animating}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
} 