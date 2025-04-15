'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

// Add React to the imports
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Move Supabase import to be loaded only on the client side
// We'll import this in useEffect instead
// import { createClient } from '@/utils/supabase/client';

// Create a simple form context implementation
type FormValues = {
  fullName: string;
  email: string;
  phone: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  condition: "new" | "used";
  city: string;
  askingPrice: string;
  description: string;
};

// Mock the form hook to avoid requiring react-hook-form
function useFormMock() {
  const [values, setValues] = useState<FormValues>({
    fullName: "",
    email: "",
    phone: "",
    make: "",
    model: "",
    year: "",
    mileage: "",
    fuelType: "",
    transmission: "",
    condition: "used", // Default value
    city: "",
    askingPrice: "",
    description: "",
  });

  const handleSubmit = (onSubmit: (data: FormValues) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(values);
    };
  };

  const reset = () => {
    setValues({
      fullName: "",
      email: "",
      phone: "",
      make: "",
      model: "",
      year: "",
      mileage: "",
      fuelType: "",
      transmission: "",
      condition: "used",
      city: "",
      askingPrice: "",
      description: "",
    });
  };

  const getValues = () => values;

  // Simulate the structure react-hook-form provides
  const control = {
    // Simplified field registration and update
    field: (name: keyof FormValues) => ({
      value: values[name],
      // onChange handler accepts either an event or a direct value (like from Select/RadioGroup)
      onChange: (eventOrValue: any) => {
        const value = eventOrValue?.target // Check if it's an event object
          ? eventOrValue.target.value
          : eventOrValue; // Otherwise, assume it's the direct value
        setValues((prev) => ({ ...prev, [name]: value }));
      },
      name: name, // Add name for potential use
      // Add other properties if your components expect them (e.g., ref, onBlur)
      // ref: () => {},
      // onBlur: () => {}
    }),
  };

  return {
    handleSubmit,
    control,
    reset,
    getValues,
    // Expose form state if needed (e.g., formState: { errors }) - though we handle errors locally here
  };
}

// Simple form components that don't require external libraries
// These mimic the structure often used with shadcn/ui + react-hook-form
const Form = ({ children, ...props }: React.HTMLAttributes<HTMLFormElement>) => (
  <form {...props}>{children}</form>
);

interface FormFieldProps {
  name: keyof FormValues; // Use keys from FormValues for type safety
  control: any; // Keep 'any' for mock simplicity, but ideally RHF's Control type
  render: (props: {
    field: {
      value: any;
      onChange: (eventOrValue: any) => void;
      name: keyof FormValues;
      // Add other field props if necessary (ref, onBlur)
    };
    // fieldState?: any; // Add if needed
  }) => React.ReactNode;
}

const FormField = ({ name, control, render }: FormFieldProps) => {
  const field = control.field(name);
  // In a real scenario, you'd also get fieldState here
  return render({ field /*, fieldState */ });
};

const FormItem = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-2", className)} {...props}>
    {children}
  </div>
);

const FormLabel = ({
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  // Use the imported Label component
  <Label {...props}>{children}</Label>
);

const FormControl = ({ children }: { children: React.ReactNode }) => (
  // Simple wrapper, often just returns children or a div if needed for layout
  <>{children}</>
);

const FormMessage = ({ children }: { children?: React.ReactNode }) =>
  // Simple error message display
  children ? <p className="text-sm font-medium text-destructive">{children}</p> : null; // Use destructive color

const FormDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[0.8rem] text-muted-foreground">{children}</p> // Match shadcn style
);

// --- Simple RadioGroup component (Based on shadcn/ui structure) ---
interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  onValueChange?: (value: string) => void;
  value?: string; // Changed from defaultValue to work better with controlled components
  defaultValue?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, defaultValue, onValueChange, ...props }, ref) => {
    // Handle change events on the root element
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onValueChange) {
        onValueChange(event.target.value);
      }
    };

    return (
      <div
        ref={ref}
        className={cn("grid gap-2", className)}
        // Use onChange here if items don't have individual handlers
        // onChange={handleChange} // --> Potentially move handler here if items are simple
        role="radiogroup"
        {...props}
      />
    );
  }
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string; // value is required for radio items
}

// Simplified RadioGroupItem - focuses on rendering the input
// NOTE: This mock doesn't include the visual circle indicator from shadcn/ui
const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  RadioGroupItemProps
>(({ className, value, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="radio"
      value={value}
      className={cn(
        "h-4 w-4 shrink-0 cursor-pointer border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    // Remove 'checked' prop - let the parent RadioGroup/Form state control it via its 'value' prop
    // checked={...}
    // No 'onChange' needed here if handled by parent RadioGroup 'onValueChange'
    // onChange={...}
    />
  );
});
RadioGroupItem.displayName = "RadioGroupItem";
// --- End RadioGroup component ---

// Near the top of the file, add this utility function
function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}

export function CarSellForm() {
  // Use our hasMounted hook to track client-side rendering
  const hasMounted = useHasMounted();

  // Keep the existing state for Supabase, but initialize differently
  const supabaseRef = React.useRef<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use our custom form hook
  const form = useFormMock();

  // Initialize Supabase on the client side only
  // Initialize Supabase on the client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Dynamic import to ensure this only happens on client
        const { createClient } = require('@/utils/supabase/client');
        supabaseRef.current = createClient();
        console.log("Supabase client initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Supabase client:", error);
      }
    }
  }, []);



  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    if (!hasMounted) {
      console.log("Component not mounted yet, aborting submission");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSubmitError(null);

    try {
      // Basic manual validation
      const newErrors: Partial<Record<keyof FormValues, string>> = {};
      if (!data.fullName.trim()) newErrors.fullName = "Name is required";
      if (!data.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "Invalid email format";
      if (!data.phone.trim()) newErrors.phone = "Phone is required";
      if (!data.make.trim()) newErrors.make = "Make is required";
      if (!data.model.trim()) newErrors.model = "Model is required";
      if (!data.year.trim()) newErrors.year = "Year is required";
      else if (!/^\d{4}$/.test(data.year)) newErrors.year = "Invalid year format";
      if (!data.mileage.trim()) newErrors.mileage = "Mileage is required";
      else if (isNaN(Number(data.mileage))) newErrors.mileage = "Mileage must be a number";
      if (!data.fuelType) newErrors.fuelType = "Fuel type is required";
      if (!data.transmission) newErrors.transmission = "Transmission is required";
      if (!data.condition) newErrors.condition = "Condition is required";
      if (!data.city.trim()) newErrors.city = "City is required";
      // Asking price is optional
      if (data.askingPrice && isNaN(Number(data.askingPrice))) newErrors.askingPrice = "Price must be a number";

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        console.log("Form validation failed", newErrors);
        setIsSubmitting(false);
        return; // Stop submission if errors exist
      }

      // Add this debug check for environment variables
      console.log("Checking Supabase environment variables:");
      console.log("NEXT_PUBLIC_SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      // Create Supabase client with better error handling
      console.log("Creating Supabase client...");
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        console.log("Supabase client created successfully");

        // Test the connection with a simple query
        const { data: testData, error: testError } = await supabase
          .from('car_offers')
          .select('id')
          .limit(1);

        console.log("Supabase connection test:", { testData, testError });

        if (testError) {
          throw new Error(`Connection test failed: ${testError.message}`);
        }

        // First insert the car offer data without photos
        const carOfferData = {
          // Text fields - explicitly cast as strings
          full_name: String(data.fullName).trim(),
          email: String(data.email).trim(),
          phone: String(data.phone).trim(),
          make: String(data.make).trim(),
          model: String(data.model).trim(),
          year: String(data.year).trim(),
          mileage: Number(data.mileage.trim()),
          fuel_type: String(data.fuelType),
          transmission: String(data.transmission),
          condition: String(data.condition),
          city: String(data.city).trim(),
          asking_price: data.askingPrice && data.askingPrice.trim() !== ''
            ? Number(data.askingPrice)
            : null,
          notes: data.description ? String(data.description).trim() : null,
          contacted: false,
        };

        console.log("Sending car offer data to Supabase:", carOfferData);

        // Insert car offer
        try {
          const { data: insertedData, error } = await supabase
            .from('car_offers')
            .insert([carOfferData])
            .select();

          if (error) {
            console.error("Insert ERROR:", error);
            throw new Error(`Insert failed: ${error.message}`);
          }

          if (!insertedData || insertedData.length === 0) {
            console.warn("Warning: Insert succeeded but no data returned");
          } else {
            console.log("Success! New car offer ID:", insertedData[0]?.id);

            // Handle photo uploads if any files were selected
            if (selectedFiles.length > 0) {
              const offerId = insertedData[0].id;
              const uploadedPhotoUrls: string[] = [];

              console.log(`Uploading ${selectedFiles.length} photos for offer ${offerId}`);

              // Upload each file to storage
              for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                // More robust file extension extraction
                const fileExt = file.name.split('.').pop() || 'jpg';
                const fileName = `${offerId}/${Date.now()}-${i}.${fileExt}`;
                const filePath = fileName; // No need for template literal with single variable

                try {
                  // Upload to vehicle-images bucket
                  const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('vehicle-images')
                    .upload(filePath, file, {
                      cacheControl: '3600',
                      upsert: true // Changed to true to allow overwriting
                    });

                  if (uploadError) {
                    console.error(`Error uploading file ${i}:`, uploadError);
                    continue; // Skip this file but continue with others
                  }

                  // Get public URL
                  const { data: publicUrlData } = supabase.storage
                    .from('vehicle-images')
                    .getPublicUrl(filePath);

                  if (publicUrlData?.publicUrl) {
                    uploadedPhotoUrls.push(publicUrlData.publicUrl);
                    console.log(`File ${i} uploaded successfully:`, publicUrlData.publicUrl);
                  } else {
                    console.error(`Failed to get public URL for file ${i}`);
                  }
                } catch (uploadException) {
                  console.error(`Exception during file ${i} upload:`, uploadException);
                }
              }

              // If we have uploaded photos, update the car_offer record
              if (uploadedPhotoUrls.length > 0) {
                try {
                  // Store as array directly, not as JSON string
                  const { error: updateError } = await supabase
                    .from('car_offers')
                    .update({ photo_urls: uploadedPhotoUrls })
                    .eq('id', offerId);

                  if (updateError) {
                    console.error("Error updating record with photo URLs:", updateError);
                    setSubmitError(`Photos uploaded but couldn't save URLs: ${updateError.message}`);
                  } else {
                    console.log("Successfully updated car offer with photo URLs:", uploadedPhotoUrls);
                  }
                } catch (updateException) {
                  console.error("Exception during photo URL update:", updateException);
                  setSubmitError("Photos uploaded but encountered an error saving URLs");
                }
              } else {
                console.warn("No photos were successfully uploaded");
              }
            }
          }

          // Success handling
          setIsSuccess(true);
          form.reset();
          setSelectedFiles([]);

        } catch (insertError) {
          console.error("Error during insert operation:", insertError);
          throw insertError;
        }
      } catch (supabaseError) {
        console.error("Supabase client error:", supabaseError);
        throw supabaseError;
      }

    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitError(error instanceof Error
        ? `Error: ${error.message}`
        : "An error occurred while submitting your information. Please try again.");
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // IMPORTANT: Return null until client-side hydration is complete
  // Move this check BEFORE any conditional rendering
  if (!hasMounted) {
    return null; // Return nothing during SSR to prevent hydration mismatches
  }

  // Now that we know we're on the client, we can render based on state
  if (isSuccess) {
    // Success State UI
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-primary">Submission Received!</CardTitle>
          <CardDescription className="text-center pt-2">
            Thank you! We'll review your car details and get back to you soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="rounded-full bg-primary/10 p-4">
            {/* SVG only rendered client-side now */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold">Details Submitted</h3>
          <p className="text-center text-muted-foreground max-w-xs">
            We'll use {form.getValues().email || 'the email provided'} to contact you.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => setIsSuccess(false)}
            variant="outline"
          >
            Submit Another Car
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Main Form UI - only rendered client-side now
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sell Your Car</CardTitle>
        <CardDescription>
          Fill out the form below with your car details. Our team will review and contact you within 24-48 hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Owner Information Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Owner Information</h3>
            <div className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field} // Spread field props (includes value, onChange, name)
                      />
                    </FormControl>
                    <FormMessage>{errors.fullName}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage>{errors.email}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="(123) 456-7890"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage>{errors.phone}</FormMessage>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Car Information Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Car Information</h3>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Make</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Toyota"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage>{errors.make}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Model</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Camry"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage>{errors.model}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 2019"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage>{errors.year}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mileage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 45000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage>{errors.mileage}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Type</FormLabel>
                      {/* Use Select component */}
                      <Select
                        value={field.value}
                        onValueChange={field.onChange} // Correctly connects to form state
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fuel type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gasoline">Gasoline</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage>{errors.fuelType}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transmission</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select transmission" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="automatic">Automatic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage>{errors.transmission}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Condition</FormLabel>
                    <FormControl>
                      {/* RadioGroup needs to receive value and onValueChange */}
                      <RadioGroup
                        onValueChange={field.onChange} // Updates form state
                        value={field.value} // Controls which item is checked
                        className="flex flex-row space-x-4 pt-1" // Added padding top for alignment
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            {/* Value prop identifies the item */}
                            <RadioGroupItem value="new" id="condition-new" />
                          </FormControl>
                          <FormLabel htmlFor="condition-new" className="font-normal"> {/* Use FormLabel */}
                            New
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="used" id="condition-used" />
                          </FormControl>
                          <FormLabel htmlFor="condition-used" className="font-normal"> {/* Use FormLabel */}
                            Used
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage>{errors.condition}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., San Francisco"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage>{errors.city}</FormMessage>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Pricing & Media Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Pricing & Media</h3>
            <div className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="askingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asking Price (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 25000"
                        {...field}
                        // Allow empty string, convert to number on submit/validate
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ''} // Ensure value is not null/undefined for input
                      />
                    </FormControl>
                    <FormDescription>
                      Leave blank if you'd like us to provide a market valuation.
                    </FormDescription>
                    <FormMessage>{errors.askingPrice}</FormMessage>
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload Photos</Label> {/* Changed Label for consistency */}
                <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-border px-6 pb-6 pt-5">
                  <div className="space-y-1 text-center">
                    <svg /* Your upload icon SVG */ >...</svg> {/* Keep your SVG */}
                    <div className="flex text-sm text-muted-foreground">
                      <Label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-background font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/90"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          onChange={handleFileChange}
                          accept="image/*,.heic,.heif" // Accept common image types
                        />
                      </Label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF, HEIC up to 10MB each
                    </p>
                  </div>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-2">
                    <FormDescription>
                      {selectedFiles.length} file(s) selected:
                    </FormDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground"
                        >
                          {file.name}
                          {/* Optional: Add a remove button */}
                          {/* <button type="button" onClick={() => handleRemoveFile(index)} className="ml-2 text-destructive">x</button> */}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Additional Information</h3>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide any additional details about your car..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{errors.description}</FormMessage>
                </FormItem>
              )}
            />
          </div>

          {submitError && (
            <div className="p-3 text-sm bg-destructive/15 border border-destructive rounded text-destructive">
              {submitError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Car for Review'
            )}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}