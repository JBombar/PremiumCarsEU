// src/components/test-drive-modal.tsx (Restored Calendar, focus on z-index)
"use client";

import * as React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from 'next-intl';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; // Put Calendar back
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";

// Define Props Interface
interface TestDriveModalProps {
    carId: string;
    carName: string;
    userId?: string;
}

// Component Definition
export function TestDriveModal({ carId, carName, userId }: TestDriveModalProps) {
    const t = useTranslations('TestDriveModal');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Define Zod Schema
    const testDriveFormSchema = z.object({
        fullName: z.string().min(2, t('validation.nameRequired')),
        email: z.string().email(t('validation.emailRequired')),
        phone: z.string().min(10, t('validation.phoneRequired')),
        date: z.date({ required_error: t('validation.dateRequired') }), // Keep date required
        time: z.string({ required_error: t('validation.timeRequired') }),
    });

    type TestDriveFormValues = z.infer<typeof testDriveFormSchema>;

    // Initialize React Hook Form
    const form = useForm<TestDriveFormValues>({
        resolver: zodResolver(testDriveFormSchema),
        defaultValues: { fullName: "", email: "", phone: "", time: "", date: undefined, },
    });

    // Handle Form Submission
    async function onSubmit(data: TestDriveFormValues) {
        setIsSubmitting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("test_drive_reservations").insert({
                car_id: carId, vehicle: carName, customer_name: data.fullName, email: data.email,
                phone: data.phone, date: format(data.date, "yyyy-MM-dd"), time: data.time,
                status: "pending", user_id: userId || null, contacted: false,
            });
            if (error) throw error;
            toast({ title: t('toast.successTitle'), description: t('toast.successDescription') });
            form.reset(); setIsDialogOpen(false);
        } catch (error) {
            console.error("Error scheduling test drive:", error);
            const errorMessage = error instanceof Error ? error.message : t('toast.errorDescription');
            toast({ title: t('toast.errorTitle'), description: errorMessage, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    // Generate Time Slots
    const timeSlots = Array.from({ length: 16 }, (_, i) => { // 16 slots: 9:00 to 16:30
        const totalMinutes = 9 * 60 + i * 30;
        const hour24 = Math.floor(totalMinutes / 60); const minute = totalMinutes % 60;
        const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12; const period = hour24 < 12 ? "AM" : "PM";
        const label = `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
        return { value: label, label: label };
    });

    // Render Component
    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> {t('triggerButton')}
                </Button>
            </DialogTrigger>
            {/* STEP 1: Ensure NO z-index or position:relative causing stacking context here */}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>{t('description', { carName })}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
                        {/* FullName, Email, Phone fields - Check these FormItems for z-index */}
                        <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>{t('labels.fullName')}</FormLabel><FormControl><Input placeholder={t('placeholders.fullName')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>{t('labels.email')}</FormLabel><FormControl><Input type="email" placeholder={t('placeholders.email')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>{t('labels.phone')}</FormLabel><FormControl><Input placeholder={t('placeholders.phone')} {...field} /></FormControl><FormMessage /></FormItem>)} />

                        {/* Date Field */}
                        <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>{t('labels.date')}</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("w-full h-10 pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, "PPP") : <span>{t('placeholders.date')}</span>}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0 bg-white shadow-lg border rounded-md z-[200]"
                                        align="start"
                                        sideOffset={5}
                                        onOpenAutoFocus={(e) => { e.preventDefault(); }}
                                        onInteractOutside={(e) => { e.preventDefault(); }}
                                    >
                                        <div className="pointer-events-auto">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || date.getDay() === 0}
                                                className="pointer-events-auto"
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Time Field */}
                        <FormField control={form.control} name="time" render={({ field }) => (
                            // STEP 3: Check this FormItem and SelectTrigger for z-index
                            <FormItem>
                                <FormLabel>{t('labels.time')}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder={t('placeholders.time')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent> {/* SelectContent usually handles its own z-index */}
                                        {timeSlots.map((slot) => (<SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* STEP 4: Check this Button for z-index */}
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? t('buttons.submitting') : t('buttons.submit')}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}