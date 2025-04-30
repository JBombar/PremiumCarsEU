// src/app/inventory/components/FilterSection.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdvancedCarFilters } from "@/components/filters/AdvancedCarFilters"; // Assuming path is correct
import { Filter, RefreshCcw, ChevronUp, ChevronDown } from "lucide-react";
import type { FilterState, CarMake, CarModel } from '../types'; // Import necessary types

// Define the props the FilterSection component expects
interface FilterSectionProps {
    id: string; // For scrolling purposes
    filters: FilterState;
    defaultFilters: FilterState; // Needed for comparison and placeholders potentially
    makes: CarMake[];
    availableModels: CarModel[];
    makesLoading: boolean;
    modelsLoading: boolean;
    availableColors: string[];
    bodyTypeOptions: Record<string, string>;
    fuelTypeOptions: Record<string, string>;
    transmissionOptions: Record<string, string>;
    conditionOptions: Record<string, string>;
    onFilterChange: (name: keyof FilterState, value: string | number) => void;
    // onSliderChange: (nameMin: keyof FilterState, nameMax: keyof FilterState, value: number[]) => void; // If using sliders directly here
    onApplyFilters: () => void;
    onResetFilters: () => void;
    // We might let AdvancedCarFilters handle its own state changes via setFilters prop
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>; // Pass down for AdvancedCarFilters
    t: (key: string, values?: Record<string, any>) => string; // Translation function
}

export function FilterSection({
    id,
    filters,
    defaultFilters,
    makes,
    availableModels,
    makesLoading,
    modelsLoading,
    availableColors,
    bodyTypeOptions,
    fuelTypeOptions,
    transmissionOptions,
    conditionOptions,
    onFilterChange,
    onApplyFilters,
    onResetFilters,
    setFilters, // Pass down
    t,
}: FilterSectionProps) {

    // Internal state for UI elements within the filter section
    const [modelSearchTerm, setModelSearchTerm] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const modelSearchInputRef = useRef<HTMLInputElement>(null);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);
    const [isTyping, setIsTyping] = useState(false);

    // Enhanced focus restoration that's more resilient to component re-renders
    useEffect(() => {
        if (!isTyping) return;

        // Use both immediate and delayed focus to catch different timing scenarios
        const focusInput = () => {
            if (modelSearchInputRef.current) {
                modelSearchInputRef.current.focus();

                if (cursorPosition !== null) {
                    modelSearchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
                }
            }
        };

        // Immediate focus attempt
        focusInput();

        // Backup focus with a small delay to ensure DOM is fully updated
        const timeoutId = setTimeout(focusInput, 10);

        return () => clearTimeout(timeoutId);
    }, [modelSearchTerm, cursorPosition, isTyping]);

    // Handle model search input changes with improved event and focus management
    const handleModelSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const newCursorPosition = e.target.selectionStart;

        // Set typing mode to trigger the focus restoration effect
        setIsTyping(true);
        setCursorPosition(newCursorPosition);
        setModelSearchTerm(newValue);
    };

    // Handle input blur - don't immediately cancel typing mode
    // This gives our focus effect a chance to work
    const handleInputBlur = () => {
        // Short delay before clearing typing state to allow focus restoration to run
        setTimeout(() => setIsTyping(false), 100);
    };

    // Handle input focus - set typing mode
    const handleInputFocus = () => {
        setIsTyping(true);
    };

    // When clicking on the input, ensure the event doesn't bubble
    // and disrupt our focus management
    const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
        e.stopPropagation();
        setIsTyping(true);
    };

    // Helper function to map color names to CSS colors (moved from page.tsx)
    const getColorValue = (colorName: string): string => {
        const colorMap: Record<string, string> = {
            anthracite: "#383838",
            bordeaux: "#6D071A",
            multicolor: "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)",
        };
        return colorMap[colorName] || colorName;
    };

    const toggleAdvancedFilters = () => {
        setShowAdvancedFilters(!showAdvancedFilters);
    };

    // Handler specifically for make change to clear model search term
    const handleMakeChange = (value: string) => {
        onFilterChange("make", value);
        setModelSearchTerm(''); // Clear search term when make changes
        setIsTyping(false); // Reset typing state
    };

    return (
        <div id={id} className="bg-background py-8 border-y mb-6">
            <div className="container max-w-6xl mx-auto px-4">
                {/* Basic Filters Row 1: Make, Model, Body Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
                    {/* Make */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium mb-2">{t('filters.makeLabel')}</label>
                        <Select
                            value={filters.make}
                            onValueChange={handleMakeChange} // Use specific handler
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
                            onValueChange={(value) => onFilterChange("model", value)}
                            disabled={filters.make === "Any" || modelsLoading || makesLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={modelsLoading ? t('filters.modelPlaceholderLoading') : t('filters.modelPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Model search input with enhanced focus handling */}
                                <div className="px-2 py-2 sticky top-0 bg-background z-10 border-b">
                                    <Input
                                        placeholder={t('filters.modelSearchPlaceholder')}
                                        className="h-8"
                                        onChange={handleModelSearchChange}
                                        value={modelSearchTerm}
                                        onClick={handleInputClick}
                                        onFocus={handleInputFocus}
                                        onBlur={handleInputBlur}
                                        ref={modelSearchInputRef}
                                    />
                                </div>

                                <SelectItem value="Any">{t('filters.optionAny')}</SelectItem>

                                {availableModels.length > 0 ? (
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
                                    !modelsLoading && filters.make !== "Any" && (
                                        <SelectItem value="no-models" disabled>
                                            {modelSearchTerm ? t('filters.modelNotFound') : t('filters.modelNotAvailable')}
                                        </SelectItem>
                                    )
                                )}
                                {modelsLoading && (
                                    <SelectItem value="loading" disabled>
                                        {t('filters.modelPlaceholderLoading')}
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
                            onValueChange={(value) => onFilterChange("bodyType", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('filters.bodyTypePlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Use options passed as props */}
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
                        <label className="block text-sm font-medium mb-1">{t('filters.priceLabel')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="priceMin" className="text-xs text-muted-foreground">{t('filters.minLabel')}</label>
                                <Input
                                    id="priceMin"
                                    type="number"
                                    min={0}
                                    max={filters.priceMax}
                                    value={filters.priceMin}
                                    onChange={(e) => {
                                        const newValue = e.target.value === '' ? defaultFilters.priceMin : parseInt(e.target.value, 10);
                                        if (!isNaN(newValue)) {
                                            onFilterChange("priceMin", Math.max(0, newValue));
                                        }
                                    }}
                                    placeholder={t('filters.priceMinPlaceholder')}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label htmlFor="priceMax" className="text-xs text-muted-foreground">{t('filters.maxLabel')}</label>
                                <Input
                                    id="priceMax"
                                    type="number"
                                    min={filters.priceMin}
                                    value={filters.priceMax}
                                    onChange={(e) => {
                                        const newValue = e.target.value === '' ? defaultFilters.priceMax : parseInt(e.target.value, 10);
                                        if (!isNaN(newValue)) {
                                            onFilterChange("priceMax", Math.max(filters.priceMin, newValue));
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
                        <label className="block text-sm font-medium mb-1">{t('filters.yearLabel')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="yearMin" className="text-xs text-muted-foreground">{t('filters.fromLabel')}</label>
                                <Input
                                    id="yearMin"
                                    type="number"
                                    min={1900}
                                    max={filters.yearMax}
                                    value={filters.yearMin}
                                    onChange={(e) => {
                                        const newValue = e.target.value === '' ? defaultFilters.yearMin : parseInt(e.target.value, 10);
                                        if (!isNaN(newValue)) {
                                            onFilterChange("yearMin", Math.max(1900, newValue));
                                        }
                                    }}
                                    placeholder={t('filters.yearMinPlaceholder')}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label htmlFor="yearMax" className="text-xs text-muted-foreground">{t('filters.toLabel')}</label>
                                <Input
                                    id="yearMax"
                                    type="number"
                                    min={filters.yearMin}
                                    max={new Date().getFullYear() + 1}
                                    value={filters.yearMax}
                                    onChange={(e) => {
                                        const newValue = e.target.value === '' ? defaultFilters.yearMax : parseInt(e.target.value, 10);
                                        if (!isNaN(newValue)) {
                                            onFilterChange("yearMax", Math.max(filters.yearMin, newValue));
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
                        <label className="block text-sm font-medium mb-1">{t('filters.mileageLabel')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="mileageMin" className="text-xs text-muted-foreground">{t('filters.minLabel')}</label>
                                <Input
                                    id="mileageMin"
                                    type="number"
                                    min={0}
                                    max={filters.mileageMax}
                                    value={filters.mileageMin}
                                    onChange={(e) => {
                                        const newValue = e.target.value === '' ? defaultFilters.mileageMin : parseInt(e.target.value, 10);
                                        if (!isNaN(newValue)) {
                                            onFilterChange("mileageMin", Math.max(0, newValue));
                                        }
                                    }}
                                    placeholder={t('filters.mileageMinPlaceholder')}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label htmlFor="mileageMax" className="text-xs text-muted-foreground">{t('filters.maxLabel')}</label>
                                <Input
                                    id="mileageMax"
                                    type="number"
                                    min={filters.mileageMin}
                                    value={filters.mileageMax}
                                    onChange={(e) => {
                                        const newValue = e.target.value === '' ? defaultFilters.mileageMax : parseInt(e.target.value, 10);
                                        if (!isNaN(newValue)) {
                                            onFilterChange("mileageMax", Math.max(filters.mileageMin, newValue));
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
                            onValueChange={(value) => onFilterChange("fuelType", value)}
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
                            onValueChange={(value) => onFilterChange("transmission", value)}
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
                            onValueChange={(value) => onFilterChange("condition", value)}
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

                {/* Color Filters Row: Exterior Color, Interior Color */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                    {/* Exterior Color */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium mb-2">{t('filters.exteriorColorLabel')}</label>
                        <Select
                            value={filters.exteriorColor}
                            onValueChange={(value) => onFilterChange("exteriorColor", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('filters.colorPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Any">{t('filters.optionAny')}</SelectItem>
                                {availableColors.map(color => (
                                    <SelectItem key={color} value={color}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                                                style={{
                                                    background: getColorValue(color), // Use internal helper
                                                    boxShadow: color === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                                                }}
                                            />
                                            {/* --- MODIFIED LINE --- */}
                                            {t(`filters.colors.${color}`)}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Interior Color */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium mb-2">{t('filters.interiorColorLabel')}</label>
                        <Select
                            value={filters.interiorColor}
                            onValueChange={(value) => onFilterChange("interiorColor", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t('filters.colorPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Any">{t('filters.optionAny')}</SelectItem>
                                {availableColors.map(color => (
                                    <SelectItem key={color} value={color}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                                                style={{
                                                    background: getColorValue(color), // Use internal helper
                                                    boxShadow: color === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                                                }}
                                            />
                                            {/* --- MODIFIED LINE --- */}
                                            {t(`filters.colors.${color}`)}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Filter Actions & Advanced Toggle */}
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mt-4">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={onApplyFilters} className="flex-1 sm:flex-none">
                            <Filter className="mr-2 h-4 w-4" /> {t('filters.applyButton')}
                        </Button>
                        <Button variant="outline" onClick={onResetFilters} className="flex items-center gap-2">
                            <RefreshCcw className="h-4 w-4" /> {t('filters.resetButton')}
                        </Button>
                    </div>
                    <Button onClick={toggleAdvancedFilters} className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0" variant="outline" size="sm">
                        {showAdvancedFilters ? // Use internal state
                            (<><ChevronUp className="h-4 w-4" /> {t('filters.hideAdvancedButton')}</>) :
                            (<><Filter className="h-4 w-4" /> {t('filters.showAdvancedButton')}</>)
                        }
                    </Button>
                </div>

                {/* Advanced Filters Panel */}
                <div className={`${showAdvancedFilters ? 'block mt-6 border-t pt-6' : 'hidden'}`}>
                    <AdvancedCarFilters
                        filters={filters} // Pass down filters state
                        setFilters={setFilters} // Pass down the MAIN setFilters from page.tsx
                        onClose={toggleAdvancedFilters} // Use internal toggle function
                    // t={t} // Pass t if AdvancedCarFilters needs it directly
                    // You might need to pass `t` here if AdvancedCarFilters also needs translations
                    />
                </div>
            </div>
        </div>
    );
}