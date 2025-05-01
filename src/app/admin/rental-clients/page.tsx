"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    ChevronDown,
    Filter,
    Search,
    Phone,
    Mail,
    MessageSquare,
    Tag,
    MapPin,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

// Define types for our data structures
interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    preferredContact: string;
    status: string;
    tags: string[];
    notes: string;
    createdAt: string;
}

interface Interaction {
    id: string;
    clientId: string;
    type: string;
    outcome: string;
    notes: string;
    createdAt: string;
}

interface ActivityLog {
    id: string;
    clientId: string;
    type: string;
    description: string;
    createdAt: string;
}

interface ClientDetails {
    interactions: Interaction[];
    activityLogs: ActivityLog[];
}

// Mock client data
const MOCK_CLIENTS: Client[] = Array(20).fill(null).map((_, i) => ({
    id: `client-${i + 1}`,
    name: `Client ${i + 1}`,
    email: `client${i + 1}@example.com`,
    phone: `+1 (555) ${100 + i}-${1000 + i}`,
    city: ["New York", "Los Angeles", "Chicago", "Miami", "Seattle"][i % 5],
    preferredContact: ["Email", "Phone", "WhatsApp"][i % 3],
    status: ["Active", "Inactive", "Pending", "VIP"][i % 4],
    tags: [
        ["Repeat Customer", "Corporate"],
        ["New", "Personal"],
        ["Referral", "Premium"],
        ["International", "Business"],
    ][i % 4],
    notes: `Notes about client ${i + 1}`,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

// Mock interactions
const MOCK_INTERACTIONS = (clientId: string): Interaction[] =>
    Array(5)
        .fill(null)
        .map((_, i) => ({
            id: `interaction-${clientId}-${i}`,
            clientId,
            type: ["Call", "Email", "WhatsApp", "In-person"][i % 4],
            outcome: [
                "Booking made",
                "Question answered",
                "Complaint resolved",
                "Follow-up scheduled",
                "No answer",
            ][i % 5],
            notes: `Interaction notes ${i + 1}`,
            createdAt: new Date(Date.now() - i * 86400000 * 0.5).toISOString(),
        }));

// Mock activity logs
const MOCK_ACTIVITY_LOGS = (clientId: string): ActivityLog[] =>
    Array(5)
        .fill(null)
        .map((_, i) => ({
            id: `activity-${clientId}-${i}`,
            clientId,
            type: [
                "Rental Created",
                "Document Uploaded",
                "Profile Updated",
                "Payment Made",
                "Form Completed",
            ][i % 5],
            description: `Activity description ${i + 1}`,
            createdAt: new Date(Date.now() - i * 86400000 * 0.3).toISOString(),
        }));

export default function RentalClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientDetails, setClientDetails] = useState<ClientDetails>({
        interactions: [],
        activityLogs: [],
    });
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Simulate data fetching
    useEffect(() => {
        const fetchClients = async () => {
            // In a real app, this would be an API call
            setTimeout(() => {
                setClients(MOCK_CLIENTS);
                setFilteredClients(MOCK_CLIENTS);
                setIsLoading(false);
            }, 500);
        };

        fetchClients();
    }, []);

    // Handle filtering and searching
    useEffect(() => {
        let result = [...clients];

        if (searchQuery) {
            result = result.filter(
                (client) =>
                    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    client.phone.includes(searchQuery)
            );
        }

        if (statusFilter !== "All") {
            result = result.filter((client) => client.status === statusFilter);
        }

        setFilteredClients(result);
        setCurrentPage(1); // Reset to first page on filter change
    }, [searchQuery, statusFilter, clients]);

    // Get client details
    const handleViewDetails = (client: Client) => {
        setSelectedClient(client);
        setClientDetails({
            interactions: MOCK_INTERACTIONS(client.id),
            activityLogs: MOCK_ACTIVITY_LOGS(client.id),
        });
        setIsDetailsOpen(true);
    };

    // Pagination data
    const totalPages = Math.ceil(filteredClients.length / pageSize);
    const currentData = filteredClients.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Status badge color mapping
    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            Active: "bg-green-100 text-green-800",
            Inactive: "bg-gray-100 text-gray-800",
            Pending: "bg-yellow-100 text-yellow-800",
            VIP: "bg-purple-100 text-purple-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    // Format date function
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Rental Clients -- need to add buttons and db integration and n8n</h1>
                <Button>Add New Client</Button>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex gap-2">
                                <Filter size={16} />
                                Status: {statusFilter}
                                <ChevronDown size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setStatusFilter("All")}>
                                All
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("Active")}>
                                Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("Inactive")}>
                                Inactive
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("Pending")}>
                                Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("VIP")}>
                                VIP
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" className="gap-2">
                        <Tag size={16} />
                        Tags
                        <ChevronDown size={16} />
                    </Button>
                </div>
            </div>

            {/* Clients table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact Info</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5)
                                .fill(null)
                                .map((_, i) => (
                                    <TableRow key={`loading-${i}`}>
                                        <TableCell>
                                            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                                        </TableCell>
                                    </TableRow>
                                ))
                        ) : currentData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    No clients found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentData.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="h-4 w-4 text-gray-500" />
                                                <span>{client.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Phone className="h-4 w-4 text-gray-500" />
                                                <span>{client.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <MessageSquare className="h-4 w-4 text-gray-500" />
                                                <span>{client.preferredContact}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-gray-500" />
                                            {client.city}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(client.status)}>
                                            {client.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleViewDetails(client)}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!isLoading && filteredClients.length > 0 && (
                <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-500">
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, filteredClients.length)} of{" "}
                        {filteredClients.length} clients
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                            }
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Client details drawer */}
            <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                    {selectedClient && (
                        <>
                            <SheetHeader className="pb-4 border-b">
                                <SheetTitle className="text-2xl">{selectedClient.name}</SheetTitle>
                                <SheetDescription className="flex items-center gap-2">
                                    <Badge className={getStatusColor(selectedClient.status)}>
                                        {selectedClient.status}
                                    </Badge>
                                    <span className="text-gray-500">
                                        Client since {formatDate(selectedClient.createdAt)}
                                    </span>
                                </SheetDescription>
                            </SheetHeader>

                            <Tabs defaultValue="details" className="mt-6">
                                <TabsList className="grid grid-cols-3 mb-4">
                                    <TabsTrigger value="details">Details</TabsTrigger>
                                    <TabsTrigger value="interactions">Interactions</TabsTrigger>
                                    <TabsTrigger value="activity">Activity</TabsTrigger>
                                </TabsList>

                                <TabsContent value="details">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Client Information</CardTitle>
                                            <CardDescription>
                                                Contact details and preferences
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">
                                                        Full Name
                                                    </label>
                                                    <Input
                                                        defaultValue={selectedClient.name}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">
                                                        Email
                                                    </label>
                                                    <Input
                                                        defaultValue={selectedClient.email}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">
                                                        Phone
                                                    </label>
                                                    <Input
                                                        defaultValue={selectedClient.phone}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">
                                                        City
                                                    </label>
                                                    <Input
                                                        defaultValue={selectedClient.city}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">
                                                    Preferred Contact Method
                                                </label>
                                                <div className="flex gap-2 mt-1">
                                                    {["Email", "Phone", "WhatsApp"].map((method) => (
                                                        <Button
                                                            key={method}
                                                            variant={
                                                                selectedClient.preferredContact === method
                                                                    ? "default"
                                                                    : "outline"
                                                            }
                                                            size="sm"
                                                        >
                                                            {method}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">
                                                    Tags
                                                </label>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {selectedClient.tags.map((tag: string) => (
                                                        <Badge key={tag} variant="outline">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    <Button size="sm" variant="outline" className="h-6">
                                                        + Add
                                                    </Button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-500">
                                                    Notes
                                                </label>
                                                <textarea
                                                    className="mt-1 w-full p-2 border rounded-md h-24"
                                                    defaultValue={selectedClient.notes}
                                                />
                                            </div>

                                            <div className="flex justify-end gap-2 pt-4">
                                                <Button variant="outline">Cancel</Button>
                                                <Button>Save Changes</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="interactions">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle>Interaction History</CardTitle>
                                                <CardDescription>
                                                    Recent communication with client
                                                </CardDescription>
                                            </div>
                                            <Button size="sm">New Interaction</Button>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {clientDetails.interactions.map((interaction) => (
                                                    <div
                                                        key={interaction.id}
                                                        className="border rounded-lg p-4"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <Badge className="mb-2">
                                                                    {interaction.type}
                                                                </Badge>
                                                                <h4 className="font-semibold">
                                                                    {interaction.outcome}
                                                                </h4>
                                                            </div>
                                                            <span className="text-sm text-gray-500">
                                                                {formatDate(interaction.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-gray-600">
                                                            {interaction.notes}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="activity">
                                    <Card>
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <CardTitle>Activity Log</CardTitle>
                                                    <CardDescription>
                                                        Client system activity
                                                    </CardDescription>
                                                </div>
                                                <Button variant="outline" size="icon">
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {clientDetails.activityLogs.map((activity) => (
                                                    <div
                                                        key={activity.id}
                                                        className="flex items-start gap-3 border-b pb-3"
                                                    >
                                                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <span className="text-xs">{activity.type[0]}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between">
                                                                <h4 className="font-medium">{activity.type}</h4>
                                                                <span className="text-sm text-gray-500">
                                                                    {formatDate(activity.createdAt)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {activity.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
} 