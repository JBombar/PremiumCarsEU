// src/app/dealer-admin/page.tsx

import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
// Choose appropriate icons
import { TruckIcon, CheckBadgeIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import { KpiCard } from "@/components/admin/KpiCard";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Dashboard | Dealer Admin",
};

// Interface for the stats calculated from partner_listings
interface DealerPartnerStats {
    total_submitted: number;
    total_published_by_admin: number;
    total_sold_by_dealer: number;
    // You could add total_available_by_dealer if needed
}

async function getDealerStats(): Promise<{ data: DealerPartnerStats | null; error: any }> {
    const supabase = createClient();

    // 1. Get Authenticated User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error("Authentication error:", authError);
        return { data: null, error: authError || new Error("User not found") };
    }
    console.log("Dealer Dashboard: Authenticated User ID:", user.id); // Log User ID


    // 2. Get the Dealer Partner ID
    const { data: partnerData, error: partnerError } = await supabase
        .from('dealer_partners')
        .select('id') // partner_id
        .eq('dealer_user_id', user.id)
        .maybeSingle();

    if (partnerError) {
        console.error("Error fetching dealer partner ID:", partnerError);
        return { data: null, error: partnerError };
    }
    if (!partnerData) {
        console.warn(`No dealer partner record found for user ID: ${user.id}`);
        return { data: { total_submitted: 0, total_published_by_admin: 0, total_sold_by_dealer: 0 }, error: null };
    }
    const dealerPartnerId = partnerData.id;
    console.log("Dealer Dashboard: Found Dealer Partner ID:", dealerPartnerId); // <-- Log the ID being used


    // 3. Calculate Stats from partner_listings using aggregate counts
    try {
        const [submittedResult, publishedResult, soldResult] = await Promise.all([
            // Total Submitted by this dealer
            supabase
                .from('partner_listings')
                .select('*', { count: 'exact', head: true })
                .eq('partner_id', dealerPartnerId),
            // Total Published by Admin (based on the flag)
            supabase
                .from('partner_listings')
                .select('*', { count: 'exact', head: true })
                .eq('partner_id', dealerPartnerId)
                .eq('is_added_to_main_listings', true), // Check the flag
            // Total Sold (as marked by the dealer in their inventory)
            supabase
                .from('partner_listings')
                .select('*', { count: 'exact', head: true })
                .eq('partner_id', dealerPartnerId)
                .eq('status', 'sold') // Check the dealer's status field
        ]);

        // Check for errors
        if (submittedResult.error) throw submittedResult.error;
        if (publishedResult.error) throw publishedResult.error;
        if (soldResult.error) throw soldResult.error;

        console.log("Dealer Dashboard: Submitted Count:", submittedResult.count); // Log counts
        console.log("Dealer Dashboard: Published Count:", publishedResult.count); // Log counts
        console.log("Dealer Dashboard: Sold Count:", soldResult.count); // Log counts

        const stats: DealerPartnerStats = {
            total_submitted: submittedResult.count ?? 0,
            total_published_by_admin: publishedResult.count ?? 0,
            total_sold_by_dealer: soldResult.count ?? 0,
        };

        return { data: stats, error: null };

    } catch (error: any) {
        console.error("Error calculating dealer stats from partner_listings:", error);
        return { data: null, error };
    }
}

// --- Main Component ---
export default async function DealerDashboard() {
    const { data: stats, error } = await getDealerStats();

    // Handle auth redirect
    if (error && (error.message === "User not found" || error.status === 401)) {
        return redirect("/login?callbackUrl=/dealer-admin");
    }

    const isLoading = false;
    const hasError = error !== null;

    return (
        <div>
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Dealer Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of your submitted listings and their status.
                </p>
            </div>

            {/* Error Display */}
            {hasError ? (
                <div className="bg-destructive/10 p-4 rounded-md text-destructive mb-8">
                    <p>There was an error loading your listing statistics. Please try refreshing the page.</p>
                    {process.env.NODE_ENV === 'development' && error?.message && (
                        <pre className="mt-2 text-xs whitespace-pre-wrap">Error: {error.message}</pre>
                    )}
                </div>
            ) : (
                // KPI Cards - Adjusted titles and values
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <KpiCard
                        title="Total Listings Submitted"
                        value={stats?.total_submitted ?? 0}
                        icon={TruckIcon} // Or another relevant icon
                        isLoading={isLoading}
                    />
                    <KpiCard
                        title="Listings Published by Admin"
                        value={stats?.total_published_by_admin ?? 0}
                        icon={CheckBadgeIcon} // Example icon for published/approved
                        isLoading={isLoading}
                    />
                    <KpiCard
                        title="Listings Marked Sold"
                        value={stats?.total_sold_by_dealer ?? 0}
                        icon={ShoppingCartIcon}
                        isLoading={isLoading}
                    />
                    {/* You could add another card for "Available (by You)" if desired */}
                    {/* <KpiCard
                        title="Available Listings (by You)"
                        value={(stats?.total_submitted ?? 0) - (stats?.total_sold_by_dealer ?? 0)} // Example calculation
                        icon={Car}
                        isLoading={isLoading}
                    /> */}
                </div>
            )}

            {/* No Listings Message */}
            {!hasError && stats?.total_submitted === 0 && (
                <div className="bg-muted p-6 rounded-lg text-center mb-8">
                    <h3 className="font-medium text-lg mb-2">No Listings Submitted Yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Use the Inventory page to submit your first vehicle listing for admin approval.
                    </p>
                    <a href="/dealer-admin/inventory" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        Go to Inventory
                    </a>
                </div>
            )}

            {/* Other dashboard sections */}
        </div>
    );
}