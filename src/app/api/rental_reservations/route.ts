// src/app/api/rental_reservations/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Ensure this path is correct
import { z } from 'zod';

// Helper function to create Supabase client
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
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Avoid throwing from cookies setup
            console.error('Failed to set cookie:', name, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Avoid throwing from cookies setup
            console.error('Failed to remove cookie:', name, error);
          }
        },
      },
    }
  );
}

// Zod schema for validating incoming reservation data from FormData
const reservationInsertSchema = z.object({
  listing_id: z.string().uuid("Invalid Listing ID format"),
  start_date: z.string().min(1, "Start date is required"), // Expect "YYYY-MM-DD"
  end_date: z.string().min(1, "End date is required"),     // Expect "YYYY-MM-DD"
  start_time: z.string().optional(), // Expect "YYYY-MM-DDTHH:MM"
  end_time: z.string().optional(),   // Expect "YYYY-MM-DDTHH:MM"
  duration: z.preprocess(
    // Convert empty string or undefined/null to null, otherwise parse as number
    val => (val === '' || val === undefined || val === null ? null : Number(val)),
    z.number().positive("Duration must be a positive number").nullable() // Allow null, but if number, must be positive
  ),
  renter_name: z.string().min(1, "Renter name is required"),
  renter_email: z.string().email("Invalid email address"),
  renter_phone: z.string().min(5, "Phone number is required"), // Basic length check
  notes: z.string().optional(),
  preferred_contact_method: z.string().optional(), // Consider enum if applicable: .enum(['email', 'phone']).optional()
  source: z.string().optional(),
  total_price: z.preprocess(
    // Convert empty string or undefined/null to null, otherwise parse as number
    val => (val === '' || val === undefined || val === null ? null : Number(val)),
    z.number().nonnegative("Total price cannot be negative").nullable() // Allow 0, positive numbers, or null
  ),
});

// Type helper for the database insert payload
type ReservationInsertPayload = Database['public']['Tables']['rental_reservations']['Insert'];

// --- Function to upload files to Supabase Storage ---
// IMPORTANT: This function definition must appear BEFORE it is called in POST
async function uploadFileToSupabase(
  supabase: ReturnType<typeof createSupabaseClient>,
  bucket: string,
  file: File, // File should be validated before calling this
  userId: string,
  carId: string // Assuming listing_id is used for path structure
): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  // Create a structured file path, e.g., id-documents/rental-CAR_UUID/USER_UUID-TIMESTAMP.pdf
  const filePath = `${bucket}/rental-${carId}/${userId}-${Date.now()}.${fileExt}`;

  console.log(`Uploading file to Supabase Storage: bucket='${bucket}', path='${filePath}'`);

  const { error: uploadError } = await supabase.storage
    .from(bucket) // Bucket name passed as argument
    .upload(filePath, file);

  if (uploadError) {
    console.error(`Supabase Storage upload error in bucket "${bucket}" for path "${filePath}":`, uploadError);
    // Throw an error to be caught by the calling try/catch block
    throw new Error(`Failed to upload file to ${bucket}. Storage error: ${uploadError.message}`);
  }

  // If upload succeeds, get the public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    console.warn(`Could not retrieve public URL for uploaded file: bucket='${bucket}', path='${filePath}'`);
    // Depending on requirements, you might want to throw an error here too,
    // or allow the process to continue but log the missing URL. Returning null for now.
    return null;
  }

  console.log(`File uploaded successfully to ${bucket}. Public URL: ${urlData.publicUrl}`);
  return urlData.publicUrl;
}
// --- End of uploadFileToSupabase function ---


// Handler for GET requests (e.g., fetching user's reservations)
export async function GET(req: NextRequest) {
  const supabase = createSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('GET /api/rental_reservations: Unauthorized access attempt.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`Fetching reservations for user: ${user.id}`);

  // Example: Fetch reservations linked to the authenticated user
  // Adjust the query based on your actual schema and needs
  const { data: reservations, error } = await supabase
    .from('rental_reservations')
    .select('*') // Select specific columns for efficiency: 'id, listing_id, start_date, end_date, status, total_price'
    .eq('renter_id', user.id) // Filter by the logged-in user
    .order('created_at', { ascending: false }); // Optional: order by creation date

  if (error) {
    console.error(`Failed to fetch reservations for user ${user.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch reservations', details: error.message }, { status: 500 });
  }

  console.log(`Successfully fetched ${reservations?.length ?? 0} reservations for user ${user.id}.`);
  return NextResponse.json(reservations, { status: 200 });
}


// Handler for POST requests (creating a new reservation)
export async function POST(req: NextRequest) {
  const supabase = createSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // 1. Authentication Check
  if (authError || !user) {
    console.error('POST /api/rental_reservations: Unauthorized access attempt.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log(`Authenticated user ${user.id} attempting to create reservation.`);

  // 2. Parse FormData
  let formData: FormData;
  try {
    formData = await req.formData();
    console.log('Received FormData keys:', Array.from(formData.keys()));
  } catch (error) {
    console.error('Failed to parse FormData:', error);
    return NextResponse.json({ error: 'Invalid request format. Expected FormData.' }, { status: 400 });
  }

  // 3. Extract Data from FormData
  const rawData: Record<string, any> = {};
  const fieldsToExtract = [
    'listing_id', 'start_date', 'end_date', 'start_time', 'end_time', 'duration',
    'renter_name', 'renter_email', 'renter_phone', 'notes', 'preferred_contact_method',
    'source', 'total_price'
  ];
  fieldsToExtract.forEach(field => {
    const value = formData.get(field);
    if (value !== null) { // Store value if present (even empty string)
      rawData[field] = value;
    }
    // If value is null, Zod schema's preprocess/optional will handle it
  });
  console.log('Raw data extracted from FormData (before Zod):', rawData);

  // Extract files separately
  const idFile = formData.get('id_document') as File | null;
  const licenseFile = formData.get('license_document') as File | null;

  // Basic file presence check (adjust if optional)
  if (!idFile) {
    return NextResponse.json({ error: 'Missing required document: id_document' }, { status: 400 });
  }
  if (!licenseFile) {
    return NextResponse.json({ error: 'Missing required document: license_document' }, { status: 400 });
  }

  // 4. Validate Text Data using Zod
  const parseResult = reservationInsertSchema.safeParse(rawData);
  if (!parseResult.success) {
    console.error('Zod Validation Failed:', parseResult.error.flatten());
    // Provide detailed validation errors back to the client
    return NextResponse.json({
      error: 'Invalid input data.',
      details: parseResult.error.flatten().fieldErrors
    }, { status: 400 });
  }

  const validatedData = parseResult.data;
  console.log('Validated data (after Zod):', validatedData);
  const carId = validatedData.listing_id; // Use validated listing_id for storage path

  // 5. File Uploads
  let idUrl: string | null = null;
  let licenseUrl: string | null = null;
  try {
    // Pass validated carId to the upload function
    console.log(`Attempting to upload ID document for user ${user.id}, car ${carId}`);
    idUrl = await uploadFileToSupabase(supabase, 'id-documents', idFile, user.id, carId);

    console.log(`Attempting to upload License document for user ${user.id}, car ${carId}`);
    licenseUrl = await uploadFileToSupabase(supabase, 'license-documents', licenseFile, user.id, carId);

    // Optional: Check if URLs were successfully generated if they are strictly required
    if (!idUrl || !licenseUrl) {
      console.error('File upload succeeded but failed to get public URL for one or both documents.');
      // Decide how to handle this - fail the request or proceed without URL?
      // Failing the request might be safer if URLs are critical.
      return NextResponse.json({ error: 'File upload processing failed: Could not retrieve file URL.' }, { status: 500 });
    }

  } catch (error: any) {
    // Catch errors specifically thrown by uploadFileToSupabase or other issues in the try block
    console.error('File Upload Error during reservation creation:', error);
    // Return the specific error message from the upload function if available
    return NextResponse.json({ error: 'File upload failed.', details: error.message }, { status: 500 });
  }

  // 6. Prepare Database Payload
  const finalTotalPrice = validatedData.total_price; // Already number | null from Zod
  console.log('Final total_price value for database insertion:', finalTotalPrice);

  // Construct the object matching the Supabase table structure
  const reservationData: ReservationInsertPayload = {
    // Spread the validated data from Zod
    ...validatedData,

    // Add/overwrite specific fields
    renter_id: user.id, // Link to the authenticated user
    id_document_url: idUrl,
    license_document_url: licenseUrl,
    status: 'pending', // Set initial status
    currency: 'CHF', // Set default currency

    // Ensure nullable fields derived from Zod are correctly passed (or rely on DB defaults)
    // Zod's .optional()/.nullable() output needs to align with DB constraints
    start_time: validatedData.start_time ?? null,
    end_time: validatedData.end_time ?? null,
    duration: validatedData.duration ?? null,
    notes: validatedData.notes ?? null,
    preferred_contact_method: validatedData.preferred_contact_method ?? null,
    source: validatedData.source ?? null,
    total_price: finalTotalPrice, // Already number | null

    // Explicitly set other nullable fields in your DB schema to null if they aren't in validatedData
    // admin_comments: null,
    // approved_at: null,
    // ... etc.
  };

  // 7. Insert into Database
  console.log('Attempting to insert reservation payload:', reservationData);
  const { data: newReservation, error: insertError } = await supabase
    .from('rental_reservations')
    .insert(reservationData)
    .select() // Select the newly created record
    .single(); // Expect only one record to be inserted

  if (insertError) {
    console.error('Supabase Insert Error:', insertError);
    // Check for specific database errors if needed (e.g., unique constraints, RLS)
    const isRLSError = insertError.message.includes('violates row-level security policy');
    return NextResponse.json({
      error: `Failed to create reservation.${isRLSError ? ' Check permissions.' : ''}`,
      details: insertError.message,
      code: (insertError as any).code // Include DB error code if available
    }, { status: isRLSError ? 403 : 500 }); // Use 403 for RLS, 500 for general DB errors
  }

  // 8. Success Response
  console.log('Reservation created successfully:', newReservation);
  return NextResponse.json(newReservation, { status: 201 }); // 201 Created status
}