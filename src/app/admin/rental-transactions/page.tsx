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
    total_reservations: number;
    total_confirmed: number;
    total_completed: number;
    total_cancelled: number;
    gross_revenue_chf: number;
    avg_price_chf: number;
    avg_length_hours: number;
}

interface Transaction {
    id: string;
    listing_id: string;
    renter_id: string;
    start_date: string;
    end_date: string;
    start_time: string | null;
    end_time: string | null;
    duration: number;
    total_price: number;
    currency: string;
    status: 'confirmed' | 'completed' | 'pending' | 'cancelled';
    created_at: string;
    approved_at: string | null;
    canceled_at: string | null;
    car_make: string;
    car_model: string;
    car_year: number;
    renter_name: string;
}

interface ApiResponse {
    kpis: KPI;
    rows: Transaction[];
    paging: {
        total: number;
        page: number;
        page_size: number;
        total_pages: number;
    };
}

export default function RentalTransactionsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const page_size = parseInt(searchParams.get("page_size") || "10");
    const sort_field = searchParams.get("sort_field") || "created_at";
    const sort_direction = searchParams.get("sort_direction") || "desc";
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    // Default to last 30 days if no date range is specified
    const default_start_date = new Date();
    default_start_date.setDate(default_start_date.getDate() - 30);

    const [start_date, set_start_date] = useState<Date | null>(
        searchParams.get("from") ? new Date(searchParams.get("from") as string) : default_start_date
    );
    const [end_date, set_end_date] = useState<Date | null>(
        searchParams.get("to") ? new Date(searchParams.get("to") as string) : new Date()
    );

    const [is_loading, set_is_loading] = useState(true);
    const [data, set_data] = useState<ApiResponse | null>({
        kpis: {
            total_reservations: 0,
            total_confirmed: 0,
            total_completed: 0,
            total_cancelled: 0,
            gross_revenue_chf: 0,
            avg_price_chf: 0,
            avg_length_hours: 0
        },
        rows: [],
        paging: {
            total: 0,
            page: 1,
            page_size: page_size,
            total_pages: 0
        }
    });
    const [status_filter, set_status_filter] = useState(status);
    const [search_term, set_search_term] = useState(search);

    const [date_range, set_date_range] = useState<DateRange | undefined>(
        start_date && end_date
            ? { from: start_date, to: end_date }
            : undefined
    );

    // Fetch data from API
    useEffect(() => {
        const fetch_data = async () => {
            set_is_loading(true);

            // Format dates for API
            const from_date_str = start_date ? new Date(start_date.setHours(0, 0, 0, 0)).toISOString()
                : "";
            const to_date_str = end_date ? new Date(end_date.setHours(23, 59, 59, 999)).toISOString()
                : "";

            try {
                // Build the query parameters
                const query_params = new URLSearchParams();
                query_params.set("page", page.toString());
                query_params.set("page_size", page_size.toString());
                query_params.set("sort", `${sort_field},${sort_direction}`);

                // Only add status if it's not "all"
                if (status_filter !== "all") {
                    query_params.set("status", status_filter);
                }

                if (search_term) query_params.set("search", search_term);
                if (from_date_str) query_params.set("from", from_date_str);
                if (to_date_str) query_params.set("to", to_date_str);

                const response = await fetch(`/api/rental-transactions?${query_params.toString()}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const result = await response.json();
                set_data(result);
            } catch (error) {
                console.error('Error fetching rental transactions:', error);
            } finally {
                set_is_loading(false);
            }
        };

        fetch_data();
    }, [page, page_size, sort_field, sort_direction, status_filter, search_term, start_date, end_date]);

    // Update URL when filters change
    const update_filters = () => {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("page_size", page_size.toString());
        params.set("sort_field", sort_field);
        params.set("sort_direction", sort_direction);

        if (status_filter && status_filter !== "all") params.set("status", status_filter);
        if (search_term) params.set("search", search_term);
        if (start_date) params.set("from", start_date.toISOString().split('T')[0]);
        if (end_date) params.set("to", end_date.toISOString().split('T')[0]);

        router.push(`/admin/rental-transactions?${params.toString()}`);
    };

    // Handle date range change
    const handle_date_range_change = (range: { from: Date; to: Date }) => {
        set_start_date(range.from);
        set_end_date(range.to);
    };

    // Handle sorting
    const handle_sort = (field: string) => {
        const direction = sort_field === field && sort_direction === "asc" ? "desc" : "asc";
        const params = new URLSearchParams(searchParams);
        params.set("sort_field", field);
        params.set("sort_direction", direction);
        router.push(`/admin/rental-transactions?${params.toString()}`);
    };

    // Format currency
    const format_currency = (amount: number) => {
        if (isNaN(amount)) return "CHF 0.00";

        return new Intl.NumberFormat("de-CH", {
            style: "currency",
            currency: "CHF",
        }).format(amount);
    };

    // Format date
    const format_date = (date_str: string) => {
        if (!date_str) return "N/A";

        try {
            return new Date(date_str).toLocaleDateString();
        } catch (error) {
            console.error(`Error formatting date: ${date_str}`, error);
            return "Invalid Date";
        }
    };

    // Update start_date and end_date when date_range changes
    useEffect(() => {
        if (date_range?.from) {
            set_start_date(date_range.from);
        }
        if (date_range?.to) {
            set_end_date(date_range.to);
        }
    }, [date_range]);

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Rental Transactions</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {is_loading ? (
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
                                    {format_currency(Number(data?.kpis?.gross_revenue_chf || 0))}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Completed Rentals</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{data?.kpis?.total_completed || 0}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Confirmed Rentals</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{data?.kpis?.total_confirmed || 0}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-muted-foreground">Avg Duration (Hours)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{(Number(data?.kpis?.avg_length_hours || 0)).toFixed(1)}</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="w-full md:w-auto">
                    <DateRangePicker
                        value={date_range}
                        onChange={(range) => {
                            set_date_range(range);
                            if (range?.from && range?.to) {
                                handle_date_range_change({ from: range.from, to: range.to });
                            }
                        }}
                    />
                </div>

                <div className="w-full md:w-auto">
                    <Select value={status_filter} onValueChange={set_status_filter}>
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
                        value={search_term}
                        onChange={(e) => set_search_term(e.target.value)}
                    />
                </div>

                <Button onClick={update_filters}>Apply Filters</Button>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    {is_loading ? (
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
                                    <TableHead className="cursor-pointer" onClick={() => handle_sort("id")}>
                                        ID {sort_field === "id" && (sort_direction === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handle_sort("created_at")}>
                                        Date {sort_field === "created_at" && (sort_direction === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead>Vehicle</TableHead>
                                    <TableHead>Renter</TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handle_sort("start_date")}>
                                        Rental Period {sort_field === "start_date" && (sort_direction === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handle_sort("total_price")}>
                                        Price {sort_field === "total_price" && (sort_direction === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handle_sort("status")}>
                                        Status {sort_field === "status" && (sort_direction === "asc" ? "↑" : "↓")}
                                    </TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {is_loading ? (
                                    [...Array(page_size)].map((_, i) => (
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
                                            <TableCell>{format_date(transaction.created_at)}</TableCell>
                                            <TableCell>
                                                {transaction.car_year} {transaction.car_make} {transaction.car_model}
                                            </TableCell>
                                            <TableCell>{transaction.renter_name}</TableCell>
                                            <TableCell>
                                                {format_date(transaction.start_date)} - {format_date(transaction.end_date)}
                                            </TableCell>
                                            <TableCell>{format_currency(Number(transaction.total_price))}</TableCell>
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
                {!is_loading && data?.paging?.total_pages && data.paging.total_pages > 1 && (
                    <CardFooter className="flex items-center justify-between px-6 pt-2">
                        <p className="text-sm text-muted-foreground">
                            Page {data?.paging?.page || 1} of {data?.paging?.total_pages || 1}
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
                                    const total_pages = data?.paging?.total_pages || 1;
                                    params.set("page", Math.min(total_pages, page + 1).toString());
                                    router.push(`/admin/rental-transactions?${params.toString()}`);
                                }}
                                disabled={page >= (data?.paging?.total_pages || 1)}
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
