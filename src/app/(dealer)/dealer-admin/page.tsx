import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CarFront, ShoppingCart, Car } from "lucide-react";
import { KpiCard } from "@/components/admin/KpiCard";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Dashboard | Dealer Admin",
};

interface InventoryStats {
    id: string;
    dealer_id: string;
    total_listings: number;
    sold_cars: number;
    available_cars: number;
    created_at?: string;
    updated_at?: string;
}

async function getInventoryStats() {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("Authentication error:", authError);
        return redirect("/login?callbackUrl=/dealer-admin");
    }

    const dealerId = user.id;

    const { data, error } = await (supabase
        .from("inventory_stats" as any)
        .select("*")
        .eq("dealer_id", dealerId)
        .maybeSingle() as any);

    if (error) {
        console.error("Error fetching inventory stats:", error);
        return { error, data: null };
    }

    return { data: data as InventoryStats | null, error: null };
}

export default async function DealerDashboard() {
    const { data: stats, error } = await getInventoryStats();

    const isLoading = false;
    const hasError = error !== null;

    return (
        <div>
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Dealer Dashboard</h1>
                <p className="text-muted-foreground">
                    Here's an overview of your dealership's performance.
                </p>
            </div>

            {hasError ? (
                <div className="bg-destructive/10 p-4 rounded-md text-destructive mb-8">
                    <p>There was an error loading your inventory statistics. Please try refreshing the page.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                </div>
            )}

            {!hasError && !stats && (
                <div className="bg-muted p-6 rounded-lg text-center mb-8">
                    <h3 className="font-medium text-lg mb-2">No Inventory Data Yet</h3>
                    <p className="text-muted-foreground mb-4">
                        It looks like you're just getting started. Add your first vehicle to begin tracking your dealership stats.
                    </p>
                    <a
                        href="/dealer-admin/inventory/new"
                        className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        Add First Vehicle
                    </a>
                </div>
            )}
        </div>
    );
}
