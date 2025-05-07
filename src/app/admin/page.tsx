import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CarFront, ShoppingCart, Car, DollarSign, Sparkles, Clock } from "lucide-react";
import { KpiCard } from "@/components/admin/KpiCard";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard | PremiumCarsEU Admin",
};

// Define an interface for the inventory stats data
interface InventoryStats {
  id: string;
  dealer_id: string;
  total_listings: number;
  sold_cars: number;
  available_cars: number;
  total_value?: number;
  new_cars_count?: number;
  used_cars_count?: number;
  created_at?: string;
  updated_at?: string;
}

// Define car listing interface to ensure proper typing
interface CarListing {
  price: string | null;
  condition?: string;
}

async function getInventoryStats() {
  const supabase = createClient();

  // Get current authenticated user securely with getUser()
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication error:", authError);
    return redirect('/login?callbackUrl=/admin');
  }

  const dealerId = user.id;

  // Fetch inventory stats for this dealer
  // Use "any" type to bypass TypeScript's strict checking until Database type is updated
  const { data, error } = await (supabase
    .from('inventory_stats' as any)
    .select('*')
    .eq('dealer_id', dealerId)
    .maybeSingle() as any);

  if (error) {
    console.error("Error fetching inventory stats:", error);
    return { error, data: null };
  }

  // Fetch car listings to calculate additional stats
  const { data: carListings, error: listingsError } = await supabase
    .from('car_listings')
    .select('price, condition')
    .eq('dealer_id', dealerId)
    .eq('status', 'available'); // Only count available cars

  if (listingsError) {
    console.error("Error fetching car listings:", listingsError);
    return { error: listingsError, data: null };
  }

  // Calculate total value of inventory with proper type handling
  const totalValue = (carListings as CarListing[]).reduce((sum, car) => {
    // Handle cases where price might be null or not a valid number
    const price = car.price ? parseFloat(car.price) : 0;
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  // Count new and used cars
  const newCarsCount = (carListings as CarListing[]).filter(car =>
    car.condition?.toLowerCase() === 'new'
  ).length;

  const usedCarsCount = (carListings as CarListing[]).filter(car =>
    car.condition?.toLowerCase() === 'used'
  ).length;

  // Add calculated stats to the data
  const enhancedStats = {
    ...data,
    total_value: totalValue,
    new_cars_count: newCarsCount,
    used_cars_count: usedCarsCount
  };

  // Cast the data to our defined interface
  return { data: enhancedStats as InventoryStats | null, error: null };
}

export default async function AdminDashboard() {
  const { data: stats, error } = await getInventoryStats();

  const isLoading = false; // We're using Server Components, so no client-side loading state
  const hasError = error !== null;

  // Format currency value
  const formatCurrency = (value: number) => {
    return `CHF ${value.toLocaleString('de-DE')}`;
  };

  return (
    <div>
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your dealership's current inventory status.
        </p>
      </div>

      {hasError ? (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive mb-8">
          <p>There was an error loading your inventory statistics. Please try refreshing the page.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KpiCard
              title="Total Cars Listed"
              value={stats?.total_listings || 0}
              icon={CarFront}
              isLoading={isLoading}
            />
            <KpiCard
              title="Cars Sold This Month"
              value={stats?.sold_cars || 0}
              icon={ShoppingCart}
              isLoading={isLoading}
            />
            <KpiCard
              title="Available Cars"
              value={stats?.available_cars || 0}
              icon={Car}
              isLoading={isLoading}
            />
            <KpiCard
              title="Total Inventory Value"
              value={formatCurrency(stats?.total_value || 0)}
              icon={DollarSign}
              isLoading={isLoading}
            />
          </div>

          <h2 className="text-xl font-semibold mb-4">Inventory Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <KpiCard
              title="New Cars in Stock"
              value={stats?.new_cars_count || 0}
              icon={Sparkles}
              isLoading={isLoading}
            />
            <KpiCard
              title="Used Cars in Stock"
              value={stats?.used_cars_count || 0}
              icon={Clock}
              isLoading={isLoading}
            />
          </div>
        </>
      )}

      {/* When no data exists yet */}
      {!hasError && !stats && (
        <div className="bg-muted p-6 rounded-lg text-center mb-8">
          <h3 className="font-medium text-lg mb-2">No Inventory Data Yet</h3>
          <p className="text-muted-foreground mb-4">
            It looks like you're just getting started. Add your first vehicle to begin tracking inventory statistics.
          </p>
          <a href="/admin/inventory/new" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Add First Vehicle
          </a>
        </div>
      )}

      {/* Additional dashboard content can go here */}
    </div>
  );
} 