"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import type { useTranslations } from 'next-intl'; // Import the type for t

// Define the type for the translation function explicitly
// You might need to adjust the path based on your project structure if useTranslations is re-exported
type TFunction = ReturnType<typeof useTranslations<string>>;

interface ListingTypeToggleProps {
    value: 'sale' | 'rent' | 'both'
    onChange: (value: 'sale' | 'rent' | 'both') => void
    t: TFunction // Add t function prop
}

const ListingTypeToggle: React.FC<ListingTypeToggleProps> = ({
    value,
    onChange,
    t // Receive t function as a prop
}) => {
    return (
        <div className="flex items-center space-x-1 bg-muted p-1 rounded-md">
            <Button
                variant={value === 'sale' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('sale')}
                className="flex-1"
            >
                {/* Use translation key */}
                {t('listingTypeToggle.buy')}
            </Button>
            <Button
                variant={value === 'rent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('rent')}
                className="flex-1"
            >
                {/* Use translation key */}
                {t('listingTypeToggle.rent')}
            </Button>
            <Button
                variant={value === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('both')}
                className="flex-1"
            >
                {/* Use translation key */}
                {t('listingTypeToggle.both')}
            </Button>
        </div>
    )
}

export default ListingTypeToggle