import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessPhotoRequest {
  file: string; // base64 encoded image
  fileName: string;
  studentId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { file, fileName, studentId }: ProcessPhotoRequest = await req.json();

    console.log('Processing photo for student:', studentId);

    // Decode base64 image
    const base64Data = file.split(',')[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Generate unique file names
    const timestamp = Date.now();
    const fullSizePath = `${user.id}/${timestamp}-${fileName}`;
    const thumbnailPath = `${user.id}/${timestamp}-thumb-${fileName}`;

    // Upload full-size image to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('training-photos')
      .upload(fullSizePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Image uploaded successfully:', fullSizePath);

    // Get public URLs
    const { data: { publicUrl: photoUrl } } = supabase.storage
      .from('training-photos')
      .getPublicUrl(fullSizePath);

    const { data: { publicUrl: thumbnailUrl } } = supabase.storage
      .from('training-photos')
      .getPublicUrl(fullSizePath); // Using same URL for now, will optimize later

    return new Response(
      JSON.stringify({
        success: true,
        photoUrl,
        thumbnailUrl,
        message: 'Photo processed successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing photo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
