'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from '@supabase/ssr'

// TypeScript types for our data
type CarListing = {
    id: string
    make: string
    model: string
    year: number
    images: string[]
    rental_price_3h: number | null
    rental_price_6h: number | null
    rental_price_12h: number | null
    rental_price_24h: number | null
    rental_status: 'available' | 'rented' | 'maintenance'
    listing_type: 'sale' | 'rent' | 'both'
    currency: string
    is_rentable: boolean
    min_rental_days: number | null
    max_rental_days: number | null
    rental_deposit: number | null
    has_pending_reservation?: boolean // New field to track pending reservations
}

// Type for reservation data
type RentalReservation = {
    listing_id: string
    status: string
}

export default function RentalInventoryPage() {
    // State for the car listings data
    const [carListings, setCarListings] = useState<CarListing[]>([])
    const [filteredListings, setFilteredListings] = useState<CarListing[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filter and sort state
    const [sortBy, setSortBy] = useState('default')
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Fetch data on component mount
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true)
            try {
                // Create a Supabase client in the browser
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                )

                // Query car_listings directly
                const { data: listingsData, error: listingsError } = await supabase
                    .from('car_listings')
                    .select('*')

                if (listingsError) {
                    throw listingsError
                }

                // Get all pending reservations in one efficient query
                const { data: pendingReservations, error: reservationsError } = await supabase
                    .from('rental_reservations')
                    .select('listing_id, status')
                    .eq('status', 'pending')

                if (reservationsError) {
                    console.error('Error fetching reservations:', reservationsError)
                    // Continue anyway, we just won't show reservation badges
                }

                // Create a Set of listing IDs that have pending reservations for efficient lookup
                const listingsWithPendingReservations = new Set(
                    (pendingReservations || []).map((res: RentalReservation) => res.listing_id)
                )

                // Enhance listings with reservation information
                const enhancedListings = listingsData.map((listing: CarListing) => ({
                    ...listing,
                    has_pending_reservation: listingsWithPendingReservations.has(listing.id)
                }))

                // Filter to only include rentable listings
                const rentalListings = enhancedListings.filter((car: CarListing) =>
                    (car.listing_type === 'rent' || car.listing_type === 'both' || car.is_rentable === true)
                )

                setCarListings(rentalListings)
                setFilteredListings(rentalListings)
            } catch (err) {
                setError('Failed to fetch car listings')
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    // Apply filters and sorting
    useEffect(() => {
        let result = [...carListings]

        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter(car => car.rental_status === statusFilter)
        }

        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(car =>
                car.make.toLowerCase().includes(query) ||
                car.model.toLowerCase().includes(query)
            )
        }

        // Apply sorting
        switch (sortBy) {
            case 'price-low-high':
                result.sort((a, b) => (a.rental_price_24h || 0) - (b.rental_price_24h || 0))
                break
            case 'price-high-low':
                result.sort((a, b) => (b.rental_price_24h || 0) - (a.rental_price_24h || 0))
                break
            case 'year-newest':
                result.sort((a, b) => b.year - a.year)
                break
            case 'year-oldest':
                result.sort((a, b) => a.year - b.year)
                break
            default:
                // Default sort (keep original order)
                break
        }

        setFilteredListings(result)
    }, [carListings, sortBy, statusFilter, searchQuery])

    // Helper function to display prices with currency
    const formatPrice = (price: number | null, currency: string) => {
        if (price === null) return null;
        return `${currency} ${price}`;
    };

    if (isLoading) {
        return <div className="p-8">Loading inventory...</div>
    }

    if (error) {
        return <div className="p-8 text-red-500">Error loading inventory: {error}</div>
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Rental Inventory</h1>

            {/* Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div>
                    <Input
                        placeholder="Search by make or model"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>

                <div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="price-low-high">Price (Low → High)</SelectItem>
                            <SelectItem value="price-high-low">Price (High → Low)</SelectItem>
                            <SelectItem value="year-newest">Year (Newest)</SelectItem>
                            <SelectItem value="year-oldest">Year (Oldest)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="rented">Rented</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredListings.map((car: CarListing) => (
                    <Card key={car.id} className="overflow-hidden">
                        <div className="relative h-48 w-full">
                            {car.images && car.images.length > 0 ? (
                                <Image
                                    src={car.images[0]}
                                    alt={`${car.make} ${car.model}`}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full bg-gray-100">
                                    <span className="text-gray-400">No image available</span>
                                </div>
                            )}
                        </div>

                        <CardContent className="pt-4">
                            <h3 className="text-lg font-semibold">{car.year} {car.make} {car.model}</h3>

                            {/* Rental Status Badges */}
                            <div className="mt-3 mb-4 flex flex-wrap gap-2">
                                {/* Existing Status Badge */}
                                <Badge
                                    className={
                                        car.rental_status === 'available' ? 'bg-green-500 hover:bg-green-600' :
                                            car.rental_status === 'rented' ? 'bg-blue-500 hover:bg-blue-600' :
                                                'bg-red-500 hover:bg-red-600'
                                    }
                                >
                                    {car.rental_status
                                        ? car.rental_status.charAt(0).toUpperCase() + car.rental_status.slice(1)
                                        : 'Unknown'}
                                </Badge>

                                {/* New Pending Reservation Badge - only show if there's a pending reservation */}
                                {car.has_pending_reservation && (
                                    <Link href="/admin/rentals">
                                        <Badge className="bg-amber-500 hover:bg-amber-600 cursor-pointer">
                                            Reservation Pending
                                        </Badge>
                                    </Link>
                                )}
                            </div>

                            {/* Pricing Sections */}
                            <div className="space-y-4">
                                {/* Hourly Rental Section */}
                                {(car.rental_price_3h || car.rental_price_6h || car.rental_price_12h) && (
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Hourly Rental</h4>
                                        <div className="space-y-1 text-sm">
                                            {car.rental_price_3h && (
                                                <div className="flex justify-between">
                                                    <span>3 Hours</span>
                                                    <span className="font-medium">{formatPrice(car.rental_price_3h, car.currency || 'CHF')}</span>
                                                </div>
                                            )}
                                            {car.rental_price_6h && (
                                                <div className="flex justify-between">
                                                    <span>6 Hours</span>
                                                    <span className="font-medium">{formatPrice(car.rental_price_6h, car.currency || 'CHF')}</span>
                                                </div>
                                            )}
                                            {car.rental_price_12h && (
                                                <div className="flex justify-between">
                                                    <span>12 Hours</span>
                                                    <span className="font-medium">{formatPrice(car.rental_price_12h, car.currency || 'CHF')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Daily Rental Section */}
                                {(car.rental_price_24h || car.min_rental_days || car.max_rental_days || car.rental_deposit) && (
                                    <div className="bg-blue-50 p-3 rounded-md">
                                        <h4 className="text-sm font-medium text-blue-600 mb-2">Daily Rental</h4>
                                        <div className="space-y-1 text-sm">
                                            {car.rental_price_24h && (
                                                <div className="flex justify-between">
                                                    <span>Daily Rate</span>
                                                    <span className="font-medium">{formatPrice(car.rental_price_24h, car.currency || 'CHF')}</span>
                                                </div>
                                            )}

                                            {(car.min_rental_days || car.max_rental_days) && (
                                                <div className="flex justify-between">
                                                    <span>Rental Period</span>
                                                    <span className="font-medium">
                                                        {car.min_rental_days ? `Min ${car.min_rental_days} days` : ''}
                                                        {car.min_rental_days && car.max_rental_days ? ' · ' : ''}
                                                        {car.max_rental_days ? `Max ${car.max_rental_days} days` : ''}
                                                    </span>
                                                </div>
                                            )}

                                            {car.rental_deposit && (
                                                <div className="flex justify-between">
                                                    <span>Deposit</span>
                                                    <span className="font-medium">{formatPrice(car.rental_deposit, car.currency || 'CHF')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Show message if no pricing information is available */}
                                {!car.rental_price_3h && !car.rental_price_6h && !car.rental_price_12h &&
                                    !car.rental_price_24h && !car.min_rental_days && !car.max_rental_days && !car.rental_deposit && (
                                        <p className="text-gray-400 mt-2">Price not set</p>
                                    )}
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href={`/inventory/${car.id}`}>
                                    View Listing
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {filteredListings.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No rental listings found matching your criteria.</p>
                </div>
            )}
        </div>
    )
}
