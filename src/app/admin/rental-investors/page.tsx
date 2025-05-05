// src/app/(dashboard)/rental-investors/page.tsx

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client"; // Ensure this path is correct
import { toast, Toaster } from "sonner";

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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    PlusCircle,
    Trash2,
    X,
    Loader2,
    AlertCircle,
    User,
    Building,
    FileText,
    Percent,
    CalendarDays,
} from "lucide-react";

// --- Types ---

// Investor type based strictly on the provided rental_investors schema
interface Investor {
    id: string;
    investor_user_id: string | null;
    full_name: string;
    email: string | null;
    phone: string | null;
    country: string | null;
    city: string | null;
    investor_type: string | null;
    company_name: string | null;
    preferred_language: string | null;
    preferred_contact_method: string | null;
    tags: string[] | null;
    status: string | null;
    notes: string | null;
    contract_url: string | null;
    agreement_date: string | null; // Stored as 'YYYY-MM-DD' string
    commission_rate: number | null; // numeric
    payout_frequency: string | null;
    payout_method: string | null;
    created_at: string | null;
    updated_at: string | null;
}

// Form data type for investors, omitting auto-generated fields
type InvestorFormData = Omit<Investor, 'id' | 'created_at' | 'updated_at'>;

// Default empty investor for the creation form
const DEFAULT_INVESTOR_FORM_DATA: InvestorFormData = {
    full_name: "",
    investor_user_id: null,
    email: null,
    phone: null,
    country: null,
    city: null,
    investor_type: "individual", // Default type
    company_name: null,
    preferred_language: null,
    preferred_contact_method: "Email", // Default preference
    tags: [],
    status: "pending_review", // Default status
    notes: null,
    contract_url: null,
    agreement_date: null,
    commission_rate: null,
    payout_frequency: "monthly", // Default frequency
    payout_method: "bank_transfer", // Default method
};


export default function RentalInvestorsPage() {
    const supabase = createClient();

    // --- State Variables ---
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalInvestors, setTotalInvestors] = useState(0);
    const pageSize = 10;
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
    const [investorFormData, setInvestorFormData] = useState<InvestorFormData>(DEFAULT_INVESTOR_FORM_DATA);
    const [isSaving, setIsSaving] = useState(false);
    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [investorToDelete, setInvestorToDelete] = useState<Investor | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [newTag, setNewTag] = useState("");


    // --- Data Fetching ---
    const fetchInvestors = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let query = supabase
                .from("rental_investors")
                .select("*", { count: "exact" });

            if (searchQuery) {
                const searchLower = `%${searchQuery.toLowerCase()}%`;
                query = query.or(`full_name.ilike.${searchLower},email.ilike.${searchLower},company_name.ilike.${searchLower}`);
            }
            if (statusFilter !== "All") {
                query = query.eq("status", statusFilter.toLowerCase());
            }
            // Add tag filtering here if needed: .contains('tags', ['tag1', 'tag2'])

            query = query.order("created_at", { ascending: false });

            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error: queryError, count } = await query;
            if (queryError) throw queryError;

            setInvestors(data || []);
            setTotalInvestors(count || 0);
        } catch (err: any) {
            console.error("Error fetching investors:", err);
            setError(`Failed to fetch investors: ${err.message}`);
            setInvestors([]);
            setTotalInvestors(0);
            toast.error("Failed to fetch investors", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    }, [supabase, searchQuery, statusFilter, currentPage, pageSize]);

    useEffect(() => {
        fetchInvestors();
    }, [fetchInvestors]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);


    // --- CRUD Handlers ---

    const handleOpenCreateSheet = () => {
        setSheetMode('create');
        setSelectedInvestor(null);
        setInvestorFormData(DEFAULT_INVESTOR_FORM_DATA);
        setError(null); // Clear previous errors
        setIsSheetOpen(true);
    };

    const handleOpenEditSheet = (investor: Investor) => {
        setSheetMode('edit');
        setSelectedInvestor(investor);
        // Populate form, ensuring nulls are handled correctly
        setInvestorFormData({
            full_name: investor.full_name ?? "",
            investor_user_id: investor.investor_user_id ?? null,
            email: investor.email ?? null,
            phone: investor.phone ?? null,
            country: investor.country ?? null,
            city: investor.city ?? null,
            investor_type: investor.investor_type ?? "individual",
            company_name: investor.company_name ?? null,
            preferred_language: investor.preferred_language ?? null,
            preferred_contact_method: investor.preferred_contact_method ?? "Email",
            tags: investor.tags ?? [],
            status: investor.status ?? "pending_review",
            notes: investor.notes ?? null,
            contract_url: investor.contract_url ?? null,
            agreement_date: investor.agreement_date ?? null,
            commission_rate: investor.commission_rate ?? null,
            payout_frequency: investor.payout_frequency ?? "monthly",
            payout_method: investor.payout_method ?? "bank_transfer",
        });
        setError(null); // Clear previous errors
        setIsSheetOpen(true);
    };

    // Handles changes for most inputs
    const handleFormInputChange = (field: keyof InvestorFormData, value: string) => {
        // Handle empty strings as null for nullable text fields
        const finalValue = value === '' ? null : value;
        setInvestorFormData(prev => ({ ...prev, [field]: finalValue }));
    };

    // Specific handler for number input to ensure correct type or null
    const handleCommissionRateChange = (value: string) => {
        if (value === '') {
            setInvestorFormData(prev => ({ ...prev, commission_rate: null }));
        } else {
            const num = parseFloat(value);
            setInvestorFormData(prev => ({ ...prev, commission_rate: isNaN(num) ? null : num }));
        }
    };

    // Handler for Select components
    const handleFormSelectChange = (field: keyof InvestorFormData, value: string) => {
        setInvestorFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handler for Tags
    const handleAddTag = () => {
        if (newTag.trim() && !(investorFormData.tags ?? []).includes(newTag.trim())) {
            setInvestorFormData(prev => ({
                ...prev,
                tags: [...(prev.tags || []), newTag.trim()]
            }));
            setNewTag("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setInvestorFormData(prev => ({
            ...prev,
            tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSaveInvestor = async () => {
        setIsSaving(true);
        setError(null);

        // Prepare data for Supabase, ensuring correct types and nulls
        const dataToSubmit: Partial<InvestorFormData> = {
            ...investorFormData,
            // Ensure commission_rate is number or null
            commission_rate: typeof investorFormData.commission_rate === 'number' && !isNaN(investorFormData.commission_rate)
                ? investorFormData.commission_rate
                : null,
            // Ensure tags is an array or null (Supabase might prefer empty array over null)
            tags: investorFormData.tags && investorFormData.tags.length > 0 ? investorFormData.tags : [],
            // Ensure date is 'YYYY-MM-DD' or null
            agreement_date: investorFormData.agreement_date ? investorFormData.agreement_date : null,
            // Ensure empty strings become null for optional text fields if desired by DB/RLS
            email: investorFormData.email || null,
            phone: investorFormData.phone || null,
            country: investorFormData.country || null,
            city: investorFormData.city || null,
            company_name: investorFormData.company_name || null,
            preferred_language: investorFormData.preferred_language || null,
            notes: investorFormData.notes || null,
            contract_url: investorFormData.contract_url || null,
            investor_user_id: investorFormData.investor_user_id || null,
        };

        // Remove null values if Supabase client/RLS prefers omitting them instead of sending explicit nulls
        // Object.keys(dataToSubmit).forEach(key => {
        //     if (dataToSubmit[key as keyof InvestorFormData] === null) {
        //         delete dataToSubmit[key as keyof InvestorFormData];
        //     }
        // });

        try {
            let response;
            if (sheetMode === 'edit' && selectedInvestor) {
                response = await supabase
                    .from('rental_investors')
                    .update(dataToSubmit)
                    .eq('id', selectedInvestor.id);
            } else {
                response = await supabase
                    .from('rental_investors')
                    .insert(dataToSubmit);
            }

            const { error: saveError } = response;
            if (saveError) throw saveError;

            toast.success(`Investor successfully ${sheetMode === 'edit' ? 'updated' : 'created'}`, {
                description: `${investorFormData.full_name} details saved.`
            });
            setIsSheetOpen(false);
            fetchInvestors();

        } catch (err: any) {
            console.error(`Error saving investor:`, err);
            setError(`Save failed: ${err.message}`);
            toast.error(`Failed to save investor`, { description: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenDeleteDialog = (investor: Investor) => {
        setInvestorToDelete(investor);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteInvestor = async () => {
        if (!investorToDelete) return;
        setIsDeleting(true);
        setError(null);
        try {
            const { error: deleteError } = await supabase
                .from('rental_investors')
                .delete()
                .eq('id', investorToDelete.id);
            if (deleteError) throw deleteError;

            toast.success(`Investor deleted successfully`, {
                description: `${investorToDelete.full_name} removed.`
            });
            setIsDeleteDialogOpen(false);
            setInvestorToDelete(null);
            if (selectedInvestor?.id === investorToDelete.id) {
                setIsSheetOpen(false);
                setSelectedInvestor(null);
            }
            fetchInvestors();
        } catch (err: any) {
            console.error("Error deleting investor:", err);
            setError(`Delete failed: ${err.message}`);
            toast.error("Failed to delete investor", { description: err.message });
        } finally {
            setIsDeleting(false);
        }
    };

    // --- UI Helpers ---
    const totalPages = Math.ceil(totalInvestors / pageSize);

    const getStatusColor = (status?: string | null): string => {
        const lowerStatus = status?.toLowerCase();
        const colors: Record<string, string> = {
            'pending_review': "bg-blue-100 text-blue-800",
            active: "bg-green-100 text-green-800",
            inactive: "bg-gray-100 text-gray-800",
            rejected: "bg-red-100 text-red-800",
        };
        return colors[lowerStatus || ''] || "bg-gray-100 text-gray-800";
    };

    const formatDate = (dateString?: string | null): string => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid Date";
            // Adjust for potential timezone offset if dateString is just 'YYYY-MM-DD'
            const adjustedDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
            return adjustedDate.toLocaleDateString("en-CA", { // en-CA gives YYYY-MM-DD format
                year: "numeric", month: "2-digit", day: "2-digit",
            });
        } catch (e) { return "Invalid Date"; }
    };

    const currentData = useMemo(() => investors, [investors]);

    // --- Render ---
    return (
        <div className="p-4 pr-6 w-full">
            <Toaster /> {/* Ensure Toaster is rendered */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Rental Investors</h1>
            </div>

            {/* Filters and Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative sm:max-w-[60%] flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search name, email, company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
                        <SelectTrigger className="w-[220px]">
                            <Filter size={16} className="mr-2" /> Status: <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="pending_review">Pending Review</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="gap-2" disabled={isLoading}>
                        <Tag size={16} /> Tags <ChevronDown size={16} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={fetchInvestors} disabled={isLoading} title="Refresh Investors">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                    <Button onClick={handleOpenCreateSheet} className="gap-2">
                        <PlusCircle size={18} /> Add New Investor
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div><strong className="font-medium">Error:</strong> {error}</div>
                </div>
            )}

            {/* Investors Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Investor Name</TableHead>
                            <TableHead>Company / Type</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(pageSize).fill(null).map((_, i) => (
                                <TableRow key={`loading-${i}`}>
                                    <TableCell><div className="h-5 w-36 bg-gray-200 rounded-md animate-pulse"></div></TableCell>
                                    <TableCell><div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse"></div></TableCell>
                                    <TableCell><div className="h-12 w-44 bg-gray-200 rounded-md animate-pulse"></div></TableCell>
                                    <TableCell><div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse"></div></TableCell>
                                    <TableCell><div className="h-6 w-20 bg-gray-200 rounded-md animate-pulse"></div></TableCell>
                                    <TableCell><div className="h-9 w-28 bg-gray-200 rounded-md animate-pulse"></div></TableCell>
                                </TableRow>
                            ))
                        ) : currentData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-gray-500">No investors found.</TableCell>
                            </TableRow>
                        ) : (
                            currentData.map((investor) => (
                                <TableRow key={investor.id}>
                                    <TableCell className="font-medium">{investor.full_name}</TableCell>
                                    <TableCell>{investor.company_name || <span className="capitalize italic text-gray-600">{investor.investor_type}</span>}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col space-y-1">
                                            {investor.email && <div className="flex items-center gap-1.5 text-sm"><Mail className="h-4 w-4 text-gray-500 shrink-0" /><span className="truncate">{investor.email}</span></div>}
                                            {investor.phone && <div className="flex items-center gap-1.5 text-sm"><Phone className="h-4 w-4 text-gray-500 shrink-0" /><span>{investor.phone}</span></div>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                                            {investor.city}{investor.city && investor.country ? ', ' : ''}{investor.country}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(investor.status)}>
                                            {investor.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleOpenEditSheet(investor)}>View Details</Button>
                                        <Button variant="outline" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleOpenDeleteDialog(investor)} title="Delete Investor"><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!isLoading && totalInvestors > 0 && (
                <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-500">Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalInvestors)} of {totalInvestors} investors</div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /> Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next <ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            )}

            {/* Investor details/create Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                    <SheetHeader className="pb-4 border-b">
                        <SheetTitle className="text-2xl">{sheetMode === 'edit' ? `Edit Investor: ${selectedInvestor?.full_name}` : 'Add New Investor'}</SheetTitle>
                        {sheetMode === 'edit' && selectedInvestor && (
                            <SheetDescription className="flex items-center gap-2 pt-1">
                                <Badge className={getStatusColor(selectedInvestor.status)}>{selectedInvestor.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}</Badge>
                                <span className="text-gray-500">Investor since {formatDate(selectedInvestor.created_at)}</span>
                            </SheetDescription>
                        )}
                    </SheetHeader>

                    <form onSubmit={(e) => { e.preventDefault(); handleSaveInvestor(); }}>
                        <Tabs defaultValue="details" className="mt-6">
                            <TabsList className="grid grid-cols-2 mb-4 w-full">
                                <TabsTrigger value="details">Investor Details</TabsTrigger>
                                <TabsTrigger value="agreement">Agreement & Terms</TabsTrigger>
                            </TabsList>

                            {/* Details Tab */}
                            <TabsContent value="details">
                                <Card>
                                    <CardHeader><CardTitle>Investor Information</CardTitle><CardDescription>Basic contact and identification details.</CardDescription></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><Label htmlFor="full_name">Full Name *</Label><Input id="full_name" value={investorFormData.full_name} onChange={(e) => handleFormInputChange('full_name', e.target.value)} required className="mt-1" /></div>
                                            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={investorFormData.email ?? ''} onChange={(e) => handleFormInputChange('email', e.target.value)} className="mt-1" /></div>
                                            <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={investorFormData.phone ?? ''} onChange={(e) => handleFormInputChange('phone', e.target.value)} className="mt-1" /></div>
                                            <div><Label htmlFor="investor_type">Investor Type</Label>
                                                <Select value={investorFormData.investor_type ?? 'individual'} onValueChange={(value) => handleFormSelectChange('investor_type', value)}><SelectTrigger id="investor_type" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="individual">Individual</SelectItem><SelectItem value="company">Company</SelectItem></SelectContent></Select>
                                            </div>
                                            <div><Label htmlFor="company_name">Company Name</Label><Input id="company_name" value={investorFormData.company_name ?? ''} onChange={(e) => handleFormInputChange('company_name', e.target.value)} className="mt-1" /></div>
                                            <div><Label htmlFor="city">City</Label><Input id="city" value={investorFormData.city ?? ''} onChange={(e) => handleFormInputChange('city', e.target.value)} className="mt-1" /></div>
                                            <div><Label htmlFor="country">Country</Label><Input id="country" value={investorFormData.country ?? ''} onChange={(e) => handleFormInputChange('country', e.target.value)} className="mt-1" /></div>
                                            <div><Label htmlFor="preferred_contact_method">Preferred Contact</Label>
                                                <Select value={investorFormData.preferred_contact_method ?? 'Email'} onValueChange={(value) => handleFormSelectChange('preferred_contact_method', value)}><SelectTrigger id="preferred_contact_method" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Email">Email</SelectItem><SelectItem value="Phone">Phone</SelectItem><SelectItem value="WhatsApp">WhatsApp</SelectItem></SelectContent></Select>
                                            </div>
                                            <div><Label htmlFor="status">Status</Label>
                                                <Select value={investorFormData.status ?? 'pending_review'} onValueChange={(value) => handleFormSelectChange('status', value)}><SelectTrigger id="status" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending_review">Pending Review</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
                                            </div>
                                            {/* Preferred Language could be Input or Select */}
                                            <div><Label htmlFor="preferred_language">Preferred Language</Label><Input id="preferred_language" value={investorFormData.preferred_language ?? ''} onChange={(e) => handleFormInputChange('preferred_language', e.target.value)} className="mt-1" /></div>
                                        </div>
                                        {/* Tags */}
                                        <div><Label>Tags</Label>
                                            <div className="flex flex-wrap gap-2 mt-1 border p-2 rounded-md min-h-[40px]">
                                                {(investorFormData.tags ?? []).map((tag) => (<Badge key={tag} variant="secondary" className="flex gap-1 items-center">{tag}<button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 rounded-full hover:bg-gray-300 p-0.5"><X size={12} /></button></Badge>))}
                                                <div className="flex gap-2 items-center flex-grow"><Input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }} placeholder="Add tag..." className="h-8 flex-grow min-w-[100px]" /><Button type="button" size="sm" variant="outline" onClick={handleAddTag} className="h-8 px-2">Add</Button></div>
                                            </div>
                                        </div>
                                        {/* Notes */}
                                        <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" className="mt-1 w-full" value={investorFormData.notes ?? ''} onChange={(e) => handleFormInputChange('notes', e.target.value)} /></div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Agreement Tab */}
                            <TabsContent value="agreement">
                                <Card>
                                    <CardHeader><CardTitle>Agreement & Terms</CardTitle><CardDescription>Investment agreement details and payout terms.</CardDescription></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><Label htmlFor="contract_url">Contract URL</Label><Input id="contract_url" type="url" placeholder="https://..." value={investorFormData.contract_url ?? ''} onChange={(e) => handleFormInputChange('contract_url', e.target.value)} className="mt-1" /></div>
                                            <div><Label htmlFor="agreement_date">Agreement Date</Label><Input type="date" id="agreement_date" value={investorFormData.agreement_date ?? ''} onChange={(e) => handleFormInputChange('agreement_date', e.target.value)} className="mt-1" /></div>
                                            <div><Label htmlFor="commission_rate">Commission Rate (%)</Label><Input type="number" step="0.01" min="0" max="1" id="commission_rate" placeholder="e.g., 0.15 for 15%" value={investorFormData.commission_rate ?? ''} onChange={(e) => handleCommissionRateChange(e.target.value)} className="mt-1" /></div>
                                            <div><Label htmlFor="payout_frequency">Payout Frequency</Label>
                                                <Select value={investorFormData.payout_frequency ?? 'monthly'} onValueChange={(value) => handleFormSelectChange('payout_frequency', value)}><SelectTrigger id="payout_frequency" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="per_rental">Per Rental</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem></SelectContent></Select>
                                            </div>
                                            <div><Label htmlFor="payout_method">Payout Method</Label>
                                                <Select value={investorFormData.payout_method ?? 'bank_transfer'} onValueChange={(value) => handleFormSelectChange('payout_method', value)}><SelectTrigger id="payout_method" className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="paypal">PayPal</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                        {/* Sheet Footer applies to the whole form */}
                        <SheetFooter className="mt-6 pt-4 border-t">
                            {error && <p className="text-sm text-red-600 mr-auto">Error: {error}</p>}
                            <Button variant="outline" type="button" onClick={() => setIsSheetOpen(false)} disabled={isSaving}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}</Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the investor "{investorToDelete?.full_name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteInvestor} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">{isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : 'Delete Investor'}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}