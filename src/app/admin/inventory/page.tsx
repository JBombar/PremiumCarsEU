'use client';
console.log("INVENTORY PAGE LOADED - LOGGING TEST");

import { useState, useEffect, ChangeEvent, FormEvent, MouseEvent, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'; // Assuming Shadcn Dialog
import { Button } from "@/components/ui/button"; // Assuming Shadcn Button
import { Input } from "@/components/ui/input"; // Assuming Shadcn Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming Shadcn Select
import { Textarea } from "@/components/ui/textarea"; // Assuming Shadcn Textarea
import { Label } from "@/components/ui/label"; // Assuming Shadcn Label
import { Separator } from "@/components/ui/separator"; // For visual separation
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";

// Icons (Example using Heroicons - install @heroicons/react)
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  PresentationChartLineIcon,
  LinkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';


// Define the CarListing type based on your DB schema + listing_views relation
type CarListing = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  purchasing_price?: number | null;
  status: "available" | "sold" | string; // Refine with actual enum values if possible
  mileage: number;
  listing_type: "sale" | "rent" | "both" | string; // Changed "rental" to "rent"
  rental_status?: "available" | "rented" | "maintenance" | string | null; // Refine
  created_at: string;
  body_type?: string | null;
  exterior_color?: string | null;
  interior_color?: string | null;
  fuel_type: string; // Refine with actual enum values
  transmission: string; // Refine
  condition: "new" | "used" | "certified" | string; // Refine
  images?: string[] | null; // Store images as an array
  description?: string | null;
  features?: string[] | null; // Store features as an array
  dealer_id: string;
  rental_daily_price?: number | null;
  rental_deposit_required?: number | null;
  min_rental_days?: number | null;
  max_rental_days?: number | null;
  location_city?: string | null;
  location_country?: string | null;
  engine?: string | null;
  vin?: string | null;
  seller_name?: string | null;
  seller_since?: string | null;
  is_public?: boolean;
  is_shared_with_network?: boolean;
  shared_with_trust_levels?: string[] | null; // Add this new field
  is_special_offer?: boolean;
  special_offer_label?: string;
  time_in_stock_days?: number | null;
  listing_views?: { count: number }[]; // Add this to fix the TypeScript error
  listing_url?: string; // Add this new field

  // New rental duration fields
  rental_available_durations?: number[] | null;
  rental_price_3h?: number | null;
  rental_price_6h?: number | null;
  rental_price_12h?: number | null;
  rental_price_24h?: number | null;
  rental_price_48h?: number | null;
  rental_deposit?: number | null;
  rental_policy?: string | null;
};

// Define the initial state for the form data
const initialFormData = {
  make: '',
  model: '',
  year: '',
  price: '',
  status: 'available',
  mileage: '',
  listing_type: 'sale',
  body_type: '',
  exterior_color: '',
  interior_color: '',
  fuel_type: 'gasoline',
  transmission: 'automatic',
  condition: 'used',
  images: [] as string[], // Use array for images
  description: '',
  features: '' as string | string[], // Use array for features
  rental_daily_price: '',
  rental_deposit_required: '',
  rental_status: 'available',
  min_rental_days: '',
  max_rental_days: '',
  location_city: '',
  location_country: '',
  engine: '',
  vin: '',
  seller_name: '',
  seller_since: '',
  purchasing_price: '',
  is_public: true,
  is_shared_with_network: false,
  shared_with_trust_levels: [] as string[],
  is_special_offer: false,
  special_offer_label: '',

  // Add new rental duration fields to initial state
  rental_available_durations: [] as number[],
  rental_price_3h: '',
  rental_price_6h: '',
  rental_price_12h: '',
  rental_price_24h: '',
  rental_price_48h: '',
  rental_deposit: '',
  rental_policy: '',
};

// Helper component for displaying details in View Mode
function DetailItem({ label, value }: { label: string; value: string | number | undefined | null }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value ?? 'N/A'}</dd>
    </div>
  );
}


export default function InventoryPage() {
  const supabase = createClient();
  const { toast } = useToast(); // Get toast function from hook
  const [inventory, setInventory] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false); // For Add button state
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ make: '', model: '', year: '', status: '', listing_type: '' });
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create');
  const [currentCar, setCurrentCar] = useState<CarListing | null>(null);

  // Form State
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // Simplified error state
  const [isSubmitting, setIsSubmitting] = useState(false); // Track form submission state

  // Image Handling State
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({}); // For table row image slider
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null); // For modal gallery view

  // Fix 1: Add this to your state declarations section
  const [sellerSince, setSellerSince] = useState<string | null>(null);

  // Fix 2: Add this useEffect to fetch seller_since when dealer_id changes
  useEffect(() => {
    const fetchSellerSince = async () => {
      if (!dealerId) return;

      try {
        // Query the users table to get the created_at date
        const { data, error } = await supabase
          .from('users') // or 'partners' or whatever table stores seller information
          .select('created_at')
          .eq('id', dealerId)
          .single();

        if (error) throw error;

        if (data) {
          // Format the date for display
          const formattedDate = data.created_at ?
            new Date(data.created_at).toISOString().split('T')[0] :
            '';

          setSellerSince(formattedDate);

          // Update form data with seller_since if in create mode
          if (modalMode === 'create') {
            setFormData(prev => ({
              ...prev,
              seller_since: formattedDate
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching seller since date:', err);
        // Don't show an error toast as this is not critical
      }
    };

    fetchSellerSince();
  }, [dealerId, supabase, modalMode]);

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 500);
    return () => clearTimeout(timer);
  }, [filters]);

  // Fetch inventory data when filters or sorting change
  useEffect(() => {
    fetchInventory();
  }, [debouncedFilters, sortField, sortDirection]);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      let query = supabase
        .from('car_listings')
        .select(`*, listing_views(count)`); // Select related view count

      // Apply filters
      if (debouncedFilters.make) query = query.ilike('make', `%${debouncedFilters.make}%`);
      if (debouncedFilters.model) query = query.ilike('model', `%${debouncedFilters.model}%`);
      if (debouncedFilters.year && !isNaN(parseInt(debouncedFilters.year))) query = query.eq('year', parseInt(debouncedFilters.year)); // Check if year is valid number
      if (debouncedFilters.status) query = query.eq('status', debouncedFilters.status);
      if (debouncedFilters.listing_type) query = query.eq('listing_type', debouncedFilters.listing_type);

      // Apply sorting
      // Note: Sorting by related count ('listing_views') directly in Supabase query requires advanced techniques (e.g., RPC or View).
      // Simple client-side sorting for views is implemented in handleSort for now.
      if (sortField !== 'listing_views') {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      // If sorting by views, sort client-side after fetch
      if (sortField === 'listing_views') {
        const sortedData = [...(data || [])].sort((a, b) => {
          const viewsA = a.listing_views?.[0]?.count ?? 0;
          const viewsB = b.listing_views?.[0]?.count ?? 0;
          return sortDirection === 'asc' ? viewsA - viewsB : viewsB - viewsA;
        });
        setInventory(sortedData);
      } else {
        setInventory(data || []);
      }

    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'An unknown error occurred fetching inventory.');
      setInventory([]); // Clear inventory on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch user/dealer ID when needed
  const fetchDealerId = async (): Promise<string | null> => {
    setUserLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error(userError?.message || 'You must be logged in.');

      // Assuming user ID is the dealer ID for simplicity based on previous code
      // If profiles table exists, you might query that instead.
      const fetchedDealerId = user.id;
      setDealerId(fetchedDealerId);

      // Pre-fill seller info based on user data only if creating a new entry
      if (modalMode === 'create') {
        setFormData(prev => ({
          ...prev,
          seller_name: user.email || '', // Or user name from profile if available
          // Fetch creation date if needed for seller_since
        }));
      }

      return fetchedDealerId;

    } catch (err: any) {
      console.error('Error fetching user data:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setDealerId(null); // Reset dealerId on error
      return null;
    } finally {
      setUserLoading(false);
    }
  };

  // --- Event Handlers ---

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle filter changes specifically for Select components
  const handleFilterSelectChange = (name: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };


  const handleSort = (field: keyof CarListing | 'listing_views') => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    // Fetching/sorting logic is handled by the useEffect hook watching these state changes
  };

  const handleClearFilters = () => {
    setFilters({ make: '', model: '', year: '', status: '', listing_type: '' });
  };

  // Unified handler for form inputs and selects
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handler for Shadcn Select components
  const handleSelectChange = (name: keyof typeof initialFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Basic required fields validation (existing code)
    if (!formData.make.trim()) errors.make = 'Make is required';
    if (!formData.model.trim()) errors.model = 'Model is required';
    if (!formData.year.trim()) errors.year = 'Year is required';
    if (!formData.price.trim()) errors.price = 'Price is required';
    if (!formData.mileage.trim()) errors.mileage = 'Mileage is required';
    if (!formData.condition) errors.condition = 'Condition is required';
    if (!formData.listing_type) errors.listing_type = 'Listing Type is required';
    if (!formData.fuel_type) errors.fuel_type = 'Fuel Type is required';
    if (!formData.transmission) errors.transmission = 'Transmission is required';
    if (!formData.status) errors.status = 'Status is required';

    // Numeric validation (existing code)
    if (formData.year && isNaN(Number(formData.year))) errors.year = 'Year must be a valid number';
    if (formData.price && isNaN(Number(formData.price))) errors.price = 'Price must be a valid number';
    if (formData.mileage && isNaN(Number(formData.mileage))) errors.mileage = 'Mileage must be a valid number';
    if (formData.purchasing_price && isNaN(Number(formData.purchasing_price))) errors.purchasing_price = 'Purchasing Price must be a valid number';

    // Rental specific validation (existing and new)
    if (formData.listing_type === 'rent' || formData.listing_type === 'both') {
      if (!formData.rental_daily_price?.trim()) errors.rental_daily_price = 'Daily price required for rentals';
      if (formData.rental_daily_price && isNaN(Number(formData.rental_daily_price))) errors.rental_daily_price = 'Daily price must be a number';
      if (formData.rental_deposit_required && isNaN(Number(formData.rental_deposit_required))) errors.rental_deposit_required = 'Deposit must be a number';
      if (formData.min_rental_days && isNaN(Number(formData.min_rental_days))) errors.min_rental_days = 'Min days must be a number';
      if (formData.max_rental_days && isNaN(Number(formData.max_rental_days))) errors.max_rental_days = 'Max days must be a number';
      if (!formData.rental_status) errors.rental_status = 'Rental Status is required for rentals';

      // New hourly rental validation
      if (formData.rental_deposit && isNaN(Number(formData.rental_deposit)))
        errors.rental_deposit = 'Security deposit must be a number';

      // Validate each selected hourly option has a price
      if (formData.rental_available_durations?.includes(3) && !formData.rental_price_3h)
        errors.rental_price_3h = 'Price required for 3 hour option';
      if (formData.rental_available_durations?.includes(6) && !formData.rental_price_6h)
        errors.rental_price_6h = 'Price required for 6 hour option';
      if (formData.rental_available_durations?.includes(12) && !formData.rental_price_12h)
        errors.rental_price_12h = 'Price required for 12 hour option';
      if (formData.rental_available_durations?.includes(24) && !formData.rental_price_24h)
        errors.rental_price_24h = 'Price required for 24 hour option';
      if (formData.rental_available_durations?.includes(48) && !formData.rental_price_48h)
        errors.rental_price_48h = 'Price required for 48 hour option';

      // Validate numeric values for prices
      if (formData.rental_price_3h && isNaN(Number(formData.rental_price_3h)))
        errors.rental_price_3h = 'Price must be a number';
      if (formData.rental_price_6h && isNaN(Number(formData.rental_price_6h)))
        errors.rental_price_6h = 'Price must be a number';
      if (formData.rental_price_12h && isNaN(Number(formData.rental_price_12h)))
        errors.rental_price_12h = 'Price must be a number';
      if (formData.rental_price_24h && isNaN(Number(formData.rental_price_24h)))
        errors.rental_price_24h = 'Price must be a number';
      if (formData.rental_price_48h && isNaN(Number(formData.rental_price_48h)))
        errors.rental_price_48h = 'Price must be a number';
    }

    if (Object.keys(errors).length > 0) {
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Reset form errors
    setFormErrors({});

    // Validate required fields
    const requiredFields = ['make', 'model', 'year', 'price', 'mileage', 'status', 'listing_type'];
    const errors: Record<string, string> = {};

    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')} is required`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    // Get dealer ID if not already available
    const currentDealerId = dealerId || await fetchDealerId();

    if (!currentDealerId) {
      setIsSubmitting(false);
      return; // fetchDealerId will show an error toast
    }

    // Process features field to ensure it's an array
    let featuresArray: string[] = [];

    // If features is already an array, use it
    if (Array.isArray(formData.features)) {
      featuresArray = formData.features;
    }
    // If features is a string, convert it to an array
    else if (typeof formData.features === 'string') {
      featuresArray = (formData.features as string)
        .split(',')
        .map((feature: string) => feature.trim())
        .filter((feature: string) => feature.length > 0);
    }

    // Sanitize numeric fields: convert empty strings to null for all numeric fields
    const sanitizedData = {
      ...formData,
      // Convert empty strings to null for all numeric fields
      year: formData.year ? parseInt(formData.year) : null,
      price: formData.price ? parseFloat(formData.price) : null,
      mileage: formData.mileage ? parseInt(formData.mileage) : null,
      purchasing_price: formData.purchasing_price ? parseFloat(formData.purchasing_price) : null,
      rental_daily_price: formData.rental_daily_price ? parseFloat(formData.rental_daily_price) : null,
      rental_deposit_required: formData.rental_deposit_required ? parseFloat(formData.rental_deposit_required) : null,
      min_rental_days: formData.min_rental_days ? parseInt(formData.min_rental_days) : null,
      max_rental_days: formData.max_rental_days ? parseInt(formData.max_rental_days) : null,
      features: featuresArray, // Use the properly processed features array
      dealer_id: currentDealerId,
      seller_since: sellerSince || null,

      // New rental duration fields
      rental_price_3h: formData.rental_price_3h ? parseFloat(formData.rental_price_3h) : null,
      rental_price_6h: formData.rental_price_6h ? parseFloat(formData.rental_price_6h) : null,
      rental_price_12h: formData.rental_price_12h ? parseFloat(formData.rental_price_12h) : null,
      rental_price_24h: formData.rental_price_24h ? parseFloat(formData.rental_price_24h) : null,
      rental_price_48h: formData.rental_price_48h ? parseFloat(formData.rental_price_48h) : null,
      rental_deposit: formData.rental_deposit ? parseFloat(formData.rental_deposit) : null,
    };

    try {
      if (modalMode === 'edit' && currentCar) {
        const { error } = await supabase
          .from('car_listings')
          .update(sanitizedData)
          .eq('id', currentCar.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Vehicle updated successfully.' });
      } else {
        const { error } = await supabase
          .from('car_listings')
          .insert(sanitizedData);
        if (error) throw error;
        toast({ title: 'Success', description: 'Vehicle added successfully.' });
      }

      setIsModalOpen(false); // Close modal on success
      fetchInventory(); // Refresh the list

    } catch (err: any) {
      console.error('Error saving vehicle:', err);
      toast({
        title: 'Save Failed',
        description: err.message || 'An error occurred while saving.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false); // Reset loading state
    }
  };

  // Handle image uploads
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    if (!dealerId) {
      toast({ title: "Cannot Upload", description: "Dealer ID is missing.", variant: "destructive" });
      return; // Need dealer ID for path
    }

    const files = Array.from(e.target.files);
    const uploadToastId = `upload-${Date.now()}`; // Unique ID for the toast

    toast({
      title: "Uploading images...",
      description: `Processing ${files.length} image(s).`,
    });

    try {
      const folderPath = dealerId; // Use dealer ID for storage path
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 30); // Sanitize name
        const fileName = `${Date.now()}-${sanitizedName}`; // Ensure unique names
        const filePath = `${folderPath}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicle-images') // Ensure this bucket exists and has correct policies
          .upload(filePath, file, { cacheControl: '3600', upsert: false }); // upsert: false to prevent accidental overwrites?

        if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('vehicle-images').getPublicUrl(filePath);
        uploadedUrls.push(urlData.publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls] // Append new URLs to existing array
      }));

      toast({ // Update the initial toast to success
        title: "Upload Complete",
        description: `${files.length} image(s) successfully uploaded.`,
      });

    } catch (err: any) {
      console.error('Image upload error:', err);
      toast({ // Update the initial toast to failure
        title: "Upload Failed",
        description: err.message || "An error occurred during upload.",
        variant: "destructive"
      });
    } finally {
      if (e.target) e.target.value = ''; // Clear the file input
    }
  };

  // Handle image removal from form state
  const handleRemoveImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  // --- Modal Open/Close Handlers ---

  const openModal = async (mode: 'create' | 'edit' | 'view', car?: CarListing) => {
    setModalMode(mode);
    setFormErrors({}); // Clear errors when opening

    // Reset form for create mode
    if (mode === 'create') {
      setCurrentCar(null);
      setFormData(initialFormData);
      const currentDealerId = dealerId || await fetchDealerId(); // Fetch ID if not already available
      if (!currentDealerId) return; // Don't open modal if ID fetch fails
      // Pre-fill seller info if needed (done within fetchDealerId for create)
    } else if (car) { // For edit or view
      setCurrentCar(car);
      // Pre-populate form for edit/view
      setFormData({
        make: car.make || '',
        model: car.model || '',
        year: car.year?.toString() || '',
        price: car.price?.toString() || '',
        purchasing_price: car.purchasing_price?.toString() || '',
        status: car.status || 'available',
        mileage: car.mileage?.toString() || '',
        listing_type: car.listing_type || 'sale',
        body_type: car.body_type || '',
        exterior_color: car.exterior_color || '',
        interior_color: car.interior_color || '',
        fuel_type: car.fuel_type || 'gasoline',
        transmission: car.transmission || 'automatic',
        condition: car.condition || 'used',
        images: car.images || [], // Use array
        description: car.description || '',
        features: car.features || [], // Use array
        rental_daily_price: car.rental_daily_price?.toString() || '',
        rental_deposit_required: car.rental_deposit_required?.toString() || '',
        rental_status: car.rental_status || 'available',
        min_rental_days: car.min_rental_days?.toString() || '',
        max_rental_days: car.max_rental_days?.toString() || '',
        location_city: car.location_city || '',
        location_country: car.location_country || '',
        engine: car.engine || '',
        vin: car.vin || '',
        seller_name: car.seller_name || '', // Pre-fill seller info from car data
        seller_since: car.seller_since || '',
        is_public: car.is_public ?? true,
        is_shared_with_network: car.is_shared_with_network ?? false,
        shared_with_trust_levels: car.shared_with_trust_levels || [],
        is_special_offer: car.is_special_offer ?? false,
        special_offer_label: car.special_offer_label || '',

        // New rental duration fields
        rental_available_durations: car.rental_available_durations || [],
        rental_price_3h: car.rental_price_3h?.toString() || '',
        rental_price_6h: car.rental_price_6h?.toString() || '',
        rental_price_12h: car.rental_price_12h?.toString() || '',
        rental_price_24h: car.rental_price_24h?.toString() || '',
        rental_price_48h: car.rental_price_48h?.toString() || '',
        rental_deposit: car.rental_deposit?.toString() || '',
        rental_policy: car.rental_policy || '',
      });
      // Fetch dealer ID if necessary (e.g., page reload)
      if (!dealerId) await fetchDealerId();
    } else {
      console.error("Car data is required for view/edit mode but was not provided.");
      return; // Don't open if car data is missing for view/edit
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCar(null); // Clear current car on close
    setFormData(initialFormData); // Reset form
    setFormErrors({});
  };

  // --- Table Action Handlers ---

  const handleViewCar = (car: CarListing) => {
    openModal('view', car);
  };

  const handleEditCar = (car: CarListing) => {
    openModal('edit', car);
  };

  const handleToggleStatus = async (car: CarListing) => {
    const newStatus = car.status === 'available' ? 'sold' : 'available';
    const is_public = newStatus !== 'sold'; // Mark as not public when sold

    try {
      // If marking as sold, calculate time in stock as days (integer)
      let updateData: any = { status: newStatus, is_public: is_public };

      // Only add time_in_stock_days when marking as sold
      if (newStatus === 'sold') {
        // Calculate days between created_at and now
        const createdDate = new Date(car.created_at);
        const today = new Date();
        const timeDiffMs = today.getTime() - createdDate.getTime();
        // Convert milliseconds to days and round to nearest integer
        const daysDiff = Math.round(timeDiffMs / (1000 * 60 * 60 * 24));

        // Add days as an integer value
        updateData.time_in_stock_days = daysDiff;
      }

      const { error } = await supabase
        .from('car_listings')
        .update(updateData)
        .eq('id', car.id);

      if (error) throw error;

      // Update local state for immediate UI feedback
      setInventory(prev =>
        prev.map(item =>
          item.id === car.id ? {
            ...item,
            status: newStatus,
            is_public: is_public,
            ...(newStatus === 'sold' ? { time_in_stock_days: updateData.time_in_stock_days } : {})
          } : item
        )
      );

      toast({
        title: 'Status Updated',
        description: `Vehicle marked as ${newStatus}.`
      });

    } catch (err: any) {
      console.error('Failed to update status:', err);
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  // --- Image Slider/Gallery Handlers ---

  const nextImage = (e: MouseEvent, carId: string, images?: string[] | null) => {
    e.stopPropagation(); // Prevent row click/link trigger
    if (!images || images.length <= 1) return;
    setActiveImageIndex(prev => ({
      ...prev,
      [carId]: ((prev[carId] || 0) + 1) % images.length
    }));
  };

  const prevImage = (e: MouseEvent, carId: string, images?: string[] | null) => {
    e.stopPropagation();
    if (!images || images.length <= 1) return;
    setActiveImageIndex(prev => ({
      ...prev,
      [carId]: ((prev[carId] || 0) - 1 + images.length) % images.length
    }));
  };

  const openImageGallery = (car: CarListing, index: number) => {
    setCurrentCar(car); // Set car context for the gallery
    setSelectedImageIndex(index);
  };

  // Keyboard nav for gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use optional chaining here as well
      if (selectedImageIndex === null || !currentCar?.images?.length) return;
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex(prev => prev! > 0 ? prev! - 1 : currentCar!.images!.length - 1);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex(prev => prev! < currentCar!.images!.length - 1 ? prev! + 1 : 0);
      } else if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, currentCar]);

  // New state for Share With Network panel
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedTrustLevels, setSelectedTrustLevels] = useState<string[]>([]);
  const [manualContacts, setManualContacts] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Available channels and trust levels
  const availableChannels = [
    'WhatsApp', 'Email', 'Slack', 'Telegram', 'SMS'
  ];

  const availableTrustLevels = [
    'trusted', 'verified', 'flagged', 'unrated'
  ];

  // Handle checkbox selection for all listings
  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = inventory.map(car => car.id);
      setSelectedListingIds(allIds);
    } else {
      setSelectedListingIds([]);
    }
  };

  // Handle individual checkbox selection
  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedListingIds(prev => [...prev, id]);
    } else {
      setSelectedListingIds(prev => prev.filter(listingId => listingId !== id));
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

  // Add these new state variables after the existing Share With Network panel state variables
  const [partners, setPartners] = useState<{ id: string, name: string, contact_email: string | null, contact_phone: string | null }[]>([]);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

  // Add this function to fetch partners from Supabase
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

  // Add this useEffect to fetch partners when the component mounts
  useEffect(() => {
    fetchPartners();
  }, []);

  // Add this function to toggle partner selection
  const togglePartner = (partnerId: string) => {
    setSelectedPartnerIds(prev =>
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  // Function to get all contact information from selected partners
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

  // Modify the handleShareListings function to include partner contacts
  const handleShareListings = async () => {
    if (selectedListingIds.length === 0) {
      toast({
        title: "No Listings Selected",
        description: "Please select at least one listing to share.",
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

      const payload = {
        listing_ids: selectedListingIds,
        dealer_id: dealerId || await fetchDealerId(),
        channels: selectedChannels,
        shared_with_trust_levels: selectedTrustLevels,
        shared_with_contacts: allContacts,
        message: "Check out these listings."
      };

      const response = await fetch('/api/share-listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to share listings');
      }

      toast({
        title: "Success",
        description: `Shared ${selectedListingIds.length} listing(s) with your network.`,
      });

      // Reset selections after successful share
      setSelectedListingIds([]);
      setSelectAll(false);
    } catch (err: any) {
      console.error('Error sharing listings:', err);
      toast({
        title: "Share Failed",
        description: err.message || 'An error occurred while sharing listings.',
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Add this new state variable with the other state variables
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  // Add these state variables with your other state declarations
  const [sharedListingsHistory, setSharedListingsHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Add this function with your other functions
  const fetchSharedListingsHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const currentDealerId = dealerId || await fetchDealerId();
      if (!currentDealerId) {
        setIsHistoryLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('listing_shares')
        .select('*')
        .eq('dealer_id', currentDealerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedListingsHistory(data || []);
    } catch (err: any) {
      console.error('Error fetching shared listings history:', err);
      // Not showing a toast as this is not critical
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Add this useEffect with your other useEffect hooks
  useEffect(() => {
    if (dealerId) {
      fetchSharedListingsHistory();
    }
  }, [dealerId]);

  // --- Render ---

  // Add these new state variables for bulk actions
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceChangeType, setPriceChangeType] = useState<'fixed' | 'percentage'>('fixed');
  const [priceChangeAmount, setPriceChangeAmount] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>('');
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
  const [specialOfferLabel, setSpecialOfferLabel] = useState('');
  const [showSpecialOfferModal, setShowSpecialOfferModal] = useState(false);
  const [selectedListingType, setSelectedListingType] = useState<'sale' | 'rent' | 'both'>('sale');
  const [showListingTypeModal, setShowListingTypeModal] = useState(false);

  // Add these bulk action helper functions before the render section

  // Helper function to update multiple listings in Supabase
  const bulkUpdateListings = async (updateData: any) => {
    setIsPerformingBulkAction(true);
    try {
      const { error } = await supabase
        .from('car_listings')
        .update(updateData)
        .in('id', selectedListingIds);

      if (error) throw error;

      // Success toast
      toast({
        title: 'Success',
        description: `Updated ${selectedListingIds.length} listing(s).`,
      });

      // Refresh inventory
      fetchInventory();

      return true;
    } catch (err: any) {
      console.error('Error updating listings:', err);
      toast({
        title: 'Update Failed',
        description: err.message || 'An error occurred while updating listings.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // Toggle public status of selected listings
  const togglePublicStatus = async (makePublic: boolean) => {
    setConfirmAction('togglePublic');
    setConfirmMessage(`Make ${selectedListingIds.length} listing(s) ${makePublic ? 'public' : 'private'}?`);
    setShowConfirmModal(true);
  };

  // Confirm and execute toggle public status
  const confirmTogglePublicStatus = async (makePublic: boolean) => {
    return await bulkUpdateListings({ is_public: makePublic });
  };

  // Toggle sold status of selected listings
  const toggleSoldStatus = async (markAsSold: boolean) => {
    setConfirmAction('toggleSold');
    setConfirmMessage(`Mark ${selectedListingIds.length} listing(s) as ${markAsSold ? 'sold' : 'available'}?`);
    setShowConfirmModal(true);
  };

  // Confirm and execute toggle sold status
  const confirmToggleSoldStatus = async (markAsSold: boolean) => {
    let updateData: any = {
      status: markAsSold ? 'sold' : 'available',
      is_public: !markAsSold // Not public when sold
    };

    // If marking as sold, calculate time in stock
    if (markAsSold) {
      // We need to fetch each listing to get its created_at date
      const { data: listings } = await supabase
        .from('car_listings')
        .select('id, created_at')
        .in('id', selectedListingIds);

      if (listings && listings.length > 0) {
        for (const listing of listings) {
          const createdDate = new Date(listing.created_at);
          const today = new Date();
          const timeDiffMs = today.getTime() - createdDate.getTime();
          const daysDiff = Math.round(timeDiffMs / (1000 * 60 * 60 * 24));

          // Update each listing individually with its own time_in_stock_days
          await supabase
            .from('car_listings')
            .update({
              status: 'sold',
              is_public: false,
              time_in_stock_days: daysDiff
            })
            .eq('id', listing.id);
        }

        // Refresh inventory
        fetchInventory();
        return true;
      }
    }

    // If we're setting to available or couldn't get created_at dates, just do a bulk update
    return await bulkUpdateListings(updateData);
  };

  // Open modal to update listing type
  const openListingTypeModal = () => {
    setShowListingTypeModal(true);
  };

  // Confirm and update listing type
  const confirmUpdateListingType = async () => {
    return await bulkUpdateListings({ listing_type: selectedListingType });
  };

  // Open modal to set special offer label
  const openSpecialOfferModal = () => {
    setShowSpecialOfferModal(true);
  };

  // Confirm and set special offer
  const confirmSetSpecialOffer = async () => {
    return await bulkUpdateListings({
      is_special_offer: true,
      special_offer_label: specialOfferLabel
    });
  };

  // Remove special offer from selected listings
  const removeSpecialOffer = async () => {
    setConfirmAction('removeSpecialOffer');
    setConfirmMessage(`Remove special offer status from ${selectedListingIds.length} listing(s)?`);
    setShowConfirmModal(true);
  };

  // Confirm and remove special offer
  const confirmRemoveSpecialOffer = async () => {
    return await bulkUpdateListings({
      is_special_offer: false,
      special_offer_label: ''
    });
  };

  // Open modal to change price
  const openPriceChangeModal = () => {
    setShowPriceModal(true);
  };

  // Confirm and apply price change
  const confirmPriceChange = async () => {
    // We need to apply the price change to each listing individually
    setIsPerformingBulkAction(true);

    try {
      const amount = parseFloat(priceChangeAmount);
      if (isNaN(amount)) throw new Error('Invalid amount');

      // Fetch current prices
      const { data: listings } = await supabase
        .from('car_listings')
        .select('id, price')
        .in('id', selectedListingIds);

      if (!listings || listings.length === 0) throw new Error('Could not fetch listings');

      // Update each listing with new price
      for (const listing of listings) {
        let newPrice;

        if (priceChangeType === 'fixed') {
          newPrice = amount; // Direct replacement
        } else {
          // Percentage change
          const discount = listing.price * (amount / 100);
          newPrice = listing.price - discount;
          if (newPrice < 0) newPrice = 0;
        }

        await supabase
          .from('car_listings')
          .update({ price: newPrice })
          .eq('id', listing.id);
      }

      toast({
        title: 'Success',
        description: `Updated prices for ${selectedListingIds.length} listing(s).`,
      });

      // Refresh inventory and reset state
      fetchInventory();
      setShowPriceModal(false);
      setPriceChangeAmount('');

      return true;
    } catch (err: any) {
      console.error('Error updating prices:', err);
      toast({
        title: 'Price Update Failed',
        description: err.message || 'An error occurred while updating prices.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsPerformingBulkAction(false);
    }
  };

  // Handle confirm modal actions
  const handleConfirmAction = async () => {
    setShowConfirmModal(false);

    switch (confirmAction) {
      case 'togglePublic':
        await confirmTogglePublicStatus(confirmMessage.includes('public'));
        break;
      case 'toggleSold':
        await confirmToggleSoldStatus(confirmMessage.includes('sold'));
        break;
      case 'removeSpecialOffer':
        await confirmRemoveSpecialOffer();
        break;
      default:
        break;
    }
  };

  // Market Analysis handlers
  const handleInitiateMarketAnalysis = async () => {
    if (selectedListingIds.length === 0) {
      toast({
        title: "No Vehicles Selected",
        description: "Please select at least one vehicle to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalysisButtonLoading(true);

    try {
      // First cleanup any existing scan data
      cleanupRealtimeSubscriptions();

      // Collect required data for selected vehicles
      const vehiclesToAnalyze = selectedListingIds.map(id => {
        const vehicle = inventory.find(car => car.id === id);
        if (!vehicle) return null;

        return {
          inventory_item_id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          mileage: vehicle.mileage
        };
      }).filter((v): v is {
        inventory_item_id: string;
        make: string;
        model: string;
        year: number;
        mileage: number;
      } => v !== null);

      if (vehiclesToAnalyze.length === 0) {
        throw new Error("Could not gather required data for selected vehicles");
      }

      // Send to API
      const response = await fetch('/api/market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicles: vehiclesToAnalyze }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate market analysis');
      }

      const data = await response.json();

      // Store scan ID in localStorage for persistence
      if (data.scan_request_id) {
        localStorage.setItem('active_market_scan_id', data.scan_request_id);
      }

      // Store scan data for tracking
      setActiveScanRequestId(data.scan_request_id);
      setVehiclesInCurrentScan(vehiclesToAnalyze);
      setScanRequestStatus('pending');
      setScanRequestError(null);
      setVehicleScanResults({});

      // Set up realtime subscriptions for this new scan
      if (userId) {
        setupRealtimeSubscriptions(data.scan_request_id, userId);
      }

      toast({
        title: "Market Analysis Initiated",
        description: "Your request is being processed. Results will update in real-time.",
      });
    } catch (err: any) {
      console.error('Error initiating market analysis:', err);
      toast({
        title: "Analysis Request Failed",
        description: err.message || 'An unexpected error occurred.',
        variant: "destructive"
      });
    } finally {
      setIsAnalysisButtonLoading(false);
    }
  };

  // Function has been moved and enhanced below

  const handleViewAnalysisDetails = (vehicleId: string) => {
    setSelectedVehicleForDetails(vehicleId);
    setIsDetailsModalOpen(true);
  };

  // Market Analysis state variables
  const [activeScanRequestId, setActiveScanRequestId] = useState<string | null>(null);
  const [scanRequestStatus, setScanRequestStatus] = useState<string | null>(null);
  const [scanRequestError, setScanRequestError] = useState<string | null>(null);
  const [vehiclesInCurrentScan, setVehiclesInCurrentScan] = useState<{
    inventory_item_id: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
  }[] | null>(null);
  const [vehicleScanResults, setVehicleScanResults] = useState<Record<string, any>>({});
  const [isAnalysisButtonLoading, setIsAnalysisButtonLoading] = useState(false);
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isFetchingPersistedScan, setIsFetchingPersistedScan] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const realTimeSubscriptionsRef = useRef<{ unsubscribe: () => void }[]>([]);

  // New state variables for historical scans
  const [historicalScans, setHistoricalScans] = useState<Array<{
    scan_request_id: string;
    created_at: string;
    status: string;
    vehicle_ids_requested: string[] | null;
    error_message: string | null;
    updated_at: string | null;
    summary_text?: string;
  }>>([]);
  const [isHistoricalPanelExpanded, setIsHistoricalPanelExpanded] = useState(false);
  const [isLoadingHistoricalScans, setIsLoadingHistoricalScans] = useState(false);
  const [selectedHistoricalScanId, setSelectedHistoricalScanId] = useState<string | null>(null);
  const [selectedHistoricalScanDetails, setSelectedHistoricalScanDetails] = useState<Record<string, any>>({});
  const [isLoadingHistoricalScanDetails, setIsLoadingHistoricalScanDetails] = useState(false);
  const [viewingHistorical, setViewingHistorical] = useState(false);

  // Load user ID, persisted scan, and historical scans on component mount
  useEffect(() => {
    const getUserIdAndLoadData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          return;
        }

        // Set the user ID
        setUserId(user.id);

        // Fetch historical scans
        fetchHistoricalScans(user.id);

        // Check localStorage for persisted scan
        const persistedScanId = localStorage.getItem('active_market_scan_id');
        if (!persistedScanId) return;

        // Start fetching persisted scan data
        setIsFetchingPersistedScan(true);
        setActiveScanRequestId(persistedScanId);

        // Fetch scan request data
        await fetchPersistedScanData(persistedScanId, user.id);
      } catch (err) {
        console.error('Error loading data:', err);
        // Clear any invalid persisted scan
        localStorage.removeItem('active_market_scan_id');
      } finally {
        setIsFetchingPersistedScan(false);
      }
    };

    getUserIdAndLoadData();

    // Cleanup function to remove subscriptions when component unmounts
    return () => {
      cleanupRealtimeSubscriptions();
    };
  }, []);

  // Function to fetch historical scan summaries for the user
  const fetchHistoricalScans = async (userId: string) => {
    setIsLoadingHistoricalScans(true);
    try {
      const { data, error } = await supabase
        .from('market_scan_requests')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['completed', 'failed', 'partially_failed']) // Get completed and failed scans
        .order('created_at', { ascending: false })
        .limit(10); // Limit to 10 most recent scans initially

      if (error) throw error;

      // Process the historical scans data
      const processedScans = await Promise.all((data || []).map(async (scan) => {
        // Try to generate a descriptive summary for the scan
        let summaryText = format(new Date(scan.created_at), 'PPp');

        // If vehicle_ids_requested exists, try to get vehicle details
        if (scan.vehicle_ids_requested) {
          // Parse vehicle IDs if stored as a JSON string
          const vehicleIds = typeof scan.vehicle_ids_requested === 'string'
            ? JSON.parse(scan.vehicle_ids_requested)
            : scan.vehicle_ids_requested;

          // If we have the inventory data loaded, try to get vehicle details
          if (inventory.length > 0 && Array.isArray(vehicleIds)) {
            const vehicles = vehicleIds
              .map(id => inventory.find(car => car.id === id))
              .filter(Boolean)
              .slice(0, 3); // Only use up to 3 vehicles for the summary

            if (vehicles.length > 0) {
              const vehicleNames = vehicles.map(v => `${v?.make} ${v?.model}`);
              summaryText = vehicleNames.join(', ');

              // If there are more vehicles than we're showing
              if (vehicleIds.length > vehicles.length) {
                summaryText += ` +${vehicleIds.length - vehicles.length} more`;
              }
            }
          }
        }

        return {
          ...scan,
          summary_text: summaryText
        };
      }));

      setHistoricalScans(processedScans);
    } catch (err) {
      console.error('Error fetching historical scans:', err);
      toast({
        title: "Error Loading History",
        description: "We couldn't load your scan history. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingHistoricalScans(false);
    }
  };

  // Function to fetch details for a selected historical scan
  const fetchHistoricalScanDetails = async (scanRequestId: string) => {
    if (!userId) return;

    console.error('⚠️ START: Fetching historical scan details for scanRequestId:', scanRequestId);

    // Clear any active scan state first to avoid UI confusion
    if (activeScanRequestId && activeScanRequestId !== scanRequestId) {
      resetScanState();
    }

    setIsLoadingHistoricalScanDetails(true);
    setViewingHistorical(true);
    setSelectedHistoricalScanId(scanRequestId);

    try {
      // 1. Fetch the scan request to get vehicle IDs and other metadata
      const { data: scanRequestData, error: scanRequestError } = await supabase
        .from('market_scan_requests')
        .select('*')
        .eq('scan_request_id', scanRequestId)
        .eq('user_id', userId)
        .single();

      if (scanRequestError) throw scanRequestError;

      console.log('Scan request data:', scanRequestData);

      // 2. Fetch the scan results for this scan request
      const { data: scanResultsData, error: scanResultsError } = await supabase
        .from('market_scan_results')
        .select('*')
        .eq('scan_request_id', scanRequestId);  // Removed user_id filter as it might be restricting results

      if (scanResultsError) throw scanResultsError;

      console.error('🔍 Scan results data received:', scanResultsData);
      console.error('🔍 Scan results length:', scanResultsData?.length || 0);

      // Check for empty results
      if (!scanResultsData || scanResultsData.length === 0) {
        console.error('❌ No scan results found in database for this scan ID');
        throw new Error('No scan results found in database for this scan ID');
      }

      // Process scan results into the expected format (keyed by vehicle ID)
      const resultsMap: Record<string, any> = {};

      // Ensure proper status values for historical data
      for (const result of scanResultsData) {
        console.error(`🔍 Processing result for vehicle: ${result.carbiz_vehicle_id}`);

        // Check if all_comparable_details exists and what type it is
        console.error('🔍 all_comparable_details type:', typeof result.all_comparable_details);
        console.error('🔍 all_comparable_details is null/undefined:', !result.all_comparable_details);

        // Always ensure all_comparable_details is an array
        if (!result.all_comparable_details) {
          result.all_comparable_details = [];
          console.error('⚠️ all_comparable_details was missing, set to empty array');
        } else if (typeof result.all_comparable_details === 'string') {
          try {
            console.error('⚠️ all_comparable_details is a string, parsing to JSON');
            result.all_comparable_details = JSON.parse(result.all_comparable_details);
          } catch (e) {
            console.error('❌ Error parsing all_comparable_details:', e);
            result.all_comparable_details = [];
          }
        } else if (!Array.isArray(result.all_comparable_details)) {
          console.error('⚠️ all_comparable_details is not an array, converting');
          // If it's an object but not an array, convert to array with that object
          result.all_comparable_details = [result.all_comparable_details];
        }

        console.error('✅ Final all_comparable_details:', result.all_comparable_details);

        // Make sure statuses are set correctly for display
        if (result.market_avg_price || (result.comparable_listings_found > 0)) {
          result.status_for_vehicle = 'success';
        } else if (result.error_details_for_vehicle) {
          result.status_for_vehicle = 'error';
        } else if (result.status_for_vehicle === 'no_data_found') {
          // Keep as is
        } else {
          // Default to success for completed records with missing status
          result.status_for_vehicle = scanRequestData.status === 'completed' ? 'success' : 'error';
        }

        resultsMap[result.carbiz_vehicle_id] = result;
      }

      console.error('🔍 Processed results map:', resultsMap);
      console.error('🔍 Keys in results map:', Object.keys(resultsMap));

      // Set the historical scan details - use functional update to ensure clean state
      setSelectedHistoricalScanDetails(resultsMap);

      // If vehicle IDs exist in the request, try to get vehicle details from inventory
      if (scanRequestData.vehicle_ids_requested) {
        // Parse vehicle IDs if stored as a JSON string
        const vehicleIds = typeof scanRequestData.vehicle_ids_requested === 'string'
          ? JSON.parse(scanRequestData.vehicle_ids_requested)
          : scanRequestData.vehicle_ids_requested;

        // Get vehicle details from inventory
        const vehicleDetails = inventory
          .filter(car => vehicleIds.includes(car.id))
          .map(car => ({
            inventory_item_id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            mileage: car.mileage
          }));

        // Store these temporarily to render the results table
        setVehiclesInCurrentScan(vehicleDetails);
        console.error('🚗 Vehicle details set:', vehicleDetails);

        // Force open modal for the first vehicle with data
        if (vehicleDetails.length > 0) {
          console.error('🚗 Looking for a vehicle with results...');

          // Find first vehicle with results in the resultsMap
          const vehicleIds = Object.keys(resultsMap);
          console.error('🚗 Result map vehicle IDs:', vehicleIds);

          // Use the first vehicle from resultsMap if possible
          let selectedId = vehicleIds[0];

          // If not found, use the first vehicle from inventory
          if (!selectedId && vehicleDetails.length > 0) {
            selectedId = vehicleDetails[0].inventory_item_id;
            console.error('⚠️ No matching vehicle in results map, using first inventory vehicle:', selectedId);
          }

          if (selectedId) {
            console.error('✅ Setting selected vehicle for modal:', selectedId);

            // Set the selected vehicle
            setSelectedVehicleForDetails(selectedId);

            // Force open the modal with delay to ensure state updates first
            setTimeout(() => {
              console.error('🔄 Opening modal for vehicle:', selectedId);
              setIsDetailsModalOpen(true);
            }, 300);
          } else {
            console.error('❌ No valid vehicle ID found to open modal');
          }
        }
      }

      toast({
        title: "Historical Scan Loaded",
        description: `Viewing analysis from ${format(new Date(scanRequestData.created_at), 'PPp')}`,
      });
    } catch (err) {
      console.error('Error fetching historical scan details:', err);
      toast({
        title: "Error Loading Scan Details",
        description: "We couldn't load the selected analysis. Please try again.",
        variant: "destructive"
      });

      // Reset the selected historical scan
      setSelectedHistoricalScanId(null);
      setViewingHistorical(false);
    } finally {
      setIsLoadingHistoricalScanDetails(false);
    }
  };

  // Handler to return to active scan (if any) from historical view
  const returnToActiveScan = () => {
    // Ensure modal is closed to avoid confusion
    setIsDetailsModalOpen(false);
    setSelectedVehicleForDetails(null);

    // Clear historical view state
    setViewingHistorical(false);
    setSelectedHistoricalScanId(null);
    setSelectedHistoricalScanDetails({});

    toast({
      title: "Returned to Active Scan",
      description: "Now viewing your current market analysis.",
    });
  };

  // Modified handleDismissScanResults to handle both active and historical views
  const handleDismissScanResults = () => {
    // If viewing historical, just return to normal view
    if (viewingHistorical) {
      returnToActiveScan();
      return;
    }

    // Otherwise, clear the active scan as before
    localStorage.removeItem('active_market_scan_id');
    resetScanState();

    toast({
      title: "Analysis Dismissed",
      description: "The market analysis results have been dismissed."
    });
  };

  // Function to reset all scan-related state
  const resetScanState = () => {
    setActiveScanRequestId(null);
    setScanRequestStatus(null);
    setScanRequestError(null);
    setVehiclesInCurrentScan(null);
    setVehicleScanResults({});
    cleanupRealtimeSubscriptions();
  };

  // Function to set up Supabase Realtime subscriptions
  const setupRealtimeSubscriptions = (scanRequestId: string, currentUserId: string) => {
    // First clean up any existing subscriptions
    cleanupRealtimeSubscriptions();

    // Create new subscriptions
    const scanRequestsChannel = supabase
      .channel(`scan-requests-${scanRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'market_scan_requests',
          filter: `scan_request_id=eq.${scanRequestId}`,
        },
        (payload) => {
          const scanData = payload.new;
          setScanRequestStatus(scanData.status);
          setScanRequestError(scanData.error_message);

          // If scan is completed or failed, you might want to show a toast
          if (scanData.status === 'completed') {
            toast({
              title: "Market Analysis Complete",
              description: "Your market analysis has completed successfully.",
            });
          } else if (scanData.status === 'failed') {
            toast({
              title: "Market Analysis Failed",
              description: scanData.error_message || "An error occurred during analysis.",
              variant: "destructive"
            });
          }
        }
      )
      .subscribe();

    const scanResultsChannel = supabase
      .channel(`scan-results-${scanRequestId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for INSERT and UPDATE
          schema: 'public',
          table: 'market_scan_results',
          filter: `scan_request_id=eq.${scanRequestId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const resultData = payload.new;
            setVehicleScanResults(prev => ({
              ...prev,
              [resultData.carbiz_vehicle_id]: resultData,
            }));
          }
        }
      )
      .subscribe();

    // Store references to subscriptions for cleanup
    realTimeSubscriptionsRef.current.push(scanRequestsChannel);
    realTimeSubscriptionsRef.current.push(scanResultsChannel);
  };

  // Function to clean up all Supabase Realtime subscriptions
  const cleanupRealtimeSubscriptions = () => {
    realTimeSubscriptionsRef.current.forEach(subscription => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    });
    realTimeSubscriptionsRef.current = [];
  };

  // Market Analysis Components
  // 1. Market Analysis Trigger Button - Modified to prevent redundant UI
  const MarketAnalysisTriggerButton = () => {
    // Only show button if there are selected listings AND no active scan is in progress
    const isDisabled = selectedListingIds.length === 0 || isAnalysisButtonLoading ||
      (activeScanRequestId !== null && scanRequestStatus === 'processing') ||
      isFetchingPersistedScan;

    // Don't show the button if there's already an active scan being displayed
    if (activeScanRequestId !== null && vehicleScanResults && Object.keys(vehicleScanResults).length > 0) {
      return null;
    }

    return (
      <Button
        onClick={handleInitiateMarketAnalysis}
        disabled={isDisabled}
        className="mb-4 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
      >
        {isAnalysisButtonLoading || isFetchingPersistedScan ? (
          <ReloadIcon className="h-4 w-4 animate-spin" />
        ) : (
          <PresentationChartLineIcon className="h-5 w-5" />
        )}
        Analyze Market & Prices
      </Button>
    );
  };

  // 2. Scan Overall Status Display - Modified to include dismiss button
  const ScanOverallStatusDisplay = () => {
    // For historical view
    if (viewingHistorical && selectedHistoricalScanId) {
      const selectedScan = historicalScans.find(scan => scan.scan_request_id === selectedHistoricalScanId);
      if (!selectedScan) return null;

      // Calculate stats for historical view
      const totalVehicles = vehiclesInCurrentScan?.length || 0;
      const processedVehicles = Object.keys(selectedHistoricalScanDetails).length;
      const successVehicles = Object.values(selectedHistoricalScanDetails)
        .filter(result => result.status_for_vehicle === 'success').length;
      const errorVehicles = Object.values(selectedHistoricalScanDetails)
        .filter(result => result.status_for_vehicle === 'error').length;
      const noDataVehicles = Object.values(selectedHistoricalScanDetails)
        .filter(result => result.status_for_vehicle === 'no_data_found').length;

      return (
        <Alert className="mb-4 border-l-4 border-purple-500">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <AlertTitle className="flex items-center gap-2 text-purple-600">
                <ChartBarIcon className="h-5 w-5" />
                Historical Analysis
                <Badge className="bg-purple-100 text-purple-800">
                  {selectedScan.status === 'completed'
                    ? 'Completed'
                    : selectedScan.status === 'partially_failed'
                      ? 'Partial Results'
                      : 'Failed'}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2 text-sm">
                <div className="font-medium text-gray-700">Analysis from {format(new Date(selectedScan.created_at), 'PPp')}</div>
                <div className="mt-1">
                  <span className="inline-block mr-3">
                    <span className="font-medium">Vehicles:</span> {processedVehicles} analyzed / {totalVehicles} total
                  </span>
                  {successVehicles > 0 && (
                    <Badge className="mr-2 bg-green-50 text-green-700">{successVehicles} successful</Badge>
                  )}
                  {errorVehicles > 0 && (
                    <Badge className="mr-2 bg-red-50 text-red-700">{errorVehicles} failed</Badge>
                  )}
                  {noDataVehicles > 0 && (
                    <Badge className="mr-2 bg-yellow-50 text-yellow-700">{noDataVehicles} no data</Badge>
                  )}
                </div>
                {selectedScan.error_message && (
                  <div className="mt-2 text-red-500">
                    <ExclamationTriangleIcon className="inline h-4 w-4 mr-1" />
                    Error: {selectedScan.error_message}
                  </div>
                )}
              </AlertDescription>
            </div>
            <div className="mt-2 md:mt-0 space-x-2">
              {activeScanRequestId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={returnToActiveScan}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1" />
                  Back to Live Scan
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismissScanResults}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Dismiss
              </Button>
            </div>
          </div>
        </Alert>
      );
    }

    // For active scan (original functionality)
    if (!activeScanRequestId) return null;

    // Calculate stats for active scan
    const totalVehicles = vehiclesInCurrentScan?.length || 0;
    const processedVehicles = Object.keys(vehicleScanResults).length;
    const successVehicles = Object.values(vehicleScanResults).filter(result => result.status_for_vehicle === 'success').length;
    const errorVehicles = Object.values(vehicleScanResults).filter(result => result.status_for_vehicle === 'error').length;
    const noDataVehicles = Object.values(vehicleScanResults).filter(result => result.status_for_vehicle === 'no_data_found').length;

    // Status badges
    const getStatusBadge = (status: string | null) => {
      switch (status) {
        case 'processing':
          return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
        case 'completed':
          return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
        case 'partially_failed':
          return <Badge className="bg-yellow-100 text-yellow-800">Partially Completed</Badge>;
        case 'failed':
          return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
        default:
          return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      }
    };

    return (
      <Alert className="mb-4 border-l-4 border-blue-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <AlertTitle className="flex items-center gap-2 text-blue-600">
              <ChartBarIcon className="h-5 w-5" />
              Live Market Analysis {getStatusBadge(scanRequestStatus)}
            </AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              <div className="font-medium text-gray-700">Scan ID: {activeScanRequestId}</div>
              <div className="mt-1">
                <span className="inline-block mr-3">
                  <span className="font-medium">Vehicles:</span> {processedVehicles} processed / {totalVehicles} total
                </span>
                {successVehicles > 0 && (
                  <Badge className="mr-2 bg-green-50 text-green-700">{successVehicles} successful</Badge>
                )}
                {errorVehicles > 0 && (
                  <Badge className="mr-2 bg-red-50 text-red-700">{errorVehicles} failed</Badge>
                )}
                {noDataVehicles > 0 && (
                  <Badge className="mr-2 bg-yellow-50 text-yellow-700">{noDataVehicles} no data</Badge>
                )}
              </div>
              {scanRequestError && (
                <div className="mt-2 text-red-500">
                  <ExclamationTriangleIcon className="inline h-4 w-4 mr-1" />
                  Error: {scanRequestError}
                </div>
              )}
            </AlertDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 md:mt-0"
            onClick={handleDismissScanResults}
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Dismiss
          </Button>
        </div>
      </Alert>
    );
  };

  // 3. Active Analysis Results Table
  const ActiveAnalysisResultsTable = () => {
    // Choose which data source to use
    const currentResults = viewingHistorical ? selectedHistoricalScanDetails : vehicleScanResults;
    const scanRequestId = viewingHistorical ? selectedHistoricalScanId : activeScanRequestId;

    if (!scanRequestId || !vehiclesInCurrentScan) return null;

    const formatCurrency = (value: number | null) => {
      if (value === null || value === undefined) return '—';
      return new Intl.NumberFormat('de-CH', {
        style: 'currency',
        currency: 'CHF',
        maximumFractionDigits: 0
      }).format(value);
    };

    const getStatusBadge = (vehicleId: string) => {
      const result = currentResults[vehicleId];
      if (!result) {
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      }

      switch (result.status_for_vehicle) {
        case 'success':
          return <Badge className="bg-green-100 text-green-800">Success</Badge>;
        case 'error':
          return <Badge className="bg-red-100 text-red-800">Error</Badge>;
        case 'no_data_found':
          return <Badge className="bg-yellow-100 text-yellow-800">No Data Found</Badge>;
        case 'processing':
          return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
        default:
          return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
      }
    };

    return (
      <div className={`bg-white rounded-lg shadow-sm border ${viewingHistorical ? 'border-purple-200' : 'border-gray-200'} mb-6 overflow-hidden`}>
        <div className={`p-4 border-b ${viewingHistorical ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
          <h3 className="text-lg font-semibold text-gray-800">
            {viewingHistorical ? 'Historical Analysis Results' : 'Market Analysis Results'}
          </h3>
          <p className="text-sm text-gray-600">
            {viewingHistorical
              ? 'Results from your past market analysis'
              : 'Real-time results for your selected vehicles'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Make</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Avg. Market Price</TableHead>
                <TableHead>Listings Found</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehiclesInCurrentScan.map((vehicle) => {
                const result = currentResults[vehicle.inventory_item_id];
                return (
                  <TableRow key={vehicle.inventory_item_id}>
                    <TableCell>{vehicle.make}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{new Intl.NumberFormat('de-CH').format(vehicle.mileage)} km</TableCell>
                    <TableCell>{getStatusBadge(vehicle.inventory_item_id)}</TableCell>
                    <TableCell>
                      {result?.market_avg_price
                        ? formatCurrency(result.market_avg_price)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {result?.comparable_listings_found !== undefined
                        ? result.comparable_listings_found
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Always allow opening the modal in historical view
                          setSelectedVehicleForDetails(vehicle.inventory_item_id);
                          console.log('Opening modal from table for vehicle:', vehicle.inventory_item_id);
                          setTimeout(() => {
                            setIsDetailsModalOpen(true);
                          }, 50);
                        }}
                        // For historical scans, enable the button even without results
                        disabled={!viewingHistorical && (!result || (result.status_for_vehicle !== 'success' && result.status_for_vehicle !== 'error'))}
                      >
                        {result?.status_for_vehicle === 'error' ? 'View Error' : 'View Details'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // 4. Market Analysis Details Modal
  const MarketAnalysisDetailsModal = () => {
    console.error('🔄 Modal rendering with isDetailsModalOpen:', isDetailsModalOpen);
    console.error('🔄 selectedVehicleForDetails:', selectedVehicleForDetails);
    console.error('🔄 viewingHistorical:', viewingHistorical);
    console.error('🔄 selectedHistoricalScanId:', selectedHistoricalScanId);

    // Safe currency formatter that handles undefined/null values
    const safeFormatCurrency = (value?: number | null, currencyCode?: string | null) => {
      if (value === undefined || value === null) return '—';
      try {
        return new Intl.NumberFormat('de-CH', {
          style: 'currency',
          currency: currencyCode || 'CHF',
          maximumFractionDigits: 0
        }).format(value);
      } catch (e) {
        console.error('Error formatting currency:', e);
        return value?.toString() || '—';
      }
    };

    // Handle both active and historical views
    const currentResults = viewingHistorical ? selectedHistoricalScanDetails : vehicleScanResults;
    console.error('🔄 currentResults:', currentResults);
    console.error('🔄 selectedHistoricalScanDetails keys:', Object.keys(selectedHistoricalScanDetails));
    console.error('🔄 vehicleScanResults keys:', Object.keys(vehicleScanResults));

    if (!selectedVehicleForDetails || !isDetailsModalOpen) {
      console.error('❌ Modal not showing: missing vehicle ID or modal not open');
      return null;
    }

    console.error('🔄 Looking for vehicle details for ID:', selectedVehicleForDetails);

    // Get vehicle details, or create a placeholder if not found
    let vehicleDetails = vehiclesInCurrentScan?.find(
      v => v.inventory_item_id === selectedVehicleForDetails
    );

    console.error('🔄 Found vehicle details:', !!vehicleDetails);

    const scanResult = currentResults[selectedVehicleForDetails];
    console.error('🔄 scanResult found:', !!scanResult);

    if (scanResult) {
      console.error('🔄 scanResult properties:', Object.keys(scanResult));

      // Ensure all_comparable_details is properly formatted
      if (!scanResult.all_comparable_details) {
        console.error('⚠️ all_comparable_details is missing or null, creating empty array');
        scanResult.all_comparable_details = [];
      } else if (typeof scanResult.all_comparable_details === 'string') {
        try {
          console.error('⚠️ all_comparable_details is still a string, parsing again...');
          scanResult.all_comparable_details = JSON.parse(scanResult.all_comparable_details);
        } catch (e) {
          console.error('❌ Error parsing all_comparable_details in modal:', e);
          scanResult.all_comparable_details = [];
        }
      }

      console.error('✅ Final all_comparable_details in modal:',
        Array.isArray(scanResult.all_comparable_details) ? scanResult.all_comparable_details.length + ' items' : typeof scanResult.all_comparable_details);
    } else {
      console.error('❌ No scan result found for vehicle:', selectedVehicleForDetails);
    }

    // If no vehicle details but we have scan results, create a placeholder
    if (!vehicleDetails && scanResult) {
      console.log('Creating placeholder vehicle details');
      vehicleDetails = {
        inventory_item_id: selectedVehicleForDetails,
        make: scanResult.make || 'Unknown',
        model: scanResult.model || 'Vehicle',
        year: scanResult.year || new Date().getFullYear(),
        mileage: scanResult.mileage || 0
      };
    } else if (!vehicleDetails) {
      console.log('No vehicle details and no scan results');
      return null;
    }

    return (
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[95vh] overflow-y-auto">
          <div className={`px-6 py-4 border-b ${viewingHistorical ? 'border-purple-200' : 'border-gray-200'}`}>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <PresentationChartLineIcon className={`h-6 w-6 mr-2 ${viewingHistorical ? 'text-purple-600' : 'text-blue-600'}`} />
              {viewingHistorical ? 'Historical Analysis' : 'Market Analysis'}: {vehicleDetails.make} {vehicleDetails.model} ({vehicleDetails.year})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {vehicleDetails.mileage.toLocaleString()} km | Scan ID: {viewingHistorical ? selectedHistoricalScanId : activeScanRequestId}
            </p>
          </div>

          <div className="p-6">
            {/* Only show loading state for non-historical views when scanResult is missing */}
            {!scanResult && !viewingHistorical && (
              <div className="text-center py-12">
                <ReloadIcon className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                <p className="mt-4 text-gray-600">Analysis in progress. Results will appear here once complete.</p>
              </div>
            )}

            {/* For historical views without scanResult, show a more appropriate message */}
            {(() => {
              console.error('🔍 Evaluating no data condition:', {
                scanResult: !!scanResult,
                viewingHistorical,
                selectedVehicleForDetails,
                hasResultsMap: Object.keys(currentResults).length > 0
              });
              return (!scanResult && viewingHistorical);
            })() && (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="h-8 w-8 mx-auto text-amber-500" />
                  <p className="mt-4 text-gray-600">No data available for this historical scan.</p>
                </div>
              )}

            {scanResult?.status_for_vehicle === 'error' && (
              <Alert variant="destructive" className="mb-6">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <AlertTitle>Analysis Error</AlertTitle>
                <AlertDescription>
                  {scanResult.error_details_for_vehicle || 'An unknown error occurred during analysis.'}
                </AlertDescription>
              </Alert>
            )}

            {scanResult?.status_for_vehicle === 'no_data_found' && (
              <Alert className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-800">
                <InformationCircleIcon className="h-5 w-5" />
                <AlertTitle>No Comparable Listings Found</AlertTitle>
                <AlertDescription>
                  We couldn't find any comparable listings for this vehicle in our data sources.
                  This could be due to the vehicle's unique specifications or limited market data.
                </AlertDescription>
              </Alert>
            )}

            {/* Always render content for historical view or if status is success */}
            {scanResult && (viewingHistorical || scanResult?.status_for_vehicle === 'success') && (
              <>
                {/* Price Range Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-600 font-medium">Minimum Market Price</div>
                    <div className="text-2xl font-bold mt-1">
                      {safeFormatCurrency(scanResult?.market_min_price, scanResult?.currency)}
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                    <div className="text-sm text-emerald-600 font-medium">Average Market Price</div>
                    <div className="text-2xl font-bold mt-1">
                      {safeFormatCurrency(scanResult?.market_avg_price, scanResult?.currency)}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <div className="text-sm text-purple-600 font-medium">Maximum Market Price</div>
                    <div className="text-2xl font-bold mt-1">
                      {safeFormatCurrency(scanResult?.market_max_price, scanResult?.currency)}
                    </div>
                  </div>
                </div>

                {/* Analysis Info Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                  <h3 className="text-md font-semibold text-gray-700 mb-2">Analysis Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Listings Found:</span>{' '}
                      <span className="font-medium">{scanResult?.comparable_listings_found ?? 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Data Source:</span>{' '}
                      <span className="font-medium">{scanResult?.data_source || 'Multiple Sources'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Scanned At:</span>{' '}
                      <span className="font-medium">{scanResult?.scanned_at ? format(new Date(scanResult.scanned_at), 'PPp') : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Example Listings URLs */}
                {scanResult?.example_listing_urls && scanResult.example_listing_urls.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Sample Listings</h3>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                      {scanResult.example_listing_urls.map((url: string, index: number) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline break-all"
                        >
                          <LinkIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="text-sm">Listing #{index + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comparable Listings Table */}
                {(() => {
                  console.log('Evaluating comparable listings condition:', {
                    hasDetails: !!scanResult?.all_comparable_details,
                    isArray: Array.isArray(scanResult?.all_comparable_details),
                    length: scanResult?.all_comparable_details ? scanResult.all_comparable_details.length : 0
                  });
                  return scanResult?.all_comparable_details &&
                    Array.isArray(scanResult.all_comparable_details) &&
                    scanResult.all_comparable_details.length > 0;
                })() && (
                    <div>
                      <h3 className="text-md font-semibold text-gray-700 mb-2">Comparable Listings</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Year</TableHead>
                                <TableHead>Mileage</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(scanResult?.all_comparable_details || []).map((listing: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{listing.title || 'N/A'}</TableCell>
                                  <TableCell>
                                    {listing.price_numeric
                                      ? safeFormatCurrency(listing.price_numeric, scanResult?.currency)
                                      : 'N/A'}
                                  </TableCell>
                                  <TableCell>{listing.year_numeric || 'N/A'}</TableCell>
                                  <TableCell>
                                    {listing.mileage_numeric
                                      ? `${new Intl.NumberFormat('de-CH').format(listing.mileage_numeric)} km`
                                      : 'N/A'}
                                  </TableCell>
                                  <TableCell>{listing.location || 'N/A'}</TableCell>
                                  <TableCell>
                                    {(listing.fuel_type || listing.transmission) && (
                                      <span className="text-sm text-gray-600">
                                        {listing.fuel_type}{listing.fuel_type && listing.transmission ? ', ' : ''}
                                        {listing.transmission}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {listing.full_listing_url && (
                                      <a
                                        href={listing.full_listing_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        <LinkIcon className="h-4 w-4" />
                                      </a>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t flex justify-end">
            <Button
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Create a Historical Scans Panel component
  const HistoricalScansPanel = () => {
    // If no userId or we're in the middle of an active scan and not viewing historical, don't show
    if (!userId || (isFetchingPersistedScan && !viewingHistorical)) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={() => setIsHistoricalPanelExpanded(!isHistoricalPanelExpanded)}
        >
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Analysis History</h3>
            {historicalScans.length > 0 && (
              <Badge className="ml-2 bg-blue-50 text-blue-800">{historicalScans.length}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="p-1">
            {isHistoricalPanelExpanded ? (
              <ChevronDownIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </Button>
        </div>

        {isHistoricalPanelExpanded && (
          <div className="p-4 border-t border-gray-200">
            {isLoadingHistoricalScans ? (
              <div className="flex justify-center py-8">
                <ReloadIcon className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : historicalScans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <InformationCircleIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No past analyses found. Complete your first market analysis to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historicalScans.map((scan) => (
                  <div
                    key={scan.scan_request_id}
                    className={`p-3 rounded-lg border ${selectedHistoricalScanId === scan.scan_request_id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      } transition-colors cursor-pointer`}
                    onClick={() => {
                      // First fetch the historical scan details
                      fetchHistoricalScanDetails(scan.scan_request_id);
                      // Ensure we're displaying historical view
                      setViewingHistorical(true);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-800">
                          {scan.summary_text || format(new Date(scan.created_at), 'PPp')}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {format(new Date(scan.created_at), 'PPp')}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge className={`mr-2 ${scan.status === 'completed'
                          ? 'bg-green-50 text-green-700'
                          : scan.status === 'partially_failed'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-red-50 text-red-700'
                          }`}>
                          {scan.status === 'completed'
                            ? 'Completed'
                            : scan.status === 'partially_failed'
                              ? 'Partial Results'
                              : 'Failed'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent div onClick

                            // EXTREME DEBUGGING
                            console.error('🔴 View Details button clicked for scan:', scan.scan_request_id);

                            // Force visibility in browser
                            window.alert('View Details clicked for scan: ' + scan.scan_request_id);

                            // Call function directly
                            fetchHistoricalScanDetails(scan.scan_request_id);
                          }}
                          disabled={isLoadingHistoricalScanDetails && selectedHistoricalScanId === scan.scan_request_id}
                        >
                          {isLoadingHistoricalScanDetails && selectedHistoricalScanId === scan.scan_request_id ? (
                            <ReloadIcon className="h-3 w-3 animate-spin" />
                          ) : (
                            'View Details'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Add the missing fetchPersistedScanData function after fetchHistoricalScans
  // Function to fetch persisted scan data from Supabase
  const fetchPersistedScanData = async (scanRequestId: string, currentUserId: string) => {
    try {
      // 1. Fetch the scan request details
      const { data: scanRequestData, error: scanRequestError } = await supabase
        .from('market_scan_requests')
        .select('*')
        .eq('scan_request_id', scanRequestId)
        .eq('user_id', currentUserId)
        .single();

      if (scanRequestError) throw scanRequestError;

      if (!scanRequestData) {
        // No scan found - clear localStorage
        localStorage.removeItem('active_market_scan_id');
        return;
      }

      // Update scan status state
      setScanRequestStatus(scanRequestData.status);
      setScanRequestError(scanRequestData.error_message);

      // If scan has vehicle IDs, parse and set them
      if (scanRequestData.vehicle_ids_requested) {
        // Parse vehicles if stored as JSON string, or use directly if already an array
        const vehicleIds = typeof scanRequestData.vehicle_ids_requested === 'string'
          ? JSON.parse(scanRequestData.vehicle_ids_requested)
          : scanRequestData.vehicle_ids_requested;

        // Fetch vehicle details for these IDs from inventory
        const vehicleDetails = inventory
          .filter(car => vehicleIds.includes(car.id))
          .map(car => ({
            inventory_item_id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            mileage: car.mileage
          }));

        setVehiclesInCurrentScan(vehicleDetails);
      }

      // 2. Fetch the scan results
      const { data: scanResultsData, error: scanResultsError } = await supabase
        .from('market_scan_results')
        .select('*')
        .eq('scan_request_id', scanRequestId)
        .eq('user_id', currentUserId);

      if (scanResultsError) throw scanResultsError;

      // Process scan results into the expected format
      const resultsMap: Record<string, any> = {};
      scanResultsData.forEach(result => {
        resultsMap[result.carbiz_vehicle_id] = result;
      });

      setVehicleScanResults(resultsMap);

      // 3. Set up realtime subscriptions for this scan
      setupRealtimeSubscriptions(scanRequestId, currentUserId);

    } catch (err) {
      console.error('Error fetching persisted scan data:', err);
      toast({
        title: "Error Loading Saved Analysis",
        description: "We couldn't load your previously saved analysis. Starting fresh.",
        variant: "destructive"
      });

      // Clear invalid scan data
      localStorage.removeItem('active_market_scan_id');
      resetScanState();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <Button onClick={() => openModal('create')} disabled={userLoading}>
          {userLoading ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" /> : <PlusIcon className="h-4 w-4 mr-2" />}
          Add New Vehicle
        </Button>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Input placeholder="Make" name="make" value={filters.make} onChange={handleFilterChange} />
          <Input placeholder="Model" name="model" value={filters.model} onChange={handleFilterChange} />
          <Input placeholder="Year" name="year" type="number" value={filters.year} onChange={handleFilterChange} />
          {/* --- FIX: Corrected Filter Select --- */}
          <Select name="status" value={filters.status} onValueChange={(value) => handleFilterSelectChange('status', value || '')}>
            <SelectTrigger><SelectValue placeholder="Any Status" /></SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="">Any Status</SelectItem> <-- REMOVED */}
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
          <Select name="listing_type" value={filters.listing_type} onValueChange={(value) => handleFilterSelectChange('listing_type', value || '')}>
            <SelectTrigger><SelectValue placeholder="Any Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">For Sale</SelectItem>
              <SelectItem value="rent">For Rent</SelectItem>
              <SelectItem value="both">Sale or Rent</SelectItem>
            </SelectContent>
          </Select>
          {/* --- END FIX --- */}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
        </div>
      </div>

      {/* Send Listings To Partners Panel - Now Collapsible */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        >
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-700">Send Listings To Partners</h2>
            <Badge variant="outline" className="ml-2 bg-blue-50">
              {selectedListingIds.length} {selectedListingIds.length === 1 ? 'listing' : 'listings'} selected
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
              {/* Channels Multiselect - unchanged */}
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

              {/* Trust Levels Multiselect - unchanged */}
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

              {/* Manual Contacts - unchanged */}
              <div>
                <Label htmlFor="manual-contacts">Manual Contacts (comma-separated)</Label>
                <Input
                  id="manual-contacts"
                  placeholder="email@example.com, +1234567890"
                  value={manualContacts}
                  onChange={(e) => setManualContacts(e.target.value)}
                />
              </div>

              {/* Share button - Now aligned with inputs */}
              <div className="flex items-end">
                <Button
                  id="share-button"
                  onClick={handleShareListings}
                  disabled={isSharing || selectedListingIds.length === 0}
                  className="w-full mb-1"
                >
                  {isSharing ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" /> : null}
                  Share Listings
                </Button>
              </div>

              {/* Partners selection - Now a separate row for better visual balance */}
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

            {/* Add the new Shared Listings History section below */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div
                className="flex items-center justify-between cursor-pointer mb-3"
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              >
                <div className="flex items-center">
                  <h3 className="text-md font-semibold text-gray-700">
                    📤 Shared Listings History
                  </h3>
                  {!isHistoryLoading && sharedListingsHistory.length > 0 && (
                    <Badge variant="outline" className="ml-2 bg-blue-50">
                      {sharedListingsHistory.length} {sharedListingsHistory.length === 1 ? 'record' : 'records'}
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
                      <ArrowPathIcon className="animate-spin h-5 w-5 text-gray-500" />
                    </div>
                  ) : sharedListingsHistory.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md">
                      No sharing history found. When you share listings, they will appear here.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {sharedListingsHistory.map((record) => (
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
                              <span className="text-gray-500">Listings:</span>{' '}
                              {record.make && record.model && record.year && record.listing_url ? (
                                <a
                                  href={record.listing_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {record.make} {record.model} ({record.year})
                                </a>
                              ) : record.listing_ids?.length ? (
                                <span>{record.listing_ids.length} listings</span>
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
                      onClick={fetchSharedListingsHistory}
                      disabled={isHistoryLoading}
                    >
                      {isHistoryLoading ? (
                        <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                      ) : (
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
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

      {/* Bulk Actions Panel - Only visible when listings are selected */}
      {selectedListingIds.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-blue-200">
          <div className="flex items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-700">Bulk Actions</h2>
            <Badge variant="outline" className="ml-2 bg-blue-50">
              {selectedListingIds.length} {selectedListingIds.length === 1 ? 'listing' : 'listings'} selected
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Make Public/Private */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Visibility</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-gray-50 hover:bg-green-50"
                  onClick={() => togglePublicStatus(true)}
                  disabled={isPerformingBulkAction}
                >
                  Make Public
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-gray-50 hover:bg-gray-100"
                  onClick={() => togglePublicStatus(false)}
                  disabled={isPerformingBulkAction}
                >
                  Make Private
                </Button>
              </div>
            </div>

            {/* Mark as Sold/Available */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-gray-50 hover:bg-red-50"
                  onClick={() => toggleSoldStatus(true)}
                  disabled={isPerformingBulkAction}
                >
                  Mark as Sold
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-gray-50 hover:bg-green-50"
                  onClick={() => toggleSoldStatus(false)}
                  disabled={isPerformingBulkAction}
                >
                  Mark Available
                </Button>
              </div>
            </div>

            {/* Update Listing Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Listing Type</Label>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-gray-50 hover:bg-blue-50"
                onClick={openListingTypeModal}
                disabled={isPerformingBulkAction}
              >
                Update Listing Type
              </Button>
            </div>

            {/* Special Offer */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Special Offer</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-gray-50 hover:bg-amber-50"
                  onClick={openSpecialOfferModal}
                  disabled={isPerformingBulkAction}
                >
                  Add Special Offer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-gray-50 hover:bg-gray-100"
                  onClick={removeSpecialOffer}
                  disabled={isPerformingBulkAction}
                >
                  Remove
                </Button>
              </div>
            </div>

            {/* Price Change */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Price</Label>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-gray-50 hover:bg-purple-50"
                onClick={openPriceChangeModal}
                disabled={isPerformingBulkAction}
              >
                Update Price
              </Button>
            </div>
          </div>

          {isPerformingBulkAction && (
            <div className="mt-4 flex items-center justify-center text-sm text-blue-600">
              <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
              Updating listings... Please wait.
            </div>
          )}
        </div>
      )}

      {/* Inventory Table / Loading / Error State */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading inventory...</div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
            <p><ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />Error: {error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* New checkbox column */}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAllChange}
                      aria-label="Select all"
                    />
                  </th>
                  {/* Make Headers Clickable for Sorting */}
                  {['make', 'model', 'year', 'price', 'status', 'mileage', 'listing_type', 'shared_with', 'listing_views', 'created_at'].map(field => (
                    <th key={field}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => field !== 'shared_with' ? handleSort(field as keyof CarListing | 'listing_views') : null}
                    >
                      {field.replace('_', ' ').replace('listing views', 'views').replace('shared with', 'shared with')} {/* Basic formatting */}
                      {sortField === field && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-500">No vehicles found.</td></tr>
                ) : (
                  inventory.map(car => (
                    <tr
                      key={car.id}
                      className={`hover:bg-gray-50 transition-colors ${car.is_public === false ? 'bg-gray-100' : ''}`}
                    >
                      {/* Checkbox Cell */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <Checkbox
                          checked={selectedListingIds.includes(car.id)}
                          onCheckedChange={(checked) => handleCheckboxChange(car.id, checked === true)}
                          aria-label={`Select ${car.make} ${car.model}`}
                        />
                      </td>
                      {/* Table Data Cells */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{car.make}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{car.model}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{car.year}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(car.price)}
                      </td>                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${car.status === 'available' ? 'bg-green-100 text-green-800' :
                          car.status === 'sold' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}`}>
                          {car.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {new Intl.NumberFormat('de-CH').format(car.mileage)} km
                      </td>                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">{car.listing_type}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {car.shared_with_trust_levels && car.shared_with_trust_levels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {car.shared_with_trust_levels.map(level => (
                              <Badge
                                key={level}
                                variant="secondary"
                                className="flex items-center gap-1 capitalize"
                              >
                                {level}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Not Shared
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">{car.listing_views?.[0]?.count ?? 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{format(new Date(car.created_at), 'PP')}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewCar(car)} title="View Details"><EyeIcon className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditCar(car)} title="Edit Vehicle"><PencilIcon className="h-4 w-4" /></Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(car)}
                            className={car.status === 'available' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}
                          >
                            {car.status === 'available' ? 'Mark as Sold' : 'Mark as Unsold'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Improved Vehicle Modal --- */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-4xl w-full max-h-[95vh] overflow-y-auto p-0">
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b z-10 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {modalMode === 'create' ? 'Add New Vehicle' :
                modalMode === 'edit' ? 'Edit Vehicle' : 'View Vehicle Details'}
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
                {/* Image Gallery */}
                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-2">Images</h3>
                  {/* FIX: Check length safely with optional chaining */}
                  {(currentCar.images?.length ?? 0) > 0 ? (
                    <div className="relative h-64 bg-gray-100 overflow-hidden rounded-lg group border">
                      {/* FIX: Map safely with optional chaining */}
                      {currentCar.images?.map((image, index) => (
                        <img
                          key={image || index} // Use URL as key if available
                          src={image}
                          alt={`${currentCar.make} ${currentCar.model} - view ${index + 1}`}
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out cursor-pointer ${(activeImageIndex[currentCar.id] || 0) === index ? 'opacity-100 z-10' : 'opacity-0'
                            }`}
                          onClick={() => openImageGallery(currentCar, index)} // Open full gallery
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Error'; }}
                        />
                      ))}
                      {/* FIX: Check length safely before rendering arrows/dots */}
                      {(currentCar.images?.length ?? 0) > 1 && (
                        <>
                          <button onClick={(e) => prevImage(e, currentCar.id, currentCar.images)} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/60" aria-label="Previous"><ArrowLeftIcon className="h-5 w-5" /></button>
                          <button onClick={(e) => nextImage(e, currentCar.id, currentCar.images)} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/60" aria-label="Next"><ArrowRightIcon className="h-5 w-5" /></button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5">
                            {/* FIX: Map safely */}
                            {currentCar.images?.map((_, index) => (<div key={index} className={`w-2 h-2 rounded-full transition-colors ${(activeImageIndex[currentCar.id] || 0) === index ? 'bg-white' : 'bg-white/50'}`} />))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 border"><PhotoIcon className="h-12 w-12" /></div>
                  )}
                </div>

                {/* Basic Details Section */}
                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-3">Vehicle Details</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
                    <DetailItem label="Make" value={currentCar.make} />
                    <DetailItem label="Model" value={currentCar.model} />
                    <DetailItem label="Year" value={currentCar.year} />
                    <DetailItem label="Price" value={new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(currentCar.price)} />
                    <DetailItem label="Status" value={currentCar.status} />
                    <DetailItem label="Mileage" value={`${new Intl.NumberFormat('de-CH').format(currentCar.mileage)} km`} />
                    <DetailItem label="Listing Type" value={currentCar.listing_type} />
                    <DetailItem label="Body Type" value={currentCar.body_type} />
                    <DetailItem label="Exterior Color" value={currentCar.exterior_color} />
                    <DetailItem label="Interior Color" value={currentCar.interior_color} />
                    <DetailItem label="Fuel Type" value={currentCar.fuel_type} />
                    <DetailItem label="Transmission" value={currentCar.transmission} />
                    <DetailItem label="Condition" value={currentCar.condition} />
                    <DetailItem label="Engine" value={currentCar.engine} />
                    <DetailItem label="VIN" value={currentCar.vin} />
                    <DetailItem label="Location" value={currentCar.location_city && currentCar.location_country ? `${currentCar.location_city}, ${currentCar.location_country}` : 'N/A'} />
                    <DetailItem label="Seller Name" value={currentCar.seller_name} />
                    <DetailItem label="Seller Since" value={currentCar.seller_since ? format(new Date(currentCar.seller_since), 'PP') : 'N/A'} />
                    <DetailItem label="Purchasing Price" value={currentCar.purchasing_price ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(currentCar.purchasing_price) : 'N/A'} />
                  </dl>
                </div>

                {/* Rental Info Section in View Mode */}
                {(currentCar.listing_type === 'rent' || currentCar.listing_type === 'both') && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-md font-semibold text-blue-800 mb-3">Rental Information</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
                      <DetailItem label="Daily Price" value={currentCar.rental_daily_price ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 }).format(currentCar.rental_daily_price) : 'N/A'} />
                      <DetailItem label="Deposit Required" value={currentCar.rental_deposit_required ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(currentCar.rental_deposit_required) : 'N/A'} />
                      <DetailItem label="Rental Status" value={currentCar.rental_status} />
                      <DetailItem label="Min Rental Days" value={currentCar.min_rental_days} />
                      <DetailItem label="Max Rental Days" value={currentCar.max_rental_days} />
                      <DetailItem label="Security Deposit" value={currentCar.rental_deposit ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(currentCar.rental_deposit) : 'N/A'} />
                    </dl>

                    {/* Hourly Rental Options */}
                    {currentCar.rental_available_durations && currentCar.rental_available_durations.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-blue-800 mb-2">Hourly Rental Options</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {currentCar.rental_available_durations.includes(3) && (
                            <div className="bg-white p-2 rounded border border-blue-100">
                              <span className="font-medium">3 Hours:</span>{' '}
                              {currentCar.rental_price_3h ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 }).format(currentCar.rental_price_3h) : 'N/A'}
                            </div>
                          )}
                          {currentCar.rental_available_durations.includes(6) && (
                            <div className="bg-white p-2 rounded border border-blue-100">
                              <span className="font-medium">6 Hours:</span>{' '}
                              {currentCar.rental_price_6h ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 }).format(currentCar.rental_price_6h) : 'N/A'}
                            </div>
                          )}
                          {currentCar.rental_available_durations.includes(12) && (
                            <div className="bg-white p-2 rounded border border-blue-100">
                              <span className="font-medium">12 Hours:</span>{' '}
                              {currentCar.rental_price_12h ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 }).format(currentCar.rental_price_12h) : 'N/A'}
                            </div>
                          )}
                          {currentCar.rental_available_durations.includes(24) && (
                            <div className="bg-white p-2 rounded border border-blue-100">
                              <span className="font-medium">24 Hours:</span>{' '}
                              {currentCar.rental_price_24h ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 }).format(currentCar.rental_price_24h) : 'N/A'}
                            </div>
                          )}
                          {currentCar.rental_available_durations.includes(48) && (
                            <div className="bg-white p-2 rounded border border-blue-100">
                              <span className="font-medium">48 Hours:</span>{' '}
                              {currentCar.rental_price_48h ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 }).format(currentCar.rental_price_48h) : 'N/A'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rental Policy */}
                    {currentCar.rental_policy && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-blue-800 mb-1">Rental Policy</h4>
                        <div className="bg-white p-3 rounded border border-blue-100 whitespace-pre-wrap text-sm">
                          {currentCar.rental_policy}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Description Section */}
                <div>
                  <h3 className="text-md font-semibold text-gray-700">Description</h3>
                  <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{currentCar.description || 'No description provided.'}</p>
                </div>

                {/* Features Section */}
                <div>
                  <h3 className="text-md font-semibold text-gray-700">Features</h3>
                  {/* FIX: Check length safely */}
                  {(currentCar.features?.length ?? 0) > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {/* FIX: Map safely */}
                      {currentCar.features?.map((feature, index) => (
                        <span key={feature || index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border">{feature}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">No features listed.</p>
                  )}
                </div>

                {/* Special Offer Details */}
                {currentCar?.is_special_offer && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold">Special Offer</h4>
                    <div className="mt-1 text-sm">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                        {currentCar.special_offer_label || 'Special Offer'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-5 border-t mt-6">
                  <Button variant="outline" onClick={closeModal}>Close</Button>
                  <Button onClick={() => openModal('edit', currentCar)}>Edit This Vehicle</Button>
                </div>
              </div>
            )}

            {/* --- CREATE/EDIT MODE --- */}
            {(modalMode === 'create' || modalMode === 'edit') && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Section */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><Label htmlFor="make">Make*</Label><Input id="make" name="make" value={formData.make} onChange={handleFormChange} placeholder="e.g., Toyota" className={formErrors.make ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.make}</p></div>
                    <div><Label htmlFor="model">Model*</Label><Input id="model" name="model" value={formData.model} onChange={handleFormChange} placeholder="e.g., Camry" className={formErrors.model ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.model}</p></div>
                    <div><Label htmlFor="year">Year*</Label><Input id="year" name="year" type="number" value={formData.year} onChange={handleFormChange} placeholder="e.g., 2021" className={formErrors.year ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.year}</p></div>
                    <div><Label htmlFor="price">Price*</Label><Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleFormChange} placeholder="e.g., 25000" className={formErrors.price ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.price}</p></div>
                    <div><Label htmlFor="mileage">Mileage*</Label><Input id="mileage" name="mileage" type="number" value={formData.mileage} onChange={handleFormChange} placeholder="e.g., 30000" className={formErrors.mileage ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.mileage}</p></div>
                    <div><Label htmlFor="vin">VIN</Label><Input id="vin" name="vin" value={formData.vin} onChange={handleFormChange} placeholder="Vehicle Identification Number" className={formErrors.vin ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.vin}</p></div>
                    <div><Label htmlFor="purchasing_price">Purchasing Price</Label><Input id="purchasing_price" name="purchasing_price" type="number" step="0.01" value={formData.purchasing_price} onChange={handleFormChange} placeholder="Optional" className={formErrors.purchasing_price ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.purchasing_price}</p></div>

                    {/* Selects moved here for better grouping */}
                    <div>
                      <Label htmlFor="condition">Condition*</Label>
                      <Select name="condition" value={formData.condition} onValueChange={(value) => handleSelectChange('condition', value)}>
                        <SelectTrigger className={formErrors.condition ? 'border-red-500' : ''}><SelectValue placeholder="Select condition" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="used">Used</SelectItem>
                          <SelectItem value="certified">Certified Pre-Owned</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-red-500 text-xs mt-1 h-4">{formErrors.condition}</p>
                    </div>
                    <div>
                      <Label htmlFor="status">Listing Status*</Label>
                      <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                        <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-red-500 text-xs mt-1 h-4">{formErrors.status}</p>
                    </div>
                    <div>
                      <Label htmlFor="listing_type">Listing Type*</Label>
                      <Select name="listing_type" value={formData.listing_type} onValueChange={(value) => handleSelectChange('listing_type', value)}>
                        <SelectTrigger className={formErrors.listing_type ? 'border-red-500' : ''}><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sale">For Sale</SelectItem>
                          <SelectItem value="rent">For Rent</SelectItem>
                          <SelectItem value="both">Sale or Rent</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-red-500 text-xs mt-1 h-4">{formErrors.listing_type}</p>
                    </div>
                  </div>
                </section>

                {/* Specifications Section */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><Label htmlFor="body_type">Body Type</Label><Input id="body_type" name="body_type" value={formData.body_type} onChange={handleFormChange} placeholder="e.g., Sedan, SUV" className={formErrors.body_type ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.body_type}</p></div>
                    <div><Label htmlFor="exterior_color">Exterior Color</Label><Input id="exterior_color" name="exterior_color" value={formData.exterior_color} onChange={handleFormChange} placeholder="e.g., Midnight Black" className={formErrors.exterior_color ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.exterior_color}</p></div>
                    <div><Label htmlFor="interior_color">Interior Color</Label><Input id="interior_color" name="interior_color" value={formData.interior_color} onChange={handleFormChange} placeholder="e.g., Charcoal Gray" className={formErrors.interior_color ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.interior_color}</p></div>
                    <div><Label htmlFor="engine">Engine</Label><Input id="engine" name="engine" value={formData.engine} onChange={handleFormChange} placeholder="e.g., 2.0L Turbo" className={formErrors.engine ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.engine}</p></div>
                    <div>
                      <Label htmlFor="fuel_type">Fuel Type*</Label>
                      <Select name="fuel_type" value={formData.fuel_type} onValueChange={(value) => handleSelectChange('fuel_type', value)}>
                        <SelectTrigger className={formErrors.fuel_type ? 'border-red-500' : ''}><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gasoline">Gasoline</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-red-500 text-xs mt-1 h-4">{formErrors.fuel_type}</p>
                    </div>
                    <div>
                      <Label htmlFor="transmission">Transmission*</Label>
                      <Select name="transmission" value={formData.transmission} onValueChange={(value) => handleSelectChange('transmission', value)}>
                        <SelectTrigger className={formErrors.transmission ? 'border-red-500' : ''}><SelectValue placeholder="Select transmission" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="automatic">Automatic</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="cvt">CVT</SelectItem>
                          <SelectItem value="dct">DCT</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-red-500 text-xs mt-1 h-4">{formErrors.transmission}</p>
                    </div>
                  </div>
                </section>

                {/* Location Section */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Location & Seller</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><Label htmlFor="location_city">City</Label><Input id="location_city" name="location_city" value={formData.location_city} onChange={handleFormChange} placeholder="City where vehicle is located" className={formErrors.location_city ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.location_city}</p></div>
                    <div><Label htmlFor="location_country">Country</Label><Input id="location_country" name="location_country" value={formData.location_country} onChange={handleFormChange} placeholder="Country (e.g., Germany)" className={formErrors.location_country ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.location_country}</p></div>
                    <div><Label htmlFor="seller_name">Seller Name</Label><Input id="seller_name" name="seller_name" value={formData.seller_name} onChange={handleFormChange} placeholder="Your name or dealership" className={formErrors.seller_name ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.seller_name}</p></div>
                    <div>
                      <Label htmlFor="seller_since">Seller Since</Label>
                      <div className="p-2 border rounded-md bg-muted/20 text-sm">
                        {sellerSince ? format(new Date(sellerSince), 'MMMM d, yyyy') : 'Not available'}
                      </div>
                      <input type="hidden" name="seller_since" value={sellerSince || ''} />
                    </div>
                  </div>
                </section>

                {/* Rental Information Section (Conditional) */}
                {(formData.listing_type === 'rent' || formData.listing_type === 'both') && (
                  <section className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 border-b border-blue-200 pb-2">Rental Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div><Label htmlFor="rental_daily_price">Daily Price*</Label><Input id="rental_daily_price" name="rental_daily_price" type="number" step="0.01" value={formData.rental_daily_price} onChange={handleFormChange} placeholder="e.g., 75.50" className={formErrors.rental_daily_price ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.rental_daily_price}</p></div>
                      <div><Label htmlFor="rental_deposit_required">Deposit Required</Label><Input id="rental_deposit_required" name="rental_deposit_required" type="number" step="0.01" value={formData.rental_deposit_required} onChange={handleFormChange} placeholder="e.g., 500" className={formErrors.rental_deposit_required ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.rental_deposit_required}</p></div>
                      <div><Label htmlFor="rental_status">Rental Status*</Label>
                        <Select name="rental_status" value={formData.rental_status} onValueChange={(value) => handleSelectChange('rental_status', value)}>
                          <SelectTrigger className={formErrors.rental_status ? 'border-red-500' : ''}><SelectValue placeholder="Select rental status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="rented">Rented</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-red-500 text-xs mt-1 h-4">{formErrors.rental_status}</p>
                      </div>
                      <div><Label htmlFor="min_rental_days">Min Rental Days</Label><Input id="min_rental_days" name="min_rental_days" type="number" value={formData.min_rental_days} onChange={handleFormChange} placeholder="e.g., 3" className={formErrors.min_rental_days ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.min_rental_days}</p></div>
                      <div><Label htmlFor="max_rental_days">Max Rental Days</Label><Input id="max_rental_days" name="max_rental_days" type="number" value={formData.max_rental_days} onChange={handleFormChange} placeholder="e.g., 30" className={formErrors.max_rental_days ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.max_rental_days}</p></div>

                      {/* New rental deposit field */}
                      <div><Label htmlFor="rental_deposit">Security Deposit</Label><Input id="rental_deposit" name="rental_deposit" type="number" step="0.01" value={formData.rental_deposit} onChange={handleFormChange} placeholder="e.g., 1000" className={formErrors.rental_deposit ? 'border-red-500' : ''} /><p className="text-red-500 text-xs mt-1 h-4">{formErrors.rental_deposit}</p></div>
                    </div>

                    {/* Hourly Rental Options Section */}
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-blue-800 mb-2">Hourly Rental Options</h4>
                      <p className="text-sm text-blue-600 mb-3">Select available hourly rental durations and set prices:</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 3 Hour Option */}
                        <div className="flex items-start space-x-2">
                          <div className="pt-2">
                            <Checkbox
                              id="duration-3h"
                              checked={formData.rental_available_durations?.includes(3)}
                              onCheckedChange={(checked) => {
                                const newDurations = checked
                                  ? [...(formData.rental_available_durations || []), 3].sort((a, b) => a - b)
                                  : (formData.rental_available_durations || []).filter(d => d !== 3);

                                setFormData(prev => ({
                                  ...prev,
                                  rental_available_durations: newDurations
                                }));
                              }}
                            />
                          </div>
                          <div className="w-full">
                            <Label
                              htmlFor="duration-3h"
                              className="text-sm font-medium cursor-pointer block mb-1"
                            >
                              3 Hour Rental
                            </Label>
                            {formData.rental_available_durations?.includes(3) && (
                              <div className="mt-1">
                                <Label htmlFor="rental_price_3h" className="text-xs text-gray-500 mb-1 block">
                                  Price for 3 hours
                                </Label>
                                <Input
                                  id="rental_price_3h"
                                  name="rental_price_3h"
                                  type="number"
                                  step="0.01"
                                  value={formData.rental_price_3h}
                                  onChange={handleFormChange}
                                  placeholder="e.g., 25.00"
                                  className={formErrors.rental_price_3h ? 'border-red-500' : ''}
                                />
                                <p className="text-red-500 text-xs mt-1 h-4">{formErrors.rental_price_3h}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 6 Hour Option */}
                        <div className="flex items-start space-x-2">
                          <div className="pt-2">
                            <Checkbox
                              id="duration-6h"
                              checked={formData.rental_available_durations?.includes(6)}
                              onCheckedChange={(checked) => {
                                const newDurations = checked
                                  ? [...(formData.rental_available_durations || []), 6].sort((a, b) => a - b)
                                  : (formData.rental_available_durations || []).filter(d => d !== 6);

                                setFormData(prev => ({
                                  ...prev,
                                  rental_available_durations: newDurations
                                }));
                              }}
                            />
                          </div>
                          <div className="w-full">
                            <Label
                              htmlFor="duration-6h"
                              className="text-sm font-medium cursor-pointer block mb-1"
                            >
                              6 Hour Rental
                            </Label>
                            {formData.rental_available_durations?.includes(6) && (
                              <div className="mt-1">
                                <Label htmlFor="rental_price_6h" className="text-xs text-gray-500 mb-1 block">
                                  Price for 6 hours
                                </Label>
                                <Input
                                  id="rental_price_6h"
                                  name="rental_price_6h"
                                  type="number"
                                  step="0.01"
                                  value={formData.rental_price_6h}
                                  onChange={handleFormChange}
                                  placeholder="e.g., 45.00"
                                  className={formErrors.rental_price_6h ? 'border-red-500' : ''}
                                />
                                <p className="text-red-500 text-xs mt-1 h-4">{formErrors.rental_price_6h}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 12 Hour Option */}
                        <div className="flex items-start space-x-2">
                          <div className="pt-2">
                            <Checkbox
                              id="duration-12h"
                              checked={formData.rental_available_durations?.includes(12)}
                              onCheckedChange={(checked) => {
                                const newDurations = checked
                                  ? [...(formData.rental_available_durations || []), 12].sort((a, b) => a - b)
                                  : (formData.rental_available_durations || []).filter(d => d !== 12);

                                setFormData(prev => ({
                                  ...prev,
                                  rental_available_durations: newDurations
                                }));
                              }}
                            />
                          </div>
                          <div className="w-full">
                            <Label
                              htmlFor="duration-12h"
                              className="text-sm font-medium cursor-pointer block mb-1"
                            >
                              12 Hour Rental
                            </Label>
                            {formData.rental_available_durations?.includes(12) && (
                              <div className="mt-1">
                                <Label htmlFor="rental_price_12h" className="text-xs text-gray-500 mb-1 block">
                                  Price for 12 hours
                                </Label>
                                <Input
                                  id="rental_price_12h"
                                  name="rental_price_12h"
                                  type="number"
                                  step="0.01"
                                  value={formData.rental_price_12h}
                                  onChange={handleFormChange}
                                  placeholder="e.g., 80.00"
                                  className={formErrors.rental_price_12h ? 'border-red-500' : ''}
                                />
                                <p className="text-red-500 text-xs mt-1 h-4">{formErrors.rental_price_12h}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 24 Hour Option */}
                        <div className="flex items-start space-x-2">
                          <div className="pt-2">
                            <Checkbox
                              id="duration-24h"
                              checked={formData.rental_available_durations?.includes(24)}
                              onCheckedChange={(checked) => {
                                const newDurations = checked
                                  ? [...(formData.rental_available_durations || []), 24].sort((a, b) => a - b)
                                  : (formData.rental_available_durations || []).filter(d => d !== 24);

                                setFormData(prev => ({
                                  ...prev,
                                  rental_available_durations: newDurations
                                }));
                              }}
                            />
                          </div>
                          <div className="w-full">
                            <Label
                              htmlFor="duration-24h"
                              className="text-sm font-medium cursor-pointer block mb-1"
                            >
                              24 Hour Rental
                            </Label>
                            {formData.rental_available_durations?.includes(24) && (
                              <div className="mt-1">
                                <Label htmlFor="rental_price_24h" className="text-xs text-gray-500 mb-1 block">
                                  Price for 24 hours
                                </Label>
                                <Input
                                  id="rental_price_24h"
                                  name="rental_price_24h"
                                  type="number"
                                  step="0.01"
                                  value={formData.rental_price_24h}
                                  onChange={handleFormChange}
                                  placeholder="e.g., 150.00"
                                  className={formErrors.rental_price_24h ? 'border-red-500' : ''}
                                />
                                <p className="text-red-500 text-xs mt-1 h-4">{formErrors.rental_price_24h}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 48 Hour Option */}
                        <div className="flex items-start space-x-2">
                          <div className="pt-2">
                            <Checkbox
                              id="duration-48h"
                              checked={formData.rental_available_durations?.includes(48)}
                              onCheckedChange={(checked) => {
                                const newDurations = checked
                                  ? [...(formData.rental_available_durations || []), 48].sort((a, b) => a - b)
                                  : (formData.rental_available_durations || []).filter(d => d !== 48);

                                setFormData(prev => ({
                                  ...prev,
                                  rental_available_durations: newDurations
                                }));
                              }}
                            />
                          </div>
                          <div className="w-full">
                            <Label
                              htmlFor="duration-48h"
                              className="text-sm font-medium cursor-pointer block mb-1"
                            >
                              48 Hour Rental
                            </Label>
                            {formData.rental_available_durations?.includes(48) && (
                              <div className="mt-1">
                                <Label htmlFor="rental_price_48h" className="text-xs text-gray-500 mb-1 block">
                                  Price for 48 hours
                                </Label>
                                <Input
                                  id="rental_price_48h"
                                  name="rental_price_48h"
                                  type="number"
                                  step="0.01"
                                  value={formData.rental_price_48h}
                                  onChange={handleFormChange}
                                  placeholder="e.g., 280.00"
                                  className={formErrors.rental_price_48h ? 'border-red-500' : ''}
                                />
                                <p className="text-red-500 text-xs mt-1 h-4">{formErrors.rental_price_48h}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rental Policy Field */}
                    <div className="mt-6">
                      <Label htmlFor="rental_policy">Rental Policy</Label>
                      <Textarea
                        id="rental_policy"
                        name="rental_policy"
                        value={formData.rental_policy}
                        onChange={handleFormChange}
                        placeholder="Describe rental terms, cancellation policy, etc..."
                        rows={3}
                        className={formErrors.rental_policy ? 'border-red-500' : ''}
                      />
                      <p className="text-red-500 text-xs mt-1 h-4">{formErrors.rental_policy}</p>
                    </div>
                  </section>
                )}

                {/* Description & Features Section */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Description & Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" value={formData.description} onChange={handleFormChange} placeholder="Detailed description of the vehicle..." rows={5} className={formErrors.description ? 'border-red-500' : ''} />
                      <p className="text-red-500 text-xs mt-1 h-4">{formErrors.description}</p>
                    </div>
                    <div>
                      <Label htmlFor="features">Features (comma-separated)</Label>
                      <Textarea
                        id="features"
                        name="features"
                        value={Array.isArray(formData.features) ? formData.features.join(', ') : formData.features}
                        onChange={(e) => {
                          // Store the raw input string during typing, don't split yet
                          setFormData({
                            ...formData,
                            features: e.target.value
                          });
                        }}
                        placeholder="e.g., Sunroof, GPS, Leather Seats"
                        rows={5}
                        className={formErrors.features ? 'border-red-500' : ''}
                      />
                      <p className="text-red-500 text-xs mt-1 h-4">{formErrors.features}</p>
                    </div>
                  </div>
                </section>

                {/* Marketing Options Section */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Marketing Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      {/* Public Listing Option */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_public"
                          checked={formData.is_public}
                          onCheckedChange={(checked) => {
                            setFormData({
                              ...formData,
                              is_public: checked === true
                            });
                          }}
                        />
                        <Label
                          htmlFor="is_public"
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Make this listing public
                        </Label>
                      </div>

                      {/* Network Sharing Option */}
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_shared_with_network"
                            checked={formData.is_shared_with_network}
                            onCheckedChange={(checked) => {
                              setFormData({
                                ...formData,
                                is_shared_with_network: checked === true,
                                // Clear trust levels if network sharing is disabled
                                shared_with_trust_levels: checked === true ? formData.shared_with_trust_levels : []
                              });
                            }}
                          />
                          <Label
                            htmlFor="is_shared_with_network"
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            Share with partner network
                          </Label>
                        </div>

                        {/* Trust Levels Selector - only visible when network sharing is enabled */}
                        {formData.is_shared_with_network && (
                          <div className="ml-6 mt-2">
                            <Label htmlFor="shared_with_trust_levels" className="text-sm font-medium mb-1 block">
                              Share with trust levels
                            </Label>
                            <div className="space-y-2">
                              {['trusted', 'verified', 'flagged', 'unrated'].map((level) => (
                                <div key={level} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`trust-level-${level}`}
                                    checked={formData.shared_with_trust_levels?.includes(level)}
                                    onCheckedChange={(checked) => {
                                      setFormData(prev => {
                                        const currentLevels = [...(prev.shared_with_trust_levels || [])];

                                        if (checked) {
                                          // Add to array if not already included
                                          if (!currentLevels.includes(level)) {
                                            return {
                                              ...prev,
                                              shared_with_trust_levels: [...currentLevels, level]
                                            };
                                          }
                                        } else {
                                          // Remove from array if present
                                          return {
                                            ...prev,
                                            shared_with_trust_levels: currentLevels.filter(l => l !== level)
                                          };
                                        }

                                        return prev; // No change needed
                                      });
                                    }}
                                  />
                                  <Label
                                    htmlFor={`trust-level-${level}`}
                                    className="text-sm font-medium leading-none cursor-pointer capitalize"
                                  >
                                    {level}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Special Offer Option - new addition */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Special Offer</h3>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_special_offer"
                        checked={formData.is_special_offer}
                        onCheckedChange={(checked) => {
                          setFormData({
                            ...formData,
                            is_special_offer: checked === true
                          });
                        }}
                      />
                      <Label
                        htmlFor="is_special_offer"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Mark as Special Offer
                      </Label>
                    </div>

                    {/* Special Offer Label - only visible when checkbox is checked */}
                    {formData.is_special_offer && (
                      <div className="ml-6 mt-2">
                        <Label htmlFor="special_offer_label">Special Offer Label</Label>
                        <Input
                          id="special_offer_label"
                          name="special_offer_label"
                          value={formData.special_offer_label}
                          onChange={handleFormChange}
                          placeholder="e.g., Hot Deal, Price Drop, New Arrival"
                          className={formErrors.special_offer_label ? 'border-red-500' : ''}
                        />
                        <p className="text-red-500 text-xs mt-1 h-4">{formErrors.special_offer_label}</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Image Upload Section */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Images</h3>
                  <Label htmlFor="vehicle-image-upload" className="block text-sm font-medium text-gray-700 mb-2">Upload New Images</Label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition ${formErrors.images ? 'border-red-500' : 'border-gray-300'}`}>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="vehicle-image-upload" />
                    <label htmlFor="vehicle-image-upload" className="cursor-pointer flex flex-col items-center">
                      <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Drag & drop or click to select</p>
                      <p className="text-xs text-gray-500">Max 10MB per image</p>
                    </label>
                  </div>
                  <p className="text-red-500 text-xs mt-1 h-4">{formErrors.images}</p>

                  {/* Image Preview */}
                  {/* FIX: Check length safely */}
                  {(formData.images?.length ?? 0) > 0 && (
                    <div className="mt-4">
                      <Label className="block text-sm font-medium text-gray-700 mb-2">Current Images ({formData.images.length})</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {/* FIX: Map safely */}
                        {formData.images?.map((url, index) => (
                          <div key={url || index} className="relative border rounded overflow-hidden group aspect-video bg-gray-100">
                            <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x100?text=Error'; }} />
                            <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700" aria-label="Remove">
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-5 border-t mt-6">
                  <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
                    {modalMode === 'create' ? 'Add Vehicle' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </div> {/* End Content Area */}
        </DialogContent>
      </Dialog>

      {/* --- Enhanced Image Gallery Dialog --- */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
        <DialogContent className="max-w-6xl w-full p-0 bg-black border-0 overflow-hidden">
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* Close button */}
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full" onClick={() => setSelectedImageIndex(null)}> <XMarkIcon className="h-6 w-6" /> </Button>

            {/* Left nav */}
            {/* FIX: Check length safely */}
            {(currentCar?.images?.length ?? 0) > 1 && (
              <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => prev! > 0 ? prev! - 1 : currentCar!.images!.length - 1); }}> <ArrowLeftIcon className="h-6 w-6" /> </Button>
            )}
            {/* Right nav */}
            {/* FIX: Check length safely */}
            {(currentCar?.images?.length ?? 0) > 1 && (
              <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => prev! < currentCar!.images!.length - 1 ? prev! + 1 : 0); }}> <ArrowRightIcon className="h-6 w-6" /> </Button>
            )}

            {/* Counter */}
            {/* FIX: Check length safely */}
            {selectedImageIndex !== null && (currentCar?.images?.length ?? 0) > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-50">
                {selectedImageIndex + 1} / {currentCar!.images!.length}
              </div>
            )}

            {/* Image */}
            {/* FIX: Access image safely */}
            {selectedImageIndex !== null && currentCar?.images?.[selectedImageIndex] && (
              <img src={currentCar.images[selectedImageIndex]} alt={`Image ${selectedImageIndex + 1}`} className="max-h-full max-w-full object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Bulk Action Modals --- */}

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Action</h3>
            <p className="text-gray-600 mb-4">{confirmMessage}</p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isPerformingBulkAction}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAction}
                disabled={isPerformingBulkAction}
              >
                {isPerformingBulkAction && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Listing Type Modal */}
      <Dialog open={showListingTypeModal} onOpenChange={setShowListingTypeModal}>
        <DialogContent className="sm:max-w-md">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Listing Type</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="listing-type">Select New Listing Type</Label>
                <Select
                  value={selectedListingType}
                  onValueChange={(value: 'sale' | 'rent' | 'both') => setSelectedListingType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select listing type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                    <SelectItem value="both">Sale or Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowListingTypeModal(false)}
                  disabled={isPerformingBulkAction}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await confirmUpdateListingType();
                    setShowListingTypeModal(false);
                  }}
                  disabled={isPerformingBulkAction}
                >
                  {isPerformingBulkAction && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
                  Update {selectedListingIds.length} Listing{selectedListingIds.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Special Offer Modal */}
      <Dialog open={showSpecialOfferModal} onOpenChange={setShowSpecialOfferModal}>
        <DialogContent className="sm:max-w-md">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Set Special Offer</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="special-offer-label">Special Offer Label</Label>
                <Input
                  id="special-offer-label"
                  value={specialOfferLabel}
                  onChange={(e) => setSpecialOfferLabel(e.target.value)}
                  placeholder="e.g., HOT DEAL, SALE, SPECIAL PRICE"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This label will be displayed prominently on all selected listings.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSpecialOfferModal(false)}
                  disabled={isPerformingBulkAction}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!specialOfferLabel.trim()) {
                      toast({
                        title: "Label Required",
                        description: "Please enter a special offer label.",
                        variant: "destructive"
                      });
                      return;
                    }
                    await confirmSetSpecialOffer();
                    setShowSpecialOfferModal(false);
                  }}
                  disabled={isPerformingBulkAction || !specialOfferLabel.trim()}
                >
                  {isPerformingBulkAction && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
                  Apply to {selectedListingIds.length} Listing{selectedListingIds.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Change Modal */}
      <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
        <DialogContent className="sm:max-w-md">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Price</h3>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Price Change Type</Label>
                <div className="flex space-x-2 mb-4">
                  <Button
                    type="button"
                    variant={priceChangeType === 'fixed' ? 'default' : 'outline'}
                    onClick={() => setPriceChangeType('fixed')}
                    className="flex-1"
                  >
                    Fixed Amount
                  </Button>
                  <Button
                    type="button"
                    variant={priceChangeType === 'percentage' ? 'default' : 'outline'}
                    onClick={() => setPriceChangeType('percentage')}
                    className="flex-1"
                  >
                    Percentage Discount
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="price-change-amount">
                  {priceChangeType === 'fixed' ? 'New Price (CHF)' : 'Discount Percentage (%)'}
                </Label>
                <Input
                  id="price-change-amount"
                  type="number"
                  step={priceChangeType === 'fixed' ? '100' : '0.1'}
                  value={priceChangeAmount}
                  onChange={(e) => setPriceChangeAmount(e.target.value)}
                  placeholder={priceChangeType === 'fixed' ? 'e.g., 25000' : 'e.g., 10'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {priceChangeType === 'fixed'
                    ? 'All selected listings will be updated to this exact price.'
                    : 'Price will be reduced by this percentage for all selected listings.'}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPriceModal(false)}
                  disabled={isPerformingBulkAction}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!priceChangeAmount.trim() || isNaN(parseFloat(priceChangeAmount))) {
                      toast({
                        title: "Invalid Amount",
                        description: "Please enter a valid number.",
                        variant: "destructive"
                      });
                      return;
                    }

                    if (priceChangeType === 'percentage' && (parseFloat(priceChangeAmount) <= 0 || parseFloat(priceChangeAmount) >= 100)) {
                      toast({
                        title: "Invalid Percentage",
                        description: "Percentage must be between 0 and 100.",
                        variant: "destructive"
                      });
                      return;
                    }

                    await confirmPriceChange();
                  }}
                  disabled={isPerformingBulkAction || !priceChangeAmount.trim()}
                >
                  {isPerformingBulkAction && <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />}
                  Update Price{selectedListingIds.length > 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Market Analysis Section */}
      {/* Analysis Trigger Button - Only show when no active scan */}
      {selectedListingIds.length > 0 && !activeScanRequestId && !viewingHistorical && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <PresentationChartLineIcon className="h-5 w-5 mr-2 text-emerald-600" />
            Market & Price Analysis
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Analyze the current market prices for your selected vehicles by comparing with similar listings.
          </p>
          <MarketAnalysisTriggerButton />
        </div>
      )}

      {/* Active or Historical Scan Status & Results - Only one will be shown at a time */}
      {(activeScanRequestId || viewingHistorical) && (
        <>
          <ScanOverallStatusDisplay />
          <ActiveAnalysisResultsTable />
        </>
      )}

      {/* Historical Scans Panel - Always shown if user is logged in, regardless of other states */}
      <HistoricalScansPanel />

      {/* Market Analysis Details Modal - Single instance for both active and historical views */}
      <MarketAnalysisDetailsModal />

    </div> // End container
  );
}