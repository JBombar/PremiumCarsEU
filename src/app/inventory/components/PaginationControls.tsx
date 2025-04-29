// src/app/inventory/components/PaginationControls.tsx
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DOTS = '...';

/**
 * Helper function to generate a range of numbers.
 */
const range = (start: number, end: number): number[] => {
    let length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
};

/**
 * Custom hook to calculate pagination range with ellipses.
 */
const usePaginationRange = ({
    totalCount,
    pageSize,
    siblingCount = 1, // Number of pages to show on each side of the current page
    currentPage,
}: {
    totalCount: number;
    pageSize: number;
    siblingCount?: number;
    currentPage: number;
}): (number | string)[] => {

    const totalPageCount = Math.ceil(totalCount / pageSize);

    // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*DOTS
    const totalPageNumbers = siblingCount + 5;

    /*
      Case 1: If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPageCount]
    */
    if (totalPageNumbers >= totalPageCount) {
        return range(1, totalPageCount);
    }

    /*
        Calculate left and right sibling index and make sure they are within range 1..totalPageCount
    */
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(
        currentPage + siblingCount,
        totalPageCount
    );

    /*
      We do not show dots just when there is just one page number to be inserted between the extremes of sibling and the page limits i.e 1 and totalPageCount. Hence we are using leftSiblingIndex > 2 and rightSiblingIndex < totalPageCount - 2
    */
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 1; // Adjusted condition slightly

    const firstPageIndex = 1;
    const lastPageIndex = totalPageCount;

    /*
        Case 2: No left dots to show, but rights dots to be shown
    */
    if (!shouldShowLeftDots && shouldShowRightDots) {
        let leftItemCount = 3 + 2 * siblingCount;
        let leftRange = range(1, leftItemCount);

        return [...leftRange, DOTS, totalPageCount];
    }

    /*
        Case 3: No right dots to show, but left dots to be shown
    */
    if (shouldShowLeftDots && !shouldShowRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        let rightRange = range(
            totalPageCount - rightItemCount + 1,
            totalPageCount
        );
        return [firstPageIndex, DOTS, ...rightRange];
    }

    /*
        Case 4: Both left and right dots to be shown
    */
    if (shouldShowLeftDots && shouldShowRightDots) {
        let middleRange = range(leftSiblingIndex, rightSiblingIndex);
        return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }

    // Default case (shouldn't happen with logic above, but for safety)
    return range(1, totalPageCount);

};


// --- Component Props ---
interface PaginationControlsProps {
    currentPage: number;
    totalPages: number; // Total number of pages
    onPageChange: (page: number) => void;
    siblingCount?: number; // Optional: How many page numbers to show around current
    className?: string; // Optional: Additional class names for the container
    // t?: (key: string) => string; // Optional: Translation function if needed
}

export function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
    className = "",
    // t
}: PaginationControlsProps) {

    // Calculate the pagination range using the custom hook
    // Note: usePaginationRange expects totalCount and pageSize, but we already have totalPages
    // We can simulate totalCount and pageSize for the hook if needed, or adapt the hook.
    // Let's adapt slightly by passing totalPages directly if simpler.
    // Or, we can just use the logic directly here if the hook seems overkill without totalCount/pageSize props.

    // --- Let's implement the range logic directly here for simplicity ---
    const paginationRange = React.useMemo(() => {
        const totalPageNumbers = siblingCount + 5; // siblingCount + first/last + current + 2*DOTS

        if (totalPageNumbers >= totalPages) {
            return range(1, totalPages);
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

        const firstPageIndex = 1;
        const lastPageIndex = totalPages;

        if (!shouldShowLeftDots && shouldShowRightDots) {
            let leftItemCount = 3 + 2 * siblingCount;
            // Ensure leftItemCount doesn't exceed totalPages
            leftItemCount = Math.min(leftItemCount, totalPages);
            let leftRange = range(1, leftItemCount);
            return [...leftRange, DOTS, totalPages];
        }

        if (shouldShowLeftDots && !shouldShowRightDots) {
            let rightItemCount = 3 + 2 * siblingCount;
            // Ensure rightItemCount doesn't exceed totalPages
            rightItemCount = Math.min(rightItemCount, totalPages);
            let rightRange = range(totalPages - rightItemCount + 1, totalPages);
            return [firstPageIndex, DOTS, ...rightRange];
        }

        if (shouldShowLeftDots && shouldShowRightDots) {
            let middleRange = range(leftSiblingIndex, rightSiblingIndex);
            return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
        }
        // Fallback just in case
        return range(1, totalPages);

    }, [totalPages, siblingCount, currentPage]);


    // --- Event Handlers ---
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // If there's only one page, don't render pagination
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className={`flex justify-center items-center space-x-1 my-12 ${className}`}>
            {/* Previous Button */}
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Number Buttons */}
            {paginationRange.map((pageNumber, index) => {
                // If the pageItem is a DOT, render the DOTS unicode character
                if (pageNumber === DOTS) {
                    return <span key={DOTS + index} className="px-2 py-1 text-muted-foreground">…</span>;
                }

                // Render button for page number
                return (
                    <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 hidden sm:flex" // Hide numbers on very small screens maybe? Or adjust size
                        onClick={() => onPageChange(pageNumber as number)}
                        disabled={currentPage === pageNumber}
                    >
                        {pageNumber}
                    </Button>
                );
            })}

            {/* Next Button */}
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}