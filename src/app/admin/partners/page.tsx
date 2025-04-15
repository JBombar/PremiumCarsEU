'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { toast } from "@/components/ui/use-toast";
import { Search, Plus, Pencil, Trash2, RefreshCcw, User, ChevronDown, ChevronRight, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
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
    Checkbox,
} from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Define the Partner type based on the database schema
interface Partner {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    notes: string | null;
    status: 'active' | 'inactive' | 'pending';
    created_at: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    location: string | null;
    is_active: boolean | null;
    trust_level: 'unrated' | 'trusted' | 'verified' | 'flagged';
}

// Partner form validation schema
const partnerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    contact_name: z.string().min(1, "Contact name is required"),
    contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
    contact_phone: z.string().min(5, "Phone number should be at least 5 characters").optional().or(z.literal("")),
    company: z.string().optional().or(z.literal("")),
    location: z.string().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
    notes: z.string().optional().or(z.literal("")),
    status: z.enum(["active", "inactive", "pending"]).default("pending"),
    trust_level: z.enum(["unrated", "trusted", "verified", "flagged"]).default("unrated"),
});

export default function PartnersPage() {
    const supabase = createClient();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formType, setFormType] = useState<'create' | 'edit'>('create');
    const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        contact_name: string;
        contact_email: string;
        contact_phone: string;
        company: string;
        location: string;
        is_active: boolean;
        status: 'active' | 'inactive' | 'pending';
        notes: string;
        trust_level: 'unrated' | 'trusted' | 'verified' | 'flagged';
    }>({
        name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        company: '',
        location: '',
        is_active: true,
        status: 'pending',
        notes: '',
        trust_level: 'unrated',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Add these state variables to the Partners component
    const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [selectedTrustLevels, setSelectedTrustLevels] = useState<string[]>([]);
    const [manualContacts, setManualContacts] = useState<string>('');
    const [isSharing, setIsSharing] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const [sharingPartners, setSharingPartners] = useState<{ id: string, name: string, contact_email: string | null, contact_phone: string | null }[]>([]);
    const [selectedSharingPartnerIds, setSelectedSharingPartnerIds] = useState<string[]>([]);
    const [loadingSharingPartners, setLoadingSharingPartners] = useState(false);
    const [isPanelExpanded, setIsPanelExpanded] = useState(false);
    const [sharedPartnersHistory, setSharedPartnersHistory] = useState<any[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    // Available channels and trust levels
    const availableChannels = [
        'WhatsApp', 'Email', 'Slack', 'Telegram', 'SMS'
    ];

    const availableTrustLevels = [
        'trusted', 'verified', 'flagged', 'unrated'
    ];

    // Filter partners based on search query
    useEffect(() => {
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            const filtered = partners.filter(
                partner =>
                    partner.name.toLowerCase().includes(lowercasedQuery) ||
                    (partner.email && partner.email.toLowerCase().includes(lowercasedQuery)) ||
                    (partner.company && partner.company.toLowerCase().includes(lowercasedQuery)) ||
                    (partner.phone && partner.phone.includes(lowercasedQuery))
            );
            setFilteredPartners(filtered);
        } else {
            setFilteredPartners(partners);
        }
    }, [searchQuery, partners]);

    // Fetch partners on component mount
    useEffect(() => {
        fetchPartners();
    }, []);

    // Fetch partners from the API
    const fetchPartners = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/partners');

            if (!response.ok) {
                throw new Error(`Error fetching partners: ${response.statusText}`);
            }

            const data = await response.json();
            setPartners(data);
            setFilteredPartners(data);
        } catch (err) {
            console.error('Failed to fetch partners:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Reset all fields when adding a new partner
    const handleAddPartner = () => {
        setFormData({
            name: '',
            contact_name: '',
            contact_email: '',
            contact_phone: '',
            company: '',
            location: '',
            is_active: true,
            notes: '',
            status: 'pending',
            trust_level: 'unrated',
        });
        setFormErrors({});
        setFormType('create');
        setIsFormOpen(true);
    };

    // Open form for editing an existing partner
    const handleEditPartner = (partner: Partner) => {
        setFormData({
            name: partner.name,
            contact_name: partner.contact_name || '',
            contact_email: partner.contact_email || '',
            contact_phone: partner.contact_phone || '',
            company: partner.company || '',
            location: partner.location || '',
            is_active: partner.is_active ?? true,
            notes: partner.notes || '',
            status: partner.status,
            trust_level: partner.trust_level || 'unrated',
        });
        setFormErrors({});
        setCurrentPartner(partner);
        setFormType('edit');
        setIsFormOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for the field being edited
        if (formErrors[name]) {
            setFormErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    // Handle status select change
    const handleStatusChange = async (partnerId: string, newStatus: 'active' | 'inactive' | 'pending') => {
        try {
            const response = await fetch('/api/partners', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: partnerId,
                    status: newStatus
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to update status');
            }

            // Update local state to reflect the change
            setPartners(partners.map(partner =>
                partner.id === partnerId
                    ? { ...partner, status: newStatus }
                    : partner
            ));

            setFilteredPartners(filteredPartners.map(partner =>
                partner.id === partnerId
                    ? { ...partner, status: newStatus }
                    : partner
            ));

            // Show success message
            toast({
                title: "Status updated",
                description: "Partner status has been updated successfully.",
            });
        } catch (err) {
            console.error('Failed to update status:', err);
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to update status",
                variant: "destructive",
            });
        }
    };

    // Handle trust level select change
    const handleTrustLevelChange = async (partnerId: string, newTrustLevel: 'unrated' | 'trusted' | 'verified' | 'flagged') => {
        try {
            const response = await fetch('/api/partners', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: partnerId,
                    trust_level: newTrustLevel
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to update trust level');
            }

            // Update local state to reflect the change
            setPartners(partners.map(partner =>
                partner.id === partnerId
                    ? { ...partner, trust_level: newTrustLevel }
                    : partner
            ));

            setFilteredPartners(filteredPartners.map(partner =>
                partner.id === partnerId
                    ? { ...partner, trust_level: newTrustLevel }
                    : partner
            ));

            // Show success message
            toast({
                title: "Trust level updated",
                description: "Partner trust level has been updated successfully.",
            });
        } catch (err) {
            console.error('Failed to update trust level:', err);
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to update trust level",
                variant: "destructive",
            });
        }
    };

    // Submit form to create or update a partner
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setFormErrors({});

        try {
            // Validate form data
            const validationResult = partnerSchema.safeParse(formData);

            if (!validationResult.success) {
                const errors: Record<string, string> = {};
                validationResult.error.errors.forEach(err => {
                    if (err.path[0]) {
                        errors[err.path[0].toString()] = err.message;
                    }
                });
                setFormErrors(errors);
                setIsSubmitting(false);
                return;
            }

            // Prepare request options
            const url = '/api/partners';
            const method = formType === 'create' ? 'POST' : 'PUT';
            const bodyData = formType === 'create'
                ? formData
                : { id: currentPartner?.id, ...formData };

            console.log('Submitting partner data:', bodyData);

            // Send request
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save partner');
            }

            // Close form and refresh data
            setIsFormOpen(false);
            fetchPartners();

            // Show success message
            toast({
                title: formType === 'create' ? "Partner created" : "Partner updated",
                description: formType === 'create'
                    ? "New partner has been added successfully."
                    : "Partner information has been updated successfully.",
            });
        } catch (err) {
            console.error('Failed to save partner:', err);
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to save partner",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open delete confirmation dialog
    const handleDeleteClick = (partner: Partner) => {
        setPartnerToDelete(partner);
        setIsDeleteDialogOpen(true);
    };

    // Delete a partner
    const handleDeletePartner = async () => {
        if (!partnerToDelete) return;

        setIsDeleting(true);

        try {
            const response = await fetch('/api/partners', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: partnerToDelete.id }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete partner');
            }

            // Close dialog and refresh data
            setIsDeleteDialogOpen(false);
            fetchPartners();

            // Show success message
            toast({
                title: "Partner deleted",
                description: "Partner has been removed successfully."
            });
        } catch (err) {
            console.error('Failed to delete partner:', err);
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to delete partner",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Render status badge with appropriate color
    const StatusBadge = ({ status }: { status: string }) => {
        let variant: "default" | "secondary" | "destructive" | "outline" | null | undefined = "secondary";

        switch (status) {
            case "active":
                variant = "default";
                break;
            case "inactive":
                variant = "outline";
                break;
            case "pending":
                variant = "secondary";
                break;
            default:
                variant = "secondary";
        }

        return <Badge variant={variant}>{status}</Badge>;
    };

    // Render trust level badge with appropriate color
    const TrustLevelBadge = ({ trustLevel }: { trustLevel: string }) => {
        let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";

        switch (trustLevel) {
            case "trusted":
                variant = "default";
                break;
            case "verified":
                variant = "secondary";
                break;
            case "flagged":
                variant = "destructive";
                break;
            case "unrated":
            default:
                variant = "outline";
                break;
        }

        return <Badge variant={variant}>{trustLevel}</Badge>;
    };

    // Handle checkbox selection for all partners
    const handleSelectAllChange = (checked: boolean) => {
        setSelectAll(checked);
        if (checked) {
            const allIds = filteredPartners.map(partner => partner.id);
            setSelectedPartnerIds(allIds);
        } else {
            setSelectedPartnerIds([]);
        }
    };

    // Handle individual checkbox selection
    const handleCheckboxChange = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedPartnerIds(prev => [...prev, id]);
        } else {
            setSelectedPartnerIds(prev => prev.filter(partnerId => partnerId !== id));
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

    // Fetch partners for sharing dropdown
    const fetchSharingPartners = async () => {
        setLoadingSharingPartners(true);
        try {
            const { data, error } = await supabase
                .from('partners')
                .select('id, name, contact_email, contact_phone')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (error) throw error;
            setSharingPartners(data || []);
        } catch (err: any) {
            console.error('Error fetching partners for sharing:', err);
        } finally {
            setLoadingSharingPartners(false);
        }
    };

    // Fetch sharing partners when component mounts
    useEffect(() => {
        fetchSharingPartners();
    }, []);

    // Toggle sharing partner selection
    const toggleSharingPartner = (partnerId: string) => {
        setSelectedSharingPartnerIds(prev =>
            prev.includes(partnerId)
                ? prev.filter(id => id !== partnerId)
                : [...prev, partnerId]
        );
    };

    // Get all contact information from selected sharing partners
    const getSelectedSharingPartnerContacts = (): string[] => {
        const contacts: string[] = [];

        selectedSharingPartnerIds.forEach(id => {
            const partner = sharingPartners.find(p => p.id === id);
            if (partner) {
                if (partner.contact_email) contacts.push(partner.contact_email);
                if (partner.contact_phone) contacts.push(partner.contact_phone);
            }
        });

        return contacts;
    };

    // Share partners with network
    const handleSharePartners = async () => {
        if (selectedPartnerIds.length === 0) {
            toast({
                title: "No Partners Selected",
                description: "Please select at least one partner to share.",
                variant: "destructive"
            });
            return;
        }

        if (selectedChannels.length === 0 && selectedTrustLevels.length === 0 &&
            !manualContacts.trim() && selectedSharingPartnerIds.length === 0) {
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
            const partnerContacts = getSelectedSharingPartnerContacts();

            // Combine both contact lists
            const allContacts = [...manualContactsList, ...partnerContacts];

            // Get current user's ID as dealer_id
            const { data: { user } } = await supabase.auth.getUser();
            const dealerId = user?.id;

            const payload = {
                partner_ids: selectedPartnerIds,
                dealer_id: dealerId,
                channels: selectedChannels,
                shared_with_trust_levels: selectedTrustLevels,
                shared_with_contacts: allContacts,
                message: "Check out these partners."
            };

            const response = await fetch('/api/partner-shares', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to share partners');
            }

            toast({
                title: "Success",
                description: `Shared ${selectedPartnerIds.length} partner(s) with your network.`,
            });

            // Add this line to refresh history after a successful share
            fetchSharedPartnersHistory();

            // Reset selections after successful share
            setSelectedPartnerIds([]);
            setSelectAll(false);
        } catch (err: any) {
            console.error('Error sharing partners:', err);
            toast({
                title: "Share Failed",
                description: err.message || 'An error occurred while sharing partners.',
                variant: "destructive"
            });
        } finally {
            setIsSharing(false);
        }
    };

    // Add this function to fetch shared partners history
    const fetchSharedPartnersHistory = async () => {
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
                .from('partner_shares')
                .select('*')
                .eq('dealer_id', dealerId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSharedPartnersHistory(data || []);
        } catch (err: any) {
            console.error('Error fetching shared partners history:', err);
            // Not showing a toast as this is not critical
        } finally {
            setIsHistoryLoading(false);
        }
    };

    // Add this useEffect with your other useEffect hooks
    useEffect(() => {
        // Call this after auth is loaded and component is mounted
        fetchSharedPartnersHistory();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Partners</h1>
                    <p className="text-muted-foreground">
                        Manage business partners and collaborators
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={fetchPartners} variant="outline" className="gap-2 w-full sm:w-auto">
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button onClick={handleAddPartner} className="gap-2 w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        Add Partner
                    </Button>
                </div>
            </div>

            {/* Add after the header and before the Card component */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                >
                    <div className="flex items-center">
                        <h2 className="text-lg font-semibold text-gray-700">Share Partners With Network</h2>
                        <Badge variant="outline" className="ml-2 bg-blue-50">
                            {selectedPartnerIds.length} {selectedPartnerIds.length === 1 ? 'partner' : 'partners'} selected
                        </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="p-1">
                        {isPanelExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                        ) : (
                            <ChevronRight className="h-5 w-5" />
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
                                            <ChevronDown className="h-4 w-4 opacity-50" />
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
                                                <X
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
                                            <ChevronDown className="h-4 w-4 opacity-50" />
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
                                                <X
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
                                    onClick={handleSharePartners}
                                    disabled={isSharing || selectedPartnerIds.length === 0}
                                    className="w-full mb-1"
                                >
                                    {isSharing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                    Share Partners
                                </Button>
                            </div>

                            {/* Share with Partners selection */}
                            <div className="col-span-full mt-2">
                                <Label htmlFor="sharing-partners">Select Partners to Share With</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between overflow-hidden text-left font-normal"
                                        >
                                            {selectedSharingPartnerIds.length > 0
                                                ? `${selectedSharingPartnerIds.length} partner(s) selected`
                                                : "Select partners to share with"}
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command className="bg-white">
                                            <CommandInput placeholder="Search partners..." className="bg-white" />
                                            <CommandEmpty>
                                                {loadingSharingPartners ? "Loading partners..." : "No partners found."}
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {sharingPartners.map((partner) => (
                                                    <CommandItem
                                                        key={partner.id}
                                                        onSelect={() => toggleSharingPartner(partner.id)}
                                                        className="flex items-center gap-2 text-gray-800"
                                                    >
                                                        <Checkbox
                                                            checked={selectedSharingPartnerIds.includes(partner.id)}
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
                                {selectedSharingPartnerIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {selectedSharingPartnerIds.map(id => {
                                            const partner = sharingPartners.find(p => p.id === id);
                                            return partner ? (
                                                <Badge
                                                    key={id}
                                                    variant="secondary"
                                                    className="flex items-center gap-1"
                                                >
                                                    {partner.name || partner.contact_email || partner.contact_phone || 'Partner'}
                                                    <X
                                                        className="h-3 w-3 cursor-pointer"
                                                        onClick={() => toggleSharingPartner(id)}
                                                    />
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Add the new Shared Partners History section below */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div
                                className="flex items-center justify-between cursor-pointer mb-3"
                                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                            >
                                <div className="flex items-center">
                                    <h3 className="text-md font-semibold text-gray-700">
                                        📤 Shared Partners History
                                    </h3>
                                    {!isHistoryLoading && sharedPartnersHistory.length > 0 && (
                                        <Badge variant="outline" className="ml-2 bg-blue-50">
                                            {sharedPartnersHistory.length} {sharedPartnersHistory.length === 1 ? 'record' : 'records'}
                                        </Badge>
                                    )}
                                </div>
                                <Button variant="ghost" size="sm" className="p-1">
                                    {isHistoryExpanded ? (
                                        <ChevronDown className="h-5 w-5" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>

                            {isHistoryExpanded && (
                                <div className="transition-all duration-300 ease-in-out">
                                    {isHistoryLoading ? (
                                        <div className="flex justify-center py-4">
                                            <RefreshCcw className="h-5 w-5 animate-spin text-gray-500" />
                                        </div>
                                    ) : sharedPartnersHistory.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md">
                                            No sharing history found. When you share partners, they will appear here.
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                            {sharedPartnersHistory.map((record) => (
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
                                                            <span className="text-gray-500">Partner:</span>{' '}
                                                            {record.name ? (
                                                                <span className="text-blue-600 font-medium">
                                                                    {record.name}
                                                                    {record.company && ` (${record.company})`}
                                                                    {record.location && ` - ${record.location}`}
                                                                </span>
                                                            ) : record.partner_ids?.length ? (
                                                                <span>{record.partner_ids.length} partners</span>
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
                                            onClick={fetchSharedPartnersHistory}
                                            disabled={isHistoryLoading}
                                        >
                                            {isHistoryLoading ? (
                                                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <RefreshCcw className="h-4 w-4 mr-2" />
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

            <Card>
                <CardHeader>
                    <CardTitle>All Partners</CardTitle>
                    <CardDescription>
                        {partners.length} total partners in the system
                    </CardDescription>

                    <div className="relative mt-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search partners..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                            <p>{error}</p>
                            <Button
                                onClick={fetchPartners}
                                variant="outline"
                                className="mt-2"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : filteredPartners.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchQuery ? 'No partners found matching your search.' : 'No partners added yet.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox
                                                checked={selectAll}
                                                onCheckedChange={handleSelectAllChange}
                                                aria-label="Select all partners"
                                            />
                                        </TableHead>
                                        <TableHead>Partner</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Trust Level</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPartners.map((partner) => (
                                        <TableRow key={partner.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedPartnerIds.includes(partner.id)}
                                                    onCheckedChange={(checked) => handleCheckboxChange(partner.id, checked === true)}
                                                    aria-label={`Select partner ${partner.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{partner.name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    {partner.email && <span className="text-sm">{partner.email}</span>}
                                                    {partner.phone && <span className="text-sm text-muted-foreground">{partner.phone}</span>}
                                                    {!partner.email && !partner.phone && '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>{partner.company || '—'}</TableCell>
                                            <TableCell>{partner.location || '—'}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={partner.status}
                                                    onValueChange={(value) => handleStatusChange(
                                                        partner.id,
                                                        value as 'active' | 'inactive' | 'pending'
                                                    )}
                                                >
                                                    <SelectTrigger className="h-8 w-28 px-2">
                                                        <StatusBadge status={partner.status} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={partner.trust_level || 'unrated'}
                                                    onValueChange={(value) => handleTrustLevelChange(
                                                        partner.id,
                                                        value as 'unrated' | 'trusted' | 'verified' | 'flagged'
                                                    )}
                                                >
                                                    <SelectTrigger className="h-8 w-28 px-2">
                                                        <TrustLevelBadge trustLevel={partner.trust_level || 'unrated'} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unrated">Unrated</SelectItem>
                                                        <SelectItem value="trusted">Trusted</SelectItem>
                                                        <SelectItem value="verified">Verified</SelectItem>
                                                        <SelectItem value="flagged">Flagged</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(partner.created_at), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditPartner(partner)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(partner)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Partner Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {formType === 'create' ? 'Add New Partner' : 'Edit Partner'}
                        </DialogTitle>
                        <DialogDescription>
                            {formType === 'create'
                                ? 'Add a new business partner to your network.'
                                : 'Update partner information.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Enter partner name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={formErrors.name ? "border-destructive" : ""}
                            />
                            {formErrors.name && (
                                <p className="text-xs text-destructive">{formErrors.name}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="contact_name" className="text-sm font-medium">
                                Contact Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="contact_name"
                                name="contact_name"
                                placeholder="Enter contact person's name"
                                value={formData.contact_name}
                                onChange={handleInputChange}
                                className={formErrors.contact_name ? "border-destructive" : ""}
                            />
                            {formErrors.contact_name && (
                                <p className="text-xs text-destructive">{formErrors.contact_name}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="company" className="text-sm font-medium">
                                Company
                            </label>
                            <Input
                                id="company"
                                name="company"
                                placeholder="Enter company name"
                                value={formData.company}
                                onChange={handleInputChange}
                                className={formErrors.company ? "border-destructive" : ""}
                            />
                            {formErrors.company && (
                                <p className="text-xs text-destructive">{formErrors.company}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="contact_email" className="text-sm font-medium">
                                Contact Email
                            </label>
                            <Input
                                id="contact_email"
                                name="contact_email"
                                type="email"
                                placeholder="Enter contact email address"
                                value={formData.contact_email}
                                onChange={handleInputChange}
                                className={formErrors.contact_email ? "border-destructive" : ""}
                            />
                            {formErrors.contact_email && (
                                <p className="text-xs text-destructive">{formErrors.contact_email}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="contact_phone" className="text-sm font-medium">
                                Contact Phone
                            </label>
                            <Input
                                id="contact_phone"
                                name="contact_phone"
                                placeholder="Enter contact phone number"
                                value={formData.contact_phone}
                                onChange={handleInputChange}
                                className={formErrors.contact_phone ? "border-destructive" : ""}
                            />
                            {formErrors.contact_phone && (
                                <p className="text-xs text-destructive">{formErrors.contact_phone}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="status" className="text-sm font-medium">
                                Status
                            </label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        status: value as 'active' | 'inactive' | 'pending'
                                    }));
                                }}
                            >
                                <SelectTrigger id="status" className={formErrors.status ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            {formErrors.status && (
                                <p className="text-xs text-destructive">{formErrors.status}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="location" className="text-sm font-medium">
                                Location
                            </label>
                            <Input
                                id="location"
                                name="location"
                                placeholder="Enter location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className={formErrors.location ? "border-destructive" : ""}
                            />
                            {formErrors.location && (
                                <p className="text-xs text-destructive">{formErrors.location}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="trust_level" className="text-sm font-medium">
                                Trust Level
                            </label>
                            <Select
                                value={formData.trust_level}
                                onValueChange={(value) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        trust_level: value as 'unrated' | 'trusted' | 'verified' | 'flagged'
                                    }));
                                }}
                            >
                                <SelectTrigger id="trust_level" className={formErrors.trust_level ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select trust level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unrated">Unrated</SelectItem>
                                    <SelectItem value="trusted">Trusted</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="flagged">Flagged</SelectItem>
                                </SelectContent>
                            </Select>
                            {formErrors.trust_level && (
                                <p className="text-xs text-destructive">{formErrors.trust_level}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="notes" className="text-sm font-medium">
                                Notes
                            </label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Add any additional notes here"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className={formErrors.notes ? "border-destructive" : ""}
                                rows={4}
                            />
                            {formErrors.notes && (
                                <p className="text-xs text-destructive">{formErrors.notes}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsFormOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                                    Saving...
                                </>
                            ) : (
                                'Save Partner'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the partner
                            <strong> {partnerToDelete?.name}</strong> and remove their data from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.preventDefault();
                                handleDeletePartner();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                                    Deleting...
                                </>
                            ) : (
                                'Delete Partner'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
