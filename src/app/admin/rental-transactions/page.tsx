"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ReloadIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { DateRange } from "react-day-picker";

// Types for API response
interface KPI {
    totalReservations: number;
    totalConfirmed: number;
    totalCompleted: number;
    totalCancelled: number;
    grossRevenueCHF: number;
    avgPriceCHF: number;
    avgLengthHours: number;
}

interface Transaction {
    id: string;
    listingId: string;
    renterId: string;
    startDate: string;
    endDate: string;
    startTime: string | null;
    endTime: string | null;
    duration: number;
    totalPrice: number;
    currency: string;
    status: 'confirmed' | 'completed' | 'pending' | 'cancelled';
    createdAt: string;
    approvedAt: string | null;
    canceledAt: string | null;
    carMake: string;
    carModel: string;
    carYear: number;
    renterName: string;
}

interface ApiResponse {
    kpis: KPI;
    rows: Transaction[];
    paging: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

export default function RentalTransactionsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    // Default to last 30 days if no date range is specified
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const [startDate, setStartDate] = useState<Date | null>(
        searchParams.get("from") ? new Date(searchParams.get("from") as string) : defaultStartDate
    );
    const [endDate, setEndDate] = useState<Date | null>(
        searchParams.get("to") ? new Date(searchParams.get("to") as string) : new Date()
    );

    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<ApiResponse | null>({
        kpis: {
            totalReservations: 0,
            totalConfirmed: 0,
            totalCompleted: 0,
            totalCancelled: 0,
            grossRevenueCHF: 0,
            avgPriceCHF: 0,
            avgLengthHours: 0
        },
        rows: [],
        paging: {
            total: 0,
            page: 1,
            pageSize: pageSize,
            totalPages: 0
        }
    });
    const [statusFilter, setStatusFilter] = useState(status);
    const [searchTerm, setSearchTerm] = useState(search);

    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        startDate && endDate
            ? { from: startDate, to: endDate }
            : undefined
    );

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            // Format dates for API
            const fromDateStr = startDate ? startDate.toISOString().split('T')[0] : '';
            const toDateStr = endDate ? endDate.toISOString().split('T')[0] : '';

            try {
                // Build the query parameters
                const queryParams = new URLSearchParams();
                queryParams.set("page", page.toString());
                queryParams.set("pageSize", pageSize.toString());
                queryParams.set("sort", `${sortField},${sortDirection}`);

                // Only add status if it's not "all"
                if (statusFilter !== "all") {
                    queryParams.set("status", statusFilter);
                }

                if (searchTerm) queryParams.set("search", searchTerm);
                if (fromDateStr) queryParams.set("from", fromDateStr);
                if (toDateStr) queryParams.set("to", toDateStr);

                const response = await fetch(`/api/rental-transactions?${queryParams.toString()}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Error fetching rental transactions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [page, pageSize, sortField, sortDirection, statusFilter, searchTerm, startDate, endDate]);

    // Update URL when filters change
    const updateFilters = () => {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("pageSize", pageSize.toString());
        params.set("sortField", sortField);
        params.set("sortDirection", sortDirection);

        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        if (searchTerm) params.set("search", searchTerm);
        if (startDate) params.set("from", startDate.toISOString().split('T')[0]);
        if (endDate) params.set("to", endDate.toISOString().split('T')[0]);

        router.push(`/admin/rental-transactions?${params.toString()}`);
    };

    // Handle date range change
    const handleDateRangeChange = (range: { from: Date; to: Date }) => {
        setStartDate(range.from);
        setEndDate(range.to);
    };

    // Handle sorting
    const handleSort = (field: string) => {
        const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc";
        const params = new URLSearchParams(searchParams);
        params.set("sortField", field);
        params.set("sortDirection", direction);
        router.push(`/admin/rental-transactions?${params.toString()}`);
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: 'CHF',
        }).format(amount);
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString();
    };

    // Update startDate and endDate when dateRange changes
    useEffect(() => {
        if (dateRange?.from) {
            setStartDate(dateRange.from);
        }
        if (dateRange?.to) {
            setEndDate(dateRange.to);
        }
    }, [dateRange]);

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Rental Transactions</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {isLoading ? (
                    <>
                        {[...Array(4)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-4 w-1/2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-3/4" />
                                </CardContent>
                            </Card>
                        ))}
                    </>
                ) : (
                    <>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(data?.kpis?.grossRevenueCHF || 0)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Completed Rentals</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{data?.kpis?.totalCompleted || 0}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Confirmed Rentals</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{data?.kpis?.totalConfirmed || 0}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Avg Duration (Hours)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{data?.kpis?.avgLengthHours?.toFixed(1) || 0}</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="w-full md:w-auto">
                    <DateRangePicker
                        value={dateRange}
                        onChange={(range) => {
                            setDateRange(range);
                            if (range?.from && range?.to) {
                                handleDateRangeChange({ from: range.from, to: range.to });
                            }
                        }}
                    />
                </div>

                <div className="w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full md:flex-1">
                    <Input
                        placeholder="Search make, model, or renter..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Button onClick={updateFilters}>Apply Filters</Button>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground">
                            <Skeleton className="h-4 w-[250px]" />
                        </div>
                    ) : (
                        <CardDescription>
                            Showing {data?.rows?.length || 0} of {data?.paging?.total || 0} transactions
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort("id")}>
                                        ID {sortField === "id" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                                        Date {sortField === "createdAt" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead>Vehicle</TableHead>
                                    <TableHead>Renter</TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort("startDate")}>
                                        Rental Period {sortField === "startDate" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort("totalPrice")}>
                                        Price {sortField === "totalPrice" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                                        Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(pageSize)].map((_, i) => (
                                        <TableRow key={i}>
                                            {[...Array(8)].map((_, j) => (
                                                <TableCell key={j}>
                                                    <Skeleton className="h-4 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : !data?.rows || data.rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            No transactions found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.rows.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell className="font-medium">{transaction.id.slice(0, 8)}</TableCell>
                                            <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                                            <TableCell>
                                                {transaction.carYear} {transaction.carMake} {transaction.carModel}
                                            </TableCell>
                                            <TableCell>{transaction.renterName}</TableCell>
                                            <TableCell>
                                                {formatDate(transaction.startDate)} - {formatDate(transaction.endDate)}
                                            </TableCell>
                                            <TableCell>{formatCurrency(transaction.totalPrice)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        transaction.status === "completed"
                                                            ? "secondary"
                                                            : transaction.status === "confirmed"
                                                                ? "default"
                                                                : transaction.status === "pending"
                                                                    ? "outline"
                                                                    : "destructive"
                                                    }
                                                >
                                                    {transaction.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/admin/rentals/${transaction.id}`}>
                                                        View Details
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>

                {/* Pagination */}
                {!isLoading && data?.paging?.totalPages && data.paging.totalPages > 1 && (
                    <CardFooter className="flex items-center justify-between px-6 pt-2">
                        <p className="text-sm text-muted-foreground">
                            Page {data?.paging?.page || 1} of {data?.paging?.totalPages || 1}
                        </p>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams);
                                    params.set("page", Math.max(1, page - 1).toString());
                                    router.push(`/admin/rental-transactions?${params.toString()}`);
                                }}
                                disabled={page <= 1}
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                                <span className="sr-only">Previous Page</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams);
                                    const totalPages = data?.paging?.totalPages || 1;
                                    params.set("page", Math.min(totalPages, page + 1).toString());
                                    router.push(`/admin/rental-transactions?${params.toString()}`);
                                }}
                                disabled={page >= (data?.paging?.totalPages || 1)}
                            >
                                <ChevronRightIcon className="h-4 w-4" />
                                <span className="sr-only">Next Page</span>
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
