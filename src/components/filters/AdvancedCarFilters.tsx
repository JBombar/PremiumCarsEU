// src/components/filters/AdvancedCarFilters.tsx
"use client";

import React from 'react'; // Import React
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react"; // Import X icon for close button
import { useTranslations } from 'next-intl'; // Import useTranslations
import type { FilterState } from '@/app/inventory/types';


// Define the shape of the main filter state expected from the parent.
// This needs to include the advanced fields.
// It's best practice to define this in a shared types file,
// but for now, we define it here based on inventory/page.tsx's state
// and add the expected advanced fields.


// --- Define the props interface this component accepts ---
interface AdvancedCarFiltersProps {
  filters: FilterState; // Receive the full filter state from parent
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>; // Receive the state setter from parent
  onClose: () => void; // Receive the close handler
}

// Default values for *advanced* filters only (used for sliders/inputs)
// These should align with the defaults you'll set in the parent's `defaultFilters`
const advancedDefaultValues = {
  horsepowerMin: 100,
  horsepowerMax: 700,
  displacementMin: 1000,
  displacementMax: 8000,
  cylindersMin: 3,
  cylindersMax: 12,
  // Add others...
};

// --- Make the component accept and use the props ---
export function AdvancedCarFilters({ filters, setFilters, onClose }: AdvancedCarFiltersProps) {
  const t = useTranslations('InventoryPage.advancedFilters'); // Initialize translations

  // Handler to update the PARENT's state for advanced fields (unchanged)
  const handleAdvancedFilterChange = (
    name: keyof FilterState, // Use keyof the extended FilterState
    value: string | number
  ) => {
    // Call the parent's setFilters function
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler specifically for sliders updating min/max pairs (unchanged)
  const handleAdvancedSliderChange = (
    nameMin: keyof FilterState,
    nameMax: keyof FilterState,
    value: number[]
  ) => {
    setFilters(prev => ({
      ...prev,
      [nameMin]: value[0],
      [nameMax]: value[1],
    }));
  };

  // Note: Horsepower unit conversion logic needs state if you keep it,
  // or it needs to be simplified/removed if not essential right now.
  // For simplicity, the unit conversion toggle is removed in this version.
  // You can add it back using local state within this component if needed.

  return (
    <div className="space-y-6 p-4 border rounded-md bg-muted/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        {/* Use the onClose prop for the close button */}
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('closeAriaLabel')}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Horsepower Filter */}
        <div className="bg-background rounded-lg border p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">{t('horsepowerLabel')}</h4>
            {/* Removed unit toggle for simplicity, add back if needed */}
          </div>

          <Slider
            // Read values from parent state
            value={[
              filters.horsepowerMin ?? advancedDefaultValues.horsepowerMin,
              filters.horsepowerMax ?? advancedDefaultValues.horsepowerMax
            ]}
            min={advancedDefaultValues.horsepowerMin} // Use fixed defaults for range
            max={advancedDefaultValues.horsepowerMax}
            step={10} // Default step for PS
            // Update parent state via specific handler
            onValueChange={(value) => handleAdvancedSliderChange("horsepowerMin", "horsepowerMax", value)}
            className="mb-6"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center">
                <Input
                  type="number"
                  // Read value from parent state
                  value={filters.horsepowerMin ?? ''}
                  placeholder={String(advancedDefaultValues.horsepowerMin)}
                  // Update parent state
                  onChange={(e) => handleAdvancedFilterChange("horsepowerMin", parseInt(e.target.value) || advancedDefaultValues.horsepowerMin)}
                  className="h-8 text-sm w-full"
                  aria-label={`${t('horsepowerLabel')} ${t('minLabel')}`} // Add aria-label
                />
                <span className="ml-2 text-sm text-muted-foreground">{t('horsepowerUnit')}</span>
              </div>
              <label className="text-xs text-muted-foreground mt-1">{t('minLabel')}</label>
            </div>
            <div>
              <div className="flex items-center">
                <Input
                  type="number"
                  // Read value from parent state
                  value={filters.horsepowerMax ?? ''}
                  placeholder={String(advancedDefaultValues.horsepowerMax)}
                  // Update parent state
                  onChange={(e) => handleAdvancedFilterChange("horsepowerMax", parseInt(e.target.value) || advancedDefaultValues.horsepowerMax)}
                  className="h-8 text-sm w-full"
                  aria-label={`${t('horsepowerLabel')} ${t('maxLabel')}`} // Add aria-label
                />
                <span className="ml-2 text-sm text-muted-foreground">{t('horsepowerUnit')}</span>
              </div>
              <label className="text-xs text-muted-foreground mt-1">{t('maxLabel')}</label>
            </div>
          </div>
        </div>

        {/* Engine Displacement */}
        <div className="bg-background rounded-lg border p-4">
          <h4 className="font-medium mb-4">{t('displacementLabel')}</h4>
          <Slider
            value={[
              filters.displacementMin ?? advancedDefaultValues.displacementMin,
              filters.displacementMax ?? advancedDefaultValues.displacementMax
            ]}
            min={advancedDefaultValues.displacementMin}
            max={advancedDefaultValues.displacementMax}
            step={100}
            onValueChange={(value) => handleAdvancedSliderChange("displacementMin", "displacementMax", value)}
            className="mb-6"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center">
                <Input
                  type="number"
                  value={filters.displacementMin ?? ''}
                  placeholder={String(advancedDefaultValues.displacementMin)}
                  onChange={(e) => handleAdvancedFilterChange("displacementMin", parseInt(e.target.value) || advancedDefaultValues.displacementMin)}
                  className="h-8 text-sm w-full"
                  aria-label={`${t('displacementLabel')} ${t('minLabel')}`} // Add aria-label
                />
                <span className="ml-2 text-sm text-muted-foreground">{t('displacementUnit')}</span>
              </div>
              <label className="text-xs text-muted-foreground mt-1">{t('minLabel')}</label>
            </div>
            <div>
              <div className="flex items-center">
                <Input
                  type="number"
                  value={filters.displacementMax ?? ''}
                  placeholder={String(advancedDefaultValues.displacementMax)}
                  onChange={(e) => handleAdvancedFilterChange("displacementMax", parseInt(e.target.value) || advancedDefaultValues.displacementMax)}
                  className="h-8 text-sm w-full"
                  aria-label={`${t('displacementLabel')} ${t('maxLabel')}`} // Add aria-label
                />
                <span className="ml-2 text-sm text-muted-foreground">{t('displacementUnit')}</span>
              </div>
              <label className="text-xs text-muted-foreground mt-1">{t('maxLabel')}</label>
            </div>
          </div>
        </div>

        {/* Cylinders */}
        <div className="bg-background rounded-lg border p-4">
          <h4 className="font-medium mb-4">{t('cylindersLabel')}</h4>
          <Slider
            value={[
              filters.cylindersMin ?? advancedDefaultValues.cylindersMin,
              filters.cylindersMax ?? advancedDefaultValues.cylindersMax
            ]}
            min={advancedDefaultValues.cylindersMin}
            max={advancedDefaultValues.cylindersMax}
            step={1}
            onValueChange={(value) => handleAdvancedSliderChange("cylindersMin", "cylindersMax", value)}
            className="mb-6"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                type="number"
                value={filters.cylindersMin ?? ''}
                placeholder={String(advancedDefaultValues.cylindersMin)}
                onChange={(e) => handleAdvancedFilterChange("cylindersMin", parseInt(e.target.value) || advancedDefaultValues.cylindersMin)}
                className="h-8 text-sm w-full"
                aria-label={`${t('cylindersLabel')} ${t('minLabel')}`} // Add aria-label
              />
              <label className="text-xs text-muted-foreground mt-1">{t('minLabel')}</label>
            </div>
            <div>
              <Input
                type="number"
                value={filters.cylindersMax ?? ''}
                placeholder={String(advancedDefaultValues.cylindersMax)}
                onChange={(e) => handleAdvancedFilterChange("cylindersMax", parseInt(e.target.value) || advancedDefaultValues.cylindersMax)}
                className="h-8 text-sm w-full"
                aria-label={`${t('cylindersLabel')} ${t('maxLabel')}`} // Add aria-label
              />
              <label className="text-xs text-muted-foreground mt-1">{t('maxLabel')}</label>
            </div>
          </div>
        </div>

        {/* Add other advanced filters (Range, BatteryCapacity, TowingCapacity etc.) following the same pattern */}

      </div>
    </div>
  );
}