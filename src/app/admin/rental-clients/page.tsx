"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast, Toaster } from "sonner";
import {
    ToastAction
} from "@/components/ui/toast";

// --- UI Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter, // Added SheetFooter
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea"; // Added Textarea
import { Label } from "@/components/ui/label"; // Added Label
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select

// --- Icon Imports ---
import {
    ChevronDown,
    Filter,
    Search,
    Phone,
    Mail,
    MessageSquare,
    Tag,
    MapPin,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    PlusCircle, // Added for Add button
    Trash2, // Added for Delete button
    X, // Added for removing tags
    Loader2, // Added for loading states
    AlertCircle, // Added for error icon
} from "lucide-react";

// --- Types ---

// Corrected Client type based on provided schema
interface Client {
    id: string; // uuid
    renter_id?: string | null; // uuid
    full_name: string; // text
    email?: string | null; // text
    phone?: string | null; // text
    country?: string | null; // text
    city?: string | null; // text
    company_name?: string | null; // text
    job_title?: string | null; // text
    preferred_language?: string | null; // text
    preferred_contact_method?: string | null; // text
    tags?: string[] | null; // text[]
    lead_source?: string | null; // text
    status?: string | null; // text
    notes?: string | null; // text
    created_at?: string | null; // timestamp with time zone
    updated_at?: string | null; // timestamp with time zone
}

// Type for the client form data (useful for create/update)
// Omit id, created_at, updated_at for creation/update forms
type ClientFormData = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

// Default empty client for the creation form
const DEFAULT_CLIENT_FORM_DATA: ClientFormData = {
    full_name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    company_name: "",
    job_title: "",
    preferred_language: "",
    preferred_contact_method: "Email", // Default preference
    tags: [],
    lead_source: "",
    status: "active", // Default status
    notes: "",
    renter_id: null,
};


export default function RentalClientsPage() {
    const supabase = createClient(); // Initialize Supabase client

    // --- State Variables ---
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtering & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    // Add state for tags filter if implementing

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalClients, setTotalClients] = useState(0);
    const pageSize = 10;

    // Details Sheet / Modal State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null); // For viewing/editing existing
    const [clientFormData, setClientFormData] = useState<ClientFormData>(DEFAULT_CLIENT_FORM_DATA); // For create/edit form
    const [isSaving, setIsSaving] = useState(false); // Loading state for save/create
    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create'); // To control sheet behavior

    // Delete Confirmation
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Tag management specific state
    const [newTag, setNewTag] = useState("");


    // --- Data Fetching ---
    const fetchClients = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let query = supabase
                .from("rental_clients")
                .select("*", { count: "exact" }); // Get total count

            // Apply Search Filter
            if (searchQuery) {
                const searchLower = `%${searchQuery.toLowerCase()}%`;
                query = query.or(
                    `full_name.ilike.${searchLower},email.ilike.${searchLower},phone.ilike.${searchLower}`
                );
            }

            // Apply Status Filter
            if (statusFilter !== "All") {
                query = query.eq("status", statusFilter.toLowerCase());
            }

            // Apply Tags Filter (Example - adjust as needed for multi-select)
            // if (selectedTags.length > 0) {
            //   query = query.contains('tags', selectedTags);
            // }

            // Apply Ordering
            query = query.order("created_at", { ascending: false });

            // Apply Pagination
            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            // Execute Query
            const { data, error: queryError, count } = await query;

            if (queryError) {
                throw queryError;
            }

            setClients(data || []);
            setTotalClients(count || 0);

        } catch (err: any) {
            console.error("Error fetching clients:", err);
            setError(`Failed to fetch clients: ${err.message}`);
            setClients([]);
            setTotalClients(0);
        } finally {
            setIsLoading(false);
        }
    }, [supabase, searchQuery, statusFilter, currentPage, pageSize]);

    // Initial fetch and refetch on filter/page change
    useEffect(() => {
        fetchClients();
    }, [fetchClients]); // Dependencies handled by useCallback

    // Reset page number when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);


    // --- CRUD Handlers ---

    const handleOpenCreateSheet = () => {
        setSheetMode('create');
        setSelectedClient(null); // Clear any selected client
        setClientFormData(DEFAULT_CLIENT_FORM_DATA); // Reset form
        setIsSheetOpen(true);
    };

    const handleOpenEditSheet = (client: Client) => {
        setSheetMode('edit');
        setSelectedClient(client); // Set the client being edited
        // Populate form data from the selected client
        setClientFormData({
            full_name: client.full_name || "",
            email: client.email || "",
            phone: client.phone || "",
            country: client.country || "",
            city: client.city || "",
            company_name: client.company_name || "",
            job_title: client.job_title || "",
            preferred_language: client.preferred_language || "",
            preferred_contact_method: client.preferred_contact_method || "Email",
            tags: client.tags || [],
            lead_source: client.lead_source || "",
            status: client.status || "active",
            notes: client.notes || "",
            renter_id: client.renter_id || null,
        });
        setIsSheetOpen(true);
    };

    const handleFormChange = (field: keyof ClientFormData, value: any) => {
        setClientFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddTag = () => {
        if (newTag.trim() && !clientFormData.tags?.includes(newTag.trim())) {
            setClientFormData(prev => ({
                ...prev,
                tags: [...(prev.tags || []), newTag.trim()]
            }));
            setNewTag("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setClientFormData(prev => ({
            ...prev,
            tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSaveClient = async () => {
        setIsSaving(true);
        setError(null);
        const dataToSave = { ...clientFormData };

        try {
            let response;
            if (sheetMode === 'edit' && selectedClient) {
                // Update existing client
                response = await supabase
                    .from('rental_clients')
                    .update(dataToSave)
                    .eq('id', selectedClient.id)
                    .select() // Optionally select the updated row
                    .single(); // Expect a single row back
            } else {
                // Create new client
                response = await supabase
                    .from('rental_clients')
                    .insert(dataToSave)
                    .select() // Optionally select the inserted row
                    .single(); // Expect a single row back
            }

            const { error: saveError } = response;

            if (saveError) {
                throw saveError;
            }

            toast.success(
                `Client successfully ${sheetMode === 'edit' ? 'updated' : 'created'}`,
                {
                    description: `${clientFormData.full_name} has been ${sheetMode === 'edit' ? 'updated' : 'added'} to your clients list.`
                }
            );

            setIsSheetOpen(false);
            fetchClients(); // Refresh the list

        } catch (err: any) {
            console.error(`Error ${sheetMode === 'edit' ? 'updating' : 'creating'} client:`, err);
            setError(`Failed to ${sheetMode === 'edit' ? 'update' : 'create'} client: ${err.message}`);

            toast.error(
                `Failed to ${sheetMode === 'edit' ? 'update' : 'create'} client`,
                {
                    description: err.message
                }
            );
        } finally {
            setIsSaving(false);
        }
    };


    const handleOpenDeleteDialog = (client: Client) => {
        setClientToDelete(client);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteClient = async () => {
        if (!clientToDelete) return;

        setIsDeleting(true);
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('rental_clients')
                .delete()
                .eq('id', clientToDelete.id);

            if (deleteError) {
                throw deleteError;
            }

            toast.success(
                `Client deleted successfully`,
                {
                    description: `${clientToDelete.full_name} has been removed from your clients list.`
                }
            );

            setIsDeleteDialogOpen(false);
            setClientToDelete(null);
            // If the deleted client was being viewed, close the sheet
            if (selectedClient?.id === clientToDelete.id) {
                setIsSheetOpen(false);
                setSelectedClient(null);
            }
            fetchClients(); // Refresh the list

        } catch (err: any) {
            console.error("Error deleting client:", err);
            setError(`Failed to delete client: ${err.message}`);

            toast.error(
                "Failed to delete client",
                {
                    description: err.message,
                }
            );
        } finally {
            setIsDeleting(false);
        }
    };


    // --- UI Helpers ---

    const totalPages = Math.ceil(totalClients / pageSize);

    const getStatusColor = (status?: string | null): string => {
        const lowerStatus = status?.toLowerCase();
        const colors: Record<string, string> = {
            active: "bg-green-100 text-green-800",
            inactive: "bg-gray-100 text-gray-800",
            pending: "bg-yellow-100 text-yellow-800",
            vip: "bg-purple-100 text-purple-800",
        };
        return colors[lowerStatus || ''] || "bg-gray-100 text-gray-800";
    };

    const formatDate = (dateString?: string | null): string => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (e) {
            return "Invalid Date";
        }
    };

    // Memoize current page data to avoid recalculating on every render
    const currentData = useMemo(() => clients, [clients]);

    // --- Render ---
    return (
        <div className="p-4 pr-6 w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Rental Clients</h1>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative sm:max-w-[60%] flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search by name, email, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                    />
                </div>
                <div className="flex gap-2">
                    {/* Status Dropdown - Increased width */}
                    <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
                        <SelectTrigger className="w-[220px]">
                            <Filter size={16} className="mr-2" />
                            Status: <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Tags Dropdown (Placeholder - Requires implementation) */}
                    <Button variant="outline" className="gap-2" disabled={isLoading}>
                        <Tag size={16} />
                        Tags
                        <ChevronDown size={16} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={fetchClients} disabled={isLoading} title="Refresh Clients">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>

                    {/* Add New Client Button - moved here */}
                    <Button onClick={handleOpenCreateSheet} className="gap-2">
                        <PlusCircle size={18} />
                        Add New Client
                    </Button>
                </div>
            </div>

            {/* Improve the error display styling */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                        <strong className="font-medium">Error:</strong> {error}
                    </div>
                </div>
            )}

            {/* Clients table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact Info</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(pageSize)
                                .fill(null)
                                .map((_, i) => (
                                    <TableRow key={`loading-${i}`}>
                                        <TableCell><div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div></TableCell>
                                        <TableCell><div className="h-12 w-48 bg-gray-200 rounded-md animate-pulse"></div></TableCell>
                                        <TableCell><div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse"></div></TableCell>
                                        <TableCell><div className="h-6 w-16 bg-gray-200 rounded-md animate-pulse"></div></TableCell>
                                        <TableCell><div className="h-9 w-28 bg-gray-200 rounded-md animate-pulse"></div></TableCell>
                                    </TableRow>
                                ))
                        ) : currentData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                                    No clients found {searchQuery || statusFilter !== 'All' ? 'matching your filters' : ''}.
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentData.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.full_name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col space-y-1">
                                            {client.email && <div className="flex items-center gap-1.5 text-sm">
                                                <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                <span className="truncate">{client.email}</span>
                                            </div>}
                                            {client.phone && <div className="flex items-center gap-1.5 text-sm">
                                                <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                <span>{client.phone}</span>
                                            </div>}
                                            {client.preferred_contact_method && <div className="flex items-center gap-1.5 text-sm">
                                                <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                <span>{client.preferred_contact_method}</span>
                                            </div>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                            {client.city}{client.city && client.country ? ', ' : ''}{client.country}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(client.status)}>
                                            {client.status || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenEditSheet(client)}
                                        >
                                            View Details
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => handleOpenDeleteDialog(client)}
                                            title="Delete Client"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!isLoading && totalClients > 0 && (
                <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-500">
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, totalClients)} of{" "}
                        {totalClients} clients
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                            }
                            disabled={currentPage === totalPages}
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Client details/create Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader className="pb-4 border-b">
                        <SheetTitle className="text-2xl">
                            {sheetMode === 'edit' ? `Edit Client: ${selectedClient?.full_name}` : 'Add New Client'}
                        </SheetTitle>
                        {sheetMode === 'edit' && selectedClient && (
                            <SheetDescription className="flex items-center gap-2 pt-1">
                                <Badge className={getStatusColor(selectedClient.status)}>
                                    {selectedClient.status}
                                </Badge>
                                <span className="text-gray-500">
                                    Client since {formatDate(selectedClient.created_at)}
                                </span>
                            </SheetDescription>
                        )}
                    </SheetHeader>

                    {/* Form Tabs (Simplified for Create/Edit) */}
                    <Tabs defaultValue="details" className="mt-6">
                        <TabsList className="grid grid-cols-1 mb-4 w-full">
                            <TabsTrigger value="details">Client Details</TabsTrigger>
                            {/* Hiding Interactions/Activity for now */}
                            {/* <TabsTrigger value="interactions">Interactions</TabsTrigger> */}
                            {/* <TabsTrigger value="activity">Activity</TabsTrigger> */}
                        </TabsList>

                        <TabsContent value="details">
                            {/* Use a form element for better structure */}
                            <form onSubmit={(e) => { e.preventDefault(); handleSaveClient(); }}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Client Information</CardTitle>
                                        <CardDescription>
                                            Enter or update the client's details below.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Form Fields */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="full_name">Full Name *</Label>
                                                <Input id="full_name" value={clientFormData.full_name} onChange={(e) => handleFormChange('full_name', e.target.value)} required className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" type="email" value={clientFormData.email || ''} onChange={(e) => handleFormChange('email', e.target.value)} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="phone">Phone</Label>
                                                <Input id="phone" value={clientFormData.phone || ''} onChange={(e) => handleFormChange('phone', e.target.value)} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="city">City</Label>
                                                <Input id="city" value={clientFormData.city || ''} onChange={(e) => handleFormChange('city', e.target.value)} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="country">Country</Label>
                                                <Input id="country" value={clientFormData.country || ''} onChange={(e) => handleFormChange('country', e.target.value)} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="company_name">Company Name</Label>
                                                <Input id="company_name" value={clientFormData.company_name || ''} onChange={(e) => handleFormChange('company_name', e.target.value)} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="job_title">Job Title</Label>
                                                <Input id="job_title" value={clientFormData.job_title || ''} onChange={(e) => handleFormChange('job_title', e.target.value)} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="lead_source">Lead Source</Label>
                                                <Input id="lead_source" value={clientFormData.lead_source || ''} onChange={(e) => handleFormChange('lead_source', e.target.value)} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label htmlFor="status">Status</Label>
                                                <Select value={clientFormData.status || 'active'} onValueChange={(value) => handleFormChange('status', value)}>
                                                    <SelectTrigger id="status" className="mt-1">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="vip">VIP</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="preferred_contact_method">Preferred Contact</Label>
                                                <Select value={clientFormData.preferred_contact_method || 'Email'} onValueChange={(value) => handleFormChange('preferred_contact_method', value)}>
                                                    <SelectTrigger id="preferred_contact_method" className="mt-1">
                                                        <SelectValue placeholder="Select method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Email">Email</SelectItem>
                                                        <SelectItem value="Phone">Phone</SelectItem>
                                                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Tags Input */}
                                        <div>
                                            <Label>Tags</Label>
                                            <div className="flex flex-wrap gap-2 mt-1 border p-2 rounded-md min-h-[40px]">
                                                {(clientFormData.tags || []).map((tag: string) => (
                                                    <Badge key={tag} variant="secondary" className="flex gap-1 items-center">
                                                        {tag}
                                                        <button
                                                            type="button" // Prevent form submission
                                                            onClick={() => handleRemoveTag(tag)}
                                                            className="ml-1 rounded-full hover:bg-gray-300 p-0.5"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </Badge>
                                                ))}
                                                <div className="flex gap-2 items-center flex-grow">
                                                    <Input
                                                        value={newTag}
                                                        onChange={(e) => setNewTag(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                                                        placeholder="Add tag..."
                                                        className="h-8 flex-grow min-w-[100px]"
                                                    />
                                                    <Button
                                                        type="button" // Prevent form submission
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleAddTag}
                                                        className="h-8 px-2"
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes Textarea */}
                                        <div>
                                            <Label htmlFor="notes">Notes</Label>
                                            <Textarea
                                                id="notes"
                                                className="mt-1 w-full p-2 border rounded-md h-24"
                                                value={clientFormData.notes || ''}
                                                onChange={(e) => handleFormChange('notes', e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                                {/* Move Footer outside CardContent but inside form */}
                                <SheetFooter className="mt-6 pt-4 border-t">
                                    {error && <p className="text-sm text-red-600 mr-auto">Error: {error}</p>}
                                    <Button variant="outline" type="button" onClick={() => setIsSheetOpen(false)} disabled={isSaving}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </SheetFooter>
                            </form>
                        </TabsContent>

                        {/* Placeholder Tabs Content (Hidden for now) */}
                        {/* <TabsContent value="interactions"> ... </TabsContent> */}
                        {/* <TabsContent value="activity"> ... </TabsContent> */}
                    </Tabs>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the client
                            "{clientToDelete?.full_name}" and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteClient}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Client'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Toaster component at the end of the component */}
            <Toaster />
        </div>
    );
}