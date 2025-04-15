import { Metadata } from "next";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  ChartBarIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Analytics | CarBiz Admin",
};

// Define proper types for our data
interface SearchIntent {
  id: string;
  raw_input: string;
  created_at: string;
  parsed_filters: Record<string, string | number | boolean> | null;
  confidence: number | null;
}

interface CarListing {
  id: string;
  make: string;
  model: string;
  year: number | null;
  price: number | null;
}

interface ListingView {
  car_id: string;
}

interface TopViewedListing extends CarListing {
  view_count: number;
}

export default async function AnalyticsPage() {
  // Create Supabase client
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Fetch analytics data
  const fetchData = async () => {
    try {
      // 1. Get total search count
      const { count: totalSearches } = await supabase
        .from("ai_search_intents")
        .select("*", { count: "exact", head: true });

      // 2. Get recent searches (top 5)
      const { data: recentSearches } = await supabase
        .from("ai_search_intents")
        .select("id, raw_input, created_at, parsed_filters, confidence")
        .order("created_at", { ascending: false })
        .limit(5);

      // 3. Get all search intents for the expandable section
      const { data: allSearchIntents } = await supabase
        .from("ai_search_intents")
        .select("id, raw_input, created_at, parsed_filters, confidence")
        .order("created_at", { ascending: false })
        .limit(50); // Limit to 50 to prevent fetching too much data

      // 4. Get total listing views count
      const { count: totalViews } = await supabase
        .from("listing_views")
        .select("*", { count: "exact", head: true });

      // 5. Get top viewed listings
      // First, fetch all listing views
      const { data: listingViews } = await supabase
        .from("listing_views")
        .select("car_id");

      // Process the data manually instead of using groupBy
      const viewCounts: Record<string, number> = {};

      if (listingViews) {
        // Count occurrences of each car_id
        listingViews.forEach((view: ListingView) => {
          if (view.car_id) {
            viewCounts[view.car_id] = (viewCounts[view.car_id] || 0) + 1;
          }
        });
      }

      // Get the top 5 car_ids by view count
      const topCarIds = Object.entries(viewCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5)
        .map(([carId]) => carId);

      // Get all car_ids with at least one view for the expandable section
      const allViewedCarIds = Object.keys(viewCounts);

      // Then fetch details for those car_ids - ONLY fetch what we need (no images)
      const topViewedListings: TopViewedListing[] = [];
      const allViewedListings: TopViewedListing[] = [];

      if (topCarIds.length > 0) {
        const { data: topCarDetails } = await supabase
          .from("car_listings")
          .select("id, make, model, year, price") // No images
          .in("id", topCarIds);

        if (topCarDetails) {
          // Merge view counts with car details
          topCarDetails.forEach((car: CarListing) => {
            const viewCount = viewCounts[car.id] || 0;
            topViewedListings.push({
              ...car,
              view_count: viewCount
            });
          });

          // Sort by view count (highest first)
          topViewedListings.sort((a, b) => b.view_count - a.view_count);
        }
      }

      if (allViewedCarIds.length > 0) {
        const { data: allCarDetails } = await supabase
          .from("car_listings")
          .select("id, make, model, year, price") // No images
          .in("id", allViewedCarIds);

        if (allCarDetails) {
          // Merge view counts with car details
          allCarDetails.forEach((car: CarListing) => {
            const viewCount = viewCounts[car.id] || 0;
            allViewedListings.push({
              ...car,
              view_count: viewCount
            });
          });

          // Sort by view count (highest first)
          allViewedListings.sort((a, b) => b.view_count - a.view_count);
        }
      }

      return {
        totalSearches: totalSearches || 0,
        recentSearches: (recentSearches || []) as SearchIntent[],
        allSearchIntents: (allSearchIntents || []) as SearchIntent[],
        totalViews: totalViews || 0,
        topViewedListings: topViewedListings,
        allViewedListings: allViewedListings,
      };
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      return {
        totalSearches: 0,
        recentSearches: [] as SearchIntent[],
        allSearchIntents: [] as SearchIntent[],
        totalViews: 0,
        topViewedListings: [] as TopViewedListing[],
        allViewedListings: [] as TopViewedListing[],
      };
    }
  };

  // Get the data
  const {
    totalSearches,
    recentSearches,
    allSearchIntents,
    totalViews,
    topViewedListings,
    allViewedListings
  } = await fetchData();

  // Render search intent item (used in multiple places)
  const renderSearchIntent = (search: SearchIntent) => (
    <div
      key={search.id}
      className="p-3 border rounded-md hover:bg-muted/10 transition-colors"
    >
      <div className="flex items-center justify-between">
        <p className="font-medium">
          {search.raw_input}
        </p>
        {search.confidence !== null && (
          <Badge variant={search.confidence > 0.7 ? "default" : "secondary"}>
            {Math.round(search.confidence * 100)}% confidence
          </Badge>
        )}
      </div>
      <div className="flex items-center text-xs text-muted-foreground mt-2">
        <ClockIcon className="h-3 w-3 mr-1" />
        {format(new Date(search.created_at), "MMM d, yyyy h:mm a")}
      </div>
      {search.parsed_filters && (
        <div className="mt-3 pt-2 border-t text-sm">
          <p className="text-xs text-muted-foreground mb-1">Parsed filters:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(search.parsed_filters).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key.replace(/_/g, ' ')}: {String(value)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render listing item (used in multiple places)
  const renderListingItem = (car: TopViewedListing) => (
    <div
      key={car.id}
      className="p-3 border rounded-md hover:bg-muted/10 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium">
            {car.year} {car.make} {car.model}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            ${car.price?.toLocaleString() || "Price unavailable"}
          </p>
        </div>
        <Badge className="ml-2" variant="secondary">
          <EyeIcon className="h-3 w-3 mr-1" /> {car.view_count} views
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Track your platform's performance and user engagement
      </p>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Search Analytics Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <MagnifyingGlassIcon className="h-5 w-5 mr-2 text-primary" />
              AI Search Analytics
            </CardTitle>
            <CardDescription>
              Track AI-powered search usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg mb-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Search Queries
                </p>
                <p className="text-3xl font-bold mt-1">{totalSearches}</p>
              </div>
              <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center">
                <SparklesIcon className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h3 className="text-lg font-medium mb-3">Recent Search Intents</h3>
            {recentSearches.length > 0 ? (
              <div className="space-y-4 mb-6">
                {recentSearches.map((search: SearchIntent) => renderSearchIntent(search))}
              </div>
            ) : (
              <p className="text-muted-foreground mb-6">No search data available yet.</p>
            )}

            {/* New Expandable Section for All Search Intents */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="all-searches">
                <AccordionTrigger className="text-base font-medium">
                  All Search Intents ({allSearchIntents.length})
                </AccordionTrigger>
                <AccordionContent>
                  {allSearchIntents.length > 0 ? (
                    <div className="space-y-4 mt-4">
                      {allSearchIntents.map((search: SearchIntent) => renderSearchIntent(search))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-2">No search data available.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Listing View Analytics Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <EyeIcon className="h-5 w-5 mr-2 text-primary" />
              Listing View Analytics
            </CardTitle>
            <CardDescription>
              Track your most popular vehicle listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg mb-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Listing Views
                </p>
                <p className="text-3xl font-bold mt-1">{totalViews}</p>
              </div>
              <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center">
                <ChartBarIcon className="h-8 w-8 text-primary" />
              </div>
            </div>

            <h3 className="text-lg font-medium mb-3">Top Viewed Listings</h3>
            {topViewedListings.length > 0 ? (
              <div className="space-y-4 mb-6">
                {topViewedListings.map((car: TopViewedListing) => renderListingItem(car))}
              </div>
            ) : (
              <p className="text-muted-foreground mb-6">No view data available yet.</p>
            )}

            {/* New Expandable Section for All Viewed Listings */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="all-views">
                <AccordionTrigger className="text-base font-medium">
                  All Viewed Listings ({allViewedListings.length})
                </AccordionTrigger>
                <AccordionContent>
                  {allViewedListings.length > 0 ? (
                    <div className="space-y-4 mt-4">
                      {allViewedListings.map((car: TopViewedListing) => renderListingItem(car))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-2">No viewed listings available.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Additional Data Visualization Section */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>
            Dive deeper into your platform's performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trends">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trends">Usage Trends</TabsTrigger>
              <TabsTrigger value="conversion">Conversion Rates</TabsTrigger>
              <TabsTrigger value="search">Search Performance</TabsTrigger>
            </TabsList>
            <TabsContent value="trends" className="py-4">
              <div className="bg-muted/20 border border-dashed rounded-lg p-12 flex flex-col items-center justify-center">
                <FireIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-center">Usage Trend Visualization</h3>
                <p className="text-center text-muted-foreground mt-2 max-w-md">
                  Future enhancement: Charts displaying user engagement and listing view trends over time
                </p>
              </div>
            </TabsContent>
            <TabsContent value="conversion" className="py-4">
              <div className="bg-muted/20 border border-dashed rounded-lg p-12 flex flex-col items-center justify-center">
                <ClockIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-center">Conversion Metrics</h3>
                <p className="text-center text-muted-foreground mt-2 max-w-md">
                  Future enhancement: Track how views convert to inquiries, test drives, and purchases
                </p>
              </div>
            </TabsContent>
            <TabsContent value="search" className="py-4">
              <div className="bg-muted/20 border border-dashed rounded-lg p-12 flex flex-col items-center justify-center">
                <MagnifyingGlassIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-center">AI Search Performance</h3>
                <p className="text-center text-muted-foreground mt-2 max-w-md">
                  Future enhancement: Detailed analysis of search query success rates and user satisfaction
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 