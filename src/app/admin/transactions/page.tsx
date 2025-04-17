'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  RefreshCcw,
  Search,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Trash2,
  Download,
  BarChart4,
  Percent,
  Clock
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/useAuth';
import Link from "next/link";

//=================================================
// TYPE DEFINITIONS (Applying the refined structure)
//=================================================

interface JoinedCarListing {
  make?: string | null;
  model?: string | null;
  year?: number | null;
}

interface JoinedUser {
  first_name?: string | null;
  last_name?: string | null;
}

// Base transaction structure matching DB columns
interface BaseTransaction {
  id: string;
  buyer_id: string | null;
  seller_id: string;
  listing_id: string;
  agreed_price: number;
  // Allow null for status if it can be null in DB, otherwise remove null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  profit: number | null; // Added profit field
  margin: number | null; // Added margin field
  time_in_stock_days: number | null; // Changed back to time_in_stock_days
}

// Type matching the raw Supabase query result using generics
// Includes the nested objects from the join
interface RawTransaction extends BaseTransaction {
  car_listings: JoinedCarListing | null; // Joined object can be null
  seller: JoinedUser | null;           // Joined object can be null
  buyer: JoinedUser | null;            // Joined object can be null
}

// Final Transaction type used for state and display
// Includes the transformed/flattened fields
interface Transaction extends BaseTransaction {
  // Keep original nested objects if needed elsewhere, or remove if only using transformed
  car_listings: JoinedCarListing | null;
  seller: JoinedUser | null;
  buyer: JoinedUser | null;
  // Transformed fields
  vehicle_title: string; // Non-optional after transformation (will have fallback)
  seller_name: string;   // Non-optional after transformation (will have fallback)
  buyer_name: string | null; // Can still be null
}

// New interface for projections data
interface ProjectionsData {
  projected_profit: number;
  avg_margin: number;
}

//=================================================
// COMPONENT START
//=================================================

export default function TransactionsPage() {
  // Add the auth hook to check authentication status
  const { user, isLoading: authLoading } = useAuth();
  // State uses the final 'Transaction' type with transformed fields
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  // New state for projections data
  const [projections, setProjections] = useState<ProjectionsData>({
    projected_profit: 0,
    avg_margin: 0
  });
  const [projectionsLoading, setProjectionsLoading] = useState(true);

  const supabase = createClient();

  // Update the useEffect hook to check authentication before fetching
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // User is authenticated, proceed with data fetching
        fetchTransactions();
        fetchProjections();
      } else {
        // User is not authenticated, set empty state and no loading
        setLoading(false);
        setProjectionsLoading(false);
        // Could set an auth error here if desired
        // setError('You must be logged in to view transactions');
      }
    }
  }, [authLoading, user]);

  // Calculate summary statistics (use the transformed 'transactions' state)
  const totalTransactions = transactions.length;
  const totalSalesValue = transactions.reduce((sum, trans) => sum + (trans.agreed_price || 0), 0);
  const completedSales = transactions.filter(t => t.status === 'completed').length;
  const completedSalesValue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, trans) => sum + (trans.agreed_price || 0), 0);

  //=================================================
  // FETCH TRANSACTIONS (Corrected Select String - NO comments)
  //=================================================
  async function fetchTransactions() {
    setLoading(true);
    setError(null);
    setTransactions([]); // Clear previous data while loading

    try {
      // Use generic parameter <string, RawTransaction> to specify expected structure
      const { data: fetchedData, error: fetchError } = await supabase
        .from('transactions')
        .select<string, RawTransaction>(`
          *,
          car_listings:listing_id (
            make,
            model,
            year
          ),
          seller:seller_id (
            first_name,
            last_name
          ),
          buyer:buyer_id (
            first_name,
            last_name
          )
        `) // <-- End of select string, ensure no comments here
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw new Error(fetchError.message || 'Unknown database error occurred');
      }

      // With generics, fetchedData should be RawTransaction[] | null
      const rawData = fetchedData; // No explicit 'as' cast needed now

      // Check if rawData is null or empty before mapping
      if (!rawData) {
        console.log("No transaction data returned from fetch.");
        setTransactions([]); // Ensure state is empty array
        return; // Exit early
      }

      // Transform the raw data into the shape needed for the state/display (Transaction[])
      const transformedData: Transaction[] = rawData.map((trans) => {
        // Construct vehicle_title
        const title = trans.car_listings ?
          `${trans.car_listings.year || ''} ${trans.car_listings.make || ''} ${trans.car_listings.model || ''}`.trim() :
          'Unknown Vehicle';

        // Construct seller_name
        const sellerName = trans.seller ?
          `${trans.seller.first_name || ''} ${trans.seller.last_name || ''}`.trim() :
          'Unknown Seller';

        // Construct buyer_name (can be null)
        const buyerName = trans.buyer ?
          `${trans.buyer.first_name || ''} ${trans.buyer.last_name || ''}`.trim() :
          null;

        // Return transformed transaction object
        return {
          ...trans,
          vehicle_title: title,
          seller_name: sellerName,
          buyer_name: buyerName
        };
      });

      setTransactions(transformedData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
      setLoading(false);
    }
  }

  //=================================================
  // FETCH PROJECTIONS - Fixed to correctly calculate projections
  //=================================================
  async function fetchProjections() {
    setProjectionsLoading(true);

    try {
      // Direct query to calculate total projected profit from available listings
      // Exclude listings with null or 0 purchasing_price to avoid calculation errors
      const { data: listingsData, error: listingsError } = await supabase
        .from('car_listings')
        .select('price, purchasing_price')
        .eq('status', 'available')
        .not('purchasing_price', 'is', null)
        .gt('purchasing_price', 0);

      if (listingsError) {
        console.error('Error fetching car listings for projections:', listingsError);
        throw new Error(listingsError.message);
      }

      // Calculate projected profit and margin from the fetched data
      let totalProjectedProfit = 0;
      let validListingsForMargin = 0;
      let totalMarginPercentage = 0;

      if (listingsData && listingsData.length > 0) {
        listingsData.forEach(listing => {
          const price = listing.price || 0;
          const purchasingPrice = listing.purchasing_price || 0;

          if (price > 0 && purchasingPrice > 0) {
            // Calculate profit for this listing
            const profit = price - purchasingPrice;
            totalProjectedProfit += profit;

            // Calculate margin percentage for this listing
            const marginPercentage = profit / purchasingPrice;
            totalMarginPercentage += marginPercentage;
            validListingsForMargin++;
          }
        });
      }

      // Calculate average margin percentage
      const avgMargin = validListingsForMargin > 0
        ? totalMarginPercentage / validListingsForMargin
        : 0;

      // Update projections state
      setProjections({
        projected_profit: totalProjectedProfit,
        avg_margin: avgMargin
      });
    } catch (error) {
      console.error('Failed to fetch projections:', error);
      // Don't set the main error state as this is secondary information
    } finally {
      setProjectionsLoading(false);
    }
  }

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTransactions(), fetchProjections()]);
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Transaction data has been updated",
    });
  };

  // Handle delete transaction
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      // Remove from local state
      setTransactions(prev => prev.filter(t => t.id !== deleteId));

      toast({
        title: "Transaction Deleted",
        description: "The transaction has been permanently removed",
      });
    } catch (err) {
      console.error('Error deleting transaction:', err);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the transaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  // Export to CSV function (native JavaScript, no external libraries)
  const handleExport = async () => {
    setExporting(true);

    try {
      // Define CSV headers
      const headers = [
        'ID',
        'Vehicle',
        'Agreed Price',
        'Profit',
        'Margin',
        'Seller',
        'Buyer',
        'Status',
        'Days in Stock',
        'Completed Date',
        'Created Date'
      ];

      // Format data for CSV
      const rows = transactions.map(t => [
        t.id,
        t.vehicle_title,
        t.agreed_price?.toString() || '0',
        t.profit?.toString() || 'N/A',
        t.margin !== null ? `${t.margin.toFixed(2)}%` : 'N/A',
        t.seller_name,
        t.buyer_name || 'Not specified',
        t.status || 'Unknown',
        t.time_in_stock_days !== null ? t.time_in_stock_days.toString() : 'N/A',
        t.completed_at ? formatDate(t.completed_at) : 'N/A',
        formatDate(t.created_at)
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row =>
          row.map(cell =>
            // Escape quotes and wrap in quotes if contains comma
            cell.includes(',') ? `"${cell.replace(/"/g, '""')}"` : cell
          ).join(',')
        )
      ].join('\n');

      // Create Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Generate filename with current date
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_${currentDate}.csv`);
      link.style.visibility = 'hidden';

      // Append to document, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "Transactions exported as CSV",
      });
    } catch (err) {
      console.error('Error exporting transactions:', err);
      toast({
        title: "Export Failed",
        description: "Failed to export transactions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // Filter transactions based on search term and status filter
  const filteredTransactions = transactions.filter((transaction) => {
    // Check if the transaction matches the search term (case insensitive)
    const matchesSearch =
      !searchTerm ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.vehicle_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.seller_name && transaction.seller_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.buyer_name && transaction.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Check if the transaction matches the status filter
    const matchesStatus = !statusFilter || transaction.status === statusFilter;

    // Return true if both conditions are met
    return matchesSearch && matchesStatus;
  });

  // Helper functions
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) {
      // Format zero CHF using the desired locale
      return new Intl.NumberFormat('de-CH', {
        style: 'currency',
        currency: 'CHF',
        // You might want 0 or 2 fraction digits for CHF, adjust as needed
        // maximumFractionDigits: 0
      }).format(0);
    }
    // Format the actual amount using the desired locale and currency
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      // You might want 0 or 2 fraction digits for CHF, adjust as needed
      // maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper functions for formatting data
  // Fixed formatPercent function to handle both ratio and percentage values
  const formatPercent = (value: number | null, isRatio: boolean = false) => {
    if (value === null) return 'N/A';
    // If isRatio is true, multiply by 100 to convert to percentage
    const percentValue = isRatio ? value * 100 : value;
    return `${percentValue.toFixed(2)}%`;
  };

  // Helper to determine badge variant based on status
  const getStatusBadgeVariant = (status: string | null): BadgeProps["variant"] => {
    if (!status) return "outline";

    switch (status.toLowerCase()) {
      case 'completed':
        return "default";
      case 'confirmed':
        return "default";
      case 'pending':
        return "secondary";
      case 'cancelled':
        return "destructive";
      default:
        return "outline";
    }
  };

  // Add a helper function to format days in stock
  const formatDaysInStock = (days: number | null) => {
    if (days === null) return 'N/A';
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  // Add a function to get the appropriate color class for days in stock
  const getDaysInStockColorClass = (days: number | null) => {
    if (days === null) return 'bg-gray-100 text-gray-500';
    if (days < 30) return 'bg-green-100 text-green-800'; // Fast sale - less than 30 days
    if (days > 90) return 'bg-amber-100 text-amber-800'; // Long time - more than 90 days
    return 'bg-blue-100 text-blue-800'; // Normal range
  };

  return (
    <div className="space-y-8 p-6">
      {/* You could add authentication check here if needed */}
      {!user && !authLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium mb-4">Authentication Required</h3>
          <p className="text-muted-foreground mb-4">Please log in to view transactions</p>
          <Button variant="default" asChild>
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-medium mb-4">Total Transactions</h3>
          {/* Main Summary Cards Grid - Now only has original 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                    <h2 className="text-2xl md:text-3xl font-bold">{totalTransactions}</h2>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-full">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Card 2 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sales Value</p>
                    <h2 className="text-2xl md:text-3xl font-bold">{formatCurrency(totalSalesValue)}</h2>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-full">
                    <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Card 3 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed Sales</p>
                    <h2 className="text-2xl md:text-3xl font-bold">{completedSales}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{formatCurrency(completedSalesValue)}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-full">
                    <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MOVED: Projections Cards Grid - Now in a separate section with heading */}
          <div className="mt-8">
            <h3 className="text-md font-medium mb-4">Sales Projections</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 4 - Projected Profit */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Projected Profit</p>
                      <h2 className="text-2xl md:text-3xl font-bold">
                        {projectionsLoading ? (
                          <span className="text-muted-foreground text-sm">Loading...</span>
                        ) : (
                          formatCurrency(projections.projected_profit)
                        )}
                      </h2>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-full">
                      <BarChart4 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Card 5 - Average Profit Margin */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Profit Margin</p>
                      <h2 className="text-2xl md:text-3xl font-bold">
                        {projectionsLoading ? (
                          <span className="text-muted-foreground text-sm">Loading...</span>
                        ) : (
                          formatPercent(projections.avg_margin, true)
                        )}
                      </h2>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Percent className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Transactions Card */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>
                  View and manage all financial transactions for vehicle sales
                </CardDescription>
              </div>

              {/* Export Button */}
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exporting || transactions.length === 0}
                className="mt-4 sm:mt-0"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
                {exporting && <RefreshCcw className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
            </CardHeader>
            <CardContent>
              {/* Controls */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by vehicle, buyer, seller or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                  <Select
                    value={statusFilter || "all"}
                    onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCcw className={`h-4 w-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Transactions Table */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-red-600 font-medium">{error}</p>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    className="mt-4"
                    disabled={refreshing || loading}
                  >
                    Try Again
                  </Button>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm || statusFilter ? (
                    <p>No transactions match your filters</p>
                  ) : (
                    <p>No transactions found</p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Transaction ID</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Agreed Price</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Margin</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <div className="flex items-center space-x-1">
                            <span>Days in Stock</span>
                            <Button
                              variant="ghost"
                              className="h-4 w-4 p-0"
                              asChild
                            >
                              <div title="Number of days the vehicle was in inventory before being sold">
                                <span className="sr-only">Information about days in stock</span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-muted-foreground">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 16v-4" />
                                  <path d="M12 8h.01" />
                                </svg>
                              </div>
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div
                              className="font-mono text-sm break-all max-w-[160px]"
                              title={transaction.id}
                            >
                              {transaction.id}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">{transaction.vehicle_title}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatCurrency(transaction.agreed_price)}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {transaction.profit !== null ? formatCurrency(transaction.profit) : 'N/A'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {transaction.margin !== null ? formatPercent(transaction.margin) : 'N/A'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{transaction.seller_name}</TableCell>
                          <TableCell className="whitespace-nowrap">{transaction.buyer_name || 'Not specified'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(transaction.status)}
                              className="capitalize whitespace-nowrap"
                            >
                              {transaction.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge
                              className={getDaysInStockColorClass(transaction.time_in_stock_days)}
                            >
                              {formatDaysInStock(transaction.time_in_stock_days)}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(transaction.completed_at)}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(transaction.created_at)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(transaction.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              aria-label="Delete transaction"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the transaction record from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}