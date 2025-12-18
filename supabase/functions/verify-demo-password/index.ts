import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for',
};

// Simple in-memory rate limiting for password attempts
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const failedAuthStore = new Map<string, { count: number; lockedUntil: number }>();

const PASSWORD_RATE_LIMIT = { requests: 10, windowSeconds: 3600 }; // 10 attempts per hour

function getClientIdentifier(req: Request): string {
  // Try to get real IP from headers, fallback to 'anonymous'
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'anonymous';
}

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Initialize or reset if window expired
  if (!entry || entry.resetAt < now) {
    const resetAt = now + (PASSWORD_RATE_LIMIT.windowSeconds * 1000);
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: PASSWORD_RATE_LIMIT.requests - 1, resetAt };
  }

  // Check if limit exceeded
  if (entry.count >= PASSWORD_RATE_LIMIT.requests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);
  return { allowed: true, remaining: PASSWORD_RATE_LIMIT.requests - entry.count, resetAt: entry.resetAt };
}

function checkAuthThrottle(identifier: string): { allowed: boolean; reason?: string } {
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

function recordFailedAuth(identifier: string): void {
  const now = Date.now();
  const entry = failedAuthStore.get(identifier) || { count: 0, lockedUntil: 0 };
  
  entry.count++;
  
  // Progressive lockout
  if (entry.count >= 10) {
    entry.lockedUntil = now + (30 * 60 * 1000); // 30 minutes
  } else if (entry.count >= 5) {
    entry.lockedUntil = now + (5 * 60 * 1000); // 5 minutes  
  } else if (entry.count >= 3) {
    entry.lockedUntil = now + (60 * 1000); // 1 minute
  }
  
  failedAuthStore.set(identifier, entry);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const identifier = getClientIdentifier(req);
    
    // Check progressive throttling first
    const throttleCheck = checkAuthThrottle(identifier);
    if (!throttleCheck.allowed) {
      console.log(`[AUTH] Throttled request from: ${identifier}`);
      return new Response(
        JSON.stringify({ valid: false, error: throttleCheck.reason }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check rate limit
    const rateLimit = checkRateLimit(identifier);
    if (!rateLimit.allowed) {
      console.log(`[AUTH] Rate limited: ${identifier}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Too many attempts. Please try again later.',
          resetAt: new Date(rateLimit.resetAt).toISOString()
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString()
          } 
        }
      );
    }

    const { password } = await req.json();
    
    if (!password) {
      console.log('[AUTH] No password provided');
      return new Response(
        JSON.stringify({ valid: false, error: 'Password required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const demoPassword = Deno.env.get('DEMO_ACCESS_PASSWORD');
    
    if (!demoPassword) {
      console.error('[AUTH] DEMO_ACCESS_PASSWORD not configured');
      return new Response(
        JSON.stringify({ valid: false, error: 'Service unavailable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const isValid = password === demoPassword;
    
    if (!isValid) {
      recordFailedAuth(identifier);
      console.log(`[AUTH] Failed password attempt from: ${identifier}`);
    } else {
      // Clear failed attempts on success
      failedAuthStore.delete(identifier);
      console.log(`[AUTH] Successful password verification`);
    }

    // Add small delay to slow brute force (100ms)
    await new Promise(resolve => setTimeout(resolve, 100));

    return new Response(
      JSON.stringify({ valid: isValid }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString()
        } 
      }
    );
  } catch (error) {
    console.error('[AUTH] Error verifying password:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
