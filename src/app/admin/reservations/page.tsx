"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { CalendarDays, Phone, Mail, CarFront, Check, X, RefreshCcw, SearchIcon } from "lucide-react";
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

// Define the Reservation type based on your database schema
interface Reservation {
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
  user_id: string | null;
  car_id: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  async function fetchReservations() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast({
        title: "Error",
        description: "Failed to load reservations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateReservationStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("reservations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setReservations(
        reservations.map((reservation) =>
          reservation.id === id ? { ...reservation, status } : reservation
        )
      );

      toast({
        title: "Status updated",
        description: `Reservation status changed to ${status}`,
      });
    } catch (error) {
      console.error("Error updating reservation:", error);
      toast({
        title: "Update failed",
        description: "Could not update the reservation status.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  }

  async function toggleContactedStatus(id: string, contacted: boolean) {
    setUpdating(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("reservations")
        .update({ contacted: !contacted })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setReservations(
        reservations.map((reservation) =>
          reservation.id === id ? { ...reservation, contacted: !contacted } : reservation
        )
      );

      toast({
        title: "Contact status updated",
        description: contacted
          ? "Marked as not contacted"
          : "Marked as contacted",
      });
    } catch (error) {
      console.error("Error updating contacted status:", error);
      toast({
        title: "Update failed",
        description: "Could not update the contact status.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
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

    setUpdating(id);
    try {
      const supabase = createClient();

      // Simple deletion with comprehensive error handling
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Database error during deletion:", error);
        throw error;
      }

      // Only update the UI after confirmed database deletion
      setReservations(prevReservations =>
        prevReservations.filter(reservation => reservation.id !== id)
      );

      toast({
        title: "Reservation deleted",
        description: "The reservation has been permanently removed.",
      });
    } catch (error) {
      console.error("Error deleting reservation:", error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete the reservation.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  }

  // Filter reservations based on search term and status
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      filter === "" ||
      reservation.customer_name.toLowerCase().includes(filter.toLowerCase()) ||
      reservation.email.toLowerCase().includes(filter.toLowerCase()) ||
      reservation.vehicle.toLowerCase().includes(filter.toLowerCase()) ||
      reservation.phone.includes(filter);

    const matchesStatus =
      statusFilter === null || reservation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status badge component for better readability
  const StatusBadge = ({ status }: { status: string }) => {
    let variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | null
      | undefined = "default";

    switch (status) {
      case "pending":
        variant = "secondary";
        break;
      case "accepted":
        variant = "default";
        break;
      case "rejected":
        variant = "destructive";
        break;
      case "completed":
        variant = "outline";
        break;
      default:
        variant = "secondary";
    }

    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reservations</h1>
          <p className="text-muted-foreground">
            Manage test drive reservations and customer inquiries
          </p>
        </div>
        <Button onClick={fetchReservations} variant="outline" className="gap-2 w-full md:w-auto">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reservations</CardTitle>
          <CardDescription>
            You have {reservations.length} total reservations in the system
          </CardDescription>

          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, vehicle..."
                className="pl-8"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <Select
              onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
              defaultValue="all"
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {filter || statusFilter
                ? "No reservations match your search criteria"
                : "No reservations found"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contacted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reservation.customer_name}</div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{reservation.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{reservation.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CarFront className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.vehicle}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {reservation.date
                                ? format(new Date(reservation.date), "MMM d, yyyy")
                                : "N/A"}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {reservation.time || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={reservation.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={reservation.contacted ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleContactedStatus(reservation.id, reservation.contacted)}
                          disabled={updating === reservation.id}
                        >
                          {reservation.contacted ? (
                            <>
                              <Check className="h-4 w-4 mr-2" /> Contacted
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" /> Not Contacted
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {reservation.status === "pending" && (
                          <>
                            <Button
                              onClick={() => updateReservationStatus(reservation.id, "accepted")}
                              disabled={updating === reservation.id}
                              size="sm"
                              variant="outline"
                              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                            >
                              Accept
                            </Button>
                            <Button
                              onClick={() => updateReservationStatus(reservation.id, "rejected")}
                              disabled={updating === reservation.id}
                              size="sm"
                              variant="outline"
                              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {reservation.status === "accepted" && (
                          <Button
                            onClick={() => updateReservationStatus(reservation.id, "completed")}
                            disabled={updating === reservation.id}
                            size="sm"
                            variant="outline"
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                          >
                            Mark Completed
                          </Button>
                        )}
                        {(reservation.status === "rejected" || reservation.status === "completed") && (
                          <Button
                            onClick={() => updateReservationStatus(reservation.id, "pending")}
                            disabled={updating === reservation.id}
                            size="sm"
                            variant="outline"
                          >
                            Reset to Pending
                          </Button>
                        )}

                        <Button
                          onClick={() => confirmDelete(reservation.id)}
                          disabled={updating === reservation.id}
                          size="sm"
                          variant="outline"
                          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 mt-2 md:mt-0"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the reservation. This action cannot be undone.
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