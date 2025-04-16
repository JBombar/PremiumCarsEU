// src/components/contact-form-modal.tsx
'use client';

import { useState, useEffect } from 'react'; // Import useEffect
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Phone, Send } from 'lucide-react';
import { useTranslations } from 'next-intl'; // Import useTranslations

interface ContactFormModalProps {
    carId: string;
    carName: string;
}

const trackContactFormSubmitted = (carId: string) => {
    console.log('Analytics: Contact form submitted for car ID:', carId);
};

export function ContactFormModal({ carId, carName }: ContactFormModalProps) {
    const t = useTranslations('ContactFormModal'); // Initialize translations
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize state with translated default message
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        message: '', // Initialize empty, will set in useEffect
        whatsappConsent: true,
    });

    // Effect to set the initial message once t and carName are available
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            message: t('defaultMessage', { carName })
        }));
    }, [t, carName]); // Re-run if t or carName changes (e.g., language switch)


    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
        // Ensure checked is boolean before setting state
        if (typeof checked === 'boolean') {
            setFormData((prev) => ({ ...prev, whatsappConsent: checked }));
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                full_name: formData.name,
                phone: formData.phone,
                email: formData.email,
                car_id: carId,
                car_name: carName, // Keep sending carName as it might be useful for the backend
                message: formData.message,
                whatsapp_consent: formData.whatsappConsent,
            };

            console.log('Contact form submission payload:', payload);

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // Optionally try to parse error message from backend
                let errorMsg = t('toast.errorDescription');
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMsg = errorData.message; // Use backend message if available
                    }
                } catch (parseError) {
                    // Ignore if response is not JSON or parsing fails
                }
                throw new Error(errorMsg); // Throw error with potentially more specific message
            }

            trackContactFormSubmitted(carId);

            toast({
                title: t('toast.successTitle'),
                description: t('toast.successDescription'),
                duration: 5000,
            });

            setOpen(false);
            // Reset form, including the default message
            setFormData({
                name: '',
                phone: '',
                email: '',
                message: t('defaultMessage', { carName }), // Reset with translated default
                whatsappConsent: true,
            });
        } catch (error) {
            console.error('Error submitting contact form:', error);
            toast({
                title: t('toast.errorTitle'),
                // Use error.message if it was thrown with a specific message, otherwise fallback
                description: error instanceof Error ? error.message : t('toast.errorDescription'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button className="w-full" onClick={() => setOpen(true)}>
                <Phone className="mr-2 h-4 w-4" />
                {t('triggerButton')}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('title')}</DialogTitle>
                        <DialogDescription>
                            {t('description', { carName })}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('labels.name')}</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder={t('placeholders.name')}
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">{t('labels.phone')}</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder={t('placeholders.phone')}
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{t('labels.email')}</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder={t('placeholders.email')}
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">{t('labels.message')}</Label>
                            <Textarea
                                id="message"
                                name="message"
                                placeholder={t('placeholders.message')}
                                value={formData.message}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="whatsappConsent"
                                checked={formData.whatsappConsent}
                                onCheckedChange={handleCheckboxChange} // Use updated handler
                            />
                            <label
                                htmlFor="whatsappConsent"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {t('labels.whatsappConsent')}
                            </label>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isSubmitting}
                            >
                                {t('buttons.cancel')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? t('buttons.submitting') : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        {t('buttons.submit')}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}