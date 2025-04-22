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
import { Badge } from "@/components/ui/badge"; // Import Badge

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
    MapPinIcon, // For Card Location
    TagIcon,      // For Card Listing Type
    ClockIcon,    // For Card Mileage
    CheckCircleIcon, // Could use for Approved status icon
    XCircleIcon,     // Could use for Rejected status icon
    ClockIcon as PendingIcon, // Reusing Clock for Pending status icon
} from '@heroicons/react/24/outline';

// --- Define the Car type based on partner_listings ---
type ApprovalStatus = 'pending' | 'approved' | 'rejected'; // Define type alias

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
    approval_status: ApprovalStatus; // <--- Added approval_status
    created_at?: string;
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
    approval_status: 'pending', // Default for form if needed, though not editable here
};


// Helper component for displaying details in View Mode (remains unchanged)
function DetailItem({ label, value }: { label: string; value: string | number | boolean | undefined | null }) {
    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value ?? 'N/A');
    return (
        <div>
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{displayValue}</dd>
        </div>
    );
}

// Helper function to format currency (remains unchanged)
const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined) {
        return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'CHF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

// --- NEW HELPER FUNCTIONS ---
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
// --- END NEW HELPER FUNCTIONS ---


// Define available options for Select components
const AVAILABLE_FEATURES = [
    // Driving Systems & Controls
    '360° Camera', 'ABS', 'Adaptive Cruise Control', 'Cruise Control', 'Lane Departure Warning System',
    'Parking Assistance', 'Rear Parking Sensors', 'Front Parking Sensors', 'Reversing Camera',
    'Stability Control (ESP)', 'Emergency Braking Assistant', 'Brake Assist', 'Differential Lock',

    // Comfort & Interior
    'Air Conditioning', 'Automatic Air Conditioning', 'Manual Air Conditioning', 'Auxiliary Heating',
    'Preheater', 'Heated Seats', 'Ventilated Seats', 'Electric Windows', 'Electric Tailgate',
    'Electric Seat Adjustment', 'Keyless Entry/Start', 'Luggage Compartment', 'Sports Seats',
    'Back Support Protection', 'Isofix', 'Start-Stop System',

    // Entertainment & Technology
    'Android Auto', 'Apple CarPlay', 'Bluetooth Interface', 'DAB Radio', 'Head-Up Display',
    'Navigation System', 'Basic Navigation', 'Portable Navigation System', 'Speakers',

    // Exterior Features
    'Adaptive Headlights', 'LED Headlights', 'Xenon Headlights', 'Laser Headlights',
    'Aluminum Rims', 'Chrome Package', 'Custom Exhaust System', 'Gullwing Doors',
    'Hardtop', 'Panoramic Roof', 'Sunroof', 'Roof Rack', 'Sliding Door', 'Special Paint',
    'Running Board', 'Reinforced Suspension',

    // Trailer & Accessories
    'Trailer Hitch', 'Detachable Trailer Hitch', 'Fixed Trailer Hitch', 'Swiveling Trailer Hitch',

    // Security & Protection
    'Alarm System', 'Anti-Theft Alarm System',

    // EV Specific
    'Fast Charging',

    // Other
    'Additional Instruments', 'Air Suspension',
];

// Separate seat cover options for hierarchical display
const SEAT_COVER_OPTIONS = ['Alcantara', 'Leather', 'Fabric Seats', 'Partial Leather Seats'];

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


    // 1) Load dealer partner ID (remains unchanged)
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
        setLoading(true);
        setError(null);
        try {
            // Select all columns including approval_status
            const { data, error: listErr } = await supabase
                .from('partner_listings')
                .select('*') // Ensure approval_status is selected (or list explicitly)
                .eq('partner_id', dealerPartnerId)
                .order('created_at', { ascending: false });

            if (listErr) throw listErr;

            // Map data to the Car interface, providing defaults
            const formattedData: Car[] = (data || []).map(item => ({
                id: item.id,
                vehicle_make: item.vehicle_make || '',
                vehicle_model: item.vehicle_model || '',
                vehicle_year: item.vehicle_year || 0,
                vin: item.vin || null,
                price: item.price === undefined ? null : item.price,
                images: Array.isArray(item.images) ? item.images.filter(Boolean) : [],
                features: Array.isArray(item.features) ? item.features.filter(Boolean) : [],
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
                approval_status: item.approval_status ?? 'pending', // <--- Map approval_status, default to pending
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

    // Effect to fetch cars when dealerPartnerId changes (remains unchanged)
    useEffect(() => {
        if (dealerPartnerId) {
            fetchCars();
        } else {
            setCars([]);
            setLoading(false);
        }
    }, [dealerPartnerId, fetchCars]);


    // --- Modal Open/Close Handlers (remains unchanged) ---
    const openModal = async (mode: 'create' | 'edit' | 'view', car?: Car) => {
        setModalMode(mode);
        setFormErrors({});
        setIsSubmitting(false);
        setModalActiveImageIndex(0);
        setError(null);

        if (mode === 'create') {
            setCurrentCar(null);
            setFormData({ ...initialFormData });
            if (!dealerPartnerId) {
                toast({ title: "Error", description: "Dealer information not loaded. Cannot add vehicle.", variant: "destructive" });
                return;
            }
        } else if (car) {
            setCurrentCar(car);
            setFormData({
                ...initialFormData,
                ...car,
                vehicle_year: car.vehicle_year ?? undefined,
                price: car.price ?? undefined,
                mileage: car.mileage ?? undefined,
                is_public: car.is_public ?? true,
                is_special_offer: car.is_special_offer ?? false,
                images: car.images || [],
                features: car.features || [],
                // No need to set approval_status in formData unless it becomes editable
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
            setModalActiveImageIndex(0);
        }, 300);
    };


    // --- Form Field Handlers (remains unchanged) ---
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

    // --- Image Upload/Remove Handlers (remains unchanged) ---
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

    // --- Form Validation (remains unchanged) ---
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        const currentYear = new Date().getFullYear();

        if (!formData.vehicle_make?.trim()) errors.vehicle_make = 'Make is required';
        if (!formData.vehicle_model?.trim()) errors.vehicle_model = 'Model is required';
        if (formData.vehicle_year === undefined || formData.vehicle_year <= 1900 || formData.vehicle_year > currentYear + 1) errors.vehicle_year = `Valid Year (1901-${currentYear + 1}) is required`;
        if (formData.price == null || formData.price <= 0) errors.price = 'Valid Price (> 0) is required';
        if (formData.mileage == null || formData.mileage < 0) errors.mileage = 'Valid Mileage (>= 0) is required';
        if (!formData.condition) errors.condition = 'Condition is required';
        if (!formData.listing_type) errors.listing_type = 'Listing Type is required';
        if (!formData.fuel_type) errors.fuel_type = 'Fuel Type is required';
        if (!formData.transmission) errors.transmission = 'Transmission is required';
        if (!formData.status) errors.status = 'Status is required';
        if (!formData.images || formData.images.length === 0 || formData.images.every(img => !img?.trim())) {
            errors.images = 'At least one valid image is required';
        }
        if (formData.vin && formData.vin.trim().length !== 17) errors.vin = 'VIN must be 17 characters if provided';
        if (formData.is_special_offer && !formData.special_offer_label?.trim()) errors.special_offer_label = 'Label is required for special offers';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };


    // --- Form Submission (Add/Edit) - No change needed here for status display ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            toast({ title: "Validation Error", description: "Please fix the errors highlighted in the form.", variant: "destructive" });
            const firstErrorField = Object.keys(formErrors).find(key => formErrors[key]);
            if (firstErrorField) {
                const inputElement = document.getElementById(firstErrorField);
                inputElement?.focus();
            }
            return;
        }

        if (!dealerPartnerId) {
            toast({ title: "Error", description: "Dealer ID is missing. Cannot save.", variant: "destructive" });
            setError("Dealer ID is missing. Cannot save.");
            return;
        }

        setIsSubmitting(true);

        // Payload does not include approval_status as it's not set by the dealer
        const payload = {
            partner_id: dealerPartnerId,
            vehicle_make: formData.vehicle_make!,
            vehicle_model: formData.vehicle_model!,
            vehicle_year: Number(formData.vehicle_year!),
            price: Number(formData.price!),
            status: formData.status!,
            mileage: formData.mileage != null ? Number(formData.mileage) : null,
            listing_type: formData.listing_type!,
            body_type: formData.body_type?.trim() || null,
            exterior_color: formData.exterior_color?.trim() || null,
            interior_color: formData.interior_color?.trim() || null,
            fuel_type: formData.fuel_type!,
            transmission: formData.transmission!,
            condition: formData.condition!,
            images: formData.images?.filter(Boolean) || [],
            description: formData.description?.trim() || null,
            features: formData.features?.filter(Boolean) || [],
            location_city: formData.location_city?.trim() || null,
            location_country: formData.location_country?.trim() || null,
            engine: formData.engine?.trim() || null,
            vin: formData.vin?.trim() || null,
            is_public: formData.is_public ?? true,
            is_special_offer: formData.is_special_offer ?? false,
            special_offer_label: formData.is_special_offer ? (formData.special_offer_label?.trim() || null) : null,
            // approval_status is set by default in DB or by admin, not included here
        };

        try {
            if (modalMode === 'create') {
                // Insert will use the default 'pending' status from the DB
                const { error: insertError } = await supabase.from('partner_listings').insert(payload);
                if (insertError) throw insertError;
                toast({ title: 'Success', description: 'Vehicle added successfully. Awaiting approval.' });
            } else if (modalMode === 'edit' && currentCar) {
                const { error: updateError } = await supabase
                    .from('partner_listings')
                    .update(payload) // Update doesn't change approval_status here
                    .eq('id', currentCar.id)
                    .eq('partner_id', dealerPartnerId);
                if (updateError) throw updateError;
                toast({ title: 'Success', description: 'Vehicle updated successfully.' });
                // Note: Editing might reset the status to 'pending' depending on business rules (handled by admin logic later)
            } else {
                throw new Error("Invalid form mode or missing car data for edit.");
            }

            closeModal();
            await fetchCars();

        } catch (err: any) {
            console.error(`Error ${modalMode}ing car:`, err);
            let errorMsg = err.message || `An unknown error occurred while ${modalMode === 'create' ? 'adding' : 'saving'} the car.`;

            if (err.code === '23505' && err.message.includes('vin')) {
                errorMsg = 'This VIN already exists in the inventory. Please enter a unique VIN.';
                setFormErrors(prev => ({ ...prev, vin: errorMsg }));
            } else if (err.details) {
                errorMsg = `${errorMsg} Details: ${err.details}`;
            } else if (err.hint) {
                errorMsg = `${errorMsg} Hint: ${err.hint}`;
            }

            setError(errorMsg);
            toast({ title: 'Save Failed', description: errorMsg, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Delete Handler (remains unchanged) ---
    const handleDelete = async () => {
        if (!currentCar || !dealerPartnerId) {
            toast({ title: "Error", description: "Cannot delete: Missing car data or dealer ID.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const { error: deleteError } = await supabase
                .from('partner_listings')
                .delete()
                .eq('id', currentCar.id)
                .eq('partner_id', dealerPartnerId);
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

    // --- Image Gallery Handlers (remains unchanged) ---
    const nextModalImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (!currentCar || !currentCar.images || currentCar.images.length <= 1) return;
        setModalActiveImageIndex(prev => (prev + 1) % currentCar.images.length);
    };
    const prevModalImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (!currentCar || !currentCar.images || currentCar.images.length <= 1) return;
        setModalActiveImageIndex(prev => (prev - 1 + currentCar.images.length) % currentCar.images.length);
    };
    const openImageGallery = (car: Car, index: number) => {
        setCurrentCar(car);
        setSelectedImageIndex(index);
    };
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedImageIndex === null || !currentCar?.images?.length) return;
            if (e.key === 'ArrowLeft') {
                setSelectedImageIndex(prev => (prev! > 0 ? prev! - 1 : currentCar!.images!.length - 1));
            } else if (e.key === 'ArrowRight') {
                setSelectedImageIndex(prev => (prev! < currentCar!.images!.length - 1 ? prev! + 1 : 0));
            } else if (e.key === 'Escape') {
                setSelectedImageIndex(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIndex, currentCar]);


    // --- Render Logic ---
    if (loading && !dealerPartnerId && !error) {
        return <p className="text-center text-gray-500 mt-8">Loading dealer information...</p>;
    }
    if (loading && dealerPartnerId && !error) {
        return <p className="text-center text-gray-500 mt-8">Loading inventory...</p>;
    }

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
            {!loading && !dealerPartnerId && error && (
                <p className="mb-4 text-center text-red-600 bg-red-100 p-3 rounded border border-red-300">
                    Failed to load dealer information. Please try refreshing. ({error})
                </p>
            )}


            {/* Car Grid */}
            {!loading && dealerPartnerId && cars.length === 0 && !error && (
                <p className="text-center text-gray-500 mt-8">No vehicles found in your inventory. Click "Add New Vehicle" to get started.</p>
            )}
            {!loading && dealerPartnerId && cars.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {cars.map((car, idx) => (
                        <div
                            key={car.id}
                            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col bg-white"
                            onClick={() => openModal('view', car)}
                        >
                            {/* Image Section */}
                            <div className="relative w-full h-48 bg-gray-200">
                                {car.images && car.images.length > 0 && car.images[0] ? (
                                    <Image
                                        src={car.images[0]}
                                        alt={`${car.vehicle_make} ${car.vehicle_model}`}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        priority={idx < 4}
                                        onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500"><PhotoIcon className="h-12 w-12 text-gray-400" /></div>
                                )}
                                {/* Approval Status Badge on Card */}
                                <Badge className={`absolute top-2 right-2 text-xs ${getApprovalStatusBadgeClasses(car.approval_status)}`}>
                                    {capitalizeFirstLetter(car.approval_status)}
                                </Badge>
                            </div>
                            {/* Content Section */}
                            <div className="p-4 flex flex-col flex-grow justify-between">
                                {/* Top section with details */}
                                <div>
                                    {/* Make, Model, Year */}
                                    <h2 className="text-lg font-semibold truncate" title={`${car.vehicle_make} ${car.vehicle_model}`}>{car.vehicle_make} {car.vehicle_model}</h2>
                                    <p className="text-sm text-gray-600 mb-1">{car.vehicle_year}</p>

                                    {/* Mileage & Listing Type */}
                                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                                        {car.mileage != null && (
                                            <div className="flex items-center">
                                                <ClockIcon className="h-3 w-3 mr-1.5 text-gray-400" />
                                                <span>{car.mileage.toLocaleString()} km</span>
                                            </div>
                                        )}
                                        {car.listing_type && (
                                            <div className="flex items-center">
                                                <TagIcon className="h-3 w-3 mr-1.5 text-gray-400" />
                                                <span>{capitalizeFirstLetter(car.listing_type)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <hr className="my-2 border-gray-100" />

                                    {/* Location */}
                                    <div className="text-xs text-gray-500">
                                        {(car.location_city || car.location_country) ? (
                                            <div className="flex items-center">
                                                <MapPinIcon className="h-3 w-3 mr-1.5 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">
                                                    {car.location_city && car.location_country
                                                        ? `${car.location_city}, ${car.location_country}`
                                                        : car.location_city || car.location_country}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center">
                                                <MapPinIcon className="h-3 w-3 mr-1.5 text-gray-400 flex-shrink-0" />
                                                <span>Location N/A</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Bottom section with Price */}
                                <div className="mt-3 text-right">
                                    <p className="text-lg font-bold">{formatPrice(car.price)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- Main View/Edit/Create Modal --- */}
            <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="max-w-4xl w-full max-h-[95vh] overflow-y-auto p-0">
                    {/* Header */}
                    <div className="sticky top-0 bg-white px-6 py-4 border-b z-10 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {modalMode === 'create' ? 'Add New Vehicle' :
                                modalMode === 'edit' ? `Edit ${currentCar?.vehicle_make || ''} ${currentCar?.vehicle_model || 'Vehicle'}` :
                                    `View ${currentCar?.vehicle_make || ''} ${currentCar?.vehicle_model || 'Vehicle'}`}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full">
                            <XMarkIcon className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Content Area */}
                    <div className="p-6">
                        {/* --- VIEW MODE --- */}
                        {modalMode === 'view' && currentCar && (
                            <div className="space-y-6">
                                {/* Image Gallery (Unchanged) */}
                                <div>
                                    <h3 className="text-md font-semibold text-gray-700 mb-2">Images</h3>
                                    {(currentCar.images?.length ?? 0) > 0 ? (
                                        <div className="relative h-64 md:h-80 lg:h-96 bg-gray-100 overflow-hidden rounded-lg group border">
                                            <img
                                                key={currentCar.images[modalActiveImageIndex] || modalActiveImageIndex}
                                                src={currentCar.images[modalActiveImageIndex]}
                                                alt={`${currentCar.vehicle_make} ${currentCar.vehicle_model} - view ${modalActiveImageIndex + 1}`}
                                                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                                                onClick={() => openImageGallery(currentCar, modalActiveImageIndex)}
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Error'; }}
                                            />
                                            {(currentCar.images?.length ?? 0) > 1 && (
                                                <>
                                                    <button onClick={prevModalImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/60" aria-label="Previous"><ArrowLeftIcon className="h-5 w-5" /></button>
                                                    <button onClick={nextModalImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/60" aria-label="Next"><ArrowRightIcon className="h-5 w-5" /></button>
                                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5">
                                                        {currentCar.images?.map((_, index) => (<button key={index} onClick={(e) => { e.stopPropagation(); setModalActiveImageIndex(index); }} className={`w-2 h-2 rounded-full transition-colors ${(modalActiveImageIndex === index ? 'bg-white ring-1 ring-offset-1 ring-offset-black/30 ring-white' : 'bg-white/50')}`} aria-label={`Go to image ${index + 1}`} />))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (<div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 border"><PhotoIcon className="h-12 w-12" /></div>)}
                                </div>

                                {/* Basic Details Section */}
                                <div>
                                    <h3 className="text-md font-semibold text-gray-700 mb-3">Vehicle Details</h3>
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
                                        <DetailItem label="Make" value={currentCar.vehicle_make} />
                                        <DetailItem label="Model" value={currentCar.vehicle_model} />
                                        <DetailItem label="Year" value={currentCar.vehicle_year} />
                                        <DetailItem label="Price" value={formatPrice(currentCar.price)} />
                                        <DetailItem label="Listing Status" value={currentCar.status ? capitalizeFirstLetter(currentCar.status) : 'N/A'} /> {/* Changed label */}
                                        {/* --- Approval Status using <dt>/<dd> --- */}
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Approval Status</dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                <Badge className={`text-xs ${getApprovalStatusBadgeClasses(currentCar.approval_status)}`}>
                                                    {capitalizeFirstLetter(currentCar.approval_status)}
                                                </Badge>
                                            </dd>
                                        </div>
                                        {/* --- End Approval Status --- */}
                                        <DetailItem label="Mileage" value={currentCar.mileage != null ? `${currentCar.mileage.toLocaleString()} km` : 'N/A'} />
                                        <DetailItem label="Listing Type" value={currentCar.listing_type ? capitalizeFirstLetter(currentCar.listing_type) : 'N/A'} />
                                        <DetailItem label="Body Type" value={currentCar.body_type} />
                                        <DetailItem label="Exterior Color" value={currentCar.exterior_color} />
                                        <DetailItem label="Interior Color" value={currentCar.interior_color} />
                                        <DetailItem label="Fuel Type" value={currentCar.fuel_type ? capitalizeFirstLetter(currentCar.fuel_type) : 'N/A'} />
                                        <DetailItem label="Transmission" value={currentCar.transmission ? capitalizeFirstLetter(currentCar.transmission) : 'N/A'} />
                                        <DetailItem label="Condition" value={currentCar.condition ? capitalizeFirstLetter(currentCar.condition) : 'N/A'} />
                                        <DetailItem label="Engine" value={currentCar.engine} />
                                        <DetailItem label="VIN" value={currentCar.vin} />
                                        <DetailItem label="Location" value={currentCar.location_city && currentCar.location_country ? `${currentCar.location_city}, ${currentCar.location_country}` : currentCar.location_city || currentCar.location_country || 'N/A'} />
                                    </dl>
                                </div>

                                {/* Description Section (Unchanged) */}
                                {currentCar.description && (<div> <h3 className="text-md font-semibold text-gray-700">Description</h3> <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{currentCar.description}</p> </div>)}

                                {/* Features Section (Unchanged) */}
                                <div>
                                    <h3 className="text-md font-semibold text-gray-700">Features</h3>
                                    {(currentCar.features?.length ?? 0) > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-2"> {currentCar.features?.map((feature, index) => (<span key={feature || index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border">{feature}</span>))} </div>
                                    ) : (<p className="mt-2 text-sm text-gray-500">No features listed.</p>)}
                                </div>

                                {/* Special Offer Details (Unchanged) */}
                                {currentCar.is_special_offer && (
                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                        <h4 className="text-md font-semibold text-orange-800">Special Offer</h4>
                                        {currentCar.special_offer_label && (<span className="mt-1 inline-block bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-medium"> {currentCar.special_offer_label} </span>)}
                                        {!currentCar.special_offer_label && (<p className="mt-1 text-sm text-orange-700">This vehicle is marked as a special offer.</p>)}
                                    </div>
                                )}

                                {/* Actions (Unchanged) */}
                                <div className="flex justify-end space-x-3 pt-5 border-t mt-6">
                                    <Button variant="outline" onClick={closeModal}>Close</Button>
                                    <Button onClick={() => openModal('edit', currentCar)}><PencilIcon className="h-4 w-4 mr-2" /> Edit Vehicle</Button>
                                </div>
                            </div>
                        )}

                        {/* --- CREATE/EDIT MODE (remains unchanged) --- */}
                        {(modalMode === 'create' || modalMode === 'edit') && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (<p className="text-sm text-red-600 bg-red-100 p-2 rounded border border-red-300">Error: {error}</p>)}
                                {/* Basic Info */}
                                <section> <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Basic Information</h3> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> <div><Label htmlFor="vehicle_make">Make*</Label><Input id="vehicle_make" name="vehicle_make" value={formData.vehicle_make || ''} onChange={handleFormChange} placeholder="e.g., Toyota" className={formErrors.vehicle_make ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.vehicle_make}</p></div> <div><Label htmlFor="vehicle_model">Model*</Label><Input id="vehicle_model" name="vehicle_model" value={formData.vehicle_model || ''} onChange={handleFormChange} placeholder="e.g., Camry" className={formErrors.vehicle_model ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.vehicle_model}</p></div> <div><Label htmlFor="vehicle_year">Year*</Label><Input id="vehicle_year" name="vehicle_year" type="number" value={formData.vehicle_year ?? ''} onChange={handleFormChange} placeholder="e.g., 2021" className={formErrors.vehicle_year ? 'border-red-500' : ''} min="1901" max={new Date().getFullYear() + 1} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.vehicle_year}</p></div> <div><Label htmlFor="price">Price*</Label><Input id="price" name="price" type="number" step="0.01" value={formData.price ?? ''} onChange={handleFormChange} placeholder="e.g., 25000" className={formErrors.price ? 'border-red-500' : ''} min="1" /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.price}</p></div> <div><Label htmlFor="mileage">Mileage*</Label><Input id="mileage" name="mileage" type="number" value={formData.mileage ?? ''} onChange={handleFormChange} placeholder="e.g., 30000" className={formErrors.mileage ? 'border-red-500' : ''} min="0" /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.mileage}</p></div> <div><Label htmlFor="vin">VIN</Label><Input id="vin" name="vin" value={formData.vin || ''} onChange={handleFormChange} placeholder="17 Character VIN" className={formErrors.vin ? 'border-red-500' : ''} minLength={17} maxLength={17} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.vin}</p></div> <div> <Label htmlFor="condition">Condition*</Label> <Select name="condition" value={formData.condition || ''} onValueChange={(value) => handleSelectChange('condition', value)}> <SelectTrigger className={formErrors.condition ? 'border-red-500' : ''}><SelectValue placeholder="Select condition" /></SelectTrigger> <SelectContent>{AVAILABLE_CONDITIONS.map(c => <SelectItem key={c} value={c}>{capitalizeFirstLetter(c)}</SelectItem>)}</SelectContent> </Select><p className="text-red-500 text-xs mt-1 h-4">{formErrors.condition}</p> </div> <div> <Label htmlFor="status">Listing Status*</Label> <Select name="status" value={formData.status || ''} onValueChange={(value) => handleSelectChange('status', value)}> <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}><SelectValue placeholder="Select status" /></SelectTrigger> <SelectContent>{AVAILABLE_STATUSES.map(s => <SelectItem key={s} value={s}>{capitalizeFirstLetter(s)}</SelectItem>)}</SelectContent> </Select><p className="text-red-500 text-xs mt-1 h-4">{formErrors.status}</p> </div> <div> <Label htmlFor="listing_type">Listing Type*</Label> <Select name="listing_type" value={formData.listing_type || ''} onValueChange={(value) => handleSelectChange('listing_type', value)}> <SelectTrigger className={formErrors.listing_type ? 'border-red-500' : ''}><SelectValue placeholder="Select type" /></SelectTrigger> <SelectContent>{AVAILABLE_LISTING_TYPES.map(lt => <SelectItem key={lt} value={lt}>{capitalizeFirstLetter(lt)}</SelectItem>)}</SelectContent> </Select><p className="text-red-500 text-xs mt-1 h-4">{formErrors.listing_type}</p> </div> </div> </section>
                                {/* Specifications */}
                                <section> <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Specifications</h3> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> <div><Label htmlFor="body_type">Body Type</Label><Input id="body_type" name="body_type" value={formData.body_type || ''} onChange={handleFormChange} placeholder="e.g., Sedan, SUV" className={formErrors.body_type ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.body_type}</p></div> <div><Label htmlFor="exterior_color">Exterior Color</Label><Input id="exterior_color" name="exterior_color" value={formData.exterior_color || ''} onChange={handleFormChange} placeholder="e.g., Midnight Black" className={formErrors.exterior_color ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.exterior_color}</p></div> <div><Label htmlFor="interior_color">Interior Color</Label><Input id="interior_color" name="interior_color" value={formData.interior_color || ''} onChange={handleFormChange} placeholder="e.g., Charcoal Gray" className={formErrors.interior_color ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.interior_color}</p></div> <div><Label htmlFor="engine">Engine</Label><Input id="engine" name="engine" value={formData.engine || ''} onChange={handleFormChange} placeholder="e.g., 2.0L Turbo" className={formErrors.engine ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.engine}</p></div> <div> <Label htmlFor="fuel_type">Fuel Type*</Label> <Select name="fuel_type" value={formData.fuel_type || ''} onValueChange={(value) => handleSelectChange('fuel_type', value)}> <SelectTrigger className={formErrors.fuel_type ? 'border-red-500' : ''}><SelectValue placeholder="Select fuel type" /></SelectTrigger> <SelectContent>{AVAILABLE_FUEL_TYPES.map(ft => <SelectItem key={ft} value={ft}>{capitalizeFirstLetter(ft)}</SelectItem>)}</SelectContent> </Select><p className="text-red-500 text-xs mt-1 h-4">{formErrors.fuel_type}</p> </div> <div> <Label htmlFor="transmission">Transmission*</Label> <Select name="transmission" value={formData.transmission || ''} onValueChange={(value) => handleSelectChange('transmission', value)}> <SelectTrigger className={formErrors.transmission ? 'border-red-500' : ''}><SelectValue placeholder="Select transmission" /></SelectTrigger> <SelectContent>{AVAILABLE_TRANSMISSIONS.map(t => <SelectItem key={t} value={t}>{capitalizeFirstLetter(t)}</SelectItem>)}</SelectContent> </Select><p className="text-red-500 text-xs mt-1 h-4">{formErrors.transmission}</p> </div> </div> </section>
                                {/* Location */}
                                <section> <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Location</h3> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> <div><Label htmlFor="location_city">City</Label><Input id="location_city" name="location_city" value={formData.location_city || ''} onChange={handleFormChange} placeholder="City where vehicle is located" className={formErrors.location_city ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.location_city}</p></div> <div><Label htmlFor="location_country">Country</Label><Input id="location_country" name="location_country" value={formData.location_country || ''} onChange={handleFormChange} placeholder="Country (e.g., USA)" className={formErrors.location_country ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.location_country}</p></div> </div> </section>
                                {/* Description & Features */}
                                <section>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Description & Features</h3>

                                    {/* Description - Full width */}
                                    <div className="mb-6">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formData.description || ''}
                                            onChange={handleFormChange}
                                            placeholder="Detailed description of the vehicle..."
                                            rows={5}
                                            className={formErrors.description ? 'border-red-500' : ''}
                                        />
                                        <p className="text-red-500 text-xs mt-1 h-4">{formErrors.description}</p>
                                    </div>

                                    {/* Features - Below Description */}
                                    <div>
                                        <Label className="text-base font-medium">Features</Label>
                                        <div className="mt-2 border rounded-md p-4">
                                            {/* Search input for features */}
                                            <div className="mb-4">
                                                <Input
                                                    type="text"
                                                    placeholder="Search features..."
                                                    onChange={(e) => {
                                                        const searchElement = document.getElementById('features-container');
                                                        if (searchElement) {
                                                            const searchTerm = e.target.value.toLowerCase();
                                                            const featureItems = searchElement.querySelectorAll('.feature-item');

                                                            featureItems.forEach((item) => {
                                                                const text = item.textContent?.toLowerCase() || '';
                                                                if (text.includes(searchTerm)) {
                                                                    (item as HTMLElement).style.display = 'flex';
                                                                } else {
                                                                    (item as HTMLElement).style.display = 'none';
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    className="mb-2"
                                                />
                                            </div>

                                            {/* Feature categories */}
                                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2" id="features-container">
                                                {/* Regular features */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                                                    {AVAILABLE_FEATURES.map((feature) => (
                                                        <div key={feature} className="flex items-center space-x-2 feature-item">
                                                            <Checkbox
                                                                id={`feature-${feature}`}
                                                                checked={formData.features?.includes(feature)}
                                                                onCheckedChange={(checked) => handleCheckboxGroupChange('features', feature, checked)}
                                                            />
                                                            <Label
                                                                htmlFor={`feature-${feature}`}
                                                                className="text-sm font-normal cursor-pointer"
                                                            >
                                                                {feature}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Seat Cover section with sub-options */}
                                                <div className="border-t pt-3 mt-3">
                                                    <div className="mb-2">
                                                        <div className="flex items-center space-x-2 feature-item">
                                                            <Checkbox
                                                                id="feature-Seat-Covers"
                                                                checked={formData.features?.includes('Seat Covers')}
                                                                onCheckedChange={(checked) => handleCheckboxGroupChange('features', 'Seat Covers', checked)}
                                                            />
                                                            <Label
                                                                htmlFor="feature-Seat-Covers"
                                                                className="text-sm font-medium cursor-pointer"
                                                            >
                                                                Seat Covers
                                                            </Label>
                                                        </div>
                                                    </div>

                                                    {/* Seat cover sub-options */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 pl-8">
                                                        {SEAT_COVER_OPTIONS.map((option) => (
                                                            <div key={option} className="flex items-center space-x-2 feature-item">
                                                                <Checkbox
                                                                    id={`feature-${option}`}
                                                                    checked={formData.features?.includes(option)}
                                                                    onCheckedChange={(checked) => handleCheckboxGroupChange('features', option, checked)}
                                                                />
                                                                <Label
                                                                    htmlFor={`feature-${option}`}
                                                                    className="text-sm font-normal cursor-pointer"
                                                                >
                                                                    {option}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                {/* Images */}
                                <section> <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Images*</h3> <Label htmlFor="vehicle-image-upload" className="block text-sm font-medium text-gray-700 mb-2">Upload New Images (Max 10MB each)</Label> <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition ${formErrors.images ? 'border-red-500' : 'border-gray-300'}`}> <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="vehicle-image-upload" disabled={isSubmitting} /> <label htmlFor="vehicle-image-upload" className={`cursor-pointer flex flex-col items-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}> <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mb-2" /> <p className="text-sm text-gray-600">Drag & drop or click to select</p> {isSubmitting && <p className="text-xs text-blue-600 mt-1">Uploading...</p>} </label> </div> <p className="text-red-500 text-xs mt-1 h-4">{formErrors.images}</p> {(formData.images?.length ?? 0) > 0 && (<div className="mt-4"> <Label className="block text-sm font-medium text-gray-700 mb-2">Current Images ({formData.images?.length})</Label> <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"> {formData.images?.map((url, index) => (url && (<div key={url || index} className="relative border rounded overflow-hidden group aspect-video bg-gray-100"> <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x100?text=Error'; }} /> <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Remove image ${index + 1}`} disabled={isSubmitting} > <XMarkIcon className="h-3 w-3" /> </button> </div>)))} </div> </div>)} </section>
                                {/* Form Actions */}
                                <div className="flex justify-end space-x-3 pt-5 border-t mt-6"> {modalMode === 'edit' && (<Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}> {isSubmitting ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" /> : <TrashIconOutline className="h-4 w-4 mr-2" />} Delete </Button>)} <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>Cancel</Button> <Button type="submit" disabled={isSubmitting || !dealerPartnerId}> {isSubmitting ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" /> : null} {modalMode === 'create' ? 'Add Vehicle' : 'Save Changes'} </Button> </div>
                            </form>
                        )}
                    </div> {/* End p-6 */}
                </DialogContent>
            </Dialog>

            {/* --- Enhanced Image Gallery Dialog (Full Screen - remains unchanged) --- */}
            <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
                <DialogContent className="max-w-6xl w-full p-0 bg-black/90 border-0 overflow-hidden">
                    <DialogHeader className="sr-only"> <DialogTitle>Image Gallery</DialogTitle> <DialogDescription>Viewing image {selectedImageIndex !== null ? selectedImageIndex + 1 : ''} of {currentCar?.images?.length || 0}</DialogDescription> </DialogHeader>
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