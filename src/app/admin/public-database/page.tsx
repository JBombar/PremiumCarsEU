'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { format } from "date-fns";
import { toast, useToast } from '@/components/ui/use-toast';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2 } from "lucide-react";

// --- Icons ---
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    XMarkIcon,
    EyeIcon,
    PhotoIcon,
    MapPinIcon,
    TagIcon,
    ClockIcon,
    Squares2X2Icon,
    TableCellsIcon,
    UserIcon,
    EnvelopeIcon,
    BuildingOfficeIcon,
    CheckIcon,
    PencilIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';

// --- Define the Car type based on partner_listings (including dealer details) ---
interface Car {
    id: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year: number;
    vin: string | null;
    price: number | null;
    images: string[];
    features: string[];
    status?: "available" | "sold" | string;
    mileage?: number | null;
    listing_type?: "sale" | "rental" | "both" | string;
    body_type?: string | null;
    exterior_color?: string | null;
    interior_color?: string | null;
    fuel_type?: string | null;
    transmission?: string | null;
    condition?: "new" | "used" | "certified" | string;
    description?: string | null;
    location_city?: string | null;
    location_country?: string | null;
    engine?: string | null;
    is_special_offer?: boolean;
    special_offer_label?: string | null;
    created_at?: string;
    // Dealer identity information
    partner_id?: string;
    dealer_first_name?: string;
    dealer_last_name?: string;
    dealer_email?: string;
    business_name?: string;
    approval_status?: string;
    is_shared_with_network?: boolean;
    is_public?: boolean;
}

// Helper component for displaying details in View Mode
function DetailItem({ label, value }: { label: string; value: string | number | boolean | undefined | null }) {
    const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value ?? 'N/A');
    return (
        <div>
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{displayValue}</dd>
        </div>
    );
}

// Helper function to format currency
const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined) {
        return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'CHF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str: string | undefined | null): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Format date helper function
const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
        return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
        return 'Invalid date';
    }
};

// Editable Price Cell component
function EditablePriceCell({ car, startEditing, handleFieldChange, saveField, cancelEditing, isEditing, editValue, isSaving }: {
    car: Car;
    startEditing: (carId: string, field: EditableField, currentValue: any) => void;
    handleFieldChange: (carId: string, field: EditableField, value: any) => void;
    saveField: (carId: string, field: EditableField) => Promise<void>;
    cancelEditing: (carId: string, field: EditableField) => void;
    isEditing: boolean;
    editValue: number | null | undefined;
    isSaving: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    if (isEditing) {
        return (
            <div className="flex items-center space-x-2">
                <Input
                    ref={inputRef}
                    type="number"
                    className="w-24 h-8 text-sm"
                    value={editValue !== null ? editValue : ''}
                    onChange={(e) => handleFieldChange(car.id, 'price', parseInt(e.target.value) || null)}
                    disabled={isSaving}
                />
                <div className="flex space-x-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => saveField(car.id, 'price')}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckIcon className="h-3 w-3" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => cancelEditing(car.id, 'price')}
                        disabled={isSaving}
                    >
                        <XMarkIcon className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-sm font-medium text-gray-900 group flex items-center">
            {formatPrice(car.price)}
            <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 ml-1"
                onClick={() => startEditing(car.id, 'price', car.price)}
            >
                <PencilIcon className="h-3 w-3" />
            </Button>
            {car.is_special_offer && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 ml-2">
                    {car.special_offer_label || 'Special'}
                </span>
            )}
        </div>
    );
}

// Editable Switch component for boolean fields
function EditableSwitchCell({ car, field, label, startEditing, handleFieldChange, saveField, isEditing, editValue, isSaving }: {
    car: Car;
    field: 'is_shared_with_network' | 'is_public';
    label: string;
    startEditing: (carId: string, field: EditableField, currentValue: any) => void;
    handleFieldChange: (carId: string, field: EditableField, value: any) => void;
    saveField: (carId: string, field: EditableField) => Promise<void>;
    isEditing: boolean;
    editValue: boolean | undefined;
    isSaving: boolean;
}) {
    const currentValue = car[field] as boolean | undefined;

    return (
        <div className="flex items-center space-x-2">
            <Switch
                checked={isEditing ? !!editValue : !!currentValue}
                onCheckedChange={(checked) => {
                    if (!isEditing) {
                        startEditing(car.id, field, currentValue);
                        handleFieldChange(car.id, field, checked);
                        saveField(car.id, field);
                    } else {
                        handleFieldChange(car.id, field, checked);
                        saveField(car.id, field);
                    }
                }}
                disabled={isSaving}
            />
            <Label className="text-xs">{label}</Label>
            {isSaving && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
        </div>
    );
}

// Editable Status Select component
function EditableStatusCell({ car, startEditing, handleFieldChange, saveField, cancelEditing, isEditing, editValue, isSaving }: {
    car: Car;
    startEditing: (carId: string, field: EditableField, currentValue: any) => void;
    handleFieldChange: (carId: string, field: EditableField, value: any) => void;
    saveField: (carId: string, field: EditableField) => Promise<void>;
    cancelEditing: (carId: string, field: EditableField) => void;
    isEditing: boolean;
    editValue: string | undefined;
    isSaving: boolean;
}) {
    if (isEditing) {
        return (
            <div className="flex items-center space-x-2">
                <Select
                    value={editValue || 'pending'}
                    onValueChange={(value) => handleFieldChange(car.id, 'approval_status', value)}
                    disabled={isSaving}
                >
                    <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex space-x-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => saveField(car.id, 'approval_status')}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckIcon className="h-3 w-3" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => cancelEditing(car.id, 'approval_status')}
                        disabled={isSaving}
                    >
                        <XMarkIcon className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-sm text-gray-500 group flex items-center">
            <Badge variant={car.approval_status === 'approved' ? 'default' : car.approval_status === 'rejected' ? 'destructive' : 'outline'}
                className={car.approval_status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                {capitalizeFirstLetter(car.approval_status || 'pending')}
            </Badge>
            <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 ml-1"
                onClick={() => startEditing(car.id, 'approval_status', car.approval_status || 'pending')}
            >
                <PencilIcon className="h-3 w-3" />
            </Button>
        </div>
    );
}

// Editable Special Offer Label
function EditableSpecialOfferCell({ car, startEditing, handleFieldChange, saveField, cancelEditing, isEditing, editValue, isSaving }: {
    car: Car;
    startEditing: (carId: string, field: EditableField, currentValue: any) => void;
    handleFieldChange: (carId: string, field: EditableField, value: any) => void;
    saveField: (carId: string, field: EditableField) => Promise<void>;
    cancelEditing: (carId: string, field: EditableField) => void;
    isEditing: boolean;
    editValue: string | null | undefined;
    isSaving: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    if (isEditing) {
        return (
            <div className="flex items-center space-x-2">
                <Input
                    ref={inputRef}
                    type="text"
                    className="w-32 h-8 text-sm"
                    value={editValue || ''}
                    onChange={(e) => handleFieldChange(car.id, 'special_offer_label', e.target.value || null)}
                    placeholder="Special Offer"
                    disabled={isSaving}
                />
                <div className="flex space-x-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => saveField(car.id, 'special_offer_label')}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckIcon className="h-3 w-3" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => cancelEditing(car.id, 'special_offer_label')}
                        disabled={isSaving}
                    >
                        <XMarkIcon className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        );
    }

    if (!car.is_special_offer) {
        return <div className="text-sm text-gray-500">-</div>;
    }

    return (
        <div className="text-sm text-gray-500 group flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                {car.special_offer_label || 'Special'}
            </span>
            <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 ml-1"
                onClick={() => startEditing(car.id, 'special_offer_label', car.special_offer_label)}
            >
                <PencilIcon className="h-3 w-3" />
            </Button>
        </div>
    );
}

// Table View component
function TableView({ cars, openModal, startEditing, handleFieldChange, saveField, cancelEditing, editingState, savingState }: {
    cars: Car[];
    openModal: (car: Car) => void;
    startEditing: (carId: string, field: EditableField, currentValue: any) => void;
    handleFieldChange: (carId: string, field: EditableField, value: any) => void;
    saveField: (carId: string, field: EditableField) => Promise<void>;
    cancelEditing: (carId: string, field: EditableField) => void;
    editingState: EditingState;
    savingState: { [key: string]: boolean };
}) {
    if (cars.length === 0) {
        return (
            <p className="text-center text-gray-500 mt-8">No shared listings found in the network database.</p>
        );
    }

    return (
        <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse min-w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special Offer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listed</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {cars.map(car => {
                        const isEditing = editingState[car.id] || {};
                        const isSaving = savingState[car.id] || false;

                        return (
                            <tr key={car.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 mr-4">
                                            {car.images && car.images.length > 0 ? (
                                                <img
                                                    src={car.images[0]}
                                                    alt={`${car.vehicle_make} ${car.vehicle_model}`}
                                                    className="h-10 w-10 rounded-md object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=X'; }}
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                                    <PhotoIcon className="h-6 w-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {car.vehicle_make} {car.vehicle_model}
                                            </div>
                                            {car.body_type && (
                                                <div className="text-xs text-gray-500">
                                                    {car.body_type}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Editable Price Cell */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <EditablePriceCell
                                        car={car}
                                        startEditing={startEditing}
                                        handleFieldChange={handleFieldChange}
                                        saveField={saveField}
                                        cancelEditing={cancelEditing}
                                        isEditing={'price' in isEditing}
                                        editValue={isEditing.price}
                                        isSaving={isSaving}
                                    />
                                </td>

                                {/* Year (non-editable) */}
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {car.vehicle_year}
                                </td>

                                {/* Status (approval_status) */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <EditableStatusCell
                                        car={car}
                                        startEditing={startEditing}
                                        handleFieldChange={handleFieldChange}
                                        saveField={saveField}
                                        cancelEditing={cancelEditing}
                                        isEditing={'approval_status' in isEditing}
                                        editValue={isEditing.approval_status}
                                        isSaving={isSaving}
                                    />
                                </td>

                                {/* Visibility toggles */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex flex-col space-y-2">
                                        <EditableSwitchCell
                                            car={car}
                                            field="is_public"
                                            label="Public"
                                            startEditing={startEditing}
                                            handleFieldChange={handleFieldChange}
                                            saveField={saveField}
                                            isEditing={'is_public' in isEditing}
                                            editValue={isEditing.is_public}
                                            isSaving={isSaving}
                                        />
                                        <EditableSwitchCell
                                            car={car}
                                            field="is_shared_with_network"
                                            label="Network"
                                            startEditing={startEditing}
                                            handleFieldChange={handleFieldChange}
                                            saveField={saveField}
                                            isEditing={'is_shared_with_network' in isEditing}
                                            editValue={isEditing.is_shared_with_network}
                                            isSaving={isSaving}
                                        />
                                    </div>
                                </td>

                                {/* Special Offer Label */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <EditableSpecialOfferCell
                                        car={car}
                                        startEditing={startEditing}
                                        handleFieldChange={handleFieldChange}
                                        saveField={saveField}
                                        cancelEditing={cancelEditing}
                                        isEditing={'special_offer_label' in isEditing}
                                        editValue={isEditing.special_offer_label}
                                        isSaving={isSaving}
                                    />
                                </td>

                                {/* Location (non-editable) */}
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {car.location_city && car.location_country
                                        ? `${car.location_city}, ${car.location_country}`
                                        : car.location_city || car.location_country || 'N/A'}
                                </td>

                                {/* Seller (non-editable) */}
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{car.dealer_first_name} {car.dealer_last_name}</span>
                                        <span className="text-xs text-gray-500">{car.dealer_email}</span>
                                        {car.business_name && <span className="text-xs text-gray-400">{car.business_name}</span>}
                                    </div>
                                </td>

                                {/* Listed Date (non-editable) */}
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(car.created_at)}
                                </td>

                                {/* Actions (View Details) */}
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openModal(car)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <EyeIcon className="h-4 w-4 mr-1" />
                                        View
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// Gallery View component
function GalleryView({
    cars,
    openModal,
    nextImage,
    prevImage,
    activeImageIndex
}: {
    cars: Car[],
    openModal: (car: Car) => void,
    nextImage: (e: React.MouseEvent<HTMLButtonElement>, carId: string, images?: string[] | null) => void,
    prevImage: (e: React.MouseEvent<HTMLButtonElement>, carId: string, images?: string[] | null) => void,
    activeImageIndex: Record<string, number>
}) {
    if (cars.length === 0) {
        return (
            <p className="text-center text-gray-500 mt-8">No shared listings found in the network database.</p>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cars.map(car => (
                <div
                    key={car.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openModal(car)}
                >
                    {/* Card Top Section - Image */}
                    <div className="relative aspect-video bg-gray-100">
                        {(car.images?.length ?? 0) > 0 ? (
                            <>
                                <img
                                    src={car.images[activeImageIndex[car.id] || 0]}
                                    alt={`${car.vehicle_make} ${car.vehicle_model}`}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x225?text=No+Image'; }}
                                />
                                {(car.images?.length ?? 0) > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => prevImage(e, car.id, car.images)}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition"
                                            aria-label="Previous image"
                                        >
                                            <ArrowLeftIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => nextImage(e, car.id, car.images)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition"
                                            aria-label="Next image"
                                        >
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                                <PhotoIcon className="h-10 w-10 text-gray-400" />
                            </div>
                        )}

                        {/* Special Offer Badge */}
                        {car.is_special_offer && (
                            <div className="absolute top-2 right-2 z-10">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                    {car.special_offer_label || 'Special Offer'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {car.vehicle_make} {car.vehicle_model}
                            </h3>
                            <span className="text-lg font-bold text-gray-900">
                                {formatPrice(car.price)}
                            </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600 mb-3">
                            <span className="mr-3">{car.vehicle_year}</span>
                            <span>•</span>
                            <span className="mx-3">{car.condition ? capitalizeFirstLetter(car.condition) : 'N/A'}</span>
                            <span>•</span>
                            <span className="ml-3">{car.mileage != null ? `${car.mileage.toLocaleString()} km` : 'N/A'}</span>
                        </div>

                        {/* Dealer information - Added for admin view */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <UserIcon className="h-3 w-3" />
                            <span>{car.dealer_first_name} {car.dealer_last_name}</span>
                            {car.business_name && (
                                <span className="text-gray-400 ml-1">({car.business_name})</span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {car.listing_type && (
                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                    <TagIcon className="h-3 w-3" />
                                    {capitalizeFirstLetter(car.listing_type)}
                                </Badge>
                            )}

                            {(car.location_city || car.location_country) && (
                                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                    <MapPinIcon className="h-3 w-3" />
                                    {car.location_city && car.location_country
                                        ? `${car.location_city}, ${car.location_country}`
                                        : car.location_city || car.location_country
                                    }
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openModal(car);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                            >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View Details
                            </button>

                            {car.created_at && (
                                <span className="text-xs text-gray-500 flex items-center">
                                    <ClockIcon className="h-3 w-3 mr-1" />
                                    Listed {formatDate(car.created_at)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Add a type for editing state
type EditableField = 'price' | 'is_shared_with_network' | 'is_public' | 'approval_status' | 'special_offer_label';
type EditingState = { [key: string]: { [field in EditableField]?: any } };

export default function AdminPublicDatabasePage() {
    const supabase = createClient();
    const { toast } = useToast();

    // State declarations
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCar, setCurrentCar] = useState<Car | null>(null);
    const [modalActiveImageIndex, setModalActiveImageIndex] = useState<number>(0);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});

    // View toggle state
    const [viewMode, setViewMode] = useState<'gallery' | 'table'>('gallery');

    // New state for inline editing
    const [editingState, setEditingState] = useState<EditingState>({});
    const [savingState, setSavingState] = useState<{ [key: string]: boolean }>({});

    // Fetch shared listings with dealer information
    const fetchSharedCars = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Select all columns from partner_listings where is_shared_with_network = true
            // Join with dealer_partners and users tables to get dealer information
            const { data, error: listErr } = await supabase
                .from('partner_listings')
                .select(`
                    *,
                    dealer_partners:partner_id (
                        id,
                        dealership_id,
                        business_name,
                        dealer_user:dealer_user_id (
                            id,
                            first_name,
                            last_name,
                            email
                        )
                    )
                `)
                .eq('is_shared_with_network', true)
                .eq('is_public', true)
                .eq('approval_status', 'approved')
                .order('created_at', { ascending: false });

            if (listErr) throw listErr;

            // Map data to the Car interface, including dealer information
            const formattedData: Car[] = (data || []).map(item => ({
                id: item.id,
                vehicle_make: item.vehicle_make || '',
                vehicle_model: item.vehicle_model || '',
                vehicle_year: item.vehicle_year || 0,
                vin: item.vin || null,
                price: item.price === undefined ? null : item.price,
                images: Array.isArray(item.images) ? item.images.filter(Boolean) : [],
                features: Array.isArray(item.features) ? item.features.filter(Boolean) : [],
                status: item.status || 'available',
                mileage: item.mileage,
                listing_type: item.listing_type || 'sale',
                body_type: item.body_type,
                exterior_color: item.exterior_color,
                interior_color: item.interior_color,
                fuel_type: item.fuel_type || 'gasoline',
                transmission: item.transmission || 'automatic',
                condition: item.condition || 'used',
                description: item.description,
                location_city: item.location_city,
                location_country: item.location_country,
                engine: item.engine,
                is_special_offer: item.is_special_offer ?? false,
                special_offer_label: item.special_offer_label || null,
                created_at: item.created_at,
                // Include dealer information
                partner_id: item.partner_id,
                dealer_first_name: item.dealer_partners?.dealer_user?.first_name || 'Unknown',
                dealer_last_name: item.dealer_partners?.dealer_user?.last_name || '',
                dealer_email: item.dealer_partners?.dealer_user?.email || 'N/A',
                business_name: item.dealer_partners?.business_name || null,
            }));

            setCars(formattedData);
        } catch (err: any) {
            console.error("Error fetching shared listings:", err);
            setError(err.message || 'Failed to fetch shared listings.');
            setCars([]);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Effect to fetch cars when component mounts
    useEffect(() => {
        fetchSharedCars();
    }, [fetchSharedCars]);

    // --- Modal Open/Close Handlers ---
    const openModal = async (car: Car) => {
        setCurrentCar(car);
        setModalActiveImageIndex(0);
        setError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setCurrentCar(null);
            setError(null);
            setModalActiveImageIndex(0);
        }, 300);
    };

    // --- Image Gallery Handlers ---
    const nextModalImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (!currentCar || !currentCar.images || currentCar.images.length <= 1) return;
        setModalActiveImageIndex(prev => (prev + 1) % currentCar.images.length);
    };

    const prevModalImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (!currentCar || !currentCar.images || currentCar.images.length <= 1) return;
        setModalActiveImageIndex(prev => (prev - 1 + currentCar.images.length) % currentCar.images.length);
    };

    const openImageGallery = (car: Car, index: number) => {
        setCurrentCar(car);
        setSelectedImageIndex(index);
    };

    // --- Gallery Image Navigation ---
    const nextImage = (e: React.MouseEvent<HTMLButtonElement>, carId: string, images?: string[] | null) => {
        e.stopPropagation(); // Prevent card click event
        if (!images || images.length <= 1) return;

        setActiveImageIndex(prev => ({
            ...prev,
            [carId]: ((prev[carId] || 0) + 1) % images.length
        }));
    };

    const prevImage = (e: React.MouseEvent<HTMLButtonElement>, carId: string, images?: string[] | null) => {
        e.stopPropagation(); // Prevent card click event
        if (!images || images.length <= 1) return;

        setActiveImageIndex(prev => ({
            ...prev,
            [carId]: ((prev[carId] || 0) - 1 + images.length) % images.length
        }));
    };

    // Function to handle edit mode for a specific field
    const startEditing = (carId: string, field: EditableField, currentValue: any) => {
        setEditingState(prev => ({
            ...prev,
            [carId]: {
                ...(prev[carId] || {}),
                [field]: currentValue
            }
        }));
    };

    // Function to handle field value change
    const handleFieldChange = (carId: string, field: EditableField, value: any) => {
        setEditingState(prev => ({
            ...prev,
            [carId]: {
                ...(prev[carId] || {}),
                [field]: value
            }
        }));
    };

    // Function to save changes to a field
    const saveField = async (carId: string, field: EditableField) => {
        if (!editingState[carId] || editingState[carId][field] === undefined) return;

        // Mark this field as saving
        setSavingState(prev => ({ ...prev, [carId]: true }));

        try {
            const updatedValue = editingState[carId][field];
            const payload = { [field]: updatedValue };

            // Use the partner-listings endpoint instead of pending-listings
            const response = await fetch(`/api/admin/partner-listings/${carId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Failed to update: ${response.statusText}`);
            }

            // Update the car in the local state (optimistic update)
            setCars(prev => prev.map(car =>
                car.id === carId ? { ...car, [field]: updatedValue } : car
            ));

            // Clear editing state for this field
            setEditingState(prev => {
                const newState = { ...prev };
                if (newState[carId]) {
                    delete newState[carId][field];
                    if (Object.keys(newState[carId]).length === 0) {
                        delete newState[carId];
                    }
                }
                return newState;
            });

            toast({
                title: "Listing updated",
                description: `The ${field.replace('_', ' ')} has been updated successfully.`,
                variant: "default"
            });
        } catch (error) {
            console.error('Error updating field:', error);
            toast({
                title: "Update failed",
                description: error instanceof Error ? error.message : String(error),
                variant: "destructive"
            });
        } finally {
            setSavingState(prev => ({ ...prev, [carId]: false }));
        }
    };

    // Function to cancel editing a field
    const cancelEditing = (carId: string, field: EditableField) => {
        setEditingState(prev => {
            const newState = { ...prev };
            if (newState[carId]) {
                delete newState[carId][field];
                if (Object.keys(newState[carId]).length === 0) {
                    delete newState[carId];
                }
            }
            return newState;
        });
    };

    return (
        <div className="container px-4 mx-auto py-6 max-w-full lg:max-w-[95%] xl:max-w-[90%] 2xl:max-w-[1800px]">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Public Network Database | All Shared Listings</h1>
                <p className="text-gray-600 mt-1">Browse, manage, and edit partner-shared listings across the network</p>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>

            {/* View Selector & Stats */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-2">
                    <Button
                        variant={viewMode === 'gallery' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('gallery')}
                        className="flex items-center"
                    >
                        <Squares2X2Icon className="w-4 h-4 mr-1.5" />
                        Gallery
                    </Button>
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className="flex items-center"
                    >
                        <TableCellsIcon className="w-4 h-4 mr-1.5" />
                        Table
                    </Button>
                    {/* Admin controls info */}
                    {viewMode === 'table' && (
                        <span className="text-xs text-gray-500 ml-4 flex items-center">
                            <InformationCircleIcon className="h-4 w-4 mr-1" />
                            Hover over editable fields to make changes (Price, Status, Visibility, Special Offers)
                        </span>
                    )}
                </div>

                {/* 
                  Future moderation tools can be added here
                  For example: bulk approve/reject buttons, filters, etc.
                */}

                <div>
                    <span className="text-sm text-gray-500">
                        {cars.length} {cars.length === 1 ? 'vehicle' : 'vehicles'} found
                    </span>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <p className="text-center text-gray-500 mt-8">Loading shared listings...</p>
            )}

            {/* Content Views */}
            {!loading && (
                viewMode === 'gallery' ? (
                    <GalleryView
                        cars={cars}
                        openModal={openModal}
                        nextImage={nextImage}
                        prevImage={prevImage}
                        activeImageIndex={activeImageIndex}
                    />
                ) : (
                    <TableView
                        cars={cars}
                        openModal={openModal}
                        startEditing={startEditing}
                        handleFieldChange={handleFieldChange}
                        saveField={saveField}
                        cancelEditing={cancelEditing}
                        editingState={editingState}
                        savingState={savingState}
                    />
                )
            )}

            {/* --- View Modal --- */}
            <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="max-w-4xl w-full max-h-[95vh] overflow-y-auto p-0">
                    {/* Header */}
                    <div className="sticky top-0 bg-white px-6 py-4 border-b z-10 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {`${currentCar?.vehicle_make || ''} ${currentCar?.vehicle_model || 'Vehicle'}`}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full">
                            <XMarkIcon className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Content Area */}
                    {currentCar && (
                        <div className="p-6 space-y-6">
                            {/* Dealer Information Section (Admin View) */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h3 className="text-md font-semibold text-blue-800 mb-2">Dealer Information</h3>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex items-center">
                                        <UserIcon className="h-5 w-5 text-blue-700 mr-2" />
                                        <span>
                                            {currentCar.dealer_first_name} {currentCar.dealer_last_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <EnvelopeIcon className="h-5 w-5 text-blue-700 mr-2" />
                                        <span>{currentCar.dealer_email}</span>
                                    </div>
                                    {currentCar.business_name && (
                                        <div className="flex items-center">
                                            <BuildingOfficeIcon className="h-5 w-5 text-blue-700 mr-2" />
                                            <span>{currentCar.business_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Image Gallery */}
                            <div>
                                <h3 className="text-md font-semibold text-gray-700 mb-2">Images</h3>
                                {(currentCar.images?.length ?? 0) > 0 ? (
                                    <div className="relative h-64 md:h-80 lg:h-96 bg-gray-100 overflow-hidden rounded-lg group border">
                                        <img
                                            key={currentCar.images[modalActiveImageIndex] || modalActiveImageIndex}
                                            src={currentCar.images[modalActiveImageIndex]}
                                            alt={`${currentCar.vehicle_make} ${currentCar.vehicle_model} - view ${modalActiveImageIndex + 1}`}
                                            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                                            onClick={() => openImageGallery(currentCar, modalActiveImageIndex)}
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Error'; }}
                                        />
                                        {(currentCar.images?.length ?? 0) > 1 && (
                                            <>
                                                <button onClick={prevModalImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/60" aria-label="Previous">
                                                    <ArrowLeftIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={nextModalImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/60" aria-label="Next">
                                                    <ArrowRightIcon className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-64 bg-gray-100 flex items-center justify-center rounded-lg border">
                                        <div className="text-center text-gray-500">
                                            <PhotoIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                                            <p>No images available</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Vehicle Details Section */}
                            <div>
                                <h3 className="text-md font-semibold text-gray-700 mb-3">Vehicle Details</h3>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4">
                                    <DetailItem label="Make" value={currentCar.vehicle_make} />
                                    <DetailItem label="Model" value={currentCar.vehicle_model} />
                                    <DetailItem label="Year" value={currentCar.vehicle_year} />
                                    <DetailItem label="Price" value={formatPrice(currentCar.price)} />
                                    <DetailItem label="Mileage" value={currentCar.mileage != null ? `${currentCar.mileage.toLocaleString()} km` : null} />
                                    <DetailItem label="VIN" value={currentCar.vin} />
                                    <DetailItem label="Status" value={currentCar.status ? capitalizeFirstLetter(currentCar.status) : null} />
                                    <DetailItem label="Listing Type" value={currentCar.listing_type ? capitalizeFirstLetter(currentCar.listing_type) : null} />
                                    <DetailItem label="Body Type" value={currentCar.body_type ? capitalizeFirstLetter(currentCar.body_type) : null} />
                                    <DetailItem label="Exterior Color" value={currentCar.exterior_color ? capitalizeFirstLetter(currentCar.exterior_color) : null} />
                                    <DetailItem label="Interior Color" value={currentCar.interior_color ? capitalizeFirstLetter(currentCar.interior_color) : null} />
                                    <DetailItem label="Fuel Type" value={currentCar.fuel_type ? capitalizeFirstLetter(currentCar.fuel_type) : 'N/A'} />
                                    <DetailItem label="Transmission" value={currentCar.transmission ? capitalizeFirstLetter(currentCar.transmission) : 'N/A'} />
                                    <DetailItem label="Condition" value={currentCar.condition ? capitalizeFirstLetter(currentCar.condition) : 'N/A'} />
                                    <DetailItem label="Engine" value={currentCar.engine} />
                                    <DetailItem label="Location" value={currentCar.location_city && currentCar.location_country ? `${currentCar.location_city}, ${currentCar.location_country}` : currentCar.location_city || currentCar.location_country || 'N/A'} />
                                    <DetailItem label="Listed Date" value={formatDate(currentCar.created_at)} />
                                    <DetailItem label="Special Offer" value={currentCar.is_special_offer} />
                                </dl>
                            </div>

                            {/* Description Section */}
                            {currentCar.description && (
                                <div>
                                    <h3 className="text-md font-semibold text-gray-700">Description</h3>
                                    <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{currentCar.description}</p>
                                </div>
                            )}

                            {/* Features Section */}
                            <div>
                                <h3 className="text-md font-semibold text-gray-700">Features</h3>
                                {(currentCar.features?.length ?? 0) > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {currentCar.features?.map((feature, index) => (
                                            <span key={feature || index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-gray-500">No features listed.</p>
                                )}
                            </div>

                            {/* Special Offer Details */}
                            {currentCar.is_special_offer && (
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <h4 className="text-md font-semibold text-orange-800">Special Offer</h4>
                                    {currentCar.special_offer_label && (
                                        <span className="mt-1 inline-block bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-medium">
                                            {currentCar.special_offer_label}
                                        </span>
                                    )}
                                    {!currentCar.special_offer_label && (
                                        <p className="mt-1 text-sm text-orange-700">This vehicle is marked as a special offer.</p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-5 border-t mt-6">
                                {/* 
                                  Future moderation actions can be added here
                                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                      Unshare from Network
                                  </Button>
                                */}
                                <Button variant="outline" onClick={closeModal}>Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* --- Enhanced Image Gallery Dialog (Full Screen) --- */}
            <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
                <DialogContent className="max-w-6xl w-full p-0 bg-black/90 border-0 overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Image Gallery</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-[90vh] flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full"
                            onClick={() => setSelectedImageIndex(null)}
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </Button>

                        {(currentCar?.images?.length ?? 0) > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full p-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex(prev => prev! > 0 ? prev! - 1 : currentCar!.images!.length - 1);
                                }}
                                aria-label="Previous image"
                            >
                                <ArrowLeftIcon className="h-6 w-6" />
                            </Button>
                        )}

                        {(currentCar?.images?.length ?? 0) > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/30 hover:bg-black/50 rounded-full p-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex(prev => prev! < currentCar!.images!.length - 1 ? prev! + 1 : 0);
                                }}
                                aria-label="Next image"
                            >
                                <ArrowRightIcon className="h-6 w-6" />
                            </Button>
                        )}

                        {selectedImageIndex !== null && (currentCar?.images?.length ?? 0) > 1 && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-50">
                                {selectedImageIndex + 1} / {currentCar!.images!.length}
                            </div>
                        )}

                        {selectedImageIndex !== null && currentCar?.images?.[selectedImageIndex] && (
                            <img
                                src={currentCar.images[selectedImageIndex]}
                                alt={`${currentCar.vehicle_make} ${currentCar.vehicle_model} - Image ${selectedImageIndex + 1}`}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        )}

                        {selectedImageIndex !== null && !currentCar?.images?.[selectedImageIndex] && (
                            <div className="text-white text-center p-4">Image not available</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
