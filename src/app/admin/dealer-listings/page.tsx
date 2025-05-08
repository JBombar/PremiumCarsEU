// src/app/admin/dealer-listings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
// --- Ensure necessary icons are imported ---
import { Loader2, ArrowLeft, ArrowRight, ExternalLink, CheckCircle, UploadCloudIcon } from "lucide-react"; // Added UploadCloudIcon (or similar) for Add button
import { format } from "date-fns";
import Image from "next/image";
import { PhotoIcon } from '@heroicons/react/24/outline'; // Keep existing icons

// --- Define Interface (Should match the one from previous correct version) ---
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface DealerListing {
    id: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year: number;
    price: number | null;
    mileage: number | null;
    vin: string | null;
    images: string[];
    features: string[];
    condition: string | null;
    description: string | null;
    location_city: string | null;
    location_country: string | null;
    approval_status: ApprovalStatus;
    created_at: string;
    partner_id: string;
    approved_by?: string | null;
    dealer_business_name: string | null;
    dealer_contact_name: string | null;
    dealer_email: string | null;
    dealer_phone_number: string | null;
    is_added_to_main_listings: boolean;
    listing_type: string | null;
    body_type: string | null;
    engine: string | null;
    exterior_color: string | null;
    interior_color: string | null;
    is_special_offer: boolean;
    special_offer_label: string | null;
    is_public: boolean;
    fuel_type: string | null;
    transmission: string | null;
}

// --- Helper Functions (remain the same) ---
const capitalizeFirstLetter = (str: string | undefined | null): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const getApprovalStatusBadgeClasses = (status: ApprovalStatus | undefined | null): string => {
    switch (status) {
        case 'approved':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'rejected':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'pending':
        default:
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
};

const formatPriceAdmin = (price: number | null): string => {
    if (price === null || price === undefined) {
        return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'CHF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

// Helper component for Modal details
function ModalDetailItem({ label, value, children }: { label: string; value?: string | number | boolean | null; children?: React.ReactNode }) {
    return (
        <div>
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">
                {children ? children : (typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value ?? 'N/A'))}
            </dd>
        </div>
    );
}


// --- Page Component ---
export default function AdminDealerListingsPage() {
    const supabase = createClient();
    const { toast } = useToast();

    // State for listings
    const [listings, setListings] = useState<DealerListing[]>([]);
    const [filteredListings, setFilteredListings] = useState<DealerListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for filtering/searching
    const [searchQuery, setSearchQuery] = useState("");

    // State for modal
    const [selectedListing, setSelectedListing] = useState<DealerListing | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false); // For Approve/Reject
    const [isAddingToListings, setIsAddingToListings] = useState(false); // For Add to Listings

    // --- Data Fetching (Select the new fields) ---
    const fetchDealerListings = useCallback(async () => {
        setLoading(true);
        setError(null);
        console.log("Fetching dealer listings...");

        try {
            // Select all needed fields, including the new one and those required for mapping
            const { data, error: fetchError } = await supabase
                .from('partner_listings')
                .select(`
                    *,
                    is_added_to_main_listings,
                    listing_type,
                    body_type,
                    engine,
                    exterior_color,
                    interior_color,
                    is_special_offer,
                    special_offer_label,
                    is_public,
                    fuel_type,
                    transmission,
                    dealer_partners (business_name, contact_name, email, phone_number)
                `)
                .order('created_at', { ascending: false });


            if (fetchError) throw fetchError;

            const formattedListings: DealerListing[] = (data || []).map((item: any) => {
                const partnerData = item.dealer_partners as {
                    business_name: string | null; contact_name: string | null; email: string | null; phone_number: string | null;
                } | null;
                return {
                    id: item.id, vehicle_make: item.vehicle_make ?? 'N/A', vehicle_model: item.vehicle_model ?? 'N/A',
                    vehicle_year: item.vehicle_year ?? 0, price: item.price, mileage: item.mileage, vin: item.vin,
                    images: Array.isArray(item.images) ? item.images.filter(Boolean) : [],
                    features: Array.isArray(item.features) ? item.features.filter(Boolean) : [],
                    condition: item.condition, description: item.description, location_city: item.location_city,
                    location_country: item.location_country, approval_status: item.approval_status ?? 'pending',
                    created_at: item.created_at, partner_id: item.partner_id, approved_by: item.approved_by,
                    dealer_business_name: partnerData?.business_name ?? null, dealer_contact_name: partnerData?.contact_name ?? null,
                    dealer_email: partnerData?.email ?? null, dealer_phone_number: partnerData?.phone_number ?? null,
                    is_added_to_main_listings: item.is_added_to_main_listings ?? false, // <-- Map new field
                    listing_type: item.listing_type, // <-- Map new field
                    body_type: item.body_type, // <-- Map new field
                    engine: item.engine, // <-- Map new field
                    exterior_color: item.exterior_color, // <-- Map new field
                    interior_color: item.interior_color, // <-- Map new field
                    is_special_offer: item.is_special_offer ?? false, // <-- Map new field
                    special_offer_label: item.special_offer_label, // <-- Map new field
                    is_public: item.is_public ?? true, // <-- Map new field
                    fuel_type: item.fuel_type, // <-- Map new field
                    transmission: item.transmission, // <-- Map new field
                };
            });
            setListings(formattedListings);
            setFilteredListings(formattedListings);

        } catch (err: any) {
            console.error("Error fetching dealer listings:", err);
            let errorMsg = "Failed to load dealer listings. Check console for details.";
            if (err?.message) { errorMsg += ` Message: ${err.message}`; }
            if (err?.code) { errorMsg += ` Code: ${err.code}`; }
            if (err?.details) { errorMsg += ` Details: ${err.details}`; }
            if (err?.hint) { errorMsg += ` Hint: ${err.hint}`; }
            setError(errorMsg);
            toast({ title: "Error Fetching Data", description: err?.message || "Could not load listings.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    useEffect(() => {
        fetchDealerListings();
    }, [fetchDealerListings]);

    // --- Filtering Logic (remains the same) ---
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredListings(listings); return;
        }
        const query = searchQuery.toLowerCase();
        const filtered = listings.filter(listing =>
            listing.dealer_business_name?.toLowerCase().includes(query) ||
            listing.vehicle_make?.toLowerCase().includes(query) ||
            listing.vehicle_model?.toLowerCase().includes(query) ||
            listing.vin?.toLowerCase().includes(query)
        );
        setFilteredListings(filtered);
    }, [searchQuery, listings]);

    // --- Modal Open/Close Handlers (remains the same) ---
    const openListingDetails = (listing: DealerListing) => {
        setSelectedListing(listing);
        setModalImageIndex(0);
        setIsModalOpen(true);
    };

    const closeListingDetails = () => {
        setIsModalOpen(false);
        setIsSubmitting(false);
        setIsAddingToListings(false);
        setTimeout(() => { setSelectedListing(null); }, 300);
    };

    // --- Modal Image Navigation (remains the same) ---
    const nextModalImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (!selectedListing || !selectedListing.images || selectedListing.images.length <= 1) return;
        setModalImageIndex(prev => (prev + 1) % selectedListing.images.length);
    };
    const prevModalImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (!selectedListing || !selectedListing.images || selectedListing.images.length <= 1) return;
        setModalImageIndex(prev => (prev - 1 + selectedListing.images.length) % selectedListing.images.length);
    };

    // --- Approve/Reject Actions (remain the same logic) ---
    const handleApprove = async (listingId: string) => {
        if (!listingId) return;
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated.");

            const { error: updateError } = await supabase
                .from('partner_listings')
                .update({ approval_status: 'approved', approved_by: user.id })
                .eq('id', listingId);
            if (updateError) throw updateError;

            toast({ title: "Success", description: "Listing approved successfully.", variant: "default" });
            const updateListingsState = (prevListings: DealerListing[]): DealerListing[] =>
                prevListings.map(listing => listing.id === listingId ? { ...listing, approval_status: 'approved', approved_by: user.id } : listing);
            setListings(updateListingsState);
            if (selectedListing?.id === listingId) {
                setSelectedListing(prev => prev ? { ...prev, approval_status: 'approved', approved_by: user.id } : null);
            }
        } catch (err: any) {
            console.error("Error approving listing:", err);
            toast({ title: "Approval Failed", description: err.message || "Could not approve the listing.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (listingId: string) => {
        if (!listingId) return;
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated.");

            const { error: updateError } = await supabase
                .from('partner_listings')
                .update({ approval_status: 'rejected', approved_by: user.id })
                .eq('id', listingId);
            if (updateError) throw updateError;

            toast({ title: "Success", description: "Listing rejected successfully.", variant: "default" });
            const updateListingsState = (prevListings: DealerListing[]): DealerListing[] =>
                prevListings.map(listing => listing.id === listingId ? { ...listing, approval_status: 'rejected', approved_by: user.id } : listing);
            setListings(updateListingsState);
            if (selectedListing?.id === listingId) {
                setSelectedListing(prev => prev ? { ...prev, approval_status: 'rejected', approved_by: user.id } : null);
            }
        } catch (err: any) {
            console.error("Error rejecting listing:", err);
            toast({ title: "Rejection Failed", description: err.message || "Could not reject the listing.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Add to Listings Action (remain the same logic) ---
    const handleAddToListings = async (partnerListingId: string) => {
        if (!partnerListingId) return;
        setIsAddingToListings(true);
        try {
            const response = await fetch('/api/car_listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_partner_listing_id: partnerListingId }),
            });
            const result = await response.json();
            if (!response.ok) { throw new Error(result.error || `Failed to add listing (${response.status})`); }

            toast({ title: "Success", description: "Listing added to main inventory.", variant: "default" });
            const updateListingsState = (prevListings: DealerListing[]): DealerListing[] =>
                prevListings.map(listing => listing.id === partnerListingId ? { ...listing, is_added_to_main_listings: true } : listing);
            setListings(updateListingsState);
            if (selectedListing?.id === partnerListingId) {
                setSelectedListing(prev => prev ? { ...prev, is_added_to_main_listings: true } : null);
            }
        } catch (err: any) {
            console.error("Error adding to listings:", err);
            toast({ title: "Add Failed", description: err.message || "Could not add the listing to inventory.", variant: "destructive" });
        } finally {
            setIsAddingToListings(false);
        }
    };


    // --- Render Logic (Table remains the same) ---
    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Dealer Partner Listings</h1>
            </div>
            <div className="mb-6">
                <Input placeholder="Search by Dealer, Make, Model, VIN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-md" />
            </div>
            {loading && (<div className="flex justify-center items-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-2">Loading Listings...</span></div>)}
            {!loading && error && (<div className="text-center py-10 border rounded-lg bg-red-50 text-red-700"><p>Error loading listings: {error}</p><Button onClick={fetchDealerListings} variant="outline" size="sm" className="mt-4">Retry</Button></div>)}
            {!loading && !error && filteredListings.length === 0 && (<div className="text-center py-10 border rounded-lg bg-muted/20"><p className="text-muted-foreground">{searchQuery ? "No listings match your search." : "No dealer partner listings found."}</p></div>)}
            {!loading && !error && filteredListings.length > 0 && (
                <div className="overflow-auto rounded-lg border">
                    <Table>
                        <TableHeader> <TableRow> <TableHead>Dealer</TableHead> <TableHead>Vehicle</TableHead> <TableHead>Price</TableHead> <TableHead>Submitted</TableHead> <TableHead>Status</TableHead> <TableHead className="text-right">Actions</TableHead> </TableRow> </TableHeader>
                        <TableBody>
                            {filteredListings.map((listing) => (
                                <TableRow key={listing.id}>
                                    <TableCell className="font-medium"> {listing.dealer_business_name ?? listing.dealer_contact_name ?? 'N/A'} {listing.dealer_email && (<div className="text-xs text-muted-foreground">{listing.dealer_email}</div>)} </TableCell>
                                    <TableCell> {listing.vehicle_make} {listing.vehicle_model} <div className="text-xs text-muted-foreground">{listing.vehicle_year}</div> </TableCell>
                                    <TableCell>{formatPriceAdmin(listing.price)}</TableCell>
                                    <TableCell> {format(new Date(listing.created_at), "dd MMM yyyy")} <div className="text-xs text-muted-foreground">{format(new Date(listing.created_at), "HH:mm")}</div> </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge className={`text-xs ${getApprovalStatusBadgeClasses(listing.approval_status)}`}>
                                                {capitalizeFirstLetter(listing.approval_status)}
                                            </Badge>
                                            {listing.is_added_to_main_listings && (
                                                <span className="text-xs text-green-600 font-medium">Added to Main Listings</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right"> <Button variant="outline" size="sm" onClick={() => openListingDetails(listing)}>View Details</Button> </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Modal Display */}
            <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeListingDetails()}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedListing ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl flex justify-between items-center">
                                    <span>{selectedListing.vehicle_year} {selectedListing.vehicle_make} {selectedListing.vehicle_model}</span>
                                    <Badge className={`text-sm ml-4 ${getApprovalStatusBadgeClasses(selectedListing.approval_status)}`}>
                                        {capitalizeFirstLetter(selectedListing.approval_status)}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription>
                                    Listing submitted by: {selectedListing.dealer_business_name ?? selectedListing.dealer_contact_name ?? 'N/A'}
                                    {' '} on {format(new Date(selectedListing.created_at), "PPp")}
                                    {/* Display Added Status Here Too */}
                                    {selectedListing.is_added_to_main_listings && (
                                        <span className="ml-2 text-green-600 font-medium">(Added to Main Listings)</span>
                                    )}
                                </DialogDescription>
                            </DialogHeader>

                            {/* --- Details Content (remains the same structure) --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Image Gallery */}
                                    <div>
                                        <h3 className="text-md font-semibold text-gray-700 mb-2">Images</h3>
                                        {/* ... Image Gallery JSX ... */}
                                        {(selectedListing.images?.length ?? 0) > 0 ? (
                                            <div className="relative h-64 bg-gray-100 overflow-hidden rounded-lg group border">
                                                <Image
                                                    key={selectedListing.images[modalImageIndex] || modalImageIndex}
                                                    src={selectedListing.images[modalImageIndex]}
                                                    alt={`${selectedListing.vehicle_make} ${selectedListing.vehicle_model} - view ${modalImageIndex + 1}`}
                                                    fill
                                                    className="object-contain"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Error'; }}
                                                />
                                                {(selectedListing.images?.length ?? 0) > 1 && (
                                                    <>
                                                        <Button onClick={prevModalImage} variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/60" aria-label="Previous"><ArrowLeft className="h-5 w-5" /></Button>
                                                        <Button onClick={nextModalImage} variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/60" aria-label="Next"><ArrowRight className="h-5 w-5" /></Button>
                                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5">
                                                            {selectedListing.images?.map((_, index) => (<div key={index} className={`w-2 h-2 rounded-full transition-colors ${(modalImageIndex === index ? 'bg-white ring-1 ring-offset-1 ring-offset-black/30 ring-white' : 'bg-white/50')}`} />))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 border"><PhotoIcon className="h-12 w-12" /></div>
                                        )}
                                    </div>
                                    {/* Vehicle Details */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Vehicle Details</h3>
                                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            <ModalDetailItem label="Make" value={selectedListing.vehicle_make} />
                                            <ModalDetailItem label="Model" value={selectedListing.vehicle_model} />
                                            <ModalDetailItem label="Year" value={selectedListing.vehicle_year} />
                                            <ModalDetailItem label="Price" value={formatPriceAdmin(selectedListing.price)} />
                                            <ModalDetailItem label="Mileage" value={selectedListing.mileage != null ? `${selectedListing.mileage.toLocaleString()} km` : 'N/A'} />
                                            <ModalDetailItem label="Condition" value={capitalizeFirstLetter(selectedListing.condition)} />
                                            <ModalDetailItem label="VIN" value={selectedListing.vin} />
                                            <ModalDetailItem label="Location" value={selectedListing.location_city && selectedListing.location_country ? `${selectedListing.location_city}, ${selectedListing.location_country}` : selectedListing.location_city || selectedListing.location_country || 'N/A'} />
                                            <ModalDetailItem label="Body Type" value={selectedListing.body_type} />
                                            <ModalDetailItem label="Engine" value={selectedListing.engine} />
                                            <ModalDetailItem label="Exterior Color" value={selectedListing.exterior_color} />
                                            <ModalDetailItem label="Interior Color" value={selectedListing.interior_color} />
                                            <ModalDetailItem label="Fuel Type" value={selectedListing.fuel_type} />
                                            <ModalDetailItem label="Transmission" value={selectedListing.transmission} />
                                            <ModalDetailItem label="Listing Type" value={selectedListing.listing_type} />
                                            <ModalDetailItem label="Is Public" value={selectedListing.is_public} />
                                            <ModalDetailItem label="Is Special Offer" value={selectedListing.is_special_offer} />
                                            {selectedListing.is_special_offer && <ModalDetailItem label="Offer Label" value={selectedListing.special_offer_label} />}
                                        </dl>
                                    </div>
                                    {/* Description */}
                                    {selectedListing.description && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-1">Description</h3>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">{selectedListing.description}</p>
                                        </div>
                                    )}
                                </div>
                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Dealer Details */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Dealer Information</h3>
                                        {/* ... Dealer Details JSX ... */}
                                        <dl className="space-y-3">
                                            <ModalDetailItem label="Business Name" value={selectedListing.dealer_business_name} />
                                            <ModalDetailItem label="Contact Name" value={selectedListing.dealer_contact_name} />
                                            <ModalDetailItem label="Email">
                                                {selectedListing.dealer_email ? (
                                                    <a href={`mailto:${selectedListing.dealer_email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                                        {selectedListing.dealer_email} <ExternalLink size={14} />
                                                    </a>
                                                ) : 'N/A'}
                                            </ModalDetailItem>
                                            <ModalDetailItem label="Phone">
                                                {selectedListing.dealer_phone_number ? (
                                                    <a href={`tel:${selectedListing.dealer_phone_number}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                                        {selectedListing.dealer_phone_number} <ExternalLink size={14} />
                                                    </a>
                                                ) : 'N/A'}
                                            </ModalDetailItem>
                                        </dl>
                                    </div>
                                    {/* Features */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Features / Equipment</h3>
                                        {(selectedListing.features?.length ?? 0) > 0 ? (
                                            <div className="flex flex-wrap gap-2 border p-3 rounded max-h-48 overflow-y-auto">
                                                {selectedListing.features?.map((feature, index) => (
                                                    <Badge key={feature || index} variant="secondary">{feature}</Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No features listed.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* --- MODIFIED Modal Footer --- */}
                            <DialogFooter className="mt-6 pt-4 border-t flex flex-wrap justify-end gap-2">
                                {/* Close Button: Disabled during any submission */}
                                <Button variant="outline" onClick={closeListingDetails} disabled={isSubmitting || isAddingToListings}>Close</Button>

                                {/* Approve/Reject Buttons: Only show if status is 'pending' */}
                                {selectedListing.approval_status === 'pending' && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            onClick={() => selectedListing?.id && handleReject(selectedListing.id)}
                                            disabled={isSubmitting || isAddingToListings} // Disable during any submission
                                        >
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Reject
                                        </Button>
                                        <Button
                                            variant="default" // Use default for Approve, maybe style with green later
                                            onClick={() => selectedListing?.id && handleApprove(selectedListing.id)}
                                            disabled={isSubmitting || isAddingToListings} // Disable during any submission
                                            className="bg-green-600 hover:bg-green-700" // Optional: Green styling
                                        >
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Approve
                                        </Button>
                                    </>
                                )}

                                {/* Add to Listings Button / Status Indicator: Only show if status is 'approved' */}
                                {selectedListing.approval_status === 'approved' && (
                                    <>
                                        {selectedListing.is_added_to_main_listings ? (
                                            // Display Label if already added
                                            <div className="flex items-center justify-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md border border-green-200">
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Added to Main Listings
                                            </div>
                                        ) : (
                                            // Display Button if not yet added
                                            <Button
                                                onClick={() => selectedListing?.id && handleAddToListings(selectedListing.id)}
                                                disabled={isAddingToListings || isSubmitting} // Disable during add or approve/reject
                                                className="bg-blue-600 hover:bg-blue-700" // Optional: Blue styling
                                            >
                                                {isAddingToListings ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    // Optional: Add an icon like UploadCloudIcon
                                                    // <UploadCloudIcon className="mr-2 h-4 w-4" />
                                                    null
                                                )}
                                                Add to Listings
                                            </Button>
                                        )}
                                    </>
                                )}
                            </DialogFooter>
                            {/* --- END MODIFIED Modal Footer --- */}
                        </>
                    ) : (
                        <div className="p-6 text-center text-muted-foreground">Loading details...</div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}