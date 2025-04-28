// src/app/inventory/components/ResultsHeader.tsx
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the props the ResultsHeader component expects
interface ResultsHeaderProps {
    // TODO: Pass the actual total count from the API when pagination is implemented
    resultsCount: number; // Currently using cars.length, will need total count later
    sortOption: string; // The current value of the sort dropdown
    sortOptions: Record<string, string>; // The available sort options { key: value }
    onSortChange: (value: string) => void; // Handler function when sort changes
    t: (key: string, values?: Record<string, any>) => string; // Translation function
}

export function ResultsHeader({
    resultsCount,
    sortOption,
    sortOptions,
    onSortChange,
    t
}: ResultsHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-center my-6 pt-4 border-t sm:border-none"> {/* Added border-t for separation, removed on larger screens */}
            {/* Results Count */}
            <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                    {/* Uses the passed resultsCount prop */}
                    {t('results.count', { count: resultsCount })}
                </div>
                {/* Potential place for other info like "Viewing page X of Y" */}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto"> {/* Ensure it takes width on small screens */}
                <span className="text-sm flex-shrink-0">{t('results.sortByLabel')}</span>
                <Select
                    value={sortOption}
                    onValueChange={onSortChange} // Use the passed handler
                >
                    <SelectTrigger className="w-full sm:w-[180px]"> {/* Full width on small, fixed on larger */}
                        <SelectValue placeholder={t('results.sortPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Use the passed sortOptions prop */}
                        {Object.entries(sortOptions).map(([key, value]) => (
                            <SelectItem key={key} value={key}>{value as string}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}