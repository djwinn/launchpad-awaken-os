import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateLocationId, createUnauthorizedResponse } from "../_shared/validate-location.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-location-id',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate location_id
    const { locationId, error: authError } = await validateLocationId(req);
    if (authError || !locationId) {
      return createUnauthorizedResponse(authError || 'Missing location ID', corsHeaders);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, updates } = await req.json();

    if (action === 'get') {
      // Fetch profile
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('location_id', locationId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('[PROFILE] Get error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ profile: data || null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      if (!updates || typeof updates !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Updates object required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Remove protected fields
      delete updates.id;
      delete updates.location_id;
      delete updates.created_at;

      // Upsert profile
      const { data, error } = await supabase
        .from('coach_profiles')
        .upsert(
          { 
            location_id: locationId, 
            ...updates,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'location_id' }
        )
        .select()
        .single();

      if (error) {
        console.error('[PROFILE] Update error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[PROFILE] Updated for location:', locationId);

      return new Response(
        JSON.stringify({ profile: data, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PROFILE] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
