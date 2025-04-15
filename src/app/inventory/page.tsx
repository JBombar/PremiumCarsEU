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
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Filter, Fuel, Gauge, RefreshCcw, Tag, Calendar, X, ChevronUp, ChevronDown, AlertCircle, Search, Sparkles } from "lucide-react";
import { AdvancedCarFilters } from "@/components/filters/AdvancedCarFilters";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/components/ui/use-toast";

export const dynamic = 'force-dynamic';

const formatPrice = (price: number | null | undefined): string => {
  if (price == null) return "N/A";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
};
const formatMileage = (mileage: number | null | undefined): string => {
  if (mileage == null) return "N/A";
  return `${new Intl.NumberFormat('en-US').format(mileage)} mi`;
};

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

// Suspense Wrapper (unchanged)
export default function InventoryPageWrapper() {
  return (<Suspense fallback={<InventoryLoadingSkeleton />}><InventoryPage /></Suspense>);
}
function InventoryLoadingSkeleton() {
  return (<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>);
}

// Main Inventory Page Component
function InventoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // **** CORRECTED HELPER FUNCTIONS (defined inside component or globally) ****
  // getIntParam now correctly handles optional defaultValue
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
  // fetchAndSetCars useCallback (ensure it checks for undefined on advanced filters before appending)
  const fetchAndSetCars = useCallback(async (currentFilters: FilterState, currentSort: string) => {
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
    if (currentSort !== "price-asc") queryParams.append('sort', currentSort);

    const searchString = queryParams.toString();
    const currentSearchString = searchParams?.toString() ?? "";

    if (searchString !== currentSearchString) {
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
        setError('Received invalid data format');
        setCars([]);
      }
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError(`Failed to load inventory. ${err instanceof Error ? err.message : 'Please try again.'}`);
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [router, searchParams]);

  // MODIFY this effect to only fetch on initial load and when sort changes
  useEffect(() => {
    console.log("Sort option changed, refetching cars...");
    fetchAndSetCars(filters, sortOption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption]); // Remove filters from dependency array, only refetch on sort changes

  // Effect to sync state FROM URL - Corrected assignments
  useEffect(() => {
    if (!searchParams) return;

    // Use helpers defined within component scope
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
      // ...
    };
    const sortFromUrl = searchParams.get('sort') || "price-asc";
    const filtersDiffer = JSON.stringify(filtersFromUrl) !== JSON.stringify(filters);
    const sortDiffer = sortFromUrl !== sortOption;

    if (filtersDiffer || sortDiffer) {
      console.log("URL changed, syncing state...");
      if (filtersDiffer) setFilters(filtersFromUrl);
      if (sortDiffer) setSortOption(sortFromUrl);
    }
    // Use dependencies that trigger the effect correctly
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
  }, [filters.make, makes]);

  // Add this new effect for initial data loading
  useEffect(() => {
    console.log("Initial data loading...");
    fetchAndSetCars(filters, sortOption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means this runs only once on mount

  // --- Event Handlers ---
  const handleFilterChange = (name: keyof FilterState, value: string | number) => {
    setFilters(prev => {
      const newState = { ...prev, [name]: value };
      if (name === "make" && value !== prev.make) newState.model = "Any";
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
    fetchAndSetCars(filters, sortOption);
    trackSearchInteraction(filters);
  };

  const resetFilters = () => {
    if (JSON.stringify(filters) === JSON.stringify(defaultFilters) && sortOption === "price-asc") return;
    setFilters(defaultFilters);
    setSortOption("price-asc");
    router.replace('/inventory', { scroll: false });
  };

  const handleSortChange = (value: string) => {
    if (value === sortOption) return;
    setSortOption(value);
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
      if (appliedFilters.model && appliedFilters.model !== "") {
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
        const error = await response.text();
        throw new Error(error || 'Failed to process your search');
      }

      const { parsed_filters, confidence, success } = await response.json();

      if (!success || !parsed_filters) {
        throw new Error('Could not understand your search. Please try again with different wording.');
      }

      // Update filters based on AI results
      const newFilters = { ...filters };

      // Map the parsed_filters to our filter state
      if (parsed_filters.make) newFilters.make = parsed_filters.make;
      if (parsed_filters.model) newFilters.model = parsed_filters.model;
      if (parsed_filters.body_type) newFilters.bodyType = parsed_filters.body_type;

      // Handle numeric ranges
      if (parsed_filters.year_min) newFilters.yearMin = parsed_filters.year_min;
      if (parsed_filters.year_max) newFilters.yearMax = parsed_filters.year_max;
      if (parsed_filters.price_min) newFilters.priceMin = parsed_filters.price_min;
      if (parsed_filters.price_max) newFilters.priceMax = parsed_filters.price_max;
      if (parsed_filters.mileage_min) newFilters.mileageMin = parsed_filters.mileage_min;
      if (parsed_filters.mileage_max) newFilters.mileageMax = parsed_filters.mileage_max;

      // Handle other categorical filters
      if (parsed_filters.fuel_type) newFilters.fuelType = parsed_filters.fuel_type;
      if (parsed_filters.transmission) newFilters.transmission = parsed_filters.transmission;
      if (parsed_filters.condition) newFilters.condition = parsed_filters.condition;

      // Update filter state
      setFilters(newFilters);

      // Auto-apply filters
      setTimeout(() => {
        applyFilters();

        // Show success message with confidence level
        toast({
          title: "Search processed",
          description: confidence > 0.8
            ? "Found exactly what you're looking for!"
            : "Found potential matches. You can adjust filters if needed.",
          variant: confidence > 0.8 ? "default" : "secondary"
        });
      }, 100);

    } catch (error) {
      console.error('AI search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to process your search');
    } finally {
      setAiSearchLoading(false);
    }
  };

  // --- Render Logic ---
  if (loading && cars.length === 0 && !error) { return <InventoryLoadingSkeleton />; }
  if (error && cars.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold text-red-500">Error</h2>
        <p>{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-muted/40 py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Browse Our Inventory</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our extensive collection of premium vehicles. Use the filters to find your perfect match.
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
              What are you looking for?
            </h2>

            <form onSubmit={handleAiSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={aiSearchInput}
                  onChange={(e) => setAiSearchInput(e.target.value)}
                  placeholder="e.g. A weekend coupe under 50k"
                  className="pl-10 w-full"
                  disabled={aiSearchLoading}
                />
              </div>
              <Button type="submit" disabled={aiSearchLoading}>
                {aiSearchLoading ? "Searching..." : "Search"}
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
            {/* All existing filter content stays here */}
            {/* Basic Filters Row 1: Make, Model, Body Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
              {/* Make */}
              <div className="space-y-1">
                <label className="block text-sm font-medium mb-2">Make</label>
                <Select
                  value={filters.make}
                  onValueChange={(value) => handleFilterChange("make", value)}
                  disabled={makesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={makesLoading ? "Loading makes..." : "Select make"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any</SelectItem>
                    {makes.map(make => (
                      <SelectItem key={make.id} value={make.name}>{make.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model */}
              <div className="space-y-1">
                <label className="block text-sm font-medium mb-2">Model</label>
                <Select
                  value={filters.model}
                  onValueChange={(value) => handleFilterChange("model", value)}
                  disabled={filters.make === "Any" || modelsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={modelsLoading ? "Loading models..." : "Select model"} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Add search input */}
                    <div className="px-2 py-2 sticky top-0 bg-background z-10 border-b">
                      <Input
                        placeholder="Search models..."
                        className="h-8"
                        onChange={(e) => setModelSearchTerm(e.target.value)}
                        value={modelSearchTerm}
                        onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on input click
                      />
                    </div>

                    <SelectItem value="Any">Any</SelectItem>

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
                        {modelSearchTerm ? "No matching models" : "No models available"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Body Type */}
              <div className="space-y-1">
                <label className="block text-sm font-medium mb-2">Body Type</label>
                <Select
                  value={filters.bodyType}
                  onValueChange={(value) => handleFilterChange("bodyType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select body type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Any', 'Sedan', 'SUV', 'Coupe', 'Convertible', 'Hatchback', 'Wagon', 'Truck', 'Van'].map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Number Inputs Row: Price, Year, Mileage - REPLACED SLIDERS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-6">
              {/* Price */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">Price Range</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Min</label>
                    <Input
                      type="number"
                      min={0}
                      max={filters.priceMax}
                      value={filters.priceMin}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          handleFilterChange("priceMin", value);
                        }
                      }}
                      placeholder="Min Price"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max</label>
                    <Input
                      type="number"
                      min={filters.priceMin}
                      max={defaultFilters.priceMax}
                      value={filters.priceMax}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          handleFilterChange("priceMax", value);
                        }
                      }}
                      placeholder="Max Price"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Year */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">Year Range</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">From</label>
                    <Input
                      type="number"
                      min={defaultFilters.yearMin}
                      max={filters.yearMax}
                      value={filters.yearMin}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          handleFilterChange("yearMin", value);
                        }
                      }}
                      placeholder="From Year"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">To</label>
                    <Input
                      type="number"
                      min={filters.yearMin}
                      max={defaultFilters.yearMax}
                      value={filters.yearMax}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          handleFilterChange("yearMax", value);
                        }
                      }}
                      placeholder="To Year"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Mileage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">Mileage Range</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Min</label>
                    <Input
                      type="number"
                      min={0}
                      max={filters.mileageMax}
                      value={filters.mileageMin}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          handleFilterChange("mileageMin", value);
                        }
                      }}
                      placeholder="Min Mileage"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max</label>
                    <Input
                      type="number"
                      min={filters.mileageMin}
                      max={defaultFilters.mileageMax}
                      value={filters.mileageMax}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          handleFilterChange("mileageMax", value);
                        }
                      }}
                      placeholder="Max Mileage"
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
                <label className="block text-sm font-medium mb-2">Fuel Type</label>
                <Select
                  value={filters.fuelType}
                  onValueChange={(value) => handleFilterChange("fuelType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Any', 'Gasoline', 'Diesel', 'Hybrid', 'Electric'].map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transmission */}
              <div className="space-y-1">
                <label className="block text-sm font-medium mb-2">Transmission</label>
                <Select
                  value={filters.transmission}
                  onValueChange={(value) => handleFilterChange("transmission", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transmission" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Any', 'Automatic', 'Manual', 'CVT', 'PDK'].map(transmission => (
                      <SelectItem key={transmission} value={transmission}>{transmission}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <label className="block text-sm font-medium mb-2">Condition</label>
                <Select
                  value={filters.condition}
                  onValueChange={(value) => handleFilterChange("condition", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Any', 'New', 'Used'].map(condition => (
                      <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Actions & Advanced Toggle */}
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mt-4">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={applyFilters} className="flex-1 sm:flex-none">
                  <Filter className="mr-2 h-4 w-4" /> Apply Filters
                </Button>
                <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
              <Button onClick={toggleAdvancedFilters} className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0" variant="outline" size="sm">
                {showAdvancedFilters ?
                  (<><ChevronUp className="h-4 w-4" /> Hide Advanced</>) :
                  (<><Filter className="h-4 w-4" /> Show Advanced</>)
                }
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            <div className={`${showAdvancedFilters ? 'block mt-6 border-t pt-6' : 'hidden'}`}>
              <AdvancedCarFilters
                filters={filters} // Pass the full state
                setFilters={setFilters}
                onClose={toggleAdvancedFilters}
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
              Back to Filters
            </Button>
          </div>
        )}

        {/* Results Count and Sort - Add filter toggle button */}
        <div className="flex flex-col sm:flex-row justify-between items-center my-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="text-muted-foreground">
              Showing {cars.length} vehicles
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <span className="text-sm">Sort by:</span>
            <Select
              value={sortOption}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="year-desc">Year: Newest First</SelectItem>
                <SelectItem value="year-asc">Year: Oldest First</SelectItem>
                <SelectItem value="mileage-asc">Mileage: Low to High</SelectItem>
                <SelectItem value="mileage-desc">Mileage: High to Low</SelectItem>
                <SelectItem value="created_at-desc">Newest Listings</SelectItem>
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
              {cars.map((car) => {
                // Skip rendering if the car doesn't have an ID
                if (!car.id) {
                  console.warn("Car missing ID, skipping render:", car);
                  return null;
                }

                const carImageCount = car.images?.length || 0;

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
                                alt={`${car.make} ${car.model} - view ${index + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                                onError={(e) => {
                                  // Fallback for broken image links
                                  (e.target as HTMLImageElement).src = '/images/car-placeholder.jpg';
                                }}
                              />
                            </div>
                          ))
                        ) : (
                          // Fallback for no images
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                              <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                              <p className="text-sm text-muted-foreground mt-2">No image available</p>
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
                              aria-label="Previous image"
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
                              aria-label="Next image"
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
                          <span>{car.fuel_type || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Gauge className="h-4 w-4" />
                          <span>{formatMileage(car.mileage)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          <span>{car.transmission || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{car.year || "N/A"}</span>
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
                            title: "Added to compare",
                            description: `${car.make} ${car.model} added to compare list.`,
                          });
                        }}
                      >
                        Add to Compare
                      </Button>
                      <Link
                        href={car && car.id ? `/inventory/${car.id}` : '#'}
                        onClick={(e) => {
                          // Prevent navigation if car.id is missing
                          if (!car || !car.id) {
                            e.preventDefault();
                            console.error("View Details clicked with invalid car.id:", car?.id);
                            toast({
                              title: "Error",
                              description: "Cannot view details: Car ID is missing.",
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
                        View Details
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
                <p className="text-muted-foreground mb-4">No vehicles found matching your criteria.</p>
                <Button onClick={resetFilters} variant="outline" className="mt-2">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reset Filters
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
                <span className="sr-only">Previous page</span>
              </Button>
              <Button variant="default" size="sm" className="px-4 h-8">
                1
              </Button>
              <Button variant="outline" size="sm" className="px-4 h-8">
                2
              </Button>
              <Button variant="outline" size="sm" className="px-4 h-8">
                3
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        )}

      </section>
    </div>
  );
}