// src/app/(dealer)/dealer-admin/inventory/page.tsx

'use client';

import {
    useState,
    useEffect,
    useCallback,
    ChangeEvent,
    FormEvent,
    MouseEvent,
} from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { format } from "date-fns";
import { toast, useToast } from '@/components/ui/use-toast';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// --- Icons ---
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    XMarkIcon,
    PlusIcon,
    TrashIcon as TrashIconOutline,
    PencilIcon,
    EyeIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    CloudArrowUpIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';

// --- Define the Car type based on partner_listings ---
interface Car {
    id: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year: number;
    vin: string | null;
    price: number | null;
    images: string[];
    features: string[];
    status?: "available" | "sold" | string;
    mileage?: number | null;
    listing_type?: "sale" | "rental" | "both" | string;
    body_type?: string | null;
    exterior_color?: string | null;
    interior_color?: string | null;
    fuel_type?: string | null;
    transmission?: string | null;
    condition?: "new" | "used" | "certified" | string;
    description?: string | null;
    location_city?: string | null;
    location_country?: string | null;
    engine?: string | null;
    is_public?: boolean;
    is_special_offer?: boolean;
    special_offer_label?: string | null;
    created_at?: string;
    // Removed seller_since, purchasing_price, seller_name, network fields
}

// --- Define initial form data based on the extended Car type ---
const initialFormData: Partial<Car> = {
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: undefined,
    price: undefined,
    status: 'available',
    mileage: undefined,
    listing_type: 'sale',
    body_type: '',
    exterior_color: '',
    interior_color: '',
    fuel_type: 'gasoline',
    transmission: 'automatic',
    condition: 'used',
    images: [],
    description: '',
    features: [],
    location_city: '',
    location_country: '',
    engine: '',
    vin: '',
    is_public: true,
    is_special_offer: false,
    special_offer_label: '',
    // Removed seller_since, purchasing_price, seller_name, network fields
};


// Helper component for displaying details in View Mode
function DetailItem({ label, value }: { label: string; value: string | number | boolean | undefined | null }) {
    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value ?? 'N/A');
    return (
        <div>
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{displayValue}</dd>
        </div>
    );
}

// Helper function to format currency (Defined in module scope)
const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined) {
        return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

// Define available options for Select components
const AVAILABLE_FEATURES = [
    'Air Conditioning', 'Power Steering', 'Power Windows', 'Sunroof', 'Navigation System',
    'Leather Seats', 'Heated Seats', 'Backup Camera', 'Bluetooth', 'Alloy Wheels', 'Cruise Control'
];
const AVAILABLE_FUEL_TYPES = ['gasoline', 'diesel', 'electric', 'hybrid', 'other'];
const AVAILABLE_TRANSMISSIONS = ['automatic', 'manual', 'cvt', 'dct', 'other'];
const AVAILABLE_CONDITIONS = ['new', 'used', 'certified'];
const AVAILABLE_STATUSES = ['available', 'sold'];
const AVAILABLE_LISTING_TYPES = ['sale', 'rental', 'both'];


export default function DealerInventoryPage() {
    const supabase = createClient();
    const { toast } = useToast();

    // State declarations
    const [dealerPartnerId, setDealerPartnerId] = useState<string | null>(null);
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create');
    const [currentCar, setCurrentCar] = useState<Car | null>(null);
    const [formData, setFormData] = useState<Partial<Car>>(initialFormData);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalActiveImageIndex, setModalActiveImageIndex] = useState<number>(0);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);


    // 1) Load dealer partner ID
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            setError(null);
            setDealerPartnerId(null);
            try {
                const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
                if (sessionErr || !session?.user) throw new Error('Not authenticated.');

                const { data: partnerData, error: partnerErr } = await supabase
                    .from('dealer_partners')
                    .select('id')
                    .eq('dealer_user_id', session.user.id)
                    .single();

                if (partnerErr) throw new Error('Dealer profile not found or multiple profiles exist.');
                if (!partnerData) throw new Error('Dealer profile data is missing.');

                setDealerPartnerId(partnerData.id);

            } catch (err: any) {
                setError(err.message || 'An error occurred loading dealer information.');
                console.error("Error loading initial data:", err);
                setDealerPartnerId(null);
                setLoading(false);
            }
        };
        loadInitialData();
    }, [supabase]);

    // 2) Fetch listings when dealerPartnerId is available
    const fetchCars = useCallback(async () => {
        if (!dealerPartnerId) return;
        // setLoading(true); // Already handled by initial load or subsequent actions
        setError(null);
        try {
            const { data, error: listErr } = await supabase
                .from('partner_listings')
                .select('*')
                .eq('partner_id', dealerPartnerId)
                .order('created_at', { ascending: false });

            if (listErr) throw listErr;

            const formattedData: Car[] = (data || []).map(item => ({
                id: item.id,
                vehicle_make: item.vehicle_make || '',
                vehicle_model: item.vehicle_model || '',
                vehicle_year: item.vehicle_year || 0,
                vin: item.vin || null,
                price: item.price === undefined ? null : item.price,
                images: Array.isArray(item.images) ? item.images : [],
                features: Array.isArray(item.features) ? item.features : [],
                status: item.status || 'available',
                mileage: item.mileage,
                listing_type: item.listing_type || 'sale',
                body_type: item.body_type,
                exterior_color: item.exterior_color,
                interior_color: item.interior_color,
                fuel_type: item.fuel_type || 'gasoline',
                transmission: item.transmission || 'automatic',
                condition: item.condition || 'used',
                description: item.description,
                location_city: item.location_city,
                location_country: item.location_country,
                engine: item.engine,
                is_public: item.is_public ?? true,
                is_special_offer: item.is_special_offer ?? false,
                special_offer_label: item.special_offer_label || null,
                created_at: item.created_at,
            }));
            setCars(formattedData);

        } catch (err: any) {
            console.error("Error fetching listings:", err);
            setError(err.message || 'Failed to fetch listings.');
            setCars([]);
        } finally {
            setLoading(false);
        }
    }, [dealerPartnerId, supabase]);

    useEffect(() => {
        if (dealerPartnerId) {
            fetchCars();
        }
    }, [dealerPartnerId, fetchCars]);


    // --- Modal Open/Close Handlers ---
    const openModal = async (mode: 'create' | 'edit' | 'view', car?: Car) => {
        setModalMode(mode);
        setFormErrors({});
        setIsSubmitting(false);
        setModalActiveImageIndex(0);
        setError(null); // Clear modal error on open

        if (mode === 'create') {
            setCurrentCar(null);
            setFormData({ ...initialFormData }); // Reset form
            if (!dealerPartnerId) {
                toast({ title: "Error", description: "Dealer information not loaded.", variant: "destructive" });
                return;
            }
        } else if (car) {
            setCurrentCar(car);
            setFormData({ // Pre-populate
                ...initialFormData,
                ...car,
                vehicle_year: car.vehicle_year ?? undefined,
                price: car.price ?? undefined,
                mileage: car.mileage ?? undefined,
                is_public: car.is_public ?? true,
                is_special_offer: car.is_special_offer ?? false,
                images: car.images || [],
                features: car.features || [],
            });
        } else {
            console.error("Car data is required for view/edit mode but was not provided.");
            toast({ title: "Error", description: "Could not load vehicle data.", variant: "destructive" });
            return;
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setCurrentCar(null);
            setFormData(initialFormData);
            setFormErrors({});
            setError(null);
        }, 300);
    };


    // --- Form Field Handlers ---
    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
            }));
        }
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelectChange = (name: keyof typeof initialFormData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleCheckboxGroupChange = (name: 'features', value: string, checked: boolean | 'indeterminate') => {
        setFormData(prev => {
            const currentValues = (prev[name] as string[] | undefined) || [];
            if (checked === true) {
                return { ...prev, [name]: currentValues.includes(value) ? currentValues : [...currentValues, value] };
            } else {
                return { ...prev, [name]: currentValues.filter(v => v !== value) };
            }
        });
    };

    // --- Image Upload/Remove Handlers ---
    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        if (!dealerPartnerId) {
            toast({ title: "Cannot Upload", description: "Dealer ID is missing.", variant: "destructive" });
            return;
        }
        const files = Array.from(e.target.files);
        const maxFileSize = 10 * 1024 * 1024;
        const validFiles = files.filter(file => file.size <= maxFileSize);
        const oversizedFiles = files.length - validFiles.length;

        if (oversizedFiles > 0) {
            toast({ title: "Upload Warning", description: `${oversizedFiles} file(s) exceed the 10MB size limit and were ignored.`, variant: "destructive" });
        }
        if (validFiles.length === 0) return;

        toast({ title: "Uploading images...", description: `Processing ${validFiles.length} image(s).` });
        setIsSubmitting(true);
        try {
            const folderPath = dealerPartnerId;
            const uploadedUrls: string[] = [];
            for (const file of validFiles) {
                const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50);
                const fileName = `${Date.now()}-${sanitizedName}`;
                const filePath = `${folderPath}/${fileName}`;
                const { error: uploadError } = await supabase.storage
                    .from('vehicle-images')
                    .upload(filePath, file, { cacheControl: '3600', upsert: false });
                if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
                const { data: urlData } = supabase.storage.from('vehicle-images').getPublicUrl(filePath);
                if (!urlData || !urlData.publicUrl) throw new Error(`Could not get public URL for ${file.name}`);
                uploadedUrls.push(urlData.publicUrl);
            }
            setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...uploadedUrls] }));
            toast({ title: "Upload Complete", description: `${validFiles.length} image(s) successfully uploaded.` });
        } catch (err: any) {
            console.error('Image upload error:', err);
            toast({ title: "Upload Failed", description: err.message || "An error occurred during upload.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setFormData(prev => ({ ...prev, images: (prev.images || []).filter((_, index) => index !== indexToRemove) }));
    };

    // --- Form Validation ---
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        const currentYear = new Date().getFullYear();
        if (!formData.vehicle_make?.trim()) errors.vehicle_make = 'Make is required';
        if (!formData.vehicle_model?.trim()) errors.vehicle_model = 'Model is required';
        if (formData.vehicle_year === undefined || formData.vehicle_year <= 1900 || formData.vehicle_year > currentYear + 1) errors.vehicle_year = `Valid Year (1901-${currentYear + 1}) is required`;
        if (formData.price == null || formData.price <= 0) errors.price = 'Valid Price (> 0) is required';
        if (formData.vin && formData.vin.trim().length !== 17) errors.vin = 'VIN must be 17 characters if provided';
        if (formData.mileage == null || formData.mileage < 0) errors.mileage = 'Valid Mileage (>= 0) is required';
        if (!formData.condition) errors.condition = 'Condition is required';
        if (!formData.listing_type) errors.listing_type = 'Listing Type is required';
        if (!formData.fuel_type) errors.fuel_type = 'Fuel Type is required';
        if (!formData.transmission) errors.transmission = 'Transmission is required';
        if (!formData.status) errors.status = 'Status is required';
        if (!formData.images || formData.images.length === 0 || formData.images.every(img => !img.trim())) errors.images = 'At least one valid image URL is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };


    // --- Form Submission (Add/Edit) ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!validateForm()) {
            toast({ title: "Validation Error", description: "Please fix the errors in the form.", variant: "destructive" });
            return;
        }
        if (!dealerPartnerId) {
            toast({ title: "Error", description: "Dealer ID is missing. Cannot save.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);

        // Prepare payload for Supabase
        const payload = {
            vehicle_make: formData.vehicle_make!,
            vehicle_model: formData.vehicle_model!,
            vehicle_year: Number(formData.vehicle_year!),
            price: Number(formData.price!),
            status: formData.status!,
            mileage: formData.mileage ? Number(formData.mileage) : null,
            listing_type: formData.listing_type!,
            body_type: formData.body_type || null,
            exterior_color: formData.exterior_color || null,
            interior_color: formData.interior_color || null,
            fuel_type: formData.fuel_type!,
            transmission: formData.transmission!,
            condition: formData.condition!,
            images: formData.images || [],
            description: formData.description || null,
            features: formData.features || [],
            location_city: formData.location_city || null,
            location_country: formData.location_country || null,
            engine: formData.engine || null,
            vin: formData.vin || null,
            is_public: formData.is_public ?? true,
            is_special_offer: formData.is_special_offer ?? false,
            special_offer_label: formData.is_special_offer ? (formData.special_offer_label || undefined) : undefined,
            partner_id: dealerPartnerId,
        };

        try {
            if (modalMode === 'create') {
                const { error: insertError } = await supabase.from('partner_listings').insert(payload);
                if (insertError) throw insertError; // Throw Supabase error
                toast({ title: 'Success', description: 'Vehicle added successfully.' });
            } else if (modalMode === 'edit' && currentCar) {
                const { error: updateError } = await supabase.from('partner_listings').update(payload).eq('id', currentCar.id).eq('partner_id', dealerPartnerId);
                if (updateError) throw updateError; // Throw Supabase error
                toast({ title: 'Success', description: 'Vehicle updated successfully.' });
            } else {
                throw new Error("Invalid form mode or missing car data for edit.");
            }
            closeModal();
            await fetchCars();
        } catch (err: any) {
            // Improved Error Handling
            console.error(`Error ${modalMode}ing car:`, err); // Log the full error object
            let errorMsg = err.message || `An unknown error occurred while ${modalMode === 'create' ? 'adding' : 'saving'} the car.`;
            // Check for unique constraint violation (Postgres error code 23505)
            if (err.code === '23505' && err.message.includes('vin')) {
                errorMsg = 'This VIN already exists in the inventory. Please enter a unique VIN.';
                setFormErrors(prev => ({ ...prev, vin: errorMsg })); // Set specific form error
            } else if (err.details) {
                errorMsg = `${errorMsg} Details: ${err.details}`; // Add details if available
            } else if (err.hint) {
                errorMsg = `${errorMsg} Hint: ${err.hint}`; // Add hint if available
            }

            setError(errorMsg); // Set error state for potential display in modal
            toast({ title: 'Save Failed', description: errorMsg, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Delete Handler ---
    const handleDelete = async () => {
        if (!currentCar || !dealerPartnerId) {
            toast({ title: "Error", description: "Cannot delete: Missing car data or dealer ID.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const { error: deleteError } = await supabase.from('partner_listings').delete().eq('id', currentCar.id).eq('partner_id', dealerPartnerId);
            if (deleteError) throw deleteError;
            toast({ title: "Success", description: "Vehicle deleted." });
            closeModal();
            await fetchCars();
        } catch (err: any) {
            console.error('Error deleting car:', err);
            const errorMsg = err.message || 'An unknown error occurred while deleting the car.';
            setError(errorMsg);
            toast({ title: 'Delete Failed', description: errorMsg, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Image Gallery Handlers ---
    const nextModalImage = () => {
        if (!currentCar || !currentCar.images || currentCar.images.length <= 1) return;
        setModalActiveImageIndex(prev => (prev + 1) % currentCar.images.length);
    };
    const prevModalImage = () => {
        if (!currentCar || !currentCar.images || currentCar.images.length <= 1) return;
        setModalActiveImageIndex(prev => (prev - 1 + currentCar.images.length) % currentCar.images.length);
    };
    const handleThumbnailClick = (index: number) => {
        setModalActiveImageIndex(index);
    };
    const openImageGallery = (car: Car, index: number) => {
        setCurrentCar(car);
        setSelectedImageIndex(index);
        setIsModalOpen(false);
    };
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedImageIndex === null || !currentCar?.images?.length) return;
            if (e.key === 'ArrowLeft') { setSelectedImageIndex(prev => prev! > 0 ? prev! - 1 : currentCar!.images!.length - 1); }
            else if (e.key === 'ArrowRight') { setSelectedImageIndex(prev => prev! < currentCar!.images!.length - 1 ? prev! + 1 : 0); }
            else if (e.key === 'Escape') { setSelectedImageIndex(null); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIndex, currentCar]);


    // --- Render Logic ---
    if (loading && !dealerPartnerId && !error) { return <p className="text-center text-gray-500 mt-8">Loading dealer information...</p>; }
    if (loading && dealerPartnerId && !cars.length && !error) { return <p className="text-center text-gray-500 mt-8">Loading inventory...</p>; }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Dealer Inventory</h1>
                <Button onClick={() => openModal('create')} disabled={!dealerPartnerId || loading}>
                    <PlusIcon className="mr-2 h-4 w-4" /> Add New Vehicle
                </Button>
            </div>

            {/* Global Error Display */}
            {error && !isModalOpen && (
                <p className="mb-4 text-center text-red-600 bg-red-100 p-3 rounded border border-red-300">
                    Error: {error}
                </p>
            )}

            {/* Loading indicator during fetches */}
            {loading && <p className="text-center text-gray-500 mb-4">Updating inventory...</p>}

            {/* Car Grid */}
            {!loading && cars.length === 0 && !error && (
                <p className="text-center text-gray-500 mt-8">No vehicles found in your inventory. Click "Add New Vehicle" to get started.</p>
            )}
            {!loading && cars.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {cars.map((car, idx) => (
                        <div key={car.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col bg-white" onClick={() => openModal('view', car)}>
                            <div className="relative w-full h-48 bg-gray-200">
                                {car.images && car.images.length > 0 && car.images[0] ? (
                                    <Image src={car.images[0]} alt={`${car.vehicle_make} ${car.vehicle_model}`} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={idx < 4} onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image'; }} />
                                ) : (<div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>)}
                            </div>
                            <div className="p-4 flex flex-col flex-grow justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold truncate" title={`${car.vehicle_make} ${car.vehicle_model}`}>{car.vehicle_make} {car.vehicle_model}</h2>
                                    <p className="text-sm text-gray-600">{car.vehicle_year}</p>
                                </div>
                                <p className="text-lg font-bold mt-2 text-right">{formatPrice(car.price)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- Main View/Edit/Create Modal --- */}
            <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="max-w-4xl w-full max-h-[95vh] overflow-y-auto p-0">
                    <DialogHeader className="sr-only"> {/* Hidden for screen readers */}
                        <DialogTitle>{modalMode === 'create' ? 'Add New Vehicle' : modalMode === 'edit' ? `Edit Vehicle` : 'View Vehicle Details'}</DialogTitle>
                        <DialogDescription>{modalMode === 'create' ? 'Fill in the details for the new vehicle.' : modalMode === 'edit' ? `Editing vehicle details.` : `Viewing details for the selected vehicle.`}</DialogDescription>
                    </DialogHeader>
                    <div className="sticky top-0 bg-white px-6 py-4 border-b z-10 flex justify-between items-center"> {/* Visible Header */}
                        <h2 className="text-xl font-semibold text-gray-800">{modalMode === 'create' ? 'Add New Vehicle' : modalMode === 'edit' ? 'Edit Vehicle' : 'View Vehicle Details'}</h2>
                        <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full"><XMarkIcon className="h-5 w-5" /></Button>
                    </div>
                    <div className="p-6">
                        {/* VIEW MODE */}
                        {modalMode === 'view' && currentCar && (<div className="space-y-6"> {/* ... View Mode Content ... */} </div>)}
                        {/* CREATE/EDIT MODE */}
                        {(modalMode === 'create' || modalMode === 'edit') && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (<p className="text-sm text-red-600 bg-red-100 p-2 rounded border border-red-300">Error: {error}</p>)}
                                <section> {/* Basic Info */}
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div><Label htmlFor="vehicle_make">Make*</Label><Input id="vehicle_make" name="vehicle_make" value={formData.vehicle_make || ''} onChange={handleFormChange} placeholder="e.g., Toyota" className={formErrors.vehicle_make ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.vehicle_make}</p></div>
                                        <div><Label htmlFor="vehicle_model">Model*</Label><Input id="vehicle_model" name="vehicle_model" value={formData.vehicle_model || ''} onChange={handleFormChange} placeholder="e.g., Camry" className={formErrors.vehicle_model ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.vehicle_model}</p></div>
                                        <div><Label htmlFor="vehicle_year">Year*</Label><Input id="vehicle_year" name="vehicle_year" type="number" value={formData.vehicle_year ?? ''} onChange={handleFormChange} placeholder="e.g., 2021" className={formErrors.vehicle_year ? 'border-red-500' : ''} min="1901" max={new Date().getFullYear() + 1} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.vehicle_year}</p></div>
                                        <div><Label htmlFor="price">Price*</Label><Input id="price" name="price" type="number" step="0.01" value={formData.price ?? ''} onChange={handleFormChange} placeholder="e.g., 25000" className={formErrors.price ? 'border-red-500' : ''} min="1" /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.price}</p></div>
                                        <div><Label htmlFor="mileage">Mileage*</Label><Input id="mileage" name="mileage" type="number" value={formData.mileage ?? ''} onChange={handleFormChange} placeholder="e.g., 30000" className={formErrors.mileage ? 'border-red-500' : ''} min="0" /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.mileage}</p></div>
                                        <div><Label htmlFor="vin">VIN</Label><Input id="vin" name="vin" value={formData.vin || ''} onChange={handleFormChange} placeholder="17 Character VIN" className={formErrors.vin ? 'border-red-500' : ''} minLength={17} maxLength={17} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.vin}</p></div>
                                        <div>
                                            <Label htmlFor="condition">Condition*</Label>
                                            <Select name="condition" value={formData.condition || ''} onValueChange={(value) => handleSelectChange('condition', value)}>
                                                <SelectTrigger className={formErrors.condition ? 'border-red-500' : ''}><SelectValue placeholder="Select condition" /></SelectTrigger>
                                                <SelectContent>{AVAILABLE_CONDITIONS.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
                                            </Select><p className="text-red-500 text-xs mt-1 h-4">{formErrors.condition}</p>
                                        </div>
                                        <div>
                                            <Label htmlFor="status">Listing Status*</Label>
                                            <Select name="status" value={formData.status || ''} onValueChange={(value) => handleSelectChange('status', value)}>
                                                <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}><SelectValue placeholder="Select status" /></SelectTrigger>
                                                <SelectContent>{AVAILABLE_STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                                            </Select><p className="text-red-500 text-xs mt-1 h-4">{formErrors.status}</p>
                                        </div>
                                        <div>
                                            <Label htmlFor="listing_type">Listing Type*</Label>
                                            <Select name="listing_type" value={formData.listing_type || ''} onValueChange={(value) => handleSelectChange('listing_type', value)}>
                                                <SelectTrigger className={formErrors.listing_type ? 'border-red-500' : ''}><SelectValue placeholder="Select type" /></SelectTrigger>
                                                <SelectContent>{AVAILABLE_LISTING_TYPES.map(lt => <SelectItem key={lt} value={lt}>{lt.charAt(0).toUpperCase() + lt.slice(1)}</SelectItem>)}</SelectContent>
                                            </Select><p className="text-red-500 text-xs mt-1 h-4">{formErrors.listing_type}</p>
                                        </div>
                                    </div>
                                </section>
                                <section> {/* Specifications */}
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Specifications</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div><Label htmlFor="body_type">Body Type</Label><Input id="body_type" name="body_type" value={formData.body_type || ''} onChange={handleFormChange} placeholder="e.g., Sedan, SUV" className={formErrors.body_type ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.body_type}</p></div>
                                        <div><Label htmlFor="exterior_color">Exterior Color</Label><Input id="exterior_color" name="exterior_color" value={formData.exterior_color || ''} onChange={handleFormChange} placeholder="e.g., Midnight Black" className={formErrors.exterior_color ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.exterior_color}</p></div>
                                        <div><Label htmlFor="interior_color">Interior Color</Label><Input id="interior_color" name="interior_color" value={formData.interior_color || ''} onChange={handleFormChange} placeholder="e.g., Charcoal Gray" className={formErrors.interior_color ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.interior_color}</p></div>
                                        <div><Label htmlFor="engine">Engine</Label><Input id="engine" name="engine" value={formData.engine || ''} onChange={handleFormChange} placeholder="e.g., 2.0L Turbo" className={formErrors.engine ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.engine}</p></div>
                                        <div>
                                            <Label htmlFor="fuel_type">Fuel Type*</Label>
                                            <Select name="fuel_type" value={formData.fuel_type || ''} onValueChange={(value) => handleSelectChange('fuel_type', value)}>
                                                <SelectTrigger className={formErrors.fuel_type ? 'border-red-500' : ''}><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                                                <SelectContent>{AVAILABLE_FUEL_TYPES.map(ft => <SelectItem key={ft} value={ft}>{ft.charAt(0).toUpperCase() + ft.slice(1)}</SelectItem>)}</SelectContent>
                                            </Select><p className="text-red-500 text-xs mt-1 h-4">{formErrors.fuel_type}</p>
                                        </div>
                                        <div>
                                            <Label htmlFor="transmission">Transmission*</Label>
                                            <Select name="transmission" value={formData.transmission || ''} onValueChange={(value) => handleSelectChange('transmission', value)}>
                                                <SelectTrigger className={formErrors.transmission ? 'border-red-500' : ''}><SelectValue placeholder="Select transmission" /></SelectTrigger>
                                                <SelectContent>{AVAILABLE_TRANSMISSIONS.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                                            </Select><p className="text-red-500 text-xs mt-1 h-4">{formErrors.transmission}</p>
                                        </div>
                                    </div>
                                </section>
                                <section> {/* Location */}
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Location</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div><Label htmlFor="location_city">City</Label><Input id="location_city" name="location_city" value={formData.location_city || ''} onChange={handleFormChange} placeholder="City where vehicle is located" className={formErrors.location_city ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.location_city}</p></div>
                                        <div><Label htmlFor="location_country">Country</Label><Input id="location_country" name="location_country" value={formData.location_country || ''} onChange={handleFormChange} placeholder="Country (e.g., USA)" className={formErrors.location_country ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.location_country}</p></div>
                                    </div>
                                </section>
                                <section> {/* Description & Features */}
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Description & Features</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea id="description" name="description" value={formData.description || ''} onChange={handleFormChange} placeholder="Detailed description of the vehicle..." rows={5} className={formErrors.description ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.description}</p>
                                        </div>
                                        <div>
                                            <Label>Features</Label>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1 p-3 border rounded-md max-h-48 overflow-y-auto">
                                                {AVAILABLE_FEATURES.map((feature) => (
                                                    <div key={feature} className="flex items-center space-x-2">
                                                        <Checkbox id={`feature-${feature}`} checked={formData.features?.includes(feature)} onCheckedChange={(checked) => handleCheckboxGroupChange('features', feature, checked)} />
                                                        <Label htmlFor={`feature-${feature}`} className="text-sm font-normal cursor-pointer">{feature}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                <section> {/* Marketing Options */}
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Marketing Options</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="is_public" name="is_public" checked={formData.is_public ?? true} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked === true }))} />
                                                <Label htmlFor="is_public" className="text-sm font-medium leading-none cursor-pointer">Make this listing public</Label>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                <section> {/* Special Offer */}
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Special Offer</h3>
                                    <div className="flex flex-col space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="is_special_offer" name="is_special_offer" checked={formData.is_special_offer ?? false} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_special_offer: checked === true }))} />
                                            <Label htmlFor="is_special_offer" className="text-sm font-medium leading-none cursor-pointer">Mark as Special Offer</Label>
                                        </div>
                                        {formData.is_special_offer && (
                                            <div className="ml-6 mt-2">
                                                <Label htmlFor="special_offer_label">Special Offer Label</Label>
                                                <Input id="special_offer_label" name="special_offer_label" value={formData.special_offer_label || ''} onChange={handleFormChange} placeholder="e.g., Hot Deal, Price Drop" className={formErrors.special_offer_label ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.special_offer_label}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                                <section> {/* Images */}
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Images*</h3>
                                    <Label htmlFor="vehicle-image-upload" className="block text-sm font-medium text-gray-700 mb-2">Upload New Images (Max 10MB each)</Label>
                                    <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition ${formErrors.images ? 'border-red-500' : 'border-gray-300'}`}>
                                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="vehicle-image-upload" disabled={isSubmitting} />
                                        <label htmlFor="vehicle-image-upload" className={`cursor-pointer flex flex-col items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-600">Drag & drop or click to select</p>
                                        </label>
                                    </div>
                                    <p className="text-red-500 text-xs mt-1 h-4">{formErrors.images}</p>
                                    {(formData.images?.length ?? 0) > 0 && (
                                        <div className="mt-4">
                                            <Label className="block text-sm font-medium text-gray-700 mb-2">Current Images ({formData.images?.length})</Label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                {formData.images?.map((url, index) => (url && (<div key={url || index} className="relative border rounded overflow-hidden group aspect-video bg-gray-100"><img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x100?text=Error'; }} /><button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700" aria-label={`Remove image ${index + 1}`} disabled={isSubmitting}><XMarkIcon className="h-3 w-3" /></button></div>)))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                                <div className="flex justify-end space-x-3 pt-5 border-t mt-6"> {/* Actions */}
                                    <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting || !dealerPartnerId}>{isSubmitting ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" /> : null}{modalMode === 'create' ? 'Add Vehicle' : 'Save Changes'}</Button>
                                </div>
                            </form>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- Enhanced Image Gallery Dialog --- */}
            <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
                <DialogContent className="max-w-6xl w-full p-0 bg-black/90 border-0 overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Image Gallery</DialogTitle>
                        <DialogDescription>Viewing image {selectedImageIndex !== null ? selectedImageIndex + 1 : ''} of {currentCar?.images?.length || 0}</DialogDescription>
                    </DialogHeader>
                    <div className="relative w-full h-[90vh] flex items-center justify-center">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full" onClick={() => setSelectedImageIndex(null)}> <XMarkIcon className="h-6 w-6" /> </Button>
                        {(currentCar?.images?.length ?? 0) > 1 && (<Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full p-2" onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => prev! > 0 ? prev! - 1 : currentCar!.images!.length - 1); }} aria-label="Previous image"> <ArrowLeftIcon className="h-6 w-6" /> </Button>)}
                        {(currentCar?.images?.length ?? 0) > 1 && (<Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full p-2" onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => prev! < currentCar!.images!.length - 1 ? prev! + 1 : 0); }} aria-label="Next image"> <ArrowRightIcon className="h-6 w-6" /> </Button>)}
                        {selectedImageIndex !== null && (currentCar?.images?.length ?? 0) > 1 && (<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-50">{selectedImageIndex + 1} / {currentCar!.images!.length}</div>)}
                        {selectedImageIndex !== null && currentCar?.images?.[selectedImageIndex] && (<img src={currentCar.images[selectedImageIndex]} alt={`${currentCar.vehicle_make} ${currentCar.vehicle_model} - Image ${selectedImageIndex + 1}`} className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />)}
                        {selectedImageIndex !== null && !currentCar?.images?.[selectedImageIndex] && (<div className="text-white text-center p-4">Image not available</div>)}
                    </div>
                </DialogContent>
            </Dialog>

        </div> // End container
    );
}