import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Track request counts per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  // Reset if window expired
  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  // Check if limit exceeded
  if (record.count >= 10) { // Max 10 requests per minute
    return false;
  }
  
  // Increment counter
  record.count++;
  return true;
}

interface CreatePatientRequest {
  firstName?: string;
  lastName: string;
  email?: string;
  status?: string;
  pdf?: {
    filename: string;
    data: string; // base64 encoded
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIp)) {
      console.error(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Maximum 10 requests per minute. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const n8nApiKey = Deno.env.get('N8N_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate Bearer Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing or invalid Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== n8nApiKey) {
      console.error('Invalid Bearer token');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreatePatientRequest = await req.json();

    // Validate required fields
    if (!body.lastName || body.lastName.trim() === '') {
      console.error('Missing required field: lastName');
      return new Response(
        JSON.stringify({ success: false, error: 'Bad Request: lastName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get first admin user
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (adminError || !adminRoles) {
      console.error('Error fetching admin user:', adminError);
      return new Response(
        JSON.stringify({ success: false, error: 'Internal Server Error: No admin user found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = adminRoles.user_id;
    let pdfFilePath: string | null = null;

    // Handle PDF upload if provided
    if (body.pdf && body.pdf.data && body.pdf.filename) {
      try {
        // Validate base64 data
        const base64Data = body.pdf.data.replace(/^data:application\/pdf;base64,/, '');
        
        // Decode base64 to check size
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Check file size (10MB limit)
        const fileSizeInMB = bytes.length / (1024 * 1024);
        if (fileSizeInMB > 10) {
          console.error(`PDF file too large: ${fileSizeInMB.toFixed(2)}MB`);
          return new Response(
            JSON.stringify({ success: false, error: 'Bad Request: PDF file must be less than 10MB' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate filename
        if (!body.pdf.filename.toLowerCase().endsWith('.pdf')) {
          console.error('Invalid file type:', body.pdf.filename);
          return new Response(
            JSON.stringify({ success: false, error: 'Bad Request: Only PDF files are allowed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate file path
        const timestamp = Date.now();
        const sanitizedFilename = body.pdf.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        pdfFilePath = `${userId}/${timestamp}-${sanitizedFilename}`;

        console.log(`Uploading PDF to: ${pdfFilePath}`);

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('Cost_estimates')
          .upload(pdfFilePath, bytes, {
            contentType: 'application/pdf',
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          return new Response(
            JSON.stringify({ success: false, error: 'Internal Server Error: Failed to upload PDF' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('PDF uploaded successfully');
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError);
        return new Response(
          JSON.stringify({ success: false, error: 'Bad Request: Invalid PDF data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert patient record
    const patientData = {
      user_id: userId,
      first_name: body.firstName?.trim() || null,
      last_name: body.lastName.trim(),
      email: body.email?.trim() || null,
      status: body.status || 'sent',
      pdf_file_path: pdfFilePath,
      date_created: new Date().toISOString(),
    };

    console.log('Inserting patient record:', patientData);

    const { data: patientRecord, error: insertError } = await supabase
      .from('data')
      .insert(patientData)
      .select()
      .single();

    if (insertError || !patientRecord) {
      console.error('Database insert error:', insertError);
      
      // Cleanup uploaded PDF if insert fails
      if (pdfFilePath) {
        await supabase.storage.from('Cost_estimates').remove([pdfFilePath]);
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Internal Server Error: Failed to create patient record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL for PDF if available
    let pdfUrl: string | undefined;
    if (pdfFilePath) {
      const { data: signedUrlData } = await supabase.storage
        .from('Cost_estimates')
        .createSignedUrl(pdfFilePath, 3600); // 1 hour expiry

      pdfUrl = signedUrlData?.signedUrl;
    }

    // Format response
    const fullName = [body.firstName?.trim(), body.lastName.trim()]
      .filter(Boolean)
      .join(' ');

    const response = {
      success: true,
      patient: {
        id: patientRecord.patient_id.toString(),
        name: fullName,
        email: body.email || null,
        status: patientRecord.status,
        pdfUrl: pdfUrl || null,
        createdAt: patientRecord.date_created,
      },
    };

    console.log('Patient created successfully:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
