import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-location-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const method = req.method;

    if (method === 'GET') {
      // Fetch account by location_id or email
      const url = new URL(req.url);
      const locationId = url.searchParams.get('location_id');
      const email = url.searchParams.get('email');

      if (locationId) {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('location_id', locationId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching account:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (email) {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('demo_email', email)
          .eq('is_demo', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching account by email:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Missing location_id or email parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'POST') {
      // Create new account
      const body = await req.json();
      const { location_id, is_demo, expires_at, demo_name, demo_email, demo_business } = body;

      if (!location_id) {
        return new Response(
          JSON.stringify({ error: 'Missing location_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const insertData: Record<string, unknown> = {
        location_id,
        is_demo: is_demo || false,
      };

      if (expires_at) insertData.expires_at = expires_at;
      if (demo_name) insertData.demo_name = demo_name;
      if (demo_email) insertData.demo_email = demo_email;
      if (demo_business) insertData.demo_business = demo_business;

      const { data, error } = await supabase
        .from('accounts')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating account:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'PUT') {
      // Update account - requires location_id in header for authentication
      const locationId = req.headers.get('X-Location-ID');
      if (!locationId) {
        return new Response(
          JSON.stringify({ error: 'Missing X-Location-ID header' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the location exists
      const { data: existingAccount, error: verifyError } = await supabase
        .from('accounts')
        .select('id')
        .eq('location_id', locationId)
        .maybeSingle();

      if (verifyError || !existingAccount) {
        return new Response(
          JSON.stringify({ error: 'Invalid location_id' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { updates } = body;

      if (!updates || typeof updates !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Missing updates object' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent updating sensitive fields
      delete updates.id;
      delete updates.location_id;
      delete updates.created_at;

      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('location_id', locationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating account:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in manage-accounts function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
