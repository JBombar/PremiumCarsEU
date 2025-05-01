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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'; // Assuming path is correct

interface RentReservationModalProps {
    carId: string; // This should be the listing_id
    carName: string;
    carPrice?: number; // Daily price (optional display)
    carSpecs?: string;
    // Props specifically for hourly rentals
    hourlyOptions?: number[]; // Array of available hour durations (e.g., [3, 6, 12])
    hourlyPrices?: {
        [key: number]: number | null; // Map duration to price (e.g., { 3: 50, 6: 90 })
    };
    rentalDeposit?: number | null; // Security deposit amount
}

export function RentReservationModal({
    carId,
    carName,
    carPrice, // Keep for display even if hourly is chosen
    carSpecs,
    hourlyOptions = [], // Default to empty array if not provided
    hourlyPrices = {},   // Default to empty object
    rentalDeposit
}: RentReservationModalProps) {
    const t = useTranslations('RentalReservationModal'); // Ensure namespace exists
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State to track if the user selected hourly or daily rental mode
    const [isHourlyRental, setIsHourlyRental] = useState(false);

    // Form data state, including fields for both rental types
    const [formData, setFormData] = useState({
        renter_name: '',
        renter_email: '',
        renter_phone: '',
        start_date: '', // Used for daily rental
        end_date: '',   // Used for daily rental
        notes: '',
        rental_duration: hourlyOptions.length > 0 ? hourlyOptions[0] : 0, // Default to first option if available
        start_time: '', // Used for hourly rental (datetime-local input)
    });

    // State for file inputs
    const [idFile, setIdFile] = useState<File | null>(null);
    const [licenseFile, setLicenseFile] = useState<File | null>(null);

    // Refs for clearing file inputs after submission
    const idInputRef = useRef<HTMLInputElement>(null);
    const licenseInputRef = useRef<HTMLInputElement>(null);

    // Add a form ref to programmatically submit the form
    const formRef = useRef<HTMLFormElement>(null);

    // Handler for text input changes (name, email, phone, notes, dates, time)
    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handler specifically for the hourly duration Select component
    const handleDurationChange = (value: string) => {
        // Ensure value is parsed as integer
        const duration = parseInt(value, 10);
        if (!isNaN(duration)) {
            setFormData(prev => ({ ...prev, rental_duration: duration }));
        }
    };

    // Toggle between hourly and daily rental modes
    const toggleRentalType = (switchToHourly: boolean) => {
        setIsHourlyRental(switchToHourly);
        // Reset fields specific to the *other* mode when switching
        if (switchToHourly) {
            // Switching TO hourly: reset daily date fields
            setFormData(prev => ({
                ...prev,
                start_date: '',
                end_date: '',
                // Optionally reset duration/time or keep previous selection?
                // Resetting duration to first option seems reasonable:
                rental_duration: hourlyOptions.length > 0 ? hourlyOptions[0] : 0,
                start_time: ''
            }));
        } else {
            // Switching TO daily: reset hourly fields
            setFormData(prev => ({
                ...prev,
                rental_duration: 0,
                start_time: ''
            }));
        }
    };

    // Handler for file input changes (ID, License)
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (e.target.name === 'id_document') {
            setIdFile(file);
        } else if (e.target.name === 'license_document') {
            setLicenseFile(file);
        }
    };

    // Calculate end time based on start time and selected duration (for hourly)
    const calculateEndTime = (): string => {
        // Requires both start time and a valid duration > 0
        if (!formData.start_time || !formData.rental_duration || formData.rental_duration <= 0) return '';

        try {
            // Parse the start time string (YYYY-MM-DDTHH:MM)
            const startTime = new Date(formData.start_time);
            // Add duration (in hours) converted to milliseconds
            const endTime = new Date(startTime.getTime() + (formData.rental_duration * 60 * 60 * 1000));
            // Return in the same format required by datetime-local input
            return endTime.toISOString().slice(0, 16);
        } catch (error) {
            console.error("Error calculating end time:", error);
            return ''; // Return empty string on error
        }
    };

    // Helper to get the price for the currently selected hourly duration
    const getSelectedDurationPrice = (): number | null => {
        if (!isHourlyRental || !formData.rental_duration) return null;
        return hourlyPrices[formData.rental_duration] ?? null; // Use nullish coalescing
    };

    // Handler for form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const submissionData = new FormData();

        // --- Append Common Fields ---
        submissionData.append('listing_id', carId);
        submissionData.append('renter_name', formData.renter_name);
        submissionData.append('renter_email', formData.renter_email);
        submissionData.append('renter_phone', formData.renter_phone);
        if (formData.notes) {
            submissionData.append('notes', formData.notes);
        }
        // Append other common optional fields if added (e.g., preferred_contact_method, source)


        // --- Append Rental Type Specific Fields ---
        if (isHourlyRental) {
            // --- HOURLY RENTAL ---
            if (!formData.start_time || !formData.rental_duration || formData.rental_duration <= 0) {
                toast({ title: "Missing Information", description: "Please select a valid start time and duration for hourly rental.", variant: "destructive" });
                setIsSubmitting(false);
                return;
            }

            const endTime = calculateEndTime();
            if (!endTime) {
                toast({ title: "Calculation Error", description: "Could not calculate end time. Please check start time.", variant: "destructive" });
                setIsSubmitting(false);
                return;
            }

            // Append hourly specific data
            submissionData.append('duration', formData.rental_duration.toString());
            submissionData.append('start_time', formData.start_time); // YYYY-MM-DDTHH:MM
            submissionData.append('end_time', endTime); // YYYY-MM-DDTHH:MM

            // ** FIX: Derive and append start_date and end_date for backend compatibility **
            try {
                const startDateOnly = formData.start_time.split('T')[0]; // Extract YYYY-MM-DD
                const endDateOnly = endTime.split('T')[0]; // Extract YYYY-MM-DD
                submissionData.append('start_date', startDateOnly);
                submissionData.append('end_date', endDateOnly);
            } catch (splitError) {
                console.error("Error splitting date/time strings:", splitError);
                toast({ title: "Date Error", description: "Could not process date/time values.", variant: "destructive" });
                setIsSubmitting(false);
                return;
            }

        } else {
            // --- DAILY RENTAL ---
            if (!formData.start_date || !formData.end_date) {
                toast({ title: "Missing Dates", description: "Please select both start and end dates for daily rental.", variant: "destructive" });
                setIsSubmitting(false);
                return;
            }
            // Basic date validation (end date should not be before start date)
            if (new Date(formData.end_date) < new Date(formData.start_date)) {
                toast({ title: "Invalid Dates", description: "End date cannot be before the start date.", variant: "destructive" });
                setIsSubmitting(false);
                return;
            }

            // Append daily specific data
            submissionData.append('start_date', formData.start_date); // YYYY-MM-DD
            submissionData.append('end_date', formData.end_date);   // YYYY-MM-DD
            // Optionally append duration=null or start_time=null if needed by backend, but current backend schema doesn't require them
        }

        // --- Append Files ---
        if (!idFile) {
            toast({ title: "Missing Document", description: "Please upload the ID document.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }
        submissionData.append('id_document', idFile);

        if (!licenseFile) {
            toast({ title: "Missing Document", description: "Please upload the license document.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }
        submissionData.append('license_document', licenseFile);

        // --- Send FormData to API ---
        try {
            console.log("Submitting FormData:", Object.fromEntries(submissionData.entries())); // Log FormData content before sending

            const response = await fetch('/api/rental_reservations', {
                method: 'POST',
                body: submissionData,
                credentials: 'include',
            });

            // --- Handle API Response ---
            if (!response.ok) {
                let errorData = { error: `Request failed: ${response.status}`, details: response.statusText }; // Default error
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    // Ignore parsing error, use default
                }
                console.error("API Error Response:", errorData);
                // Use more specific error message if available
                throw new Error(errorData?.error ?? errorData?.details ?? `Request failed: ${response.status}`);
            }

            // --- Handle Success ---
            toast({
                title: t('toast.successTitle'),
                description: t('toast.successDescription'),
                duration: 5000,
            });

            // --- Reset Form State ---
            setFormData({
                renter_name: '', renter_email: '', renter_phone: '',
                start_date: '', end_date: '', notes: '',
                rental_duration: hourlyOptions.length > 0 ? hourlyOptions[0] : 0, // Reset duration
                start_time: ''
            });
            setIdFile(null);
            setLicenseFile(null);
            if (idInputRef.current) idInputRef.current.value = '';
            if (licenseInputRef.current) licenseInputRef.current.value = '';
            setIsHourlyRental(false); // Optionally reset to default mode (daily)
            setOpen(false);

        } catch (error) {
            // --- Handle Fetch/API Errors ---
            console.error("Form Submission Error:", error);
            toast({
                title: t('toast.errorTitle'),
                description: error instanceof Error ? error.message : t('toast.error'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // New function to handle button click in the footer
    const handleSubmitButtonClick = () => {
        if (formRef.current) {
            formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
    };

    // Determine if the hourly rental options should be presented to the user
    const showHourlyOptionToggle = hourlyOptions && hourlyOptions.length > 0;

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
                {/* Increased max width, allows vertical scroll, max height */}
                <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[95vh] flex flex-col">
                    {/* Dialog Header */}
                    <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
                        <DialogTitle>{t('title')}</DialogTitle>
                        <DialogDescription>
                            {carName}
                            {carPrice != null && ( // Display daily price for context if available
                                <div className="mt-1 text-sm text-muted-foreground">
                                    {t('priceLabel')} (Daily): {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CHF' }).format(carPrice)}
                                </div>
                            )}
                            {carSpecs && (
                                <div className="mt-1 text-sm text-muted-foreground">{carSpecs}</div>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Scrollable Form Content Area */}
                    <div className="flex-grow overflow-y-auto px-6 pb-4">
                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 mt-4">

                            {/* Renter Information Section */}
                            <section className="space-y-4">
                                <h4 className="text-lg font-semibold">{t('section.renterInfo')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label htmlFor="renter_name">{t('labels.name')}</Label><Input id="renter_name" name="renter_name" type="text" value={formData.renter_name} onChange={handleChange} required /></div>
                                    <div className="space-y-2"><Label htmlFor="renter_email">{t('labels.email')}</Label><Input id="renter_email" name="renter_email" type="email" value={formData.renter_email} onChange={handleChange} required /></div>
                                    <div className="space-y-2"><Label htmlFor="renter_phone">{t('labels.phone')}</Label><Input id="renter_phone" name="renter_phone" type="tel" value={formData.renter_phone} onChange={handleChange} required /></div>
                                </div>
                            </section>

                            {/* Rental Type Selection Toggle (only if hourly options exist) */}
                            {showHourlyOptionToggle && (
                                <section className="space-y-3 pt-4 border-t">
                                    <h4 className="text-lg font-semibold">{t('section.rentalType')}</h4>
                                    <div className="flex space-x-4">
                                        <Button type="button" variant={!isHourlyRental ? "default" : "outline"} className="flex-1" onClick={() => toggleRentalType(false)}>{t('buttons.dailyRental')}</Button>
                                        <Button type="button" variant={isHourlyRental ? "default" : "outline"} className="flex-1" onClick={() => toggleRentalType(true)}>{t('buttons.hourlyRental')}</Button>
                                    </div>
                                </section>
                            )}

                            {/* Conditional Rental Period Section */}
                            <section className="space-y-4 pt-4 border-t">
                                {isHourlyRental && showHourlyOptionToggle ? (
                                    // --- Hourly Rental Inputs ---
                                    <>
                                        <h4 className="text-lg font-semibold">{t('section.hourlyRental')}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Duration Selection */}
                                            <div className="space-y-2">
                                                <Label htmlFor="rental-duration">{t('labels.duration')}</Label>
                                                <Select value={formData.rental_duration.toString()} onValueChange={handleDurationChange} required>
                                                    <SelectTrigger><SelectValue placeholder={t('placeholders.selectDuration')} /></SelectTrigger>
                                                    <SelectContent>
                                                        {hourlyOptions.map((hours) => (
                                                            <SelectItem key={hours} value={hours.toString()}>
                                                                <span className="flex justify-between w-full">
                                                                    <span>{hours} {hours === 1 ? t('labels.hour') : t('labels.hours')}</span>
                                                                    {hourlyPrices[hours] != null && (
                                                                        <span className="ml-4 text-primary font-medium">
                                                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CHF' }).format(hourlyPrices[hours]!)}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {/* Start Time Input */}
                                            <div className="space-y-2">
                                                <Label htmlFor="start_time">{t('labels.startTime')}</Label>
                                                <Input id="start_time" name="start_time" type="datetime-local" value={formData.start_time} onChange={handleChange} required />
                                            </div>
                                        </div>
                                        {/* Display calculated end time */}
                                        {formData.start_time && formData.rental_duration > 0 && calculateEndTime() && (
                                            <div className="p-3 bg-muted/20 rounded-md text-sm">
                                                <span className="text-muted-foreground">{t('labels.calculatedEndTime')}: </span>
                                                <span className="font-medium">{new Date(calculateEndTime()).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                            </div>
                                        )}
                                        {/* Display selected price */}
                                        {getSelectedDurationPrice() !== null && (
                                            <div className="p-3 bg-primary/10 rounded-md flex justify-between items-center text-sm">
                                                <span className="text-primary">{t('labels.selectedPrice')}:</span>
                                                <span className="font-bold text-primary">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CHF' }).format(getSelectedDurationPrice()!)}</span>
                                            </div>
                                        )}
                                        {/* Display deposit */}
                                        {rentalDeposit != null && (
                                            <div className="p-3 bg-muted/20 rounded-md flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">{t('labels.securityDeposit')}:</span>
                                                <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CHF' }).format(rentalDeposit)}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // --- Daily Rental Inputs ---
                                    <>
                                        <h4 className="text-lg font-semibold">{t('section.dates')}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2"><Label htmlFor="start_date">{t('labels.start_date')}</Label><Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} required /></div>
                                            <div className="space-y-2"><Label htmlFor="end_date">{t('labels.end_date')}</Label><Input id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} required /></div>
                                        </div>
                                    </>
                                )}
                            </section>

                            {/* Documents Upload Section */}
                            <section className="space-y-4 pt-4 border-t">
                                <h4 className="text-lg font-semibold">{t('section.documents')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label htmlFor="id_document">{t('labels.idDocument')}</Label><Input id="id_document" name="id_document" type="file" accept="image/*,.pdf" onChange={handleFileChange} ref={idInputRef} required /></div>
                                    <div className="space-y-2"><Label htmlFor="license_document">{t('labels.licenseDocument')}</Label><Input id="license_document" name="license_document" type="file" accept="image/*,.pdf" onChange={handleFileChange} ref={licenseInputRef} required /></div>
                                </div>
                            </section>

                            {/* Additional Notes Section */}
                            <section className="space-y-2 pt-4 border-t">
                                <Label htmlFor="notes">{t('labels.notes')}</Label>
                                <Textarea id="notes" name="notes" placeholder={t('placeholders.notes')} value={formData.notes} onChange={handleChange} rows={3} />
                            </section>

                            {/* Leave the form tag open here */}
                        </form>
                    </div> {/* End Scrollable Form Content Area */}

                    {/* Dialog Footer - Now outside the scrolling area */}
                    <DialogFooter className="flex-shrink-0 px-6 pb-6 pt-4 border-t bg-background">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>{t('buttons.cancel')}</Button>
                        {/* Change to use the new handler rather than type="submit" */}
                        <Button type="button" onClick={handleSubmitButtonClick} disabled={isSubmitting}>
                            {isSubmitting ? t('buttons.submitting') : t('buttons.submit')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}