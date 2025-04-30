'use client';

import { useState, useEffect, ChangeEvent, FormEvent, MouseEvent } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from '@/utils/supabase/client';
import { toast } from '@/components/ui/use-toast';
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

    // Basic required fields
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


    // Numeric validation
    if (formData.year && isNaN(Number(formData.year))) errors.year = 'Year must be a valid number';
    if (formData.price && isNaN(Number(formData.price))) errors.price = 'Price must be a valid number';
    if (formData.mileage && isNaN(Number(formData.mileage))) errors.mileage = 'Mileage must be a valid number';
    if (formData.purchasing_price && isNaN(Number(formData.purchasing_price))) errors.purchasing_price = 'Purchasing Price must be a valid number';

    // Rental specific validation
    if (formData.listing_type === 'rent' || formData.listing_type === 'both') { // Added 'both'
      if (!formData.rental_daily_price?.trim()) errors.rental_daily_price = 'Daily price required for rentals';
      if (formData.rental_daily_price && isNaN(Number(formData.rental_daily_price))) errors.rental_daily_price = 'Daily price must be a number';
      if (formData.rental_deposit_required && isNaN(Number(formData.rental_deposit_required))) errors.rental_deposit_required = 'Deposit must be a number';
      if (formData.min_rental_days && isNaN(Number(formData.min_rental_days))) errors.min_rental_days = 'Min days must be a number';
      if (formData.max_rental_days && isNaN(Number(formData.max_rental_days))) errors.max_rental_days = 'Max days must be a number';
      if (!formData.rental_status) errors.rental_status = 'Rental Status is required for rentals';
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
                    <tr key={car.id} className="hover:bg-gray-50 transition-colors">
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

                {/* Rental Info Section */}
                {(currentCar.listing_type === 'rent' || currentCar.listing_type === 'both') && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-md font-semibold text-blue-800 mb-3">Rental Information</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
                      <DetailItem label="Daily Price" value={currentCar.rental_daily_price ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 2 }).format(currentCar.rental_daily_price) : 'N/A'} />
                      <DetailItem label="Deposit Required" value={currentCar.rental_deposit_required ? new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(currentCar.rental_deposit_required) : 'N/A'} />
                      <DetailItem label="Rental Status" value={currentCar.rental_status} />
                      <DetailItem label="Min Rental Days" value={currentCar.min_rental_days} />
                      <DetailItem label="Max Rental Days" value={currentCar.max_rental_days} />
                    </dl>
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

    </div> // End container
  );
}