'use client';

import { useState, useEffect } from 'react';
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
import { useTranslations } from 'next-intl';

interface ContactRenterModalProps {
    carId: string;
    carName: string;
}

const trackRenterContactSubmitted = (carId: string) => {
    console.log('Analytics: Contact renter submitted for car ID:', carId);
};

export function ContactRenterModal({ carId, carName }: ContactRenterModalProps) {
    const t = useTranslations('ContactRenterModal');
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        message: '',
        whatsappConsent: true,
    });

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            message: t('defaultMessage', { carName })
        }));
    }, [t, carName]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
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
                car_name: carName,
                message: formData.message,
                whatsapp_consent: formData.whatsappConsent,
                contact_type: 'renter'
            };

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorMsg = t('toast.errorDescription');
                try {
                    const errorData = await response.json();
                    if (errorData?.message) errorMsg = errorData.message;
                } catch { }
                throw new Error(errorMsg);
            }

            trackRenterContactSubmitted(carId);

            toast({
                title: t('toast.successTitle'),
                description: t('toast.successDescription'),
                duration: 5000,
            });

            setOpen(false);
            setFormData({
                name: '',
                phone: '',
                email: '',
                message: t('defaultMessage', { carName }),
                whatsappConsent: true,
            });
        } catch (error) {
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
                                onCheckedChange={handleCheckboxChange}
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
