import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const failedAuthStore = new Map<string, { count: number; lockedUntil: number }>();

const RATE_LIMITS: Record<string, { requests: number; windowSeconds: number }> = {
  'chat': { requests: 50, windowSeconds: 3600 },
  'transcribe': { requests: 20, windowSeconds: 3600 },
  'parse-document': { requests: 30, windowSeconds: 3600 },
  'extract-funnel-context': { requests: 30, windowSeconds: 3600 },
  'ai-foundation-chat': { requests: 30, windowSeconds: 3600 },
  'generate-ai-outputs': { requests: 10, windowSeconds: 3600 },
  'manage-accounts': { requests: 100, windowSeconds: 3600 },
  'generate-phase2-content': { requests: 20, windowSeconds: 3600 },
};

export function checkRateLimit(
  locationId: string, 
  functionName: string
): { allowed: boolean; remaining: number; resetAt: number } {
  const limit = RATE_LIMITS[functionName];
  if (!limit) {
    return { allowed: true, remaining: 999, resetAt: Date.now() };
  }

  const key = `${functionName}:${locationId}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!entry || entry.resetAt < now) {
    const resetAt = now + (limit.windowSeconds * 1000);
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit.requests - 1, resetAt };
  }

  // Check if limit exceeded
  if (entry.count >= limit.requests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  return { allowed: true, remaining: limit.requests - entry.count, resetAt: entry.resetAt };
}

export function checkAuthThrottle(identifier: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const entry = failedAuthStore.get(identifier);
  
  if (!entry) {
    return { allowed: true };
  }
  
  if (entry.lockedUntil > now) {
    const secondsLeft = Math.ceil((entry.lockedUntil - now) / 1000);
    return { 
      allowed: false, 
      reason: `Too many failed attempts. Try again in ${secondsLeft} seconds.` 
    };
  }
  
  // Lock expired, reset
  failedAuthStore.delete(identifier);
  return { allowed: true };
}

export function recordFailedAuth(identifier: string): void {
  const now = Date.now();
  const entry = failedAuthStore.get(identifier) || { count: 0, lockedUntil: 0 };
  
  entry.count++;
  
  // Progressive lockout
  if (entry.count >= 20) {
    entry.lockedUntil = now + (60 * 60 * 1000); // 1 hour
  } else if (entry.count >= 10) {
    entry.lockedUntil = now + (10 * 60 * 1000); // 10 minutes  
  } else if (entry.count >= 5) {
    entry.lockedUntil = now + (60 * 1000); // 1 minute
  }
  
  failedAuthStore.set(identifier, entry);
}

function maskLocationId(locationId: string): string {
  if (locationId.length <= 4) return '***';
  return locationId.substring(0, 4) + '***';
}

export async function validateLocationId(req: Request): Promise<{ 
  locationId: string | null; 
  error: string | null;
  isExpired?: boolean;
}> {
  const locationId = req.headers.get('X-Location-ID');
  
  if (!locationId || locationId.trim() === '') {
    return { locationId: null, error: 'Authentication required' };
  }

  // Check auth throttling
  const throttleCheck = checkAuthThrottle(locationId);
  if (!throttleCheck.allowed) {
    return { locationId: null, error: throttleCheck.reason || 'Too many attempts' };
  }

  // Validate locationId exists in accounts table
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[AUTH] Server configuration error');
    return { locationId: null, error: 'Service unavailable' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Include expiration fields for validation
  const { data: account, error } = await supabase
    .from('accounts')
    .select('id, location_id, is_demo, expires_at')
    .eq('location_id', locationId)
    .maybeSingle();

  if (error) {
    console.error('[AUTH] Database validation error');
    return { locationId: null, error: 'Service unavailable' };
  }

  if (!account) {
    recordFailedAuth(locationId);
    console.log('[AUTH] Invalid location:', maskLocationId(locationId));
    return { locationId: null, error: 'Authentication failed' };
  }

  // Check expiration for demo accounts
  if (account.is_demo && account.expires_at) {
    const expiresAt = new Date(account.expires_at);
    if (expiresAt < new Date()) {
      console.log('[AUTH] Expired account:', maskLocationId(locationId));
      return { locationId: null, error: 'Account expired', isExpired: true };
    }
  }

  return { locationId, error: null };
}

export function createUnauthorizedResponse(error: string, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export function createRateLimitResponse(resetAt: number, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Rate limit exceeded',
      resetAt: new Date(resetAt).toISOString()
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetAt.toString()
      } 
    }
  );
}
