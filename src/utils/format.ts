/**
 * Formats a number using Swiss/European style with apostrophes as thousand separators
 * Example: 59990 -> "59'990"
 * 
 * @param value The number to format
 * @param maximumFractionDigits Maximum number of decimal places (default: 0)
 * @returns Formatted string
 */
export const formatPrice = (value: number | null | undefined, maximumFractionDigits = 0): string => {
    if (value === null || value === undefined) return '';

    return new Intl.NumberFormat('de-CH', {
        style: 'decimal',
        maximumFractionDigits,
    }).format(value);
};

/**
 * Utility to format mileage with the same European/Swiss style 
 * @param mileage The mileage value to format
 * @returns Formatted string
 */
export const formatMileage = (mileage: number | null | undefined): string => {
    return formatPrice(mileage);
}; 