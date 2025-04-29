"use client"

import React from 'react'
import { Button } from '@/components/ui/button'

interface ListingTypeToggleProps {
    value: 'sale' | 'rent' | 'both'
    onChange: (value: 'sale' | 'rent' | 'both') => void
}

const ListingTypeToggle: React.FC<ListingTypeToggleProps> = ({
    value,
    onChange
}) => {
    return (
        <div className="flex items-center space-x-1 bg-muted p-1 rounded-md">
            <Button
                variant={value === 'sale' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('sale')}
                className="flex-1"
            >
                Buy
            </Button>
            <Button
                variant={value === 'rent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('rent')}
                className="flex-1"
            >
                Rent
            </Button>
            <Button
                variant={value === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('both')}
                className="flex-1"
            >
                Both
            </Button>
        </div>
    )
}

export default ListingTypeToggle
