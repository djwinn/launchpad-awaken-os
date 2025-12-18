import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateLocationId, checkRateLimit, createUnauthorizedResponse, createRateLimitResponse } from "../_shared/validate-location.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-location-id',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate location ID
    const validation = await validateLocationId(req);
    if (validation.error || !validation.locationId) {
      return createUnauthorizedResponse(validation.error || 'Authentication required', corsHeaders);
    }
    
    const locationId = validation.locationId;

    // Check rate limit
    const rateLimit = checkRateLimit(locationId, 'chat');
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetAt, corsHeaders);
    }

    const method = req.method;

    if (method === 'GET') {
      const url = new URL(req.url);
      const action = url.searchParams.get('action');
      const email = url.searchParams.get('email');

      if (action === 'find_incomplete' && email) {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_email', email)
          .eq('location_id', locationId)
          .eq('completed', false)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error finding conversation:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to find conversation' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'POST') {
      const body = await req.json();
      const { action, email, name, conversationId, messages, output } = body;

      if (action === 'create') {
        const { data, error } = await supabase
          .from('conversations')
          .insert({
            user_email: email,
            user_name: name,
            location_id: locationId,
            messages: [],
            current_stage: 'intro',
            completed: false,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating conversation:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to create conversation' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'update_messages' && conversationId) {
        const { error } = await supabase
          .from('conversations')
          .update({ messages })
          .eq('id', conversationId)
          .eq('location_id', locationId);

        if (error) {
          console.error('Error updating messages:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to update messages' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'mark_complete' && conversationId) {
        const { error } = await supabase
          .from('conversations')
          .update({ completed: true, output })
          .eq('id', conversationId)
          .eq('location_id', locationId);

        if (error) {
          console.error('Error marking complete:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to mark complete' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'delete' && conversationId) {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId)
          .eq('location_id', locationId);

        if (error) {
          console.error('Error deleting conversation:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to delete conversation' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Manage conversations error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
