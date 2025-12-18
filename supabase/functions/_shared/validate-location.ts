import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function validateLocationId(req: Request): Promise<{ locationId: string | null; error: string | null }> {
  const locationId = req.headers.get('X-Location-ID');
  
  if (!locationId || locationId.trim() === '') {
    return { locationId: null, error: 'Missing X-Location-ID header' };
  }

  // Validate locationId exists in accounts table
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return { locationId: null, error: 'Server configuration error' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: account, error } = await supabase
    .from('accounts')
    .select('id, location_id')
    .eq('location_id', locationId)
    .maybeSingle();

  if (error) {
    console.error('Database error validating location:', error);
    return { locationId: null, error: 'Database error' };
  }

  if (!account) {
    return { locationId: null, error: 'Invalid location' };
  }

  return { locationId, error: null };
}

export function createUnauthorizedResponse(error: string, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
