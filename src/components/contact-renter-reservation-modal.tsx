'use client';

import { useState } from 'react';
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
import { CalendarCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RentReservationModalProps {
    carId: string;
    carName: string;
}

export function RentReservationModal({ carId, carName }: RentReservationModalProps) {
    const t = useTranslations('RentalReservationModal');
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        start_date: '',
        end_date: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/rental_reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listing_id: carId,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error || t('toast.error'));
            }

            toast({
                title: t('toast.successTitle'),
                description: t('toast.successDescription'),
                duration: 5000,
            });

            setFormData({ start_date: '', end_date: '' });
            setOpen(false);
        } catch (error) {
            toast({
                title: t('toast.errorTitle'),
                description: error instanceof Error ? error.message : t('toast.error'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button className="w-full" variant="secondary" onClick={() => setOpen(true)}>
                <CalendarCheck className="mr-2 h-4 w-4" />
                {t('triggerButton')}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('title')}</DialogTitle>
                        <DialogDescription>{t('description', { carName })}</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">{t('labels.startDate')}</Label>
                            <Input
                                id="start_date"
                                name="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="end_date">{t('labels.endDate')}</Label>
                            <Input
                                id="end_date"
                                name="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={handleChange}
                                required
                            />
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
                                {t('buttons.submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
