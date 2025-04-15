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
import { Label } from '@/components/ui/label';
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

// Define validation schema using zod
const reservationSchema = z.object({
    customer_name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

interface ReservationModalProps {
    carId: string;
    carName: string;
}

export function ReservationModal({ carId, carName }: ReservationModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                    vehicle: carName,
                    car_id: carId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit reservation');
            }

            // Reset form
            form.reset();

            // Close modal
            setOpen(false);

            // Show success toast
            toast({
                title: 'Reservation Submitted',
                description: `We've received your reservation for the ${carName}. We'll contact you shortly.`,
                duration: 5000,
            });
        } catch (error) {
            console.error('Error submitting reservation:', error);
            toast({
                title: 'Reservation Failed',
                description: 'There was a problem submitting your reservation. Please try again.',
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
                Reserve This Vehicle
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Reserve Vehicle</DialogTitle>
                        <DialogDescription>
                            Complete this form to reserve the {carName}. We'll contact you to confirm details.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                            <FormField
                                control={form.control}
                                name="customer_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter your full name"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="Enter your email address"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
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
                                                placeholder="Enter your phone number"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-2 mt-2 border-t text-sm text-muted-foreground">
                                <div className="flex items-center gap-2 mb-1">
                                    <Car className="h-4 w-4" />
                                    <span>Reserving: {carName}</span>
                                </div>
                                <p>
                                    By submitting this form, you agree to our reservation terms and policies.
                                </p>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Reserve Vehicle'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
} 