// src/components/reservation-modal.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Label } from '@/components/ui/label'; // Keep Label import if needed elsewhere, though FormLabel is used now
import { toast } from '@/components/ui/use-toast';
import { Calendar, Car } from 'lucide-react';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useTranslations } from 'next-intl'; // Import useTranslations

interface ReservationModalProps {
    carId: string;
    carName: string;
}

export function ReservationModal({ carId, carName }: ReservationModalProps) {
    const t = useTranslations('ReservationModal'); // Initialize translations
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Define validation schema using zod with translated messages
    const reservationSchema = z.object({
        customer_name: z.string().min(2, { message: t('validation.nameMin') }),
        email: z.string().email({ message: t('validation.emailInvalid') }),
        phone: z.string().min(10, { message: t('validation.phoneMin') }), // Assuming min 10 is still the validation rule
    });

    type ReservationFormValues = z.infer<typeof reservationSchema>;

    // Initialize react-hook-form with zod validation
    const form = useForm<ReservationFormValues>({
        resolver: zodResolver(reservationSchema),
        defaultValues: {
            customer_name: '',
            email: '',
            phone: '',
        },
    });

    // Submit handler
    const onSubmit = async (data: ReservationFormValues) => {
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_name: data.customer_name,
                    email: data.email,
                    phone: data.phone,
                    vehicle: carName, // Keep sending original carName
                    car_id: carId,
                }),
            });

            if (!response.ok) {
                // Try to get a more specific error message if backend provides one
                let errorMsg = t('toast.errorDescription');
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMsg = errorData.message;
                    }
                } catch (parseError) {
                    // Ignore if response is not JSON or parsing fails
                }
                throw new Error(errorMsg);
            }

            // Reset form
            form.reset();

            // Close modal
            setOpen(false);

            // Show success toast
            toast({
                title: t('toast.successTitle'),
                description: t('toast.successDescription', { carName }),
                duration: 5000,
            });
        } catch (error) {
            console.error('Error submitting reservation:', error);
            toast({
                title: t('toast.errorTitle'),
                description: error instanceof Error ? error.message : t('toast.errorDescription'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button
                variant="secondary"
                className="w-full"
                onClick={() => setOpen(true)}
            >
                <Calendar className="mr-2 h-4 w-4" />
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

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                            <FormField
                                control={form.control}
                                name="customer_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('labels.name')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('placeholders.name')}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage /> {/* RHF handles showing Zod message */}
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('labels.email')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder={t('placeholders.email')}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage /> {/* RHF handles showing Zod message */}
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('labels.phone')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="tel"
                                                placeholder={t('placeholders.phone')}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage /> {/* RHF handles showing Zod message */}
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2 mt-2 border-t text-sm text-muted-foreground">
                                <div className="flex items-center gap-2 mb-1">
                                    <Car className="h-4 w-4" />
                                    <span>{t('reservingVehicle', { carName })}</span>
                                </div>
                                <p>
                                    {t('termsNotice')}
                                </p>
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
                                    {isSubmitting ? t('buttons.submitting') : t('buttons.submit')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}