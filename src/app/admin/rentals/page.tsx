'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, differenceInHours, differenceInDays } from "date-fns";
import { createClient } from '@/utils/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from "@/components/ui/textarea";

// Icons
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    XMarkIcon,
    ArrowPathIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    ChevronDownIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    CalendarIcon,
    ClockIcon,
    UserIcon,
    CurrencyDollarIcon,
    EnvelopeIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';

// Define the Reservation type
type ReservationRow = {
    id: string;
    listing_id: string;
    renter_id: string;
    renter_name: string;
    renter_email: string;
    renter_phone: string;
    start_date: string;
    end_date: string;
    start_time: string | null;
    end_time: string | null;
    duration: number | null;
    total_price: number | null;
    status: "pending" | "confirmed" | "rejected" | "completed" | "canceled" | string;
    notes: string | null;
    approved_by: string | null;
    approved_at: string | null;
    canceled_by: string | null;
    canceled_at: string | null;
    created_at: string;
    updated_at: string;
    currency: string | null;
    source: string | null;
    admin_comments: string | null;
    is_verified: boolean | null;
    verification_method: string | null;
    id_document_url: string | null;
    license_document_url: string | null;
    preferred_contact_method: string | null;
    
    // Car relationship - extend with required properties
    car?: {
        id?: string;
        make: string;
        model: string;
        year?: number;
        images?: string[] | null;
        rental_status?: string;
        // Add these properties to fix TypeScript errors
        rental_price_3h?: number | null;
        rental_price_6h?: number | null;
        rental_price_12h?: number | null;
        rental_price_24h?: number | null;
        rental_price_48h?: number | null;
        rental_daily_price?: number | null;
        currency?: string | null;
    };
};

export default function RentalsPage() {
    const supabase = createClient();
    const [reservations, setReservations] = useState<ReservationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedReservationIds, setSelectedReservationIds] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        status: '',
        renter: '',
        listing: ''
    });
    const [debouncedFilters, setDebouncedFilters] = useState(filters);

    // Sorting
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Confirmation dialog
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [activeReservation, setActiveReservation] = useState<ReservationRow | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [adminComments, setAdminComments] = useState('');

    // Debounce filter changes
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedFilters(filters), 500);
        return () => clearTimeout(timer);
    }, [filters]);

    // Fetch reservations when filters, sorting, or pagination change
    useEffect(() => {
        fetchReservations();
    }, [debouncedFilters, sortField, sortDirection, currentPage, pageSize]);

    // Reset selectedReservationIds when reservations change
    useEffect(() => {
        setSelectedReservationIds([]);
        setSelectAll(false);
    }, [reservations]);

    const fetchReservations = async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('rental_reservations')
                .select(`
                    id,
                    listing_id,
                    renter_id,
                    renter_name,
                    renter_email,
                    renter_phone,
                    start_date,
                    end_date,
                    duration,
                    total_price,
                    status,
                    notes,
                    approved_by,
                    approved_at,
                    canceled_by,
                    canceled_at,
                    created_at,
                    updated_at,
                    currency,
                    source,
                    admin_comments,
                    is_verified,
                    verification_method,
                    id_document_url,
                    license_document_url,
                    preferred_contact_method,
                    start_time,
                    end_time,
                    car:car_listings(id, make, model, year, images, rental_status)
                `);

            // Apply filters
            if (debouncedFilters.status && debouncedFilters.status !== 'all') {
                query = query.eq('status', debouncedFilters.status);
            }

            if (debouncedFilters.renter) {
                query = query.or(`renter_name.ilike.%${debouncedFilters.renter}%,renter_email.ilike.%${debouncedFilters.renter}%`);
            }

            if (debouncedFilters.listing) {
                query = query.eq('listing_id', debouncedFilters.listing);
            }

            // Apply sorting
            query = query.order(sortField, { ascending: sortDirection === 'asc' });

            // Apply pagination (using range)
            const start = (currentPage - 1) * pageSize;
            const end = start + pageSize - 1;
            query = query.range(start, end);

            // Execute query
            const { data, error: fetchError, count } = await query.returns<ReservationRow[]>();

            if (fetchError) throw fetchError;

            // Get total count for pagination
            const { count: totalCount, error: countError } = await supabase
                .from('rental_reservations')
                .select('id', { count: 'exact', head: true });

            if (countError) throw countError;

            setReservations(data || []);
            setTotalPages(Math.ceil((totalCount || 0) / pageSize));

        } catch (err: any) {
            console.error('Error fetching reservations:', err);
            setError(err.message || 'An unknown error occurred fetching reservations.');
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle row selection
    const handleSelectRow = (id: string) => {
        setSelectedReservationIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(reservationId => reservationId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // Handle "select all" checkbox
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedReservationIds([]);
        } else {
            setSelectedReservationIds(reservations.map(reservation => reservation.id));
        }
        setSelectAll(!selectAll);
    };

    // Handle sorting
    const handleSort = (field: string) => {
        setSortDirection(current => {
            if (sortField === field) {
                return current === 'asc' ? 'desc' : 'asc';
            }
            return 'asc'; // Default to ascending for new field
        });
        setSortField(field);
    };

    // Handle filter changes
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            status: '',
            renter: '',
            listing: ''
        });
        setCurrentPage(1);
    };

    // Pagination handlers
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Handle confirm action (open dialog)
    const openConfirmDialog = (reservation: ReservationRow) => {
        setActiveReservation(reservation);
        setIsConfirmDialogOpen(true);
    };

    // Handle reject action (open dialog)
    const openRejectDialog = (reservation: ReservationRow) => {
        setActiveReservation(reservation);
        setIsRejectDialogOpen(true);
    };

    // Confirm reservation
    const handleConfirm = async () => {
        if (!activeReservation) return;

        setActionLoading(true);

        try {
            // 1. Update the reservation status
            const { error: reservationError } = await supabase
                .from('rental_reservations')
                .update({
                    status: 'confirmed',
                    approved_by: (await supabase.auth.getUser()).data.user?.id,
                    approved_at: new Date().toISOString()
                })
                .eq('id', activeReservation.id);

            if (reservationError) throw reservationError;

            // 2. Update the car listing rental status
            const { error: carError } = await supabase
                .from('car_listings')
                .update({
                    rental_status: 'rented'
                })
                .eq('id', activeReservation.listing_id);

            if (carError) throw carError;

            toast({
                title: 'Reservation Confirmed',
                description: `Reservation for ${activeReservation.car?.make} ${activeReservation.car?.model} has been confirmed.`,
            });

            // Refresh the data
            fetchReservations();

        } catch (err: any) {
            console.error('Error confirming reservation:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to confirm reservation',
                variant: 'destructive'
            });
        } finally {
            setActionLoading(false);
            setIsConfirmDialogOpen(false);
            setActiveReservation(null);
        }
    };

    // Reject reservation
    const handleReject = async () => {
        if (!activeReservation) return;

        setActionLoading(true);

        try {
            // Update the reservation status
            const { error } = await supabase
                .from('rental_reservations')
                .update({
                    status: 'rejected',
                    canceled_by: (await supabase.auth.getUser()).data.user?.id,
                    canceled_at: new Date().toISOString(),
                    admin_comments: adminComments
                })
                .eq('id', activeReservation.id);

            if (error) throw error;

            toast({
                title: 'Reservation Rejected',
                description: `Reservation for ${activeReservation.car?.make} ${activeReservation.car?.model} has been rejected.`,
            });

            // Refresh the data
            fetchReservations();

        } catch (err: any) {
            console.error('Error rejecting reservation:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to reject reservation',
                variant: 'destructive'
            });
        } finally {
            setActionLoading(false);
            setIsRejectDialogOpen(false);
            setActiveReservation(null);
        }
    };

    // Format currency
    const formatCurrency = (amount: number | null | undefined, currency: string = 'CHF'): string => {
        if (amount == null) return 'N/A';
        return new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Get status badge variant
    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: "default" | "destructive" | "outline" | null, label: string }> = {
            pending: { variant: "outline", label: "Pending" },
            confirmed: { variant: "default", label: "Confirmed" },
            rejected: { variant: "destructive", label: "Rejected" },
            completed: { variant: "default", label: "Completed" },
            canceled: { variant: "destructive", label: "Canceled" }
        };

        return statusMap[status] || { variant: "outline", label: status };
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Rental Reservations</h1>
                    <p className="text-gray-600">Manage and track all vehicle rental requests</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <Button
                        onClick={fetchReservations}
                        variant="outline"
                        className="flex items-center"
                    >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters Card */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center">
                            <FunnelIcon className="h-5 w-5 mr-2 text-gray-600" />
                            Filters
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="mt-2 md:mt-0"
                        >
                            Clear All
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="status-filter">Status</Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => handleFilterChange('status', value)}
                            >
                                <SelectTrigger id="status-filter" className="w-full">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="canceled">Canceled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="renter-filter">Renter (Name/Email)</Label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                                <Input
                                    id="renter-filter"
                                    value={filters.renter}
                                    onChange={(e) => handleFilterChange('renter', e.target.value)}
                                    placeholder="Search by name or email"
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 mt-0.5" />
                    <div>
                        <p className="font-medium">Error loading reservations</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Main table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-gray-700 text-sm">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium w-12">
                                    <Checkbox
                                        checked={selectAll}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </th>
                                <th
                                    className="px-4 py-3 text-left font-medium cursor-pointer whitespace-nowrap"
                                    onClick={() => handleSort('car.make')}
                                >
                                    <div className="flex items-center">
                                        <TruckIcon className="h-4 w-4 mr-1" />
                                        Vehicle
                                        {sortField === 'car.make' && (
                                            <ChevronDownIcon
                                                className={`h-4 w-4 ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                                            />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left font-medium cursor-pointer"
                                    onClick={() => handleSort('renter_name')}
                                >
                                    <div className="flex items-center">
                                        <UserIcon className="h-4 w-4 mr-1" />
                                        Renter
                                        {sortField === 'renter_name' && (
                                            <ChevronDownIcon
                                                className={`h-4 w-4 ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                                            />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left font-medium cursor-pointer whitespace-nowrap"
                                    onClick={() => handleSort('start_date')}
                                >
                                    <div className="flex items-center">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        Start Date
                                        {sortField === 'start_date' && (
                                            <ChevronDownIcon
                                                className={`h-4 w-4 ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                                            />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left font-medium cursor-pointer whitespace-nowrap"
                                    onClick={() => handleSort('end_date')}
                                >
                                    <div className="flex items-center">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        End Date
                                        {sortField === 'end_date' && (
                                            <ChevronDownIcon
                                                className={`h-4 w-4 ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                                            />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left font-medium cursor-pointer"
                                    onClick={() => handleSort('duration')}
                                >
                                    <div className="flex items-center">
                                        <ClockIcon className="h-4 w-4 mr-1" />
                                        Duration
                                        {sortField === 'duration' && (
                                            <ChevronDownIcon
                                                className={`h-4 w-4 ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                                            />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left font-medium cursor-pointer"
                                    onClick={() => handleSort('total_price')}
                                >
                                    <div className="flex items-center">
                                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                        Price
                                        {sortField === 'total_price' && (
                                            <ChevronDownIcon
                                                className={`h-4 w-4 ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                                            />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left font-medium cursor-pointer"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center">
                                        Status
                                        {sortField === 'status' && (
                                            <ChevronDownIcon
                                                className={`h-4 w-4 ml-1 transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                                            />
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index} className="animate-pulse">
                                        <td className="px-4 py-4 text-gray-400"><div className="h-5 w-5 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4"><div className="h-5 w-16 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-4 text-right"><div className="h-8 w-24 ml-auto bg-gray-200 rounded"></div></td>
                                    </tr>
                                ))
                            ) : reservations.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                        {error ? (
                                            <div>Error loading data. Please try again.</div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="mb-3 p-3 bg-gray-100 rounded-full">
                                                    <CalendarIcon className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <p className="font-medium">No reservations found</p>
                                                <p className="text-sm">Try adjusting your filters or check back later</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                reservations.map((reservation) => {
                                    const statusBadge = getStatusBadge(reservation.status);
                                    const isSelectable = reservation.status === 'pending';
                                    const isSelected = selectedReservationIds.includes(reservation.id);

                                    return (
                                        <tr
                                            key={reservation.id}
                                            className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                                        >
                                            <td className="px-4 py-4">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleSelectRow(reservation.id)}
                                                    disabled={!isSelectable}
                                                    aria-label={`Select reservation ${reservation.id}`}
                                                />
                                            </td>
                                            <td className="px-4 py-4 font-medium">
                                                {reservation.car ? (
                                                    <div className="flex items-center">
                                                        {reservation.car.images && reservation.car.images.length > 0 ? (
                                                            <img
                                                                src={reservation.car.images[0]}
                                                                alt={`${reservation.car.make} ${reservation.car.model}`}
                                                                className="w-8 h-8 rounded object-cover mr-2"
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center mr-2">
                                                                <TruckIcon className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <span>{reservation.car.make} {reservation.car.model}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">Unknown vehicle</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span>{reservation.renter_name}</span>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <EnvelopeIcon className="h-3 w-3 mr-1" />
                                                        <span className="truncate max-w-[140px]">{reservation.renter_email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {reservation.start_date ? format(new Date(reservation.start_date), 'PP') : 'N/A'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {reservation.end_date ? format(new Date(reservation.end_date), 'PP') : 'N/A'}
                                            </td>
                                            <td className="px-4 py-4">
                                                {calculateDuration(reservation)}
                                            </td>
                                            <td className="px-4 py-4 font-medium">
                                                {calculatePrice(reservation)}
                                            </td>
                                            <td className="px-4 py-4">
                                                {reservation.status && (
                                                    <Badge variant={getStatusBadge(reservation.status).variant || undefined}>
                                                        {getStatusBadge(reservation.status).label}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    {reservation.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => openConfirmDialog(reservation)}
                                                                className="flex items-center"
                                                            >
                                                                <CheckIcon className="h-4 w-4 mr-1" />
                                                                Confirm
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => openRejectDialog(reservation)}
                                                                className="flex items-center"
                                                            >
                                                                <XCircleIcon className="h-4 w-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Link href={`/admin/rentals/${reservation.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            Details
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    {loading ? (
                        <div className="animate-pulse h-5 w-36 bg-gray-200 rounded"></div>
                    ) : (
                        <span>
                            Showing {reservations.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                            {Math.min(currentPage * pageSize, (totalPages * pageSize))} of {totalPages * pageSize} reservations
                        </span>
                    )}
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1 || loading}
                        className="flex items-center"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-1" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages || loading}
                        className="flex items-center"
                    >
                        Next
                        <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>

            {/* Confirm Reservation Dialog */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Reservation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to confirm this reservation? This will also mark the vehicle as rented.
                        </DialogDescription>
                    </DialogHeader>

                    {activeReservation && (
                        <div className="py-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="font-medium">{activeReservation.car?.make} {activeReservation.car?.model}</div>
                                <Badge>
                                    {calculatePrice(activeReservation)}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-gray-500">Renter:</div>
                                <div>{activeReservation.renter_name}</div>

                                <div className="text-gray-500">Duration:</div>
                                <div>{calculateDuration(activeReservation)}</div>

                                <div className="text-gray-500">Start:</div>
                                <div>
                                    {activeReservation.start_date && format(new Date(activeReservation.start_date), 'PPP')}
                                    {activeReservation.start_time && (
                                        <span className="ml-1 text-xs">
                                            {format(new Date(activeReservation.start_time), 'p')}
                                        </span>
                                    )}
                                </div>

                                <div className="text-gray-500">End:</div>
                                <div>
                                    {activeReservation.end_date && format(new Date(activeReservation.end_date), 'PPP')}
                                    {activeReservation.end_time && (
                                        <span className="ml-1 text-xs">
                                            {format(new Date(activeReservation.end_time), 'p')}
                                        </span>
                                    )}
                                </div>

                                <div className="text-gray-500">Phone:</div>
                                <div>{activeReservation.renter_phone || 'N/A'}</div>

                                {activeReservation.notes && (
                                    <>
                                        <div className="text-gray-500">Notes:</div>
                                        <div className="text-sm">{activeReservation.notes}</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsConfirmDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={actionLoading}
                            className="flex items-center"
                        >
                            {actionLoading && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
                            Confirm Reservation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Reservation Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Reservation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject this reservation? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    {activeReservation && (
                        <div className="py-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="font-medium">{activeReservation.car?.make} {activeReservation.car?.model}</div>
                                <Badge variant="outline">
                                    {calculatePrice(activeReservation)}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-gray-500">Renter:</div>
                                <div>{activeReservation.renter_name}</div>

                                <div className="text-gray-500">Email:</div>
                                <div>{activeReservation.renter_email}</div>

                                <div className="text-gray-500">Period:</div>
        <div>
                                    {activeReservation.start_date && format(new Date(activeReservation.start_date), 'PP')} -
                                    {activeReservation.end_date && format(new Date(activeReservation.end_date), 'PP')}
                                </div>

                                {activeReservation.notes && (
                                    <>
                                        <div className="text-gray-500">Notes:</div>
                                        <div className="text-sm">{activeReservation.notes}</div>
                                    </>
                                )}
                            </div>

                            <div className="mt-4">
                                <Label htmlFor="reject-reason">Rejection Reason (Optional)</Label>
                                <Textarea
                                    id="reject-reason"
                                    placeholder="Enter reason for rejection"
                                    value={adminComments}
                                    onChange={(e) => setAdminComments(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRejectDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={actionLoading}
                            className="flex items-center"
                        >
                            {actionLoading && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
                            Reject Reservation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Function to calculate and format duration
function calculateDuration(reservation: ReservationRow): string {
    // If duration is explicitly provided
    if (reservation.duration) {
        // Determine if it's hours or days
        if (reservation.duration < 24) {
            return `${reservation.duration} hour${reservation.duration !== 1 ? 's' : ''}`;
        } else {
            const days = Math.ceil(reservation.duration / 24);
            return `${days} day${days !== 1 ? 's' : ''}`;
        }
    }

    // Calculate from dates if no explicit duration
    try {
        // Try to calculate from start_time and end_time first
        if (reservation.start_time && reservation.end_time) {
            const startTime = new Date(reservation.start_time);
            const endTime = new Date(reservation.end_time);
            const hours = differenceInHours(endTime, startTime);

            if (hours < 24) {
                return `${hours} hour${hours !== 1 ? 's' : ''}`;
            } else {
                const days = Math.ceil(hours / 24);
                return `${days} day${days !== 1 ? 's' : ''}`;
            }
        }

        // Fall back to start_date and end_date
        if (reservation.start_date && reservation.end_date) {
            const startDate = new Date(reservation.start_date);
            const endDate = new Date(reservation.end_date);
            const days = differenceInDays(endDate, startDate) + 1; // Add 1 to include the start day

            return `${days} day${days !== 1 ? 's' : ''}`;
        }
    } catch (error) {
        console.error("Error calculating duration:", error);
    }

    // Return 'N/A' if calculation is not possible
    return 'N/A';
}

// Function to calculate and format price
function calculatePrice(reservation: ReservationRow): string {
    const currency = reservation.currency || reservation.car?.currency || 'CHF';

    // If price is explicitly provided
    if (reservation.total_price) {
        return formatCurrency(reservation.total_price, currency);
    }

    // Calculate based on duration and rates
    if (reservation.car && reservation.duration) {
        const hourlyDurations = [3, 6, 12, 24, 48];

        // For hourly durations, use corresponding hourly rate
        if (hourlyDurations.includes(reservation.duration)) {
            const hourlyPriceField = `rental_price_${reservation.duration}h` as keyof typeof reservation.car;
            const hourlyPrice = reservation.car[hourlyPriceField] as number | null | undefined;

            if (hourlyPrice) {
                return formatCurrency(hourlyPrice, currency);
            }
        }

        // For longer durations, use daily rate
        if (reservation.car.rental_daily_price && reservation.duration >= 24) {
            const days = Math.ceil(reservation.duration / 24);
            const totalPrice = reservation.car.rental_daily_price * days;
            return formatCurrency(totalPrice, currency);
        }
    }

    // Return 'N/A' if calculation is not possible
    return 'N/A';
}

// Format currency
function formatCurrency(amount: number | null | undefined, currency: string = 'CHF'): string {
    if (amount == null) return 'N/A';

    return new Intl.NumberFormat('de-CH', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount);
}

// Get status badge variant
function getStatusBadge(status: string): { variant: string; label: string } {
    switch (status) {
        case 'pending':
            return { variant: 'warning', label: 'Pending' };
        case 'confirmed':
            return { variant: 'success', label: 'Confirmed' };
        case 'rejected':
            return { variant: 'destructive', label: 'Rejected' };
        case 'completed':
            return { variant: 'default', label: 'Completed' };
        case 'canceled':
            return { variant: 'outline', label: 'Canceled' };
        default:
            return { variant: 'secondary', label: status };
    }
} 