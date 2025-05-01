// src/app/admin/rentals/[id]/page.tsx

import { cookies as getCookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    ChevronLeft,
    FileText,
    Download,
    User,
    Calendar,
    Clock,
    DollarSign,
    Phone,
    Mail,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingUp
} from 'lucide-react';

interface RentalPageProps {
    params: { id: string };
}

// Define a type for the vehicle data - removed license_plate
interface VehicleData {
    id?: string;
    make: string;
    model: string;
    year: string | number;
    fuel_type: string;
    transmission: string;
    condition: string;
    mileage: number | null;
    image_url: string | null;
}

export default async function RentalDetailPage({ params }: RentalPageProps) {
    const cookieStore = getCookies();

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (name: string) => cookieStore.get(name)?.value,
            },
        }
    );

    // Get rental reservation data
    const { data, error } = await supabase
        .from('rental_reservations')
        .select('*')
        .eq('id', params.id as string)
        .single();

    if (error || !data) return notFound();

    // Fetch vehicle data separately
    let vehicleData: VehicleData | null = null;

    // Try to get vehicle data if there's a listing_id available
    if (data.listing_id) {
        const carResponse = await supabase
            .from('car_listings')
            .select(`
                id,
                make,
                model,
                year,
                fuel_type,
                transmission,
                condition,
                mileage,
                images
            `)
            .eq('id', data.listing_id)
            .single();

        // Check if we have valid car data (not an error)
        if (carResponse.data && !carResponse.error) {
            const carData = carResponse.data;
            // Map car data to the vehicle structure
            vehicleData = {
                id: carData.id,
                make: carData.make || 'Unknown',
                model: carData.model || 'Unknown',
                year: carData.year || 'N/A',
                fuel_type: carData.fuel_type || 'N/A',
                transmission: carData.transmission || 'N/A',
                condition: carData.condition || 'N/A',
                mileage: carData.mileage,
                // Take the first image from the images array if available
                image_url: carData.images && carData.images.length > 0 ? carData.images[0] : null
            };
        }
    }

    // Default vehicle data if none is found
    const vehicle: VehicleData = vehicleData || {
        make: "Unknown",
        model: "Unknown",
        year: "N/A",
        fuel_type: "N/A",
        transmission: "N/A",
        condition: "N/A",
        mileage: null,
        image_url: "/placeholder-car.jpg"
    };

    const {
        renter_name,
        renter_email,
        renter_phone,
        start_date,
        end_date,
        start_time,
        end_time,
        duration,
        id_document_url,
        license_document_url,
        status,
        created_at,
        approved_at,
        approved_by,
        canceled_at,
        canceled_by,
        notes,
        admin_comments,
        is_verified,
        verification_method,
        currency,
        total_price,
        preferred_contact_method,
    } = data;

    const statusVariant = status === 'confirmed'
        ? 'default'
        : status === 'pending'
            ? 'secondary'
            : 'destructive';

    const formatDate = (dateString?: string) =>
        dateString ? format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: enGB }) : null;

    const getStatusIcon = () => {
        if (status === 'confirmed') return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (status === 'pending') return <AlertCircle className="h-5 w-5 text-amber-500" />;
        return <XCircle className="h-5 w-5 text-red-500" />;
    };

    // Generate some placeholder data for the chart
    const placeholderChartData = [
        { month: 'Jan', value: 25 },
        { month: 'Feb', value: 40 },
        { month: 'Mar', value: 30 },
        { month: 'Apr', value: 70 },
        { month: 'May', value: 85 },
        { month: 'Jun', value: 50 }
    ];

    // Calculate the maximum value for scaling
    const maxValue = Math.max(...placeholderChartData.map(d => d.value));

    // Create the points for the SVG line
    const linePoints = placeholderChartData.map((point, index) => {
        const x = (index / (placeholderChartData.length - 1)) * 100;
        const y = 100 - (point.value / maxValue) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/admin/rentals" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Rentals
                </Link>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Rental Reservation Details</h1>
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <Badge variant={statusVariant} className="text-sm px-3 py-1">{status}</Badge>
                </div>
            </div>

            {/* Vehicle Information Card */}
            <Card className="mb-6">
                <CardContent className="p-0">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="relative h-64 md:h-auto">
                            <img
                                src={vehicle.image_url || "/placeholder-car.jpg"}
                                alt={`${vehicle.make} ${vehicle.model}`}
                                className="w-full h-full object-cover rounded-l-lg"
                            />
                        </div>
                        <div className="p-6 col-span-2 space-y-4">
                            <div>
                                <h2 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h2>
                                <p className="text-muted-foreground">{vehicle.year}</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 mt-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Fuel Type</p>
                                    <p className="font-medium">{vehicle.fuel_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Transmission</p>
                                    <p className="font-medium">{vehicle.transmission}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Condition</p>
                                    <p className="font-medium">{vehicle.condition}</p>
                                </div>
                                {vehicle.mileage && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Mileage</p>
                                        <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Combined Renter Info and Rental Period */}
            <Card className="mb-6">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Reservation Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Left Column - Renter Information */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm uppercase text-muted-foreground tracking-wider">Renter Information</h3>

                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Full Name</p>
                                    <p className="font-medium">{renter_name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{renter_email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium">{renter_phone}</p>
                                </div>
                            </div>

                            {preferred_contact_method && (
                                <div className="mt-2">
                                    <p className="text-sm text-muted-foreground">Preferred Contact Method</p>
                                    <p className="font-medium">{preferred_contact_method}</p>
                                </div>
                            )}
                        </div>

                        {/* Middle Column - Rental Times */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm uppercase text-muted-foreground tracking-wider">Rental Period</h3>

                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Start Date</p>
                                    <p className="font-medium">{formatDate(start_date)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">End Date</p>
                                    <p className="font-medium">{formatDate(end_date)}</p>
                                </div>
                            </div>

                            {start_time && (
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Start Time</p>
                                        <p className="font-medium">{formatDate(start_time)}</p>
                                    </div>
                                </div>
                            )}

                            {end_time && (
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">End Time</p>
                                        <p className="font-medium">{formatDate(end_time)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Price & Duration & Documents */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm uppercase text-muted-foreground tracking-wider">Payment & Documents</h3>

                            {duration && (
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Duration</p>
                                        <p className="font-medium">{duration} {start_time ? 'hours' : 'days'}</p>
                                    </div>
                                </div>
                            )}

                            {total_price != null && (
                                <div className="flex items-start gap-3">
                                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Price</p>
                                        <p className="font-medium text-lg">{currency} {total_price.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col space-y-2 pt-3">
                                <p className="text-sm text-muted-foreground">Documents</p>
                                <div className="flex flex-wrap gap-3">
                                    {id_document_url && (
                                        <a
                                            href={id_document_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
                                        >
                                            <FileText className="h-4 w-4" />
                                            ID Document
                                        </a>
                                    )}

                                    {license_document_url && (
                                        <a
                                            href={license_document_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
                                        >
                                            <FileText className="h-4 w-4" />
                                            License Document
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Admin Data and Notes */}
            <Card className="mb-6">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Admin Data & Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Left Side - Admin Metadata */}
                        <div>
                            <h3 className="font-medium text-sm uppercase text-muted-foreground tracking-wider mb-4">Status Information</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getStatusIcon()}
                                            <Badge variant={statusVariant}>{status}</Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">Created At</p>
                                        <p className="font-medium">{formatDate(created_at)}</p>
                                    </div>

                                    {approved_at && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Approved At</p>
                                            <p className="font-medium">{formatDate(approved_at)}</p>
                                        </div>
                                    )}

                                    {approved_by && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Approved By</p>
                                            <p className="font-medium">{approved_by}</p>
                                        </div>
                                    )}

                                    {canceled_at && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Canceled At</p>
                                            <p className="font-medium">{formatDate(canceled_at)}</p>
                                        </div>
                                    )}

                                    {canceled_by && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Canceled By</p>
                                            <p className="font-medium">{canceled_by}</p>
                                        </div>
                                    )}

                                    {is_verified !== null && (
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">Verification Status</p>
                                            <p className="font-medium">
                                                {is_verified ? 'Verified' : 'Not Verified'}
                                                {verification_method && ` (${verification_method})`}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Notes */}
                        <div>
                            <h3 className="font-medium text-sm uppercase text-muted-foreground tracking-wider mb-4">Notes & Comments</h3>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Renter Notes</p>
                                    <div className="bg-gray-50 p-3 rounded-md min-h-20 border border-gray-100">
                                        {notes || 'No additional notes from the renter.'}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Admin Comments</p>
                                    <div className="bg-gray-50 p-3 rounded-md min-h-20 border border-gray-100">
                                        {admin_comments || 'No admin comments.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Improved Analytics Charts */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Rental Analytics
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">Placeholder for future charts</div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="h-80 w-full relative">
                        {/* Y-axis labels - positioned on the left */}
                        <div className="absolute left-0 top-6 bottom-8 flex flex-col justify-between">
                            <div className="text-xs text-muted-foreground">85</div>
                            <div className="text-xs text-muted-foreground">64</div>
                            <div className="text-xs text-muted-foreground">43</div>
                            <div className="text-xs text-muted-foreground">21</div>
                            <div className="text-xs text-muted-foreground">0</div>
                        </div>

                        {/* Chart area */}
                        <div className="absolute left-8 right-0 top-0 bottom-0">
                            {/* SVG Chart */}
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                            >
                                {/* Horizontal grid lines */}
                                <line x1="0" y1="0" x2="100" y2="0" stroke="#f1f1f1" strokeWidth="0.5" />
                                <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f1f1" strokeWidth="0.5" />
                                <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f1f1" strokeWidth="0.5" />
                                <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f1f1" strokeWidth="0.5" />
                                <line x1="0" y1="100" x2="100" y2="100" stroke="#f1f1f1" strokeWidth="0.5" />

                                {/* Chart line - updated to match the red line chart */}
                                <polyline
                                    points="0,80 10,70 20,70 30,50 40,55 50,40 60,20 70,10 80,35 90,30 100,50"
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="2"
                                    strokeLinejoin="miter"
                                />

                                {/* Data points */}
                                <circle cx="0" cy="80" r="3" fill="#ef4444" />
                                <circle cx="10" cy="70" r="3" fill="#ef4444" />
                                <circle cx="20" cy="70" r="3" fill="#ef4444" />
                                <circle cx="30" cy="50" r="3" fill="#ef4444" />
                                <circle cx="40" cy="55" r="3" fill="#ef4444" />
                                <circle cx="50" cy="40" r="3" fill="#ef4444" />
                                <circle cx="60" cy="20" r="3" fill="#ef4444" />
                                <circle cx="70" cy="10" r="3" fill="#ef4444" />
                                <circle cx="80" cy="35" r="3" fill="#ef4444" />
                                <circle cx="90" cy="30" r="3" fill="#ef4444" />
                                <circle cx="100" cy="50" r="3" fill="#ef4444" />
                            </svg>
                        </div>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        {/* Revenue card with gray background */}
                        <div className="bg-slate-100 p-4 rounded-md">
                            <h3 className="text-sm font-medium text-slate-700">Total Revenue</h3>
                            <p className="text-2xl font-bold mt-1">CHF 12,450</p>
                            <p className="text-xs text-slate-500 mt-1">+12% from last month</p>
                        </div>

                        {/* Utilization rate card with green background */}
                        <div className="bg-green-50 p-4 rounded-md">
                            <h3 className="text-sm font-medium text-green-700">Utilization Rate</h3>
                            <p className="text-2xl font-bold mt-1">68%</p>
                            <p className="text-xs text-slate-500 mt-1">+5% from last month</p>
                        </div>

                        {/* Average duration card with blue background */}
                        <div className="bg-blue-50 p-4 rounded-md">
                            <h3 className="text-sm font-medium text-blue-700">Average Rental Duration</h3>
                            <p className="text-2xl font-bold mt-1">3.2 days</p>
                            <p className="text-xs text-slate-500 mt-1">-0.5 days from last month</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
