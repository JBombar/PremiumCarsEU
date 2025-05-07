"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, X, ExternalLink, ChevronLeft, ChevronRight, Maximize2, RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import {
  Label
} from "@/components/ui/label";
import {
  XMarkIcon
} from "@heroicons/react/24/outline";

// Define TypeScript interface for car offer data
interface CarOffer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  condition: string;
  city: string;
  asking_price: number;
  contacted: boolean;
  created_at: string;
  photo_urls?: string[];
  description?: string;
  status?: string;
}

export default function AdminCarsPage() {
  const [carOffers, setCarOffers] = useState<CarOffer[]>([]);
  const [filteredCarOffers, setFilteredCarOffers] = useState<CarOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<CarOffer | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedTrustLevels, setSelectedTrustLevels] = useState<string[]>([]);
  const [manualContacts, setManualContacts] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [partners, setPartners] = useState<{ id: string, name: string, contact_email: string | null, contact_phone: string | null }[]>([]);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [sharedOffersHistory, setSharedOffersHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  // Fetch car offers from Supabase
  useEffect(() => {
    const fetchCarOffers = async () => {
      try {
        const { data, error } = await supabase
          .from("car_offers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCarOffers(data || []);
        setFilteredCarOffers(data || []);
      } catch (error) {
        console.error("Error fetching car offers:", error);
        toast({
          title: "Error fetching data",
          description: "Could not load car offers. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCarOffers();
  }, [supabase, toast]);

  // Filter car offers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCarOffers(carOffers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = carOffers.filter(
      (offer) =>
        offer.full_name?.toLowerCase().includes(query) ||
        offer.email?.toLowerCase().includes(query) ||
        offer.make?.toLowerCase().includes(query) ||
        offer.model?.toLowerCase().includes(query) ||
        offer.city?.toLowerCase().includes(query)
    );
    setFilteredCarOffers(filtered);
  }, [searchQuery, carOffers]);

  // Update the contacted status
  const toggleContactedStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("car_offers")
        .update({ contacted: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      // Update local state to reflect change
      setCarOffers((prev) =>
        prev.map((offer) =>
          offer.id === id
            ? { ...offer, contacted: !offer.contacted }
            : offer
        )
      );

      toast({
        title: "Status updated",
        description: `Offer marked as ${!currentStatus ? "contacted" : "not contacted"}`,
      });
    } catch (error) {
      console.error("Error updating contact status:", error);
      toast({
        title: "Update failed",
        description: "Could not update contact status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update offer status (Accepted, Rejected, In Review)
  const updateOfferStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("car_offers")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // Update local state to reflect the status change
      setCarOffers((prev) =>
        prev.map((offer) =>
          offer.id === id ? { ...offer, status } : offer
        )
      );

      // Also update the selected offer if it's currently being viewed
      if (selectedOffer && selectedOffer.id === id) {
        setSelectedOffer({ ...selectedOffer, status });
      }

      toast({
        title: "Status updated",
        description: `Offer status changed to ${status}`,
      });
    } catch (error) {
      console.error("Error updating offer status:", error);
      toast({
        title: "Status update failed",
        description: "Could not update offer status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete car offer
  const deleteCarOffer = async (id: string) => {
    try {
      const { error } = await supabase
        .from("car_offers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state to remove the deleted offer
      setCarOffers((prev) => prev.filter((offer) => offer.id !== id));
      setFilteredCarOffers((prev) => prev.filter((offer) => offer.id !== id));

      toast({
        title: "Offer deleted",
        description: "The car offer has been permanently deleted",
      });

      // Close the modal if the deleted offer was being viewed
      if (selectedOffer && selectedOffer.id === id) {
        closeOfferDetails();
      }
    } catch (error) {
      console.error("Error deleting car offer:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the car offer. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  // Get status badge color
  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "in review":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Handle opening modal with selected offer
  const openOfferDetails = (offer: CarOffer) => {
    setSelectedOffer(offer);
    setCurrentImageIndex(0);
  };

  // Close the modal
  const closeOfferDetails = () => {
    setSelectedOffer(null);
  };

  // Handle image navigation
  const nextImage = () => {
    if (selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedOffer.photo_urls!.length);
    }
  };

  const prevImage = () => {
    if (selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedOffer.photo_urls!.length - 1 : prev - 1
      );
    }
  };

  // Handle opening lightbox from the detail view
  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setLightboxOpen(true);
  };

  // Close the lightbox
  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  // Handle lightbox navigation
  const nextLightboxImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 0) {
      setLightboxImageIndex((prev) => (prev + 1) % selectedOffer.photo_urls!.length);
    }
  };

  const prevLightboxImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 0) {
      setLightboxImageIndex((prev) =>
        prev === 0 ? selectedOffer.photo_urls!.length - 1 : prev - 1
      );
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;

      if (e.key === 'ArrowRight') {
        nextLightboxImage();
      } else if (e.key === 'ArrowLeft') {
        prevLightboxImage();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, selectedOffer]);

  // Handle delete confirmation
  const confirmDelete = (id: string) => {
    setOfferToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = () => {
    if (offerToDelete) {
      deleteCarOffer(offerToDelete);
    }
    setDeleteConfirmOpen(false);
    setOfferToDelete(null);
  };

  // Available channels and trust levels
  const availableChannels = [
    'WhatsApp', 'Email', 'Slack', 'Telegram', 'SMS'
  ];

  const availableTrustLevels = [
    'trusted', 'verified', 'flagged', 'unrated'
  ];

  // Handle checkbox selection for all offers
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = filteredCarOffers.map(offer => offer.id);
      setSelectedOfferIds(allIds);
    } else {
      setSelectedOfferIds([]);
    }
  };

  // Handle individual checkbox selection
  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedOfferIds(prev => [...prev, id]);
    } else {
      setSelectedOfferIds(prev => prev.filter(offerId => offerId !== id));
      setSelectAll(false);
    }
  };

  // Toggle selection of channel
  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  // Toggle selection of trust level
  const toggleTrustLevel = (level: string) => {
    setSelectedTrustLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  // Fetch partners from Supabase
  const fetchPartners = async () => {
    setLoadingPartners(true);
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, contact_email, contact_phone')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (err: any) {
      console.error('Error fetching partners:', err);
      // Not showing an error toast as this is not critical to the page functioning
    } finally {
      setLoadingPartners(false);
    }
  };

  // Fetch partners when component mounts
  useEffect(() => {
    fetchPartners();
  }, []);

  // Toggle partner selection
  const togglePartner = (partnerId: string) => {
    setSelectedPartnerIds(prev =>
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  // Get all contact information from selected partners
  const getSelectedPartnerContacts = (): string[] => {
    const contacts: string[] = [];

    selectedPartnerIds.forEach(id => {
      const partner = partners.find(p => p.id === id);
      if (partner) {
        if (partner.contact_email) contacts.push(partner.contact_email);
        if (partner.contact_phone) contacts.push(partner.contact_phone);
      }
    });

    return contacts;
  };

  // Share offers with partners
  const handleShareOffers = async () => {
    if (selectedOfferIds.length === 0) {
      toast({
        title: "No Offers Selected",
        description: "Please select at least one offer to share.",
        variant: "destructive"
      });
      return;
    }

    if (selectedChannels.length === 0 && selectedTrustLevels.length === 0 &&
      !manualContacts.trim() && selectedPartnerIds.length === 0) {
      toast({
        title: "No Share Target Selected",
        description: "Please select channels, trust levels, partners, or enter manual contacts.",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);

    try {
      // Process manual contacts
      const manualContactsList = manualContacts
        .split(',')
        .map(contact => contact.trim())
        .filter(contact => contact.length > 0);

      // Get partner contacts
      const partnerContacts = getSelectedPartnerContacts();

      // Combine both contact lists
      const allContacts = [...manualContactsList, ...partnerContacts];

      // Get current user's ID as dealer_id
      const { data: { user } } = await supabase.auth.getUser();
      const dealerId = user?.id;

      const payload = {
        offer_ids: selectedOfferIds,
        dealer_id: dealerId,
        channels: selectedChannels,
        shared_with_trust_levels: selectedTrustLevels,
        shared_with_contacts: allContacts,
        message: "Check out these offers."
      };

      const response = await fetch('/api/share-offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to share offers');
      }

      toast({
        title: "Success",
        description: `Shared ${selectedOfferIds.length} offer(s) with your network.`,
      });

      // Add this line to refresh history after a successful share
      fetchSharedOffersHistory();

      // Reset selections after successful share
      setSelectedOfferIds([]);
      setSelectAll(false);
    } catch (err: any) {
      console.error('Error sharing offers:', err);
      toast({
        title: "Share Failed",
        description: err.message || 'An error occurred while sharing offers.',
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Fetch shared offers history
  const fetchSharedOffersHistory = async () => {
    setIsHistoryLoading(true);
    try {
      // Get current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      const dealerId = user?.id;

      if (!dealerId) {
        setIsHistoryLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('car_offer_shares')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedOffersHistory(data || []);
    } catch (err: any) {
      console.error('Error fetching shared offers history:', err);
      // Not showing a toast as this is not critical
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Add this useEffect with your other useEffect hooks - after the fetchPartners useEffect
  useEffect(() => {
    // Call this after auth is loaded and component is mounted
    fetchSharedOffersHistory();

    // Add event handler to refresh history after a successful share
    const refreshHistoryAfterShare = () => {
      fetchSharedOffersHistory();
    };

    // Subscribe to a successful share event (you can call this after handleShareOffers completes)
    document.addEventListener('offersShared', refreshHistoryAfterShare);

    return () => {
      document.removeEventListener('offersShared', refreshHistoryAfterShare);
    };
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Car Offers Management</h1>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by name, email, make, model, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Send Offers To Partners Panel - Collapsible */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        >
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-700">Share Offers With Partners</h2>
            <Badge variant="outline" className="ml-2 bg-blue-50">
              {selectedOfferIds.length} {selectedOfferIds.length === 1 ? 'offer' : 'offers'} selected
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="p-1">
            {isPanelExpanded ? (
              <ChevronDownIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </Button>
        </div>

        {isPanelExpanded && (
          <div className="mt-4 transition-all duration-300 ease-in-out">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
              {/* Channels Multiselect */}
              <div>
                <Label htmlFor="channels">Channels</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between overflow-hidden text-left font-normal"
                    >
                      {selectedChannels.length > 0
                        ? `${selectedChannels.length} selected`
                        : "Select channels"}
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command className="bg-white">
                      <CommandInput placeholder="Search channels..." className="bg-white" />
                      <CommandEmpty>No channels found.</CommandEmpty>
                      <CommandGroup>
                        {availableChannels.map((channel) => (
                          <CommandItem
                            key={channel}
                            onSelect={() => toggleChannel(channel)}
                            className="flex items-center gap-2 text-gray-800"
                          >
                            <Checkbox
                              checked={selectedChannels.includes(channel)}
                              onCheckedChange={() => { }}
                              className="mr-2"
                            />
                            {channel}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedChannels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedChannels.map(channel => (
                      <Badge
                        key={channel}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {channel}
                        <XMarkIcon
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => toggleChannel(channel)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Trust Levels Multiselect */}
              <div>
                <Label htmlFor="trust-levels">Trust Levels</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between overflow-hidden text-left font-normal"
                    >
                      {selectedTrustLevels.length > 0
                        ? `${selectedTrustLevels.length} selected`
                        : "Select trust levels"}
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command className="bg-white">
                      <CommandInput placeholder="Search trust levels..." className="bg-white" />
                      <CommandEmpty>No trust levels found.</CommandEmpty>
                      <CommandGroup>
                        {availableTrustLevels.map((level) => (
                          <CommandItem
                            key={level}
                            onSelect={() => toggleTrustLevel(level)}
                            className="flex items-center gap-2 text-gray-800"
                          >
                            <Checkbox
                              checked={selectedTrustLevels.includes(level)}
                              onCheckedChange={() => { }}
                              className="mr-2"
                            />
                            <span className="capitalize">{level}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedTrustLevels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTrustLevels.map(level => (
                      <Badge
                        key={level}
                        variant="secondary"
                        className="flex items-center gap-1 capitalize"
                      >
                        {level}
                        <XMarkIcon
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => toggleTrustLevel(level)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual Contacts */}
              <div>
                <Label htmlFor="manual-contacts">Manual Contacts (comma-separated)</Label>
                <Input
                  id="manual-contacts"
                  placeholder="email@example.com, +1234567890"
                  value={manualContacts}
                  onChange={(e) => setManualContacts(e.target.value)}
                />
              </div>

              {/* Share button */}
              <div className="flex items-end">
                <Button
                  id="share-button"
                  onClick={handleShareOffers}
                  disabled={isSharing || selectedOfferIds.length === 0}
                  className="w-full mb-1"
                >
                  {isSharing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Share Offers
                </Button>
              </div>

              {/* Partners selection */}
              <div className="col-span-full mt-2">
                <Label htmlFor="partners">Select Partners</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between overflow-hidden text-left font-normal"
                    >
                      {selectedPartnerIds.length > 0
                        ? `${selectedPartnerIds.length} partner(s) selected`
                        : "Select partners to share with"}
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command className="bg-white">
                      <CommandInput placeholder="Search partners..." className="bg-white" />
                      <CommandEmpty>
                        {loadingPartners ? "Loading partners..." : "No partners found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {partners.map((partner) => (
                          <CommandItem
                            key={partner.id}
                            onSelect={() => togglePartner(partner.id)}
                            className="flex items-center gap-2 text-gray-800"
                          >
                            <Checkbox
                              checked={selectedPartnerIds.includes(partner.id)}
                              onCheckedChange={() => { }}
                              className="mr-2"
                            />
                            <div className="flex flex-col">
                              <span>{partner.name || 'Unnamed Partner'}</span>
                              {(partner.contact_email || partner.contact_phone) && (
                                <span className="text-xs text-gray-500">
                                  {partner.contact_email || partner.contact_phone}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedPartnerIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedPartnerIds.map(id => {
                      const partner = partners.find(p => p.id === id);
                      return partner ? (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {partner.name || partner.contact_email || partner.contact_phone || 'Partner'}
                          <XMarkIcon
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => togglePartner(id)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Add this new section */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div
                className="flex items-center justify-between cursor-pointer mb-3"
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              >
                <div className="flex items-center">
                  <h3 className="text-md font-semibold text-gray-700">
                    📤 Shared Offers History
                  </h3>
                  {!isHistoryLoading && sharedOffersHistory.length > 0 && (
                    <Badge variant="outline" className="ml-2 bg-blue-50">
                      {sharedOffersHistory.length} {sharedOffersHistory.length === 1 ? 'record' : 'records'}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="p-1">
                  {isHistoryExpanded ? (
                    <ChevronDownIcon className="h-5 w-5" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {isHistoryExpanded && (
                <div className="transition-all duration-300 ease-in-out">
                  {isHistoryLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    </div>
                  ) : sharedOffersHistory.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md">
                      No sharing history found. When you share offers, they will appear here.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {sharedOffersHistory.map((record) => (
                        <div
                          key={record.id}
                          className="bg-gray-50 rounded-md p-3 border border-gray-200 hover:border-gray-300 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div className="text-sm font-medium text-gray-700">
                              {format(new Date(record.created_at), 'PPp')}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {record.id.substring(record.id.length - 5)}
                            </div>
                          </div>

                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <span className="text-gray-500">Offer:</span>{' '}
                              {record.make && record.model && record.year ? (
                                <span className="text-blue-600 font-medium">
                                  {record.make} {record.model} ({record.year})
                                </span>
                              ) : record.offer_ids?.length ? (
                                <span>{record.offer_ids.length} offers</span>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </div>

                            <div>
                              <span className="text-gray-500">Channels:</span>{' '}
                              {record.channels?.length ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {record.channels.map((channel: string) => (
                                    <Badge key={channel} variant="secondary" className="text-xs">
                                      {channel}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </div>

                            <div>
                              <span className="text-gray-500">Trust Levels:</span>{' '}
                              {record.shared_with_trust_levels?.length ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {record.shared_with_trust_levels.map((level: string) => (
                                    <Badge key={level} variant="secondary" className="text-xs capitalize">
                                      {level}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </div>

                            <div>
                              <span className="text-gray-500">Contacts:</span>{' '}
                              {record.shared_with_contacts?.length ? (
                                <div className="flex flex-wrap gap-1 mt-1 max-w-xs overflow-hidden">
                                  {record.shared_with_contacts.map((contact: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs truncate max-w-full">
                                      {contact}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </div>
                          </div>

                          {record.message && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Message:</span>{' '}
                              <span className="text-gray-700 italic">"{record.message}"</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchSharedOffersHistory}
                      disabled={isHistoryLoading}
                    >
                      {isHistoryLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCarOffers.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No car offers found</p>
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAllChange}
                    aria-label="Select all offers"
                  />
                </TableHead>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Contacted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCarOffers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedOfferIds.includes(offer.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(offer.id, checked === true)}
                      aria-label={`Select offer from ${offer.full_name}`}
                    />
                  </TableCell>
                  <TableCell>
                    {offer.photo_urls && offer.photo_urls.length > 0 ? (
                      <div className="relative h-16 w-16 rounded overflow-hidden cursor-pointer" onClick={() => openOfferDetails(offer)}>
                        <Image
                          src={offer.photo_urls[0]}
                          alt={`${offer.make} ${offer.model}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 bg-muted flex items-center justify-center rounded">
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{offer.full_name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{offer.email}</div>
                      <div className="text-sm text-muted-foreground">{offer.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>
                        {offer.make} {offer.model}
                      </div>
                      <div className="text-sm text-muted-foreground">{offer.year}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{offer.mileage} km</div>
                      <div className="text-sm text-muted-foreground">
                        {offer.fuel_type}, {offer.transmission}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Condition: {offer.condition}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{offer.city}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(offer.asking_price)}
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(offer.status)}`}>
                      {offer.status || "New"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {offer.created_at && format(new Date(offer.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={offer.contacted}
                      onCheckedChange={() => toggleContactedStatus(offer.id, offer.contacted)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openOfferDetails(offer)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Offer Details Modal */}
      <Dialog open={selectedOffer !== null} onOpenChange={(open) => !open && closeOfferDetails()}>
        <DialogContent className="max-w-4xl">
          {selectedOffer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center justify-between">
                  <span>
                    {selectedOffer.make} {selectedOffer.model} ({selectedOffer.year})
                  </span>
                  <Badge className={getStatusBadgeColor(selectedOffer.status)}>
                    {selectedOffer.status || "New"}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Offered by {selectedOffer.full_name} on {format(new Date(selectedOffer.created_at), "MMMM d, yyyy")}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                {/* Image Gallery */}
                <div className="flex flex-col">
                  {selectedOffer.photo_urls && selectedOffer.photo_urls.length > 0 ? (
                    <div className="space-y-2">
                      <div
                        className="relative h-64 w-full rounded-md overflow-hidden border cursor-pointer group"
                        onClick={() => openLightbox(currentImageIndex)}
                      >
                        <Image
                          src={selectedOffer.photo_urls[currentImageIndex]}
                          alt={`${selectedOffer.make} ${selectedOffer.model}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="text-white h-8 w-8" />
                        </div>
                      </div>

                      {selectedOffer.photo_urls.length > 1 && (
                        <div className="flex justify-between">
                          <Button size="sm" variant="outline" onClick={prevImage}>Previous</Button>
                          <span className="text-sm text-muted-foreground">
                            {currentImageIndex + 1} of {selectedOffer.photo_urls.length}
                          </span>
                          <Button size="sm" variant="outline" onClick={nextImage}>Next</Button>
                        </div>
                      )}

                      {selectedOffer.photo_urls.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto py-2">
                          {selectedOffer.photo_urls.map((url, idx) => (
                            <div
                              key={url}
                              className={`relative h-16 w-16 rounded overflow-hidden border-2 cursor-pointer ${currentImageIndex === idx ? 'border-primary' : 'border-transparent'}`}
                              onClick={() => {
                                setCurrentImageIndex(idx);
                                // Don't open lightbox on thumbnail click - let user click main image
                              }}
                            >
                              <Image
                                src={url}
                                alt={`Thumbnail ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 w-full bg-muted flex items-center justify-center rounded-md">
                      <span className="text-muted-foreground">No images available</span>
                    </div>
                  )}
                </div>

                {/* Car Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Vehicle Details</h3>
                    <dl className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Make</dt>
                        <dd>{selectedOffer.make}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Model</dt>
                        <dd>{selectedOffer.model}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Year</dt>
                        <dd>{selectedOffer.year}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Mileage</dt>
                        <dd>{selectedOffer.mileage} km</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Fuel Type</dt>
                        <dd>{selectedOffer.fuel_type}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Transmission</dt>
                        <dd>{selectedOffer.transmission}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Condition</dt>
                        <dd>{selectedOffer.condition}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Asking Price</dt>
                        <dd className="font-semibold">{formatCurrency(selectedOffer.asking_price)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium">Seller Information</h3>
                    <dl className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                        <dd>{selectedOffer.full_name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                        <dd>
                          <a href={`mailto:${selectedOffer.email}`} className="text-primary hover:underline">
                            {selectedOffer.email}
                          </a>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                        <dd>
                          <a href={`tel:${selectedOffer.phone}`} className="text-primary hover:underline">
                            {selectedOffer.phone}
                          </a>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                        <dd>{selectedOffer.city}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Contacted</dt>
                        <dd>
                          <Checkbox
                            checked={selectedOffer.contacted}
                            onCheckedChange={() => toggleContactedStatus(selectedOffer.id, selectedOffer.contacted)}
                          />
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {selectedOffer.description && (
                    <div>
                      <h3 className="text-lg font-medium">Description</h3>
                      <div className="h-24 mt-2 rounded-md border p-2 overflow-y-auto">
                        <p className="text-sm">{selectedOffer.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2 mr-auto">
                  <span className="text-sm font-medium">Status:</span>
                  <Select
                    value={selectedOffer.status || ""}
                    onValueChange={(value) => updateOfferStatus(selectedOffer.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Set status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={closeOfferDetails}
                  >
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => confirmDelete(selectedOffer.id)}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      toggleContactedStatus(selectedOffer.id, selectedOffer.contacted);
                      closeOfferDetails();
                    }}
                  >
                    {selectedOffer.contacted ? "Mark as Not Contacted" : "Mark as Contacted"}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox Modal */}
      <Dialog
        open={lightboxOpen && selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 0}
        onOpenChange={setLightboxOpen}
      >
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-none">
          <div className="relative h-[80vh] w-full" onClick={closeLightbox}>
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Left navigation arrow */}
            {selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 1 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                onClick={prevLightboxImage}
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
            )}

            {/* Right navigation arrow */}
            {selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                onClick={nextLightboxImage}
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            )}

            {/* Main image */}
            {selectedOffer?.photo_urls && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center">
                  <Image
                    src={selectedOffer.photo_urls[lightboxImageIndex]}
                    alt={`${selectedOffer.make} ${selectedOffer.model} - Large view`}
                    fill
                    className="object-contain"
                    quality={95}
                    priority
                  />
                </div>
              </div>
            )}

            {/* Image counter */}
            {selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                {lightboxImageIndex + 1} / {selectedOffer.photo_urls.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the car offer
              and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 