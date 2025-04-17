// app/inventory/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider"; // Keep if AdvancedCarFilters uses it
import { Badge } from "@/components/ui/badge"; // Keep if used
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Filter, Fuel, Gauge, RefreshCcw, Tag, Calendar, X, ChevronUp, ChevronDown, AlertCircle, Search, Sparkles } from "lucide-react";
import { AdvancedCarFilters } from "@/components/filters/AdvancedCarFilters";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from 'next-intl'; // Import useTranslations

export const dynamic = 'force-dynamic';

// Type for car listing from database (unchanged)
interface CarListing { /* ... */
  id: string; make: string; model: string; year: number | null; price: number | null; mileage: number | null; fuel_type: string | null; transmission: string | null; condition: string | null; location_city: string | null; location_country: string | null; images: string[] | null; description: string | null; body_type?: string | null;
}
// Interfaces for makes and models (unchanged)
interface CarMake { id: string; name: string; }
interface CarModel { id: string; make_id: string; name: string; }

// **** FilterState Interface (includes advanced optional fields) ****
interface FilterState {
  make: string;
  model: string;
  yearMin: number; // Basic filters are required numbers
  yearMax: number;
  priceMin: number;
  priceMax: number;
  mileageMin: number;
  mileageMax: number;
  fuelType: string;
  transmission: string;
  condition: string;
  bodyType: string;
  // Advanced fields are optional numbers
  horsepowerMin?: number;
  horsepowerMax?: number;
  displacementMin?: number;
  displacementMax?: number;
  cylindersMin?: number;
  cylindersMax?: number;
  // Add others as needed...
}

// **** Default filter values (advanced fields can be undefined) ****
const defaultFilters: FilterState = {
  make: "Any",
  model: "Any",
  yearMin: 2010,
  yearMax: new Date().getFullYear(),
  priceMin: 0,
  priceMax: 150000,
  mileageMin: 0,
  mileageMax: 100000,
  fuelType: "Any",
  transmission: "Any",
  condition: "Any",
  bodyType: "Any",
  // Defaults for advanced fields
  horsepowerMin: undefined,
  horsepowerMax: undefined,
  displacementMin: undefined,
  displacementMax: undefined,
  cylindersMin: undefined,
  cylindersMax: undefined,
  // Add others...
};

// Helper function to parse sort option (unchanged)
const parseSortOption = (option: string): [string, string] => {
  if (!option || !option.includes('-')) return ['created_at', 'desc'];
  const [field, direction] = option.split('-');
  return [field, direction];
};

// First, we need to define the isFirstLoad ref outside the component to ensure it properly persists
const isFirstLoad = { current: true };

// Suspense Wrapper (unchanged)
export default function InventoryPageWrapper() {
  // No translation needed for the skeleton itself, but wrapping component needs it
  return (<Suspense fallback={<InventoryLoadingSkeleton />}><InventoryPage /></Suspense>);
}

function InventoryLoadingSkeleton() {
  const t = useTranslations('InventoryPage'); // Hook needed even in skeleton wrapper if text is added
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
  const t = useTranslations('InventoryPage'); // Initialize useTranslations
  const searchParams = useSearchParams();
  const router = useRouter();

  // Helper function for price formatting (CHANGED)
  const formatPrice = (price: number | null | undefined): string => {
    if (price == null) return t('card.priceNA');
    // Use a Swiss locale (e.g., 'de-CH') and 'CHF' currency
    // You can choose 'fr-CH' or 'it-CH' if that's more appropriate for your target audience
    return new Intl.NumberFormat('de-CH', { // <-- Changed locale
      style: 'currency',
      currency: 'CHF', // <-- Changed currency code
      maximumFractionDigits: 0 // Keep no decimals if desired
    }).format(price);
  };
  // Helper function for mileage formatting (use translated unit)
  const formatMileage = (mileage: number | null | undefined): string => {
    if (mileage == null) return t('card.mileageNA');
    return `${new Intl.NumberFormat('de-CH').format(mileage)} ${t('card.unitMiles')}`;

  };

  // **** CORRECTED HELPER FUNCTIONS (defined inside component or globally) ****
  const getIntParam = useCallback((name: string, defaultValue?: number): number | undefined => {
    const param = searchParams?.get(name);
    if (param === null || param === undefined) return defaultValue;
    const parsed = parseInt(param, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }, [searchParams]); // Depend on searchParams

  const getStringParam = useCallback((name: string, defaultValue: string): string => {
    return searchParams?.get(name) || defaultValue;
  }, [searchParams]); // Depend on searchParams

  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state initialization - Corrected assignments
  const [filters, setFilters] = useState<FilterState>(() => {
    const initialFilters = { ...defaultFilters }; // Start with base defaults

    // Basic Filters (Strings)
    initialFilters.bodyType = getStringParam('body_type', defaultFilters.bodyType);
    initialFilters.fuelType = getStringParam('fuel_type', defaultFilters.fuelType);
    initialFilters.make = getStringParam('make', defaultFilters.make);
    initialFilters.model = getStringParam('model', defaultFilters.model);
    initialFilters.condition = getStringParam('condition', defaultFilters.condition);
    initialFilters.transmission = getStringParam('transmission', defaultFilters.transmission);

    // Basic Filters (Required Numbers - Use ?? to guarantee a number)
    initialFilters.priceMin = getIntParam('price_min', defaultFilters.priceMin) ?? defaultFilters.priceMin;
    initialFilters.priceMax = getIntParam('price_max', defaultFilters.priceMax) ?? defaultFilters.priceMax;
    initialFilters.yearMin = getIntParam('year_from', defaultFilters.yearMin) ?? defaultFilters.yearMin;
    initialFilters.yearMax = getIntParam('year_to', defaultFilters.yearMax) ?? defaultFilters.yearMax;
    initialFilters.mileageMin = getIntParam('mileage_min', defaultFilters.mileageMin) ?? defaultFilters.mileageMin;
    initialFilters.mileageMax = getIntParam('mileage_max', defaultFilters.mileageMax) ?? defaultFilters.mileageMax;

    // Advanced Filters (Optional Numbers - Assign number | undefined directly)
    initialFilters.horsepowerMin = getIntParam('hp_min');
    initialFilters.horsepowerMax = getIntParam('hp_max');
    initialFilters.displacementMin = getIntParam('disp_min');
    initialFilters.displacementMax = getIntParam('disp_max');
    initialFilters.cylindersMin = getIntParam('cyl_min');
    initialFilters.cylindersMax = getIntParam('cyl_max');
    // Add others...

    return initialFilters;
  });

  const [sortOption, setSortOption] = useState<string>(() => {
    return searchParams?.get('sort') || "price-asc";
  });

  // Other state variables
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [makesLoading, setMakesLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});
  const [aiSearchInput, setAiSearchInput] = useState("");
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Add this function to handle scrolling back to filters
  const scrollToFilters = () => {
    const filterSection = document.getElementById('filter-section');
    if (filterSection) {
      filterSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Add a simple state to track if we're scrolled past filters
  const [isScrolledPastFilters, setIsScrolledPastFilters] = useState(false);

  // Add a simple scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const filterSection = document.getElementById('filter-section');
      if (filterSection) {
        // Check if we're scrolled past the filters
        const filterBottom = filterSection.getBoundingClientRect().bottom;
        setIsScrolledPastFilters(filterBottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Data Fetching and Filtering Logic ---
  const fetchAndSetCars = useCallback(async (currentFilters: FilterState, currentSort: string, updateUrl: boolean = true) => {
    setLoading(true);
    setError(null);
    const queryParams = new URLSearchParams();

    // Always add is_public=true filter to only show listings marked as public
    queryParams.append('is_public', 'true');

    // Build query params - Check for undefined on optional fields
    if (currentFilters.make !== defaultFilters.make) queryParams.append('make', currentFilters.make);
    if (currentFilters.model && currentFilters.model !== defaultFilters.model && currentFilters.model !== "Any") queryParams.append('model', currentFilters.model);
    // Basic number filters (already guaranteed to be numbers)
    if (currentFilters.yearMin > defaultFilters.yearMin) queryParams.append('year_from', currentFilters.yearMin.toString());
    if (currentFilters.yearMax < defaultFilters.yearMax) queryParams.append('year_to', currentFilters.yearMax.toString());
    if (currentFilters.priceMin > defaultFilters.priceMin) queryParams.append('price_min', currentFilters.priceMin.toString());
    if (currentFilters.priceMax < defaultFilters.priceMax) queryParams.append('price_max', currentFilters.priceMax.toString());
    if (currentFilters.mileageMin > defaultFilters.mileageMin) queryParams.append('mileage_min', currentFilters.mileageMin.toString());
    if (currentFilters.mileageMax < defaultFilters.mileageMax) queryParams.append('mileage_max', currentFilters.mileageMax.toString());
    // Basic string filters
    if (currentFilters.fuelType !== defaultFilters.fuelType) queryParams.append('fuel_type', currentFilters.fuelType);
    if (currentFilters.transmission !== defaultFilters.transmission) queryParams.append('transmission', currentFilters.transmission);
    if (currentFilters.condition !== defaultFilters.condition) queryParams.append('condition', currentFilters.condition);
    if (currentFilters.bodyType !== defaultFilters.bodyType) queryParams.append('body_type', currentFilters.bodyType);

    // Advanced optional number filters (check for undefined)
    if (currentFilters.horsepowerMin !== undefined) queryParams.append('hp_min', currentFilters.horsepowerMin.toString());
    if (currentFilters.horsepowerMax !== undefined) queryParams.append('hp_max', currentFilters.horsepowerMax.toString());
    if (currentFilters.displacementMin !== undefined) queryParams.append('disp_min', currentFilters.displacementMin.toString());
    if (currentFilters.displacementMax !== undefined) queryParams.append('disp_max', currentFilters.displacementMax.toString());
    if (currentFilters.cylindersMin !== undefined) queryParams.append('cyl_min', currentFilters.cylindersMin.toString());
    if (currentFilters.cylindersMax !== undefined) queryParams.append('cyl_max', currentFilters.cylindersMax.toString());
    // Add others...

    // Sorting
    const [sortBy, sortOrder] = parseSortOption(currentSort);
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);
    if (currentSort !== "price-asc") queryParams.append('sort', currentSort); // Keep original sort param if needed

    const searchString = queryParams.toString();
    const currentSearchString = searchParams?.toString() ?? "";

    // Only update URL if specifically requested
    if (updateUrl && searchString !== currentSearchString) {
      router.replace(`/inventory?${searchString}`, { scroll: false });
    }

    console.log("Fetching inventory with:", searchString || " (no params)");
    try {
      const response = await fetch(`/api/inventory?${searchString}`);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API Error (${response.status}): ${errorBody}`);
      }
      const result = await response.json();
      if (result && Array.isArray(result.data)) {
        setCars(result.data);
      }
      else {
        console.error('Unexpected API data format:', result);
        setError(t('errorLoading', { message: 'Received invalid data format' })); // Translate error
        setCars([]);
      }
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError(t('errorLoading', { message: err instanceof Error ? err.message : 'Please try again.' })); // Translate error
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [router, searchParams, t]); // Added t to dependencies

  // MODIFY this effect to only fetch on initial load and when sort changes
  useEffect(() => {
    console.log("Sort option changed, refetching cars...");
    fetchAndSetCars(filters, sortOption, false); // Don't update URL on sort change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption]); // Remove filters from dependency array, only refetch on sort changes

  // Effect to sync state FROM URL - Corrected assignments
  useEffect(() => {
    if (!searchParams) return;

    if (isFirstLoad.current) {
      isFirstLoad.current = false;

      // Only sync from URL on first load
      const filtersFromUrl: FilterState = {
        // Basic (Strings)
        make: getStringParam('make', defaultFilters.make),
        model: getStringParam('model', defaultFilters.model),
        fuelType: getStringParam('fuel_type', defaultFilters.fuelType),
        transmission: getStringParam('transmission', defaultFilters.transmission),
        condition: getStringParam('condition', defaultFilters.condition),
        bodyType: getStringParam('body_type', defaultFilters.bodyType),

        // Basic (Numbers - ensure they are numbers)
        priceMin: getIntParam('price_min', defaultFilters.priceMin) ?? defaultFilters.priceMin,
        priceMax: getIntParam('price_max', defaultFilters.priceMax) ?? defaultFilters.priceMax,
        yearMin: getIntParam('year_from', defaultFilters.yearMin) ?? defaultFilters.yearMin,
        yearMax: getIntParam('year_to', defaultFilters.yearMax) ?? defaultFilters.yearMax,
        mileageMin: getIntParam('mileage_min', defaultFilters.mileageMin) ?? defaultFilters.mileageMin,
        mileageMax: getIntParam('mileage_max', defaultFilters.mileageMax) ?? defaultFilters.mileageMax,

        // Advanced (Optional Numbers)
        horsepowerMin: getIntParam('hp_min'),
        horsepowerMax: getIntParam('hp_max'),
        displacementMin: getIntParam('disp_min'),
        displacementMax: getIntParam('disp_max'),
        cylindersMin: getIntParam('cyl_min'),
        cylindersMax: getIntParam('cyl_max'),
      };
      const sortFromUrl = searchParams.get('sort') || "price-asc";

      // Update state with URL values
      setFilters(filtersFromUrl);
      setSortOption(sortFromUrl);

      // Initial data fetch based on URL params
      fetchAndSetCars(filtersFromUrl, sortFromUrl, false); // Don't update URL on initial fetch
    }
    // Remove dependencies on filters and sortOption to prevent recursive updates
  }, [searchParams, getIntParam, getStringParam]);

  // Fetch makes
  useEffect(() => {
    const fetchMakes = async () => {
      setMakesLoading(true);
      try {
        const response = await fetch('/api/car-makes');
        if (!response.ok) {
          throw new Error('Failed to fetch car makes');
        }
        const data = await response.json();
        setMakes(data);
      } catch (err) {
        console.error('Error fetching car makes:', err);
      } finally {
        setMakesLoading(false);
      }
    };

    fetchMakes();
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    if (filters.make === "Any") {
      setAvailableModels([]);
      // Ensure model filter is also reset if make goes back to "Any"
      if (filters.model !== "Any") {
        handleFilterChange("model", "Any"); // Use handler to potentially trigger other logic
      }
      return;
    }

    // Find the selected make's ID
    const selectedMake = makes.find(make => make.name === filters.make);
    if (!selectedMake) {
      console.error('Selected make not found in makes list');
      setAvailableModels([]);
      return;
    }

    setModelsLoading(true);

    fetch(`/api/car-models?make_id=${selectedMake.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch models');
        return res.json();
      })
      .then(data => {
        setAvailableModels(data);
      })
      .catch(err => {
        console.error('Error fetching car models:', err);
        setAvailableModels([]);
      })
      .finally(() => {
        setModelsLoading(false);
      });
  }, [filters.make, makes]); // Removed handleFilterChange from deps

  // --- Event Handlers ---
  const handleFilterChange = (name: keyof FilterState, value: string | number) => {
    setFilters(prev => {
      const newState = { ...prev, [name]: value };
      // Reset model when make changes
      if (name === "make" && value !== prev.make) {
        newState.model = "Any";
        // Clear model search term as well
        setModelSearchTerm('');
      }
      return newState;
    });
  };

  const handleSliderChange = (nameMin: keyof FilterState, nameMax: keyof FilterState, value: number[]) => {
    // Ensure values are treated as numbers, even if state field is optional
    const numValue0 = value[0];
    const numValue1 = value[1];
    if (filters[nameMin] !== numValue0 || filters[nameMax] !== numValue1) {
      setFilters(prev => ({ ...prev, [nameMin]: numValue0, [nameMax]: numValue1, }));
    }
  };

  const applyFilters = () => {
    console.log("Manual Apply Filters triggered");
    fetchAndSetCars(filters, sortOption, true); // true means update URL
    trackSearchInteraction(filters);
  };

  const resetFilters = () => {
    if (JSON.stringify(filters) === JSON.stringify(defaultFilters) && sortOption === "price-asc") return;
    setFilters(defaultFilters);
    setSortOption("price-asc");
    setModelSearchTerm(''); // Reset model search term
    router.replace('/inventory', { scroll: false });
    // Fetch cars with default filters after resetting state and URL
    fetchAndSetCars(defaultFilters, "price-asc");
  };

  const handleSortChange = (value: string) => {
    if (value === sortOption) return;
    setSortOption(value);
    // Fetching happens automatically via the useEffect watching sortOption
  };

  const nextImage = (carId: string, imageCount: number) => {
    if (imageCount <= 0) return;
    setActiveImageIndex(prev => ({
      ...prev,
      [carId]: ((prev[carId] || 0) + 1) % imageCount
    }));
  };

  const prevImage = (carId: string, imageCount: number) => {
    if (imageCount <= 0) return;
    setActiveImageIndex(prev => ({
      ...prev,
      [carId]: ((prev[carId] || 0) - 1 + imageCount) % imageCount
    }));
  };

  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  const trackSearchInteraction = async (appliedFilters: FilterState, clickedListingId: string | null = null) => {
    try {
      // Get session ID from localStorage or create a new one
      let sessionId = localStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem('session_id', sessionId);
      }

      // Extract make_id and model_id if they exist in the filtered results
      let makeId: string | null = null;
      let modelId: string | null = null;

      // If make is selected, find the corresponding make_id
      if (appliedFilters.make && appliedFilters.make !== "Any") {
        const selectedMake = makes.find(make => make.name === appliedFilters.make);
        if (selectedMake) {
          makeId = selectedMake.id;
        }
      }

      // If model is selected, find the corresponding model_id
      if (appliedFilters.model && appliedFilters.model !== "" && appliedFilters.model !== "Any") { // Check for "Any" here too
        const selectedModel = availableModels.find(model => model.name === appliedFilters.model);
        if (selectedModel) {
          modelId = selectedModel.id;
        }
      }

      // Send the tracking data
      await fetch('/api/track/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          make_id: makeId,
          model_id: modelId,
          filters: appliedFilters,
          clicked_listing_id: clickedListingId
        }),
      });
    } catch (trackingError) {
      // Only log a warning, don't disrupt the main functionality
      console.warn('Failed to track search interaction:', trackingError);
    }
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aiSearchInput.trim()) {
      return;
    }

    setAiSearchLoading(true);
    setSearchError(null);

    try {
      // Get session ID from localStorage or create a new one
      let sessionId = localStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem('session_id', sessionId);
      }

      const response = await fetch('/api/ai-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: aiSearchInput
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Check if the error is the specific 'Could not understand' message
        if (errorText?.toLowerCase().includes('could not understand')) {
          throw new Error(t('aiSearch.errorCouldNotUnderstand'));
        }
        throw new Error(errorText || t('aiSearch.errorPrefix'));
      }

      const { parsed_filters, confidence, success } = await response.json();

      if (!success || !parsed_filters) {
        throw new Error(t('aiSearch.errorCouldNotUnderstand'));
      }

      // Update filters based on AI results
      const newFilters = { ...filters }; // Start with current filters

      // Map the parsed_filters to our filter state, falling back to existing if not provided by AI
      newFilters.make = parsed_filters.make ?? newFilters.make;
      newFilters.model = parsed_filters.model ?? newFilters.model;
      newFilters.bodyType = parsed_filters.body_type ?? newFilters.bodyType;

      // Handle numeric ranges
      newFilters.yearMin = parsed_filters.year_min ?? newFilters.yearMin;
      newFilters.yearMax = parsed_filters.year_max ?? newFilters.yearMax;
      newFilters.priceMin = parsed_filters.price_min ?? newFilters.priceMin;
      newFilters.priceMax = parsed_filters.price_max ?? newFilters.priceMax;
      newFilters.mileageMin = parsed_filters.mileage_min ?? newFilters.mileageMin;
      newFilters.mileageMax = parsed_filters.mileage_max ?? newFilters.mileageMax;

      // Handle other categorical filters
      newFilters.fuelType = parsed_filters.fuel_type ?? newFilters.fuelType;
      newFilters.transmission = parsed_filters.transmission ?? newFilters.transmission;
      newFilters.condition = parsed_filters.condition ?? newFilters.condition;

      // Ensure model is reset if make changed but model didn't
      if (parsed_filters.make && parsed_filters.make !== filters.make && !parsed_filters.model) {
        newFilters.model = 'Any';
      }

      // Update filter state
      setFilters(newFilters);

      // Auto-apply filters
      setTimeout(() => {
        applyFilters(); // applyFilters already calls fetchAndSetCars

        // Show success message with confidence level
        toast({
          title: t('aiSearch.toastTitle'),
          description: confidence > 0.8
            ? t('aiSearch.toastDescSuccess')
            : t('aiSearch.toastDescPotential'),
          variant: confidence > 0.8 ? "default" : "secondary"
        });
      }, 100); // Small delay to allow state update

    } catch (error) {
      console.error('AI search error:', error);
      // Use the error message directly if it's already translated, otherwise use prefix
      const errorMessage = error instanceof Error ? error.message : t('aiSearch.errorPrefix');
      // Check if the message is one of the known translated errors
      const knownErrors = [t('aiSearch.errorCouldNotUnderstand'), t('aiSearch.errorPrefix')];
      const displayError = knownErrors.includes(errorMessage) ? errorMessage : `${t('aiSearch.errorPrefix')}: ${errorMessage}`;
      setSearchError(displayError);
    } finally {
      setAiSearchLoading(false);
    }
  };

  // --- Render Logic ---
  if (loading && cars.length === 0 && !error) { return <InventoryLoadingSkeleton />; }
  if (error && cars.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold text-red-500">{t('errorTitle')}</h2>
        <p>{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>{t('errorTryAgain')}</Button>
      </div>
    </div>;
  }

  // Prepare filter options from JSON
  // Cast to expected type for safety, although explicit casting in map is the direct fix
  const bodyTypeOptions = t.raw('bodyTypes') as Record<string, string>;
  const fuelTypeOptions = t.raw('fuelTypes') as Record<string, string>;
  const transmissionOptions = t.raw('transmissions') as Record<string, string>;
  const conditionOptions = t.raw('conditions') as Record<string, string>;
  const sortOptions = t.raw('sortOptions') as Record<string, string>;


  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-muted/40 py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <section className="container max-w-6xl mx-auto px-6">
        {/* AI Search */}
        <div className="py-6 mb-6">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              {t('aiSearch.title')}
            </h2>

            <form onSubmit={handleAiSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={aiSearchInput}
                  onChange={(e) => setAiSearchInput(e.target.value)}
                  placeholder={t('aiSearch.placeholder')}
                  className="pl-10 w-full"
                  disabled={aiSearchLoading}
                />
              </div>
              <Button type="submit" disabled={aiSearchLoading}>
                {aiSearchLoading ? t('aiSearch.buttonLoading') : t('aiSearch.buttonIdle')}
              </Button>
            </form>

            {searchError && (
              <div className="mt-2 text-sm text-red-500 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {searchError}
              </div>
            )}
          </div>
        </div>

        {/* **** FULL FILTERS SECTION **** */}
        <div id="filter-section" className="bg-background py-8 border-y mb-6">
          <div className="container max-w-6xl mx-auto px-4">
            {/* Basic Filters Row 1: Make, Model, Body Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
              {/* Make */}
              <div className="space-y-1">
                <label className="block text-sm font-medium mb-2">{t('filters.makeLabel')}</label>
                <Select
                  value={filters.make}
                  onValueChange={(value) => {
                    handleFilterChange("make", value);
                    // No immediate fetch - wait for Apply button
                  }}
                  disabled={makesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={makesLoading ? t('filters.makePlaceholderLoading') : t('filters.makePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">{t('filters.optionAny')}</SelectItem>
                    {makes.map(make => (
                      <SelectItem key={make.id} value={make.name}>{make.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model */}
              <div className="space-y-1">
                <label className="block text-sm font-medium mb-2">{t('filters.modelLabel')}</label>
                <Select
                  value={filters.model}
                  onValueChange={(value) => {
                    handleFilterChange("model", value);
                    // No immediate fetch - wait for Apply button
                  }}
                  disabled={filters.make === "Any" || modelsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={modelsLoading ? t('filters.modelPlaceholderLoading') : t('filters.modelPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Add search input */}
                    <div className="px-2 py-2 sticky top-0 bg-background z-10 border-b">
                      <Input
                        placeholder={t('filters.modelSearchPlaceholder')}
                        className="h-8"
                        onChange={(e) => setModelSearchTerm(e.target.value)}
                        value={modelSearchTerm}
                        onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on input click
                      />
                    </div>

                    <SelectItem value="Any">{t('filters.optionAny')}</SelectItem>

                    {availableModels.length > 0 ? (
                      // Filter models by both name validity and search term
                      availableModels
                        .filter(model =>
                          model.name &&
                          model.name.trim() !== '' &&
                          (!modelSearchTerm || model.name.toLowerCase().includes(modelSearchTerm.toLowerCase()))
                        )
                        .map(model => (
                          <SelectItem key={model.id} value={model.name}>
                            {model.name}
                          </SelectItem>
                        ))
                    ) : (
                      // Show when no models are available
                      !modelsLoading &&
                      <SelectItem value="no-models" disabled>
                        {modelSearchTerm ? t('filters.modelNotFound') : t('filters.modelNotAvailable')}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Body Type */}
              <div className="space-y-1">
                <label className="block text-sm font-medium mb-2">{t('filters.bodyTypeLabel')}</label>
                <Select
                  value={filters.bodyType}
                  onValueChange={(value) => handleFilterChange("bodyType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('filters.bodyTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(bodyTypeOptions).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Number Inputs Row: Price, Year, Mileage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-6">
              {/* Price */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">{t('filters.priceLabel')}</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">{t('filters.minLabel')}</label>
                    <Input
                      type="number"
                      min={0}
                      max={filters.priceMax}
                      value={filters.priceMin}
                      onChange={(e) => {
                        const newValue = e.target.value === '' ? defaultFilters.priceMin : parseInt(e.target.value);
                        if (!isNaN(newValue)) {
                          handleFilterChange("priceMin", newValue);
                        }
                      }}
                      placeholder={t('filters.priceMinPlaceholder')}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">{t('filters.maxLabel')}</label>
                    <Input
                      type="number"
                      min={filters.priceMin}
                      max={defaultFilters.priceMax} // Use default max as ceiling
                      value={filters.priceMax}
                      onChange={(e) => {
                        const newValue = e.target.value === '' ? defaultFilters.priceMax : parseInt(e.target.value);
                        if (!isNaN(newValue)) {
                          handleFilterChange("priceMax", newValue);
                        }
                      }}
                      placeholder={t('filters.priceMaxPlaceholder')}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Year */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">{t('filters.yearLabel')}</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">{t('filters.fromLabel')}</label>
                    <Input
                      type="number"
                      min={defaultFilters.yearMin} // Use default min as floor
                      max={filters.yearMax}
                      value={filters.yearMin}
                      onChange={(e) => {
                        const newValue = e.target.value === '' ? defaultFilters.yearMin : parseInt(e.target.value);
                        if (!isNaN(newValue)) {
                          handleFilterChange("yearMin", newValue);
                        }
                      }}
                      placeholder={t('filters.yearMinPlaceholder')}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">{t('filters.toLabel')}</label>
                    <Input
                      type="number"
                      min={filters.yearMin}
                      max={defaultFilters.yearMax} // Use default max as ceiling
                      value={filters.yearMax}
                      onChange={(e) => {
                        const newValue = e.target.value === '' ? defaultFilters.yearMax : parseInt(e.target.value);
                        if (!isNaN(newValue)) {
                          handleFilterChange("yearMax", newValue);
                        }
                      }}
                      placeholder={t('filters.yearMaxPlaceholder')}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Mileage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">{t('filters.mileageLabel')}</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">{t('filters.minLabel')}</label>
                    <Input
                      type="number"
                      min={0}
                      max={filters.mileageMax}
                      value={filters.mileageMin}
                      onChange={(e) => {
                        const newValue = e.target.value === '' ? defaultFilters.mileageMin : parseInt(e.target.value);
                        if (!isNaN(newValue)) {
                          handleFilterChange("mileageMin", newValue);
                        }
                      }}
                      placeholder={t('filters.mileageMinPlaceholder')}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">{t('filters.maxLabel')}</label>
                    <Input
                      type="number"
                      min={filters.mileageMin}
                      max={defaultFilters.mileageMax} // Use default max as ceiling
                      value={filters.mileageMax}
                      onChange={(e) => {
                        const newValue = e.target.value === '' ? defaultFilters.mileageMax : parseInt(e.target.value);
                        if (!isNaN(newValue)) {
                          handleFilterChange("mileageMax", newValue);
                        }
                      }}
                      placeholder={t('filters.mileageMaxPlaceholder')}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Filters Row 2: Fuel, Transmission, Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
              {/* Fuel */}
              <div className="space-y-1">
                <label className="block text-sm font-medium mb-2">{t('filters.fuelTypeLabel')}</label>
                <Select
                  value={filters.fuelType}
                  onValueChange={(value) => handleFilterChange("fuelType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('filters.fuelTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(fuelTypeOptions).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transmission */}
              <div className="space-y-1">
                <label className="block text-sm font-medium mb-2">{t('filters.transmissionLabel')}</label>
                <Select
                  value={filters.transmission}
                  onValueChange={(value) => handleFilterChange("transmission", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('filters.transmissionPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(transmissionOptions).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <label className="block text-sm font-medium mb-2">{t('filters.conditionLabel')}</label>
                <Select
                  value={filters.condition}
                  onValueChange={(value) => handleFilterChange("condition", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('filters.conditionPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(conditionOptions).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Actions & Advanced Toggle */}
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mt-4">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={applyFilters} className="flex-1 sm:flex-none">
                  <Filter className="mr-2 h-4 w-4" /> {t('filters.applyButton')}
                </Button>
                <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4" /> {t('filters.resetButton')}
                </Button>
              </div>
              <Button onClick={toggleAdvancedFilters} className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0" variant="outline" size="sm">
                {showAdvancedFilters ?
                  (<><ChevronUp className="h-4 w-4" /> {t('filters.hideAdvancedButton')}</>) :
                  (<><Filter className="h-4 w-4" /> {t('filters.showAdvancedButton')}</>)
                }
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            <div className={`${showAdvancedFilters ? 'block mt-6 border-t pt-6' : 'hidden'}`}>
              {/* Pass translation function 't' down if AdvancedCarFilters needs it */}
              <AdvancedCarFilters
                filters={filters} // Pass the full state
                setFilters={setFilters}
                onClose={toggleAdvancedFilters}
              // t={t} // Example: Pass t if needed
              />
            </div>
          </div>
        </div>

        {/* Simple Back to Filters Button */}
        {isScrolledPastFilters && (
          <div className="fixed bottom-6 right-6 z-30">
            <Button
              onClick={scrollToFilters}
              className="shadow-md"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t('filters.backButton')}
            </Button>
          </div>
        )}

        {/* Results Count and Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-center my-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="text-muted-foreground">
              {t('results.count', { count: cars.length })}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <span className="text-sm">{t('results.sortByLabel')}</span>
            <Select
              value={sortOption}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('results.sortPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sortOptions).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Car Grid Area */}
        <div className="relative min-h-[400px]">
          {loading && cars.length === 0 ? (
            <div className="w-full flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : cars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {cars.map((car, carIndex) => {
                // Skip rendering if the car doesn't have an ID
                if (!car.id) {
                  console.warn("Car missing ID, skipping render:", car);
                  return null;
                }

                const carImageCount = car.images?.length || 0;
                const altText = car.make && car.model ? t('card.imageAlt', { make: car.make, model: car.model, index: (activeImageIndex[car.id] || 0) + 1 }) : t('card.imageAltFallback');

                return (
                  <Card
                    key={car.id}
                    className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] focus-within:scale-[1.02] focus-within:shadow-xl"
                  >
                    {/* Image Carousel */}
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/0 z-10" />

                      {/* Carousel Images */}
                      <div className="relative w-full h-full">
                        {car.images && car.images.length > 0 ? (
                          // Map through available images
                          car.images.map((image, index) => (
                            <div
                              key={index}
                              className={`absolute inset-0 transition-opacity duration-500 ${(activeImageIndex[car.id] || 0) === index ? 'opacity-100' : 'opacity-0'
                                }`}
                            >
                              <Image
                                src={image}
                                alt={car.make && car.model ? t('card.imageAlt', { make: car.make, model: car.model, index: index + 1 }) : t('card.imageAltFallback')}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                                priority={carIndex < 3} // Prioritize loading images for the first few cards
                                onError={(e) => {
                                  // Fallback for broken image links
                                  (e.target as HTMLImageElement).src = '/images/car-placeholder.jpg';
                                  (e.target as HTMLImageElement).srcset = ''; // Clear srcset as well
                                }}
                              />
                            </div>
                          ))
                        ) : (
                          // Fallback for no images
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                              <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                              <p className="text-sm text-muted-foreground mt-2">{t('card.noImage')}</p>
                            </div>
                          </div>
                        )}

                        {/* Only show carousel controls if there are multiple images */}
                        {car.images && car.images.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation(); // Prevent event bubbling to card
                                prevImage(car.id, carImageCount);
                                e.currentTarget.blur(); // Remove focus after click
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white transition-colors bg-black/20 rounded-full p-1"
                              aria-label={t('card.prevImageLabel')}
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation(); // Prevent event bubbling to card
                                nextImage(car.id, carImageCount);
                                e.currentTarget.blur(); // Remove focus after click
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white transition-colors bg-black/20 rounded-full p-1"
                              aria-label={t('card.nextImageLabel')}
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">
                          {car.year ? `${car.year} ` : ''}{car.make} {car.model}
                        </h3>
                        {/* Price Display */}
                        <div className="flex-shrink-0 relative">
                          <div className="absolute inset-0 bg-primary/10 rounded-full blur-sm"></div>
                          <div className="relative font-bold text-lg text-primary px-3 py-1 rounded-full border border-primary/20 bg-primary/5">
                            {formatPrice(car.price)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-4">
                      <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Fuel className="h-4 w-4" />
                          <span>{car.fuel_type || t('card.fuelNA')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Gauge className="h-4 w-4" />
                          <span>{formatMileage(car.mileage)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          <span>{car.transmission || t('card.transmissionNA')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{car.year || t('card.yearNA')}</span>
                        </div>
                      </div>

                      {/* Location info if available */}
                      {(car.location_city || car.location_country) && (
                        <div className="mt-3 text-sm text-muted-foreground">
                          <div className="flex items-start gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>
                              {car.location_city && car.location_country
                                ? `${car.location_city}, ${car.location_country}`
                                : car.location_city || car.location_country}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex justify-between border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: t('toastMessages.compareAddedTitle'),
                            description: t('toastMessages.compareAddedDesc', { make: car.make, model: car.model }),
                          });
                        }}
                      >
                        {t('card.addToCompareButton')}
                      </Button>
                      <Link
                        href={car && car.id ? `/inventory/${car.id}` : '#'}
                        onClick={(e) => {
                          // Prevent navigation if car.id is missing
                          if (!car || !car.id) {
                            e.preventDefault();
                            console.error("View Details clicked with invalid car.id:", car?.id);
                            toast({
                              title: t('toastMessages.errorTitle'),
                              description: t('toastMessages.errorViewDetails'),
                              variant: "destructive"
                            });
                            return;
                          }

                          // Track the interaction but don't block navigation if it fails
                          try {
                            if (typeof trackSearchInteraction === 'function') {
                              trackSearchInteraction(filters, car.id);
                            } else {
                              console.warn("trackSearchInteraction function is not available.");
                            }
                          } catch (error) {
                            console.error("Error during trackSearchInteraction:", error);
                            // Do NOT prevent navigation - let the link proceed even if tracking fails
                          }
                        }}
                        className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 ${!car || !car.id ? 'opacity-50 pointer-events-none' : ''}`}
                        aria-disabled={!car || !car.id}
                        tabIndex={!car || !car.id ? -1 : undefined}
                      >
                        {t('card.viewDetailsButton')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="w-full p-8 text-center">
              <div className="bg-muted/50 rounded-lg p-8 max-w-md mx-auto">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t('results.emptyTitle')}</p>
                <Button onClick={resetFilters} variant="outline" className="mt-2">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {t('results.resetFiltersButton')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pagination Placeholder - Add real pagination when ready */}
        {cars.length > 0 && (
          <div className="flex justify-center mb-12">
            <div className="flex space-x-1">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">{t('pagination.previous')}</span>
              </Button>
              {/* Placeholder pagination numbers */}
              <Button variant="default" size="sm" className="px-4 h-8">1</Button>
              <Button variant="outline" size="sm" className="px-4 h-8">2</Button>
              <Button variant="outline" size="sm" className="px-4 h-8">3</Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">{t('pagination.next')}</span>
              </Button>
            </div>
          </div>
        )}

      </section>
    </div>
  );
}