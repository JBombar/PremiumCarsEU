// src/app/api/rental_reservations/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { z } from 'zod';

function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch (error) { console.error('Failed to set cookie:', error); }
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch (error) { console.error('Failed to remove cookie:', error); }
        },
      },
    }
  );
}

const reservationInsertSchema = z.object({
  listing_id: z.string().uuid("Invalid Listing ID format"),
  start_date: z.string().min(1, "Start date is required"), // should be "YYYY-MM-DD"
  end_date: z.string().min(1, "End date is required"),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  duration: z.preprocess(val => val === '' || val === undefined ? null : Number(val), z.number().nullable()),
  renter_name: z.string().min(1, "Renter name is required"),
  renter_email: z.string().email("Invalid email address"),
  renter_phone: z.string().min(5, "Phone number is required"),
  notes: z.string().optional(),
  preferred_contact_method: z.string().optional(),
  source: z.string().optional(),
});

type ReservationInsertPayload = Database['public']['Tables']['rental_reservations']['Insert'];

async function uploadFileToSupabase(
  supabase: ReturnType<typeof createSupabaseClient>,
  bucket: string,
  file: File,
  userId: string,
  carId: string
): Promise<string | null> {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const filePath = `rental-${carId}/${userId}-${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
  if (uploadError) throw new Error(`Failed to upload file: ${uploadError.message}`);
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return urlData?.publicUrl || null;
}

export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: reservations, error } = await supabase
    .from('rental_reservations')
    .select('*')
    .eq('renter_id', user.id);
  if (error) return NextResponse.json({ error: 'Failed to fetch reservations', details: error.message }, { status: 500 });
  return NextResponse.json(reservations, { status: 200 });
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request format. Expected FormData.' }, { status: 400 });
  }

  const idFile = formData.get('id_document') as File | null;
  const licenseFile = formData.get('license_document') as File | null;

  const textData: Record<string, any> = {};
  const fields = [
    'listing_id', 'start_date', 'end_date', 'start_time', 'end_time', 'duration',
    'renter_name', 'renter_email', 'renter_phone', 'notes', 'preferred_contact_method', 'source'
  ];
  fields.forEach(field => {
    const value = formData.get(field);
    if (value !== null) textData[field] = value;
  });

  const parseResult = reservationInsertSchema.safeParse(textData);
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid input', details: parseResult.error.flatten() }, { status: 400 });
  }

  const validatedData = parseResult.data;
  const carId = validatedData.listing_id;

  let idUrl: string | null = null;
  let licenseUrl: string | null = null;
  try {
    if (idFile) idUrl = await uploadFileToSupabase(supabase, 'id-documents', idFile, user.id, carId);
    if (licenseFile) licenseUrl = await uploadFileToSupabase(supabase, 'license-documents', licenseFile, user.id, carId);
  } catch (error: any) {
    return NextResponse.json({ error: 'File upload failed', details: error.message }, { status: 500 });
  }

  const reservationData: ReservationInsertPayload = {
    ...validatedData,
    renter_id: user.id,
    id_document_url: idUrl,
    license_document_url: licenseUrl,
    status: 'pending',
    total_price: null,
    admin_comments: null,
    approved_at: null,
    approved_by: null,
    canceled_at: null,
    canceled_by: null,
    currency: 'CHF',
    is_verified: false,
    verification_method: null,
    utm_source: null,
    utm_campaign: null,
    referrer: null,
    duration: validatedData.duration ?? null,
    start_time: validatedData.start_time ?? null,
    end_time: validatedData.end_time ?? null,
    start_date: validatedData.start_date,
    end_date: validatedData.end_date,
  };

  const { data: newReservation, error: insertError } = await supabase
    .from('rental_reservations')
    .insert(reservationData)
    .select()
    .single();

  if (insertError) {
    const isRLSError = insertError.message.includes('violates row-level security policy');
    return NextResponse.json({
      error: `Failed to create reservation.${isRLSError ? ' (RLS Violation)' : ''}`,
      details: insertError.message,
      code: (insertError as any).code
    }, { status: isRLSError ? 403 : 500 });
  }

  return NextResponse.json(newReservation, { status: 201 });
}
