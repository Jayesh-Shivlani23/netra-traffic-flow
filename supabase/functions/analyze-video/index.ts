import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DetectionResult {
  frame_number: number;
  detections: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    class_name: string;
    confidence: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { video_url, junction_id } = await req.json();
      
      console.log('Starting video analysis for:', { video_url, junction_id });

      // Store analysis request in database
      const { data: analysis, error: analysisError } = await supabase
        .from('video_analysis')
        .insert({
          video_url,
          junction_id,
          status: 'processing',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (analysisError) {
        console.error('Error creating analysis record:', analysisError);
        throw analysisError;
      }

      return new Response(
        JSON.stringify({ 
          analysis_id: analysis.id,
          status: 'processing',
          message: 'Video analysis started. Use WebSocket connection for real-time results.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const analysisId = url.searchParams.get('analysis_id');
      
      if (!analysisId) {
        return new Response(
          JSON.stringify({ error: 'Analysis ID required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Get detection results from database
      const { data: detections, error: detectionsError } = await supabase
        .from('detections')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('frame_number');

      if (detectionsError) {
        console.error('Error fetching detections:', detectionsError);
        throw detectionsError;
      }

      return new Response(
        JSON.stringify({ detections }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    );

  } catch (error) {
    console.error('Error in analyze-video function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})