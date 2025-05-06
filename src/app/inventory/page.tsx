"use client";

import { useState, useEffect, useCallback, Suspense } from "react";

// UI Components
import { Button } from "@/components/ui/button";
import { Filter, AlertCircle } from "lucide-react";
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Components
import { InventoryGrid } from './components/InventoryGrid';
import { FilterSection } from './components/FilterSection';
import { AiSearchForm } from './components/AiSearchForm';
import { ResultsHeader } from './components/ResultsHeader';
import { PaginationControls } from './components/PaginationControls';
import ListingTypeToggle from './components/ListingTypeToggle'; // Keep import

// Types
import type { FilterState } from './types';

// Hooks
import { useInventoryFilters } from './hooks/useInventoryFilters';
import { useInventoryData } from './hooks/useInventoryData';
import { useMakesAndModels } from './hooks/useMakesAndModels';
import { useAiSearch } from './hooks/useAiSearch';
import { useTracking } from './hooks/useTracking';
import { useCurrency, Currency, currencySymbolMap } from '@/contexts/CurrencyContext';

export const dynamic = 'force-dynamic';

const defaultFilters: FilterState = {
  make: "Any", model: "Any", yearMin: 2010, yearMax: new Date().getFullYear(),
  priceMin: 0, priceMax: 150000, mileageMin: 0, mileageMax: 100000,
  fuelType: "Any", transmission: "Any", condition: "Any", bodyType: "Any",
  exteriorColor: "Any", interiorColor: "Any", horsepowerMin: undefined,
  horsepowerMax: undefined, displacementMin: undefined, displacementMax: undefined,
  cylindersMin: undefined, cylindersMax: undefined,
  listingType: 'both' // Default listing type
};

const ITEMS_PER_PAGE = 24;

// Wrapper for Suspense boundary
export default function InventoryPageWrapper() {
  return (<Suspense fallback={<InventoryLoadingSkeleton />}><InventoryPage /></Suspense>);
}

// Loading Skeleton Component
function InventoryLoadingSkeleton() {
  const t = useTranslations('InventoryPage');
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p>{t('loading')}</p>
      </div>
    </div>
  );
}

// Main Inventory Page Component
function InventoryPage() {
  const t = useTranslations('InventoryPage');

  // State for individual car card image cycling
  const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});
  // State for showing/hiding the "Back to Filters" button
  const [isScrolledPastFilters, setIsScrolledPastFilters] = useState(false);

  // --- REMOVED local listingType state ---

  // Use the custom hook for managing all filters, sorting, and pagination
  const {
    filters, // Contains filters.listingType for the toggle's value
    appliedFilters,
    sortOption,
    currentPage,
    setFilters, // Exposes setFilters if needed directly (e.g., by FilterSection)
    handleFilterChange,
    handleSliderChange,
    applyFilters: applyFiltersFromHook, // Renamed to avoid conflict if applyFilters was defined locally
    resetFilters,
    handleSortChange,
    applySpecificFilters,
    handlePageChange,
    handleListingTypeChange // Get the handler from the hook for the toggle
  } = useInventoryFilters(defaultFilters, ITEMS_PER_PAGE);

  // Use the custom hook for fetching inventory data based on applied state
  const {
    cars, loading, error, totalCount
  } = useInventoryData(appliedFilters, sortOption, currentPage, ITEMS_PER_PAGE);

  // Use the custom hook for fetching makes and models for filter dropdowns
  const { makes, availableModels, makesLoading, modelsLoading } = useMakesAndModels(filters.make);
  // Use the custom hook for tracking search interactions
  const { trackSearchInteraction } = useTracking({ makes, availableModels });

  // Use the custom hook for handling AI search functionality
  const {
    aiSearchInput, setAiSearchInput, aiSearchLoading,
    searchError, submitAiSearch
  } = useAiSearch({
    applySpecificFilters, trackSearchInteraction,
    getCurrentFilters: () => filters, // Pass current UI filters for context
    getCurrentSortOption: () => sortOption, // Pass current sort for context
    t // Pass translation function
  });

  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  // Handlers for car card image navigation
  const nextImage = (carId: string) => {
    setActiveImageIndex(prev => {
      const c = cars.find(car => car.id === carId);
      const imageCount = c?.images?.length ?? 0;
      if (imageCount <= 1) return prev;
      const currentIndex = prev[carId] || 0;
      const nextIndex = (currentIndex + 1) % imageCount;
      return { ...prev, [carId]: nextIndex };
    });
  };

  const prevImage = (carId: string) => {
    setActiveImageIndex(prev => {
      const c = cars.find(car => car.id === carId);
      const imageCount = c?.images?.length ?? 0;
      if (imageCount <= 1) return prev;
      const currentIndex = prev[carId] || 0;
      const prevIndex = (currentIndex - 1 + imageCount) % imageCount;
      return { ...prev, [carId]: prevIndex };
    });
  };

  // Effect to detect scrolling past the filter section
  useEffect(() => {
    const handleScroll = () => {
      const filterSectionElement = document.getElementById('filter-section');
      if (filterSectionElement) {
        setIsScrolledPastFilters(filterSectionElement.getBoundingClientRect().bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Function to scroll back to the filter section
  const scrollToFilters = () => {
    const filterSectionElement = document.getElementById('filter-section');
    if (filterSectionElement) {
      filterSectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handler combining filter application with tracking
  const handleApplyFiltersAndTrack = useCallback(() => {
    applyFiltersFromHook(); // Call the hook's apply function
    trackSearchInteraction(filters); // Track the interaction with current UI filters
  }, [applyFiltersFromHook, trackSearchInteraction, filters]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Conditional Rendering for Loading/Error states
  if (loading && cars.length === 0 && !error) {
    return <InventoryLoadingSkeleton />;
  }
  if (!loading && error && cars.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-card rounded-lg shadow-md max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-destructive mb-2">{t('errorTitle')}</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>{t('errorTryAgain')}</Button>
        </div>
      </div>
    );
  }

  // Prepare options for filter dropdowns using translations
  const bodyTypeOptions = t.raw('bodyTypes') as Record<string, string>;
  const fuelTypeOptions = t.raw('fuelTypes') as Record<string, string>;
  const transmissionOptions = t.raw('transmissions') as Record<string, string>;
  const conditionOptions = t.raw('conditions') as Record<string, string>;
  const sortOptions = t.raw('sortOptions') as Record<string, string>;
  // Define available colors (could also come from API or config)
  const availableColors = ["anthracite", "beige", "blue", "bordeaux", "brown", "yellow", "gold", "gray", "green", "multicolor", "orange", "pink", "red", "black", "silver", "turquoise", "violet", "white"];

  // Render the main page structure
  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      <div className="bg-muted/40 py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('hero.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <section className="container max-w-6xl mx-auto px-6">
        {/* AI Search Form */}
        <AiSearchForm
          input={aiSearchInput} setInput={setAiSearchInput}
          onSubmit={submitAiSearch} loading={aiSearchLoading}
          error={searchError} t={t}
        />

        {/* ✅ Listing Type Toggle - CONNECTED TO HOOK */}
        <div className="my-4">
          <ListingTypeToggle
            value={filters.listingType} // Use value from hook's filters state
            onChange={handleListingTypeChange} // Use handler from hook
            t={t} // <-- THE FIX: Pass the t function as a prop
          />
        </div>

        {/* Filter Section */}
        <FilterSection
          id="filter-section" // ID for scrolling
          filters={filters} // Pass current UI filters
          defaultFilters={defaultFilters} // Pass default filters for comparison/reset
          makes={makes} // Pass makes data
          availableModels={availableModels} // Pass models data
          makesLoading={makesLoading} // Pass loading states
          modelsLoading={modelsLoading}
          availableColors={availableColors} // Pass color options
          bodyTypeOptions={bodyTypeOptions} // Pass translated options
          fuelTypeOptions={fuelTypeOptions}
          transmissionOptions={transmissionOptions}
          conditionOptions={conditionOptions}
          onFilterChange={handleFilterChange} // Pass handler for individual filter changes
          onApplyFilters={handleApplyFiltersAndTrack} // Pass handler for Apply button
          onResetFilters={resetFilters} // Pass handler for Reset button
          setFilters={setFilters} // Pass setFilters if FilterSection needs direct access
          t={t} // Pass translation function
        />

        {/* Floating "Back to Filters" Button */}
        {isScrolledPastFilters && (
          <div className="fixed bottom-6 right-6 z-30">
            <Button onClick={scrollToFilters} className="shadow-md">
              <Filter className="h-4 w-4 mr-2" />
              {t('filters.backButton')}
            </Button>
          </div>
        )}

        {/* Results Header (Count and Sorting) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Vehicle count - full width on mobile */}
          <div className="text-base">Showing {totalCount} vehicles</div>

          {/* Controls container - stack vertically on mobile */}
          <div className="flex flex-col xs:flex-row gap-4">
            {/* Currency Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm min-w-[70px] sm:min-w-0">Currency:</span>
              <Select
                value={selectedCurrency}
                onValueChange={(value) => setSelectedCurrency(value as Currency)}
              >
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(currencySymbolMap).map(([currency, symbol]) => (
                    <SelectItem key={currency} value={currency}>
                      {currency} ({symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm min-w-[70px] sm:min-w-0">Sort by:</span>
              <Select
                value={sortOption}
                onValueChange={(value) => handleSortChange(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sortOptions).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Inventory Grid (Displaying Cars) */}
        <InventoryGrid
          cars={cars} // Pass fetched car data
          loading={loading} // Pass loading state for potential skeleton inside grid
          error={error} // Pass error state
          filters={appliedFilters} // Pass applied filters for context if needed
          activeImageIndex={activeImageIndex} // Pass image index state
          onNextImage={nextImage} // Pass image navigation handlers
          onPrevImage={prevImage}
          onTrackInteraction={trackSearchInteraction} // Pass tracking handler
          t={t} // Pass translation function
        />

        {/* Pagination Controls */}
        {totalPages > 1 && !loading && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange} // Pass handler for page changes
          />
        )}
      </section>
    </div>
  );
}