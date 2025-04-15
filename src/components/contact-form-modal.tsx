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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Phone, Send } from 'lucide-react';

interface ContactFormModalProps {
    carId: string;
    carName: string;
}

const trackContactFormSubmitted = (carId: string) => {
    console.log('Analytics: Contact form submitted for car ID:', carId);
};

export function ContactFormModal({ carId, carName }: ContactFormModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        message: `I'm interested in the ${carName}. Please contact me with more information.`,
        whatsappConsent: true,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData((prev) => ({ ...prev, whatsappConsent: checked }));
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
            };

            console.log('Contact form submission payload:', payload);

            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to submit contact inquiry');
            }

            trackContactFormSubmitted(carId);

            toast({
                title: 'Message Sent!',
                description: "Thanks! We'll reach out on WhatsApp shortly.",
                duration: 5000,
            });

            setOpen(false);
            setFormData({
                name: '',
                phone: '',
                email: '',
                message: `I'm interested in the ${carName}. Please contact me with more information.`,
                whatsappConsent: true,
            });
        } catch (error) {
            console.error('Error submitting contact form:', error);
            toast({
                title: 'Error',
                description: 'There was a problem sending your message. Please try again.',
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
                Contact Seller
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Contact Seller</DialogTitle>
                        <DialogDescription>
                            Fill out this form to inquire about the {carName}. The seller will reach out to you shortly.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="Enter your phone number"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email (optional)</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Your Email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                name="message"
                                placeholder="Enter your message"
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
                                I consent to being contacted via WhatsApp
                            </label>
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
                                {isSubmitting ? 'Sending...' : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Message
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
