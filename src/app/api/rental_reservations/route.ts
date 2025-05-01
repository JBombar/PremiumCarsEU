// src/app/api/rental_reservations/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Make sure this path is correct
import { z } from 'zod';

// Supabase client factory (remains the same)
function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Note: Using ANON key here is standard for server client factory
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

// Zod schema for TEXT fields coming from FormData
// We removed the _url fields as they are handled separately after upload
const reservationFormDataSchema = z.object({
  listing_id: z.string().uuid("Invalid Listing ID format"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  renter_name: z.string().min(1, "Renter name is required"),
  renter_email: z.string().email("Invalid email address"),
  renter_phone: z.string().min(5, "Phone number is required"),
  notes: z.string().optional(),
  // Add other optional text fields from your form if needed
  // preferred_contact_method: z.string().optional(),
  // source: z.string().optional(),
  // utm_source: z.string().optional(),
  // utm_campaign: z.string().optional(),
  // referrer: z.string().optional(),
});

// Helper function for uploading files
async function uploadFileToSupabase(
  supabase: ReturnType<typeof createSupabaseClient>,
  bucket: string,
  file: File,
  userId: string,
  carId: string
): Promise<string | null> {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  // Use user ID and timestamp for unique path, within a folder for the rental
  const filePath = `rental-${carId}/${userId}-${Date.now()}.${fileExt}`;

  console.log(`Uploading to bucket: ${bucket}, path: ${filePath}`); // Debug log

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    console.error(`Supabase Storage Upload Error (${bucket}):`, uploadError);
    throw new Error(`Failed to upload ${bucket === 'id-documents' ? 'ID document' : 'license'}. Message: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    console.warn(`Could not get public URL for uploaded file: ${filePath}`);
    // Decide if this is critical. Maybe return path instead? Or throw?
    // For now, return null, but the insert will lack the URL.
    return null;
  }

  console.log(`Upload successful (${bucket}), URL: ${urlData.publicUrl}`); // Debug log
  return urlData.publicUrl;
}


// GET /api/rental_reservations (remains the same)
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("GET Auth Error:", authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`Fetching reservations for user: ${user.id}`); // Debug log

  const { data: reservations, error } = await supabase
    .from('rental_reservations')
    .select('*')
    .eq('renter_id', user.id); // This RLS should work if user is authenticated

  if (error) {
    console.error("Failed to fetch reservations:", error);
    return NextResponse.json({ error: 'Failed to fetch reservations', details: error.message }, { status: 500 });
  }

  return NextResponse.json(reservations, { status: 200 });
}

// POST /api/rental_reservations — Modified to handle FormData and uploads
export async function POST(req: NextRequest) {
  const supabase = createSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("POST Auth Error:", authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log(`API Route: Authenticated User ID: ${user.id}`); // Log user ID

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (error) {
    console.error("Failed to parse FormData:", error);
    return NextResponse.json({ error: 'Invalid request format. Expected FormData.' }, { status: 400 });
  }

  // Extract files
  const idFile = formData.get('id_document') as File | null;
  const licenseFile = formData.get('license_document') as File | null;

  // Extract and prepare text data for validation
  const textData: Record<string, any> = {};
  const fieldsToValidate = [
    'listing_id', 'start_date', 'end_date', 'renter_name',
    'renter_email', 'renter_phone', 'notes' // Add others as needed
  ];
  fieldsToValidate.forEach(field => {
    const value = formData.get(field);
    if (value !== null) { // Only include fields that were actually sent
      textData[field] = value;
    }
  });

  // Validate text data using Zod
  const parseResult = reservationFormDataSchema.safeParse(textData);
  if (!parseResult.success) {
    console.error("Form Data Validation Error:", parseResult.error.flatten());
    return NextResponse.json(
      { error: 'Invalid input', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const validatedData = parseResult.data;
  const carId = validatedData.listing_id; // Get carId for folder structure

  let idUrl: string | null = null;
  let licenseUrl: string | null = null;

  try {
    // Upload files using the authenticated client
    if (idFile) {
      idUrl = await uploadFileToSupabase(supabase, 'id-documents', idFile, user.id, carId);
    }
    if (licenseFile) {
      licenseUrl = await uploadFileToSupabase(supabase, 'license-documents', licenseFile, user.id, carId);
    }

    // Optional: Add checks here if URLs are mandatory but failed to generate

  } catch (error: any) {
    console.error("File Upload Process Error:", error);
    return NextResponse.json(
      { error: 'File upload failed', details: error.message || 'An unknown upload error occurred' },
      { status: 500 }
    );
  }

  // Build the final record for insertion
  const reservationData: Database['public']['Tables']['rental_reservations']['Insert'] = {
    ...validatedData, // Spread validated text fields
    renter_id: user.id, // Crucial for RLS
    id_document_url: idUrl,
    license_document_url: licenseUrl,
    status: 'pending', // Default status
    // created_at and updated_at are usually handled by db defaults, but setting explicitly is fine too
    // created_at: new Date().toISOString(),
    // updated_at: new Date().toISOString(),
    // Add any other fields extracted from formData or defaults here
  };

  console.log('API Route: Attempting to insert reservation data:', JSON.stringify(reservationData, null, 2)); // Log data before insert

  // Insert into the database
  const { data: newReservation, error: insertError } = await supabase
    .from('rental_reservations')
    .insert(reservationData)
    .select()
    .single();

  if (insertError) {
    console.error('API Route: Supabase Insert Error:', insertError); // Log the specific error
    // Check for RLS specific code/message if available
    const isRLSError = insertError.message.includes('violates row-level security policy');
    return NextResponse.json(
      {
        error: `Failed to create reservation.${isRLSError ? ' (RLS Violation)' : ''}`,
        details: insertError.message,
        code: (insertError as any).code // Include DB error code if helpful
      },
      // RLS violation typically results in 403 or 404 depending on policy, but Supabase might wrap it in 500 here.
      // Let's return 500 for general DB errors, but you could map specific codes.
      { status: isRLSError ? 403 : 500 }
    );
  }

  console.log('API Route: Reservation created successfully:', newReservation.id); // Log success
  return NextResponse.json(newReservation, { status: 201 });
}