// src/components/test-drive-modal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    // DialogPortal, // Not explicitly used, can be removed if not needed
    // DialogOverlay, // Not explicitly used, can be removed if not needed
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client"; // Assuming correct path
import { toast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";
import { useTranslations } from 'next-intl'; // Import useTranslations

interface TestDriveModalProps {
    carId: string;
    carName: string;
    userId?: string;
}

export function TestDriveModal({ carId, carName, userId }: TestDriveModalProps) {
    const t = useTranslations('TestDriveModal'); // Initialize translations
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Define validation schema using zod with translated messages
    const testDriveFormSchema = z.object({
        fullName: z.string().min(2, t('validation.nameRequired')),
        email: z.string().email(t('validation.emailRequired')),
        phone: z.string().min(10, t('validation.phoneRequired')),
        date: z.date({
            required_error: t('validation.dateRequired'),
        }),
        time: z.string({
            required_error: t('validation.timeRequired'),
        }),
    });

    type TestDriveFormValues = z.infer<typeof testDriveFormSchema>;

    const form = useForm<TestDriveFormValues>({
        resolver: zodResolver(testDriveFormSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            time: "",
            // date: undefined // default is handled by RHF/Zod
        },
    });

    async function onSubmit(data: TestDriveFormValues) {
        setIsSubmitting(true);

        try {
            const supabase = createClient();

            const { error } = await supabase.from("test_drive_reservations").insert({
                car_id: carId,
                vehicle: carName, // Keep original carName for backend
                customer_name: data.fullName,
                email: data.email,
                phone: data.phone,
                date: format(data.date, "yyyy-MM-dd"), // Keep standard format for DB
                time: data.time,
                status: "pending", // ✅ ENUM-compatible value
                user_id: userId || null,
                contacted: false,
            });

            if (error) throw error;

            toast({
                title: t('toast.successTitle'),
                description: t('toast.successDescription'),
                variant: "default",
            });

            form.reset();
            setIsOpen(false);
        } catch (error) {
            console.error("Error scheduling test drive:", error);
            // Attempt to provide a more specific error if possible
            const errorMessage = error instanceof Error ? error.message : t('toast.errorDescription');
            toast({
                title: t('toast.errorTitle'),
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    // Time slots generation logic remains the same
    const timeSlots = Array.from({ length: 17 }, (_, i) => {
        const hour24 = Math.floor((i + 18) / 2); // 9 AM to 5 PM (17 slots, starting at 9:00) -> 9 to 17
        const hour12 = hour24 % 12 || 12; // Convert to 12-hour format
        const minute = i % 2 === 0 ? "00" : "30";
        const period = hour24 < 12 ? "AM" : "PM";
        const value = `${String(hour24).padStart(2, '0')}:${minute}`; // Store as 24hr format for consistency? Or keep 12hr? Let's keep 12hr for display consistency.
        const label = `${hour12}:${minute} ${period}`;
        return {
            value: label, // Use the display label as the value for simplicity here
            label: label,
        };
    });


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {t('triggerButton')}
                </Button>
            </DialogTrigger>
            {/* Removed overflow-visible as PopoverContent handles its own positioning */}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>
                        {t('description', { carName })}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('labels.fullName')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('placeholders.fullName')} {...field} />
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
                                    <FormLabel>{t('labels.email')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('placeholders.email')} type="email" {...field} />
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
                                    <FormLabel>{t('labels.phone')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('placeholders.phone')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>{t('labels.date')}</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                {/* Added explicit height h-10 to match Input */}
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start pl-3 text-left font-normal h-10" // Ensure consistent height
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" /> {/* Added Icon */}
                                                    {field.value ? format(field.value, "PPP") : (
                                                        <span className="text-muted-foreground">{t('placeholders.date')}</span>
                                                    )}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        {/* Removed z-50, Popover handles layering. Removed pointer-events-auto */}
                                        <PopoverContent
                                            className="w-auto p-0 bg-background shadow-md border rounded-md" // Use bg-background for theme consistency
                                            align="start"
                                            sideOffset={5}
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date(new Date().setHours(0, 0, 0, 0)) || // Disable past dates
                                                    date.getDay() === 0 // Disable Sundays
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('labels.time')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                {/* Use SelectValue for placeholder */}
                                                <SelectValue placeholder={t('placeholders.time')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {timeSlots.map((slot) => (
                                                <SelectItem key={slot.value} value={slot.value}>
                                                    {slot.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? t('buttons.submitting') : t('buttons.submit')}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}