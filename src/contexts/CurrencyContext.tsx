'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the supported currencies
export type Currency = 'CHF' | 'EUR' | 'CZK' | 'HUF' | 'PLN';

// Define the currency symbols map
export const currencySymbolMap: Record<Currency, string> = {
    CHF: 'CHF',
    EUR: '€',
    CZK: 'CZK',
    HUF: 'Ft',
    PLN: 'zł',
};

// Define the locale map for proper number formatting
export const currencyLocaleMap: Record<Currency, string> = {
    CHF: 'de-CH',
    EUR: 'de-DE',
    CZK: 'cs-CZ',
    HUF: 'hu-HU',
    PLN: 'pl-PL',
};

// Define the interface for the context
interface CurrencyContextType {
    selectedCurrency: Currency;
    setSelectedCurrency: (currency: Currency) => void;
    formatPrice: (price: number | null | undefined) => string;
}

// Create the context with default values
const CurrencyContext = createContext<CurrencyContextType>({
    selectedCurrency: 'CHF',
    setSelectedCurrency: () => { },
    formatPrice: () => '',
});

// Create a custom hook to use the currency context
export const useCurrency = () => useContext(CurrencyContext);

// Define the provider component props
interface CurrencyProviderProps {
    children: ReactNode;
}

// Create the provider component
export function CurrencyProvider({ children }: CurrencyProviderProps) {
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>('CHF');

    // Helper function to format prices according to the selected currency
    const formatPrice = (price: number | null | undefined): string => {
        if (price == null) return 'Contact for price';

        const locale = currencyLocaleMap[selectedCurrency];
        const symbol = currencySymbolMap[selectedCurrency];

        // Format based on currency - some currencies show symbol after the number
        if (selectedCurrency === 'HUF' || selectedCurrency === 'PLN') {
            return `${new Intl.NumberFormat(locale, {
                maximumFractionDigits: 0
            }).format(price)} ${symbol}`;
        }

        // Default formatting (symbol before number)
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: selectedCurrency,
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
} 