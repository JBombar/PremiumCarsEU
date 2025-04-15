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
    DialogPortal,
    DialogOverlay,
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
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";

// ✅ Schema for test drive form
const testDriveFormSchema = z.object({
    fullName: z.string().min(2, "Name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    date: z.date({
        required_error: "Please select a date",
    }),
    time: z.string({
        required_error: "Please select a time",
    }),
});

type TestDriveFormValues = z.infer<typeof testDriveFormSchema>;

interface TestDriveModalProps {
    carId: string;
    carName: string;
    userId?: string;
}

export function TestDriveModal({ carId, carName, userId }: TestDriveModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<TestDriveFormValues>({
        resolver: zodResolver(testDriveFormSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            time: "",
        },
    });

    async function onSubmit(data: TestDriveFormValues) {
        setIsSubmitting(true);

        try {
            const supabase = createClient();

            const { error } = await supabase.from("test_drive_reservations").insert({
                car_id: carId,
                vehicle: carName,
                customer_name: data.fullName,
                email: data.email,
                phone: data.phone,
                date: format(data.date, "yyyy-MM-dd"),
                time: data.time,
                status: "pending", // ✅ ENUM-compatible value
                user_id: userId || null,
                contacted: false,
            });

            if (error) throw error;

            toast({
                title: "Test drive scheduled",
                description: "We will contact you to confirm your appointment.",
                variant: "default",
            });

            form.reset();
            setIsOpen(false);
        } catch (error) {
            console.error("Error scheduling test drive:", error);
            toast({
                title: "Failed to schedule test drive",
                description: "Please try again later or contact support.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const timeSlots = Array.from({ length: 17 }, (_, i) => {
        const hour = Math.floor((i + 18) / 2) % 12 || 12;
        const minute = (i + 18) % 2 === 0 ? "00" : "30";
        const period = Math.floor((i + 18) / 2) < 12 ? "AM" : "PM";
        return {
            value: `${hour}:${minute} ${period}`,
            label: `${hour}:${minute} ${period}`,
        };
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Schedule Test Drive
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] overflow-visible">
                <DialogHeader>
                    <DialogTitle>Schedule a Test Drive</DialogTitle>
                    <DialogDescription>
                        Fill out the form below to schedule a test drive for {carName}.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
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
                                        <Input placeholder="you@example.com" type="email" {...field} />
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
                                        <Input placeholder="(123) 456-7890" {...field} />
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
                                    <FormLabel>Preferred Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant="outline" className="pl-3 text-left font-normal h-10">
                                                    {field.value ? format(field.value, "PPP") : (
                                                        <span className="text-muted-foreground">Pick a date</span>
                                                    )}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0 z-50 bg-white shadow-md border rounded-md pointer-events-auto"
                                            align="start"
                                            sideOffset={5}
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                                    date.getDay() === 0
                                                }
                                                initialFocus
                                                className="pointer-events-auto"
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
                                    <FormLabel>Preferred Time</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select time" />
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
                            {isSubmitting ? "Submitting..." : "Schedule Test Drive"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
