// src/components/contact-renter-reservation-modal.tsx
'use client';

import { useState, useRef, FormEvent, ChangeEvent } from 'react'; // Added types
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'; // Assuming path is correct
import { Button } from '@/components/ui/button'; // Assuming path is correct
import { Input } from '@/components/ui/input'; // Assuming path is correct
import { Label } from '@/components/ui/label'; // Assuming path is correct
import { Textarea } from '@/components/ui/textarea'; // Assuming path is correct
import { toast } from '@/components/ui/use-toast'; // Assuming path is correct
import { CalendarCheck } from 'lucide-react'; // Keep used icons
import { useTranslations } from 'next-intl';
// Removed: import { createClient } from '@supabase/supabase-js'; // No longer needed here

interface RentReservationModalProps {
    carId: string; // This should be the listing_id
    carName: string;
    carPrice?: number;
    carSpecs?: string;
}

export function RentReservationModal({
    carId,
    carName,
    carPrice,
    carSpecs
}: RentReservationModalProps) {
    const t = useTranslations('RentalReservationModal'); // Make sure this namespace exists in your translations
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for text form fields
    const [formData, setFormData] = useState({
        renter_name: '',
        renter_email: '',
        renter_phone: '',
        start_date: '',
        end_date: '',
        notes: ''
        // Add other related text fields if needed
    });

    // State for file inputs
    const [idFile, setIdFile] = useState<File | null>(null);
    const [licenseFile, setLicenseFile] = useState<File | null>(null);

    // Refs for clearing file inputs
    const idInputRef = useRef<HTMLInputElement>(null);
    const licenseInputRef = useRef<HTMLInputElement>(null);

    // Handler for text input changes
    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handler for file input changes
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        // Use the input's 'name' attribute to update the correct file state
        if (e.target.name === 'id_document') {
            setIdFile(file);
        } else if (e.target.name === 'license_document') {
            setLicenseFile(file);
        }
    };

    // Handler for form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault(); // Prevent default form submission
        setIsSubmitting(true);

        // --- Create FormData ---
        const submissionData = new FormData();

        // Append text fields from state
        submissionData.append('listing_id', carId); // Pass the carId as listing_id
        submissionData.append('renter_name', formData.renter_name);
        submissionData.append('renter_email', formData.renter_email);
        submissionData.append('renter_phone', formData.renter_phone);
        submissionData.append('start_date', formData.start_date);
        submissionData.append('end_date', formData.end_date);
        if (formData.notes) { // Only append optional fields if they have value
            submissionData.append('notes', formData.notes);
        }
        // Append any other text fields you might have added to the state/form

        // --- Append files ---
        // Check if files are selected (especially if they are required)
        if (!idFile) {
            toast({ title: "Missing Document", description: "Please upload the ID document.", variant: "destructive" });
            setIsSubmitting(false);
            return; // Stop submission if required file is missing
        }
        submissionData.append('id_document', idFile); // Key must match API route expectation

        if (!licenseFile) {
            toast({ title: "Missing Document", description: "Please upload the license document.", variant: "destructive" });
            setIsSubmitting(false);
            return; // Stop submission if required file is missing
        }
        submissionData.append('license_document', licenseFile); // Key must match API route expectation

        // --- Send FormData to API ---
        try {
            const response = await fetch('/api/rental_reservations', {
                method: 'POST',
                body: submissionData, // Send the FormData object
                credentials: 'include', // Important: Send cookies with the request
                // ** Do NOT manually set the 'Content-Type' header for FormData **
                // The browser will automatically set it to 'multipart/form-data' with the correct boundary
            });

            // --- Handle API Response ---
            if (!response.ok) {
                let errorData;
                try {
                    // Attempt to parse the error response from the API
                    errorData = await response.json();
                } catch (parseError) {
                    // If parsing fails, use the status text as a fallback
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
                // Throw a detailed error message from the API response
                console.error("API Error Response:", errorData);
                throw new Error(errorData?.error ?? errorData?.details?.message ?? `Request failed: ${response.status}`);
            }

            // --- Handle Success ---
            toast({
                title: t('toast.successTitle'), // Ensure translation key exists
                description: t('toast.successDescription'), // Ensure translation key exists
                duration: 5000,
            });

            // --- Reset Form ---
            setFormData({ // Reset text fields
                renter_name: '', renter_email: '', renter_phone: '',
                start_date: '', end_date: '', notes: ''
            });
            setIdFile(null); // Reset file state
            setLicenseFile(null); // Reset file state
            // Clear file input elements using refs
            if (idInputRef.current) idInputRef.current.value = '';
            if (licenseInputRef.current) licenseInputRef.current.value = '';
            setOpen(false); // Close the dialog

        } catch (error) {
            // --- Handle Fetch/API Errors ---
            console.error("Form Submission Error:", error);
            toast({
                title: t('toast.errorTitle'), // Ensure translation key exists
                description: error instanceof Error ? error.message : t('toast.error'), // Ensure translation key exists
                variant: 'destructive',
            });
        } finally {
            // --- Final Steps ---
            setIsSubmitting(false); // Re-enable the submit button
        }
    };

    // --- Render JSX ---
    return (
        <>
            {/* Trigger Button */}
            <Button className="w-full" variant="secondary" onClick={() => setOpen(true)}>
                <CalendarCheck className="mr-2 h-4 w-4" />
                {t('triggerButton')}
            </Button>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    {/* Dialog Header */}
                    <DialogHeader>
                        <DialogTitle>{t('title')}</DialogTitle>
                        <DialogDescription>
                            {carName}
                            {/* Display Car Price if available */}
                            {carPrice != null && (
                                <div className="mt-1 text-sm text-muted-foreground">
                                    {t('priceLabel')}: {new Intl.NumberFormat('en-US', { // Adjust locale/currency as needed
                                        style: 'currency',
                                        currency: 'CHF',
                                    }).format(carPrice)}
                                </div>
                            )}
                            {/* Display Car Specs if available */}
                            {carSpecs && (
                                <div className="mt-1 text-sm text-muted-foreground">
                                    {carSpecs}
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Form Element */}
                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">

                        {/* Renter Information Section */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold">{t('section.renterInfo')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Renter Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="renter_name">{t('labels.name')}</Label>
                                    <Input id="renter_name" name="renter_name" type="text" value={formData.renter_name} onChange={handleChange} required />
                                </div>
                                {/* Renter Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="renter_email">{t('labels.email')}</Label>
                                    <Input id="renter_email" name="renter_email" type="email" value={formData.renter_email} onChange={handleChange} required />
                                </div>
                                {/* Renter Phone */}
                                <div className="space-y-2">
                                    <Label htmlFor="renter_phone">{t('labels.phone')}</Label>
                                    <Input id="renter_phone" name="renter_phone" type="tel" value={formData.renter_phone} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        {/* Rental Dates Section */}
                        <div className="space-y-2">
                            <h4 className="text-lg font-semibold">{t('section.dates')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Start Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">{t('labels.start_date')}</Label>
                                    <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} required />
                                </div>
                                {/* End Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">{t('labels.end_date')}</Label>
                                    <Input id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        {/* Documents Upload Section */}
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold">{t('section.documents')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* ID Document Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="id_document">{t('labels.idDocument')}</Label>
                                    <Input
                                        id="id_document"
                                        name="id_document" // ** Crucial: Must match API FormData key **
                                        type="file"
                                        accept="image/*,.pdf" // Specify accepted file types
                                        onChange={handleFileChange}
                                        ref={idInputRef}
                                        required // Make required if necessary
                                    />
                                </div>
                                {/* License Document Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="license_document">{t('labels.licenseDocument')}</Label>
                                    <Input
                                        id="license_document"
                                        name="license_document" // ** Crucial: Must match API FormData key **
                                        type="file"
                                        accept="image/*,.pdf" // Specify accepted file types
                                        onChange={handleFileChange}
                                        ref={licenseInputRef}
                                        required // Make required if necessary
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Additional Notes Section */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">{t('labels.notes')}</Label>
                            <Textarea
                                id="notes"
                                name="notes" // Matches state key
                                placeholder={t('placeholders.notes')} // Ensure translation key exists
                                value={formData.notes}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                        {/* Dialog Footer with Actions */}
                        <DialogFooter className="pt-6">
                            {/* Cancel Button */}
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                                {t('buttons.cancel')}
                            </Button>
                            {/* Submit Button */}
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? t('buttons.submitting') : t('buttons.submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}