// src/app/admin/rentals/[id]/page.tsx

import { cookies as getCookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface RentalPageProps {
    params: { id: string };
}

export default async function RentalDetailPage({ params }: RentalPageProps) {
    const cookieStore = getCookies();

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (name: string) => cookieStore.get(name)?.value,
            },
        }
    );

    const { data, error } = await supabase
        .from('rental_reservations')
        .select('*')
        .eq('id', params.id as string)
        .single();

    if (error || !data) return notFound();

    const {
        renter_name,
        renter_email,
        renter_phone,
        start_date,
        end_date,
        start_time,
        end_time,
        duration,
        id_document_url,
        license_document_url,
        status,
        created_at,
        approved_at,
        approved_by,
        canceled_at,
        canceled_by,
        notes,
        admin_comments,
        is_verified,
        verification_method,
        currency,
        total_price,
        preferred_contact_method,
    } = data;

    const statusVariant = status === 'confirmed'
        ? 'default'
        : status === 'pending'
            ? 'secondary'
            : 'destructive';

    const formatDate = (dateString?: string) =>
        dateString ? format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: enGB }) : null;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">Rental Reservation Details</h1>

            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">{renter_name}</h2>
                <Badge variant={statusVariant}>{status}</Badge>
            </div>

            <Card>
                <CardContent className="py-4">
                    <h3 className="text-lg font-semibold mb-2">Renter Info</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <p><strong>Email:</strong> {renter_email}</p>
                        <p><strong>Phone:</strong> {renter_phone}</p>
                        {preferred_contact_method && <p><strong>Preferred Contact:</strong> {preferred_contact_method}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="py-4">
                    <h3 className="text-lg font-semibold mb-2">Rental Period</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <p><strong>Start Date:</strong> {formatDate(start_date)}</p>
                        <p><strong>End Date:</strong> {formatDate(end_date)}</p>
                        {start_time && <p><strong>Start Time:</strong> {formatDate(start_time)}</p>}
                        {end_time && <p><strong>End Time:</strong> {formatDate(end_time)}</p>}
                        {duration && <p><strong>Duration:</strong> {duration} {start_time ? 'hours' : 'days'}</p>}
                        {total_price != null && (
                            <p><strong>Total Price:</strong> {currency} {total_price.toFixed(2)}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="py-4">
                    <h3 className="text-lg font-semibold mb-2">Documents</h3>
                    <div className="flex flex-wrap gap-4">
                        {id_document_url && (
                            <div>
                                <p className="font-medium">ID Document:</p>
                                <a href={id_document_url} target="_blank" rel="noopener noreferrer">
                                    <img src={id_document_url} alt="ID Document" className="h-32 rounded border" />
                                </a>
                            </div>
                        )}
                        {license_document_url && (
                            <div>
                                <p className="font-medium">License Document:</p>
                                <a href={license_document_url} target="_blank" rel="noopener noreferrer">
                                    <img src={license_document_url} alt="License Document" className="h-32 rounded border" />
                                </a>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="py-4">
                    <h3 className="text-lg font-semibold mb-2">Admin Metadata</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <p><strong>Status:</strong> {status}</p>
                        <p><strong>Created At:</strong> {formatDate(created_at)}</p>
                        {approved_at && <p><strong>Approved At:</strong> {formatDate(approved_at)}</p>}
                        {approved_by && <p><strong>Approved By:</strong> {approved_by}</p>}
                        {canceled_at && <p><strong>Canceled At:</strong> {formatDate(canceled_at)}</p>}
                        {canceled_by && <p><strong>Canceled By:</strong> {canceled_by}</p>}
                        {admin_comments && <p><strong>Admin Comments:</strong> {admin_comments}</p>}
                        {is_verified !== null && (
                            <p><strong>Verified:</strong> {is_verified ? 'Yes' : 'No'} {verification_method && `(${verification_method})`}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="py-4">
                    <h3 className="text-lg font-semibold mb-2">Additional Notes</h3>
                    <p>{notes || 'None'}</p>
                </CardContent>
            </Card>

            <Link href="/admin/rentals" className="text-sm underline text-muted-foreground">
                Back to Rentals
            </Link>
        </div>
    );
}
