'use client';

import { useState } from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { CalendarClock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

// Interface for test drive reservation type
interface TestDriveReservation {
    id: string;
    customer_name: string;
    email: string;
    phone: string;
    vehicle: string;
    date: string;
    time: string;
    status: string;
    contacted: boolean;
    created_at: string;
    user_id: string;
    car_id: string;
}

// Get badge variant based on status
function getStatusBadgeVariant(status: string) {
    switch (status.toLowerCase()) {
        case 'confirmed':
            return 'outline';
        case 'cancelled':
            return 'destructive';
        case 'no_show':
            return 'destructive';
        default:
            return 'default';
    }
}

// Format date helper function
function formatDate(dateString: string) {
    try {
        return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
        return dateString;
    }
}

export default function TestDriveReservationsPage() {
    const [reservations, setReservations] = useState<TestDriveReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<{ [key: string]: boolean }>({});
    const { toast } = useToast();
    const supabase = createClient();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchReservations();
    }, []);

    async function fetchReservations() {
        setLoading(true);
        const { data, error } = await supabase
            .from('test_drive_reservations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching test drive reservations:", error);
            toast({
                title: "Error",
                description: "Failed to load test drive reservations",
                variant: "destructive",
            });
        } else {
            setReservations(data || []);
        }
        setLoading(false);
    }

    async function updateReservationStatus(id: string, newStatus: string) {
        // Set the specific reservation as updating
        setUpdatingStatus(prev => ({ ...prev, [id]: true }));

        try {
            const { error } = await supabase
                .from('test_drive_reservations')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) {
                throw error;
            }

            // Update local state to reflect the change
            setReservations(prevReservations =>
                prevReservations.map(reservation =>
                    reservation.id === id
                        ? { ...reservation, status: newStatus }
                        : reservation
                )
            );

            toast({
                title: "Status Updated",
                description: `Reservation status changed to ${newStatus}`,
            });
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                title: "Update Failed",
                description: "Failed to update reservation status",
                variant: "destructive",
            });
        } finally {
            // Clear the updating state
            setUpdatingStatus(prev => ({ ...prev, [id]: false }));
        }
    }

    function confirmDelete(id: string) {
        setReservationToDelete(id);
        setDeleteDialogOpen(true);
    }

    async function handleDeleteConfirmed() {
        if (!reservationToDelete) return;

        const id = reservationToDelete;
        setDeleteDialogOpen(false);
        setReservationToDelete(null);

        // Set the specific reservation as updating
        setUpdatingStatus(prev => ({ ...prev, [id]: true }));

        try {
            const { error } = await supabase
                .from('test_drive_reservations')
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }

            // Update local state by removing the deleted reservation
            setReservations(prevReservations =>
                prevReservations.filter(reservation => reservation.id !== id)
            );

            toast({
                title: "Reservation Deleted",
                description: "The test drive reservation has been permanently removed.",
            });
        } catch (error) {
            console.error("Error deleting reservation:", error);
            toast({
                title: "Delete Failed",
                description: "Failed to delete test drive reservation",
                variant: "destructive",
            });
        } finally {
            // Clear the updating state
            setUpdatingStatus(prev => ({ ...prev, [id]: false }));
        }
    }

    if (loading && reservations.length === 0) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold tracking-tight mb-6">Test Drive Reservations</h1>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            Loading test drive reservations...
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Test Drive Reservations</h1>
            <Card>
                <CardHeader>
                    <CardTitle>All Test Drive Bookings</CardTitle>
                    <CardDescription>
                        Manage test drive bookings submitted by customers
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Vehicle</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reservations.length > 0 ? (
                                reservations.map((reservation) => (
                                    <TableRow key={reservation.id}>
                                        <TableCell className="font-medium">
                                            {reservation.customer_name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{reservation.email}</span>
                                                <span className="text-sm text-muted-foreground">{reservation.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{reservation.vehicle}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <div className="flex items-center text-sm">
                                                    <CalendarClock className="mr-1 h-4 w-4 text-muted-foreground" />
                                                    <span>{formatDate(reservation.date)}</span>
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {reservation.time}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    defaultValue={reservation.status}
                                                    onValueChange={(value) => updateReservationStatus(reservation.id, value)}
                                                    disabled={updatingStatus[reservation.id]}
                                                >
                                                    <SelectTrigger
                                                        className={`w-[130px] h-8 text-white
                                                              ${reservation.status === 'confirmed'
                                                                ? 'bg-green-600 hover:bg-green-700'
                                                                : reservation.status === 'pending'
                                                                    ? 'bg-amber-500 hover:bg-amber-600'
                                                                    : reservation.status === 'cancelled' || reservation.status === 'no_show'
                                                                        ? 'bg-red-600 hover:bg-red-700'
                                                                        : ''
                                                            }
                                                                 ${updatingStatus[reservation.id] ? 'opacity-70' : ''}
                                                             `}
                                                    >
                                                        <SelectValue>
                                                            {updatingStatus[reservation.id] ? 'Updating...' : (
                                                                <div className="flex items-center gap-2 capitalize">
                                                                    {reservation.status}
                                                                </div>
                                                            )}
                                                        </SelectValue>
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                        <SelectItem value="no_show">No Show</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            {formatDate(reservation.created_at)}
                                        </TableCell>

                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
                                                onClick={() => confirmDelete(reservation.id)}
                                                disabled={updatingStatus[reservation.id]}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                        No test drive reservations found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the test drive reservation. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirmed}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 