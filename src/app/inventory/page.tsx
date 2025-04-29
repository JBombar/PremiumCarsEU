// app/inventory/page.tsx
"use client";

// Keep necessary React/Next imports
import { useState, useEffect, useCallback, Suspense } from "react";

// UI Components
import { Button } from "@/components/ui/button";
// Select components are now only used in ResultsHeader
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Input is now only used in AiSearchForm
// import { Input } from "@/components/ui/input";
// Keep only icons used directly in this component (PaginationControls will need ChevronLeft/Right)
import { Filter, AlertCircle } from "lucide-react"; // Removed ChevronLeft/Right as they will be in PaginationControls

// Utilities & Libs
// uuid is now only used in useTracking
// import { v4 as uuidv4 } from 'uuid';
// toast is now only used in useAiSearch hook
// import { toast } from "@/components/ui/use-toast";
import { useTranslations } from 'next-intl'; // Essential for translations

// Import Child Components
import { InventoryGrid } from './components/InventoryGrid';
import { FilterSection } from './components/FilterSection';
import { AiSearchForm } from './components/AiSearchForm';
import { ResultsHeader } from './components/ResultsHeader';
import { PaginationControls } from './components/PaginationControls'; // <-- Import Pagination

// Import Types
import type { CarListing, CarMake, CarModel, FilterState } from './types';

// Import Custom Hooks
import { useInventoryFilters } from './hooks/useInventoryFilters';
import { useInventoryData } from './hooks/useInventoryData';
import { useMakesAndModels } from './hooks/useMakesAndModels';
import { useAiSearch } from './hooks/useAiSearch';
import { useTracking } from './hooks/useTracking';

export const dynamic = 'force-dynamic';

// Default filter values (unchanged)
const defaultFilters: FilterState = {
  make: "Any", model: "Any", yearMin: 2010, yearMax: new Date().getFullYear(),
  priceMin: 0, priceMax: 150000, mileageMin: 0, mileageMax: 100000,
  fuelType: "Any", transmission: "Any", condition: "Any", bodyType: "Any",
  exteriorColor: "Any", interiorColor: "Any", horsepowerMin: undefined,
  horsepowerMax: undefined, displacementMin: undefined, displacementMax: undefined,
  cylindersMin: undefined, cylindersMax: undefined,
};

// Define items per page constant
const ITEMS_PER_PAGE = 24;

// Suspense Wrapper (unchanged)
export default function InventoryPageWrapper() {
  return (<Suspense fallback={<InventoryLoadingSkeleton />}><InventoryPage /></Suspense>);
}

// Loading Skeleton (unchanged)
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

// Main Inventory Page Component - Refactored with Pagination Logic
function InventoryPage() {
  const t = useTranslations('InventoryPage');

  // --- State Variables ---
  // Only UI state not handled by hooks remains here
  const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});
  const [isScrolledPastFilters, setIsScrolledPastFilters] = useState(false);

  // --- Custom Hooks ---

  // Filter/Sort/URL Hook - Pass ITEMS_PER_PAGE
  const {
    filters, appliedFilters, sortOption, currentPage, // <-- Get currentPage
    setFilters, handleFilterChange, handleSliderChange,
    applyFilters: applyFiltersFromHook, // Renamed original apply
    resetFilters, handleSortChange, applySpecificFilters,
    handlePageChange // <-- Get handlePageChange
  } = useInventoryFilters(defaultFilters, ITEMS_PER_PAGE); // <-- Pass ITEMS_PER_PAGE

  // Data Fetching Hook - Pass currentPage and ITEMS_PER_PAGE
  const {
    cars, loading, error, totalCount // <-- Get totalCount
  } = useInventoryData(
    appliedFilters,
    sortOption,
    currentPage,    // <-- Pass currentPage
    ITEMS_PER_PAGE  // <-- Pass ITEMS_PER_PAGE
  );

  // Makes and Models Hook
  const { makes, availableModels, makesLoading, modelsLoading } = useMakesAndModels(filters.make);

  // Tracking Hook
  const { trackSearchInteraction } = useTracking({ makes, availableModels });

  // --- Combined Handler for Apply Button ---
  const handleApplyFiltersAndTrack = useCallback(() => {
    applyFiltersFromHook();
    trackSearchInteraction(filters); // Track UI filters state on apply
  }, [applyFiltersFromHook, trackSearchInteraction, filters]);

  // AI Search Hook
  const {
    aiSearchInput, setAiSearchInput, aiSearchLoading,
    searchError, submitAiSearch
  } = useAiSearch({
    applySpecificFilters, trackSearchInteraction,
    getCurrentFilters: () => filters, getCurrentSortOption: () => sortOption, t
  });


  // --- Image Carousel Handlers ---
  // TODO: Move to useImageCarousel hook
  const nextImage = (carId: string) => { setActiveImageIndex(prev => { const c = cars.find(car => car.id === carId); const iC = c?.images?.length ?? 0; if (iC <= 1) return prev; const cI = prev[carId] || 0; const nI = (cI + 1) % iC; return { ...prev, [carId]: nI }; }); };
  const prevImage = (carId: string) => { setActiveImageIndex(prev => { const c = cars.find(car => car.id === carId); const iC = c?.images?.length ?? 0; if (iC <= 1) return prev; const cI = prev[carId] || 0; const pI = (cI - 1 + iC) % iC; return { ...prev, [carId]: pI }; }); };


  // --- Scroll Effect & Handler ---
  // TODO: Move to useScrollVisibility hook
  useEffect(() => { const handleScroll = () => { const fs = document.getElementById('filter-section'); if (fs) setIsScrolledPastFilters(fs.getBoundingClientRect().bottom < 0); }; window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);
  const scrollToFilters = () => { const fs = document.getElementById('filter-section'); if (fs) fs.scrollIntoView({ behavior: 'smooth' }); };


  // --- Calculate Total Pages --- NEW
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);


  // --- Render Logic ---
  if (loading && cars.length === 0 && !error) { return <InventoryLoadingSkeleton />; }
  if (!loading && error && cars.length === 0) {
    return ( /* Error Display */ <div className="min-h-screen flex items-center justify-center"><div className="text-center p-6 bg-card rounded-lg shadow-md max-w-md mx-auto"><AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" /><h2 className="text-xl font-bold text-destructive mb-2">{t('errorTitle')}</h2><p className="text-muted-foreground mb-4">{error}</p><Button onClick={() => window.location.reload()}>{t('errorTryAgain')}</Button></div></div>);
  }

  // Prepare options for child components
  const bodyTypeOptions = t.raw('bodyTypes') as Record<string, string>;
  const fuelTypeOptions = t.raw('fuelTypes') as Record<string, string>;
  const transmissionOptions = t.raw('transmissions') as Record<string, string>;
  const conditionOptions = t.raw('conditions') as Record<string, string>;
  const sortOptions = t.raw('sortOptions') as Record<string, string>;
  const availableColors = ["anthracite", "beige", "blue", "bordeaux", "brown", "yellow", "gold", "gray", "green", "multicolor", "orange", "pink", "red", "black", "silver", "turquoise", "violet", "white"];


  return (
    <div className="min-h-screen pb-12">
      {/* Header (unchanged) */}
      {/* TODO: Extract to InventoryHeader component */}
      <div className="bg-muted/40 py-12"> <div className="container max-w-6xl mx-auto px-6"> <div className="text-center"> <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1> <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('hero.subtitle')}</p> </div> </div> </div>

      <section className="container max-w-6xl mx-auto px-6">

        {/* AI Search Section */}
        <AiSearchForm
          input={aiSearchInput} setInput={setAiSearchInput}
          onSubmit={submitAiSearch} loading={aiSearchLoading}
          error={searchError} t={t}
        />

        {/* Filters Section */}
        <FilterSection
          id="filter-section"
          filters={filters} defaultFilters={defaultFilters}
          makes={makes} availableModels={availableModels} makesLoading={makesLoading} modelsLoading={modelsLoading}
          availableColors={availableColors} bodyTypeOptions={bodyTypeOptions} fuelTypeOptions={fuelTypeOptions}
          transmissionOptions={transmissionOptions} conditionOptions={conditionOptions}
          onFilterChange={handleFilterChange}
          onApplyFilters={handleApplyFiltersAndTrack} // Pass combined handler
          onResetFilters={resetFilters}
          setFilters={setFilters}
          t={t}
        />

        {/* Back to Filters Button */}
        {/* TODO: Extract to BackToFiltersButton component */}
        {isScrolledPastFilters && (<div className="fixed bottom-6 right-6 z-30"> <Button onClick={scrollToFilters} className="shadow-md"> <Filter className="h-4 w-4 mr-2" /> {t('filters.backButton')} </Button> </div>)}

        {/* Results Count and Sort */}
        <ResultsHeader
          resultsCount={totalCount} // <-- Use totalCount from hook
          sortOption={sortOption}
          sortOptions={sortOptions}
          onSortChange={handleSortChange}
          t={t}
        />

        {/* Car Grid Area */}
        <InventoryGrid
          cars={cars} loading={loading} error={error} // Data from useInventoryData
          filters={appliedFilters} // Pass appliedFilters for tracking
          activeImageIndex={activeImageIndex} // UI state from page
          onNextImage={nextImage} // Handler from page
          onPrevImage={prevImage} // Handler from page
          onTrackInteraction={trackSearchInteraction} // Handler from useTracking hook
          t={t}
        />

        {/* --- Pagination Controls --- */}
        {/* Render only if there's more than one page and not initial loading */}
        {totalPages > 1 && !loading && ( // Added !loading check
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange} // Pass handler from useInventoryFilters
          // t={t} // Pass t if needed inside PaginationControls
          />
        )}
        {/* REMOVED old placeholder div */}

      </section>
    </div>
  );
}