import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server"; // Assuming this path is correct for server component
import { CarFront, ShoppingCart, Car } from "lucide-react";
import { KpiCard } from "@/components/admin/KpiCard"; // Assuming this path is correct
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Dashboard | Dealer Admin",
};

interface InventoryStats {
    id: string;
    dealer_id: string;
    total_listings: number;
    sold_cars: number; // Assuming this is monthly, based on card title
    available_cars: number;
    created_at?: string;
    updated_at?: string;
}

async function getInventoryStats() {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("Authentication error:", authError);
        // Redirect to login, preserving the intended destination
        return redirect("/login?callbackUrl=/dealer-admin");
    }

    // Use the authenticated user's ID as the dealer_id
    const dealerId = user.id;

    // Fetch stats for the logged-in dealer
    // Added type safety improvements
    const { data, error } = await supabase
        .from("inventory_stats") // No need for 'as any' if types are set up
        .select("*")
        .eq("dealer_id", dealerId)
        .maybeSingle(); // Use maybeSingle() for optional record

    if (error) {
        console.error("Error fetching inventory stats:", error);
        // Return error state for handling in the component
        return { error, data: null };
    }

    // Return data explicitly typed
    return { data: data as InventoryStats | null, error: null };
}

export default async function DealerDashboard() {
    const { data: stats, error } = await getInventoryStats();

    // Determine loading state (can be enhanced if needed)
    const isLoading = false; // Since this is RSC, loading is handled by Next.js streaming/Suspense
    const hasError = error !== null;

    return (
        <div>
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Dealer Dashboard</h1>
                <p className="text-muted-foreground">
                    Here's an overview of your dealership's performance.
                </p>
            </div>

            {/* Display error message if fetching failed */}
            {hasError ? (
                <div className="bg-destructive/10 p-4 rounded-md text-destructive mb-8">
                    <p>There was an error loading your inventory statistics. Please try refreshing the page.</p>
                    {/* Optional: Show error details in development */}
                    {process.env.NODE_ENV === 'development' && error?.message && (
                        <pre className="mt-2 text-xs whitespace-pre-wrap">Error: {error.message}</pre>
                    )}
                </div>
            ) : (
                // Display KPI Cards if no error
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <KpiCard
                        title="Total Cars Listed"
                        // Provide default 0 if stats are null/undefined
                        value={stats?.total_listings ?? 0}
                        icon={CarFront}
                        isLoading={isLoading} // isLoading is false here in RSC
                    />
                    <KpiCard
                        title="Cars Sold This Month"
                        value={stats?.sold_cars ?? 0}
                        icon={ShoppingCart}
                        isLoading={isLoading}
                    />
                    <KpiCard
                        title="Available Cars"
                        value={stats?.available_cars ?? 0}
                        icon={Car}
                        isLoading={isLoading}
                    />
                </div>
            )}

            {/*
             * Removed the "No Inventory Data Yet" block.
             * The dashboard will now simply show the KPI cards (potentially with 0 values)
             * or the error message if fetching failed.
            */}

            {/* You might add other dashboard sections below */}

        </div>
    );
}