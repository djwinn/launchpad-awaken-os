import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface CoachProfile {
  id: string;
  location_id: string;
  coach_name?: string;
  business_name?: string;
  instagram_handle?: string;
  website_url?: string;
  ideal_client_description?: string;
  ideal_client_demographics?: string;
  ideal_client_situation?: string;
  main_problem?: string;
  problem_feels_like?: string;
  what_theyve_tried?: string;
  transformation?: string;
  unique_approach?: string;
  origin_story?: string;
  credibility_points?: string;
  service_type?: string;
  offer_name?: string;
  offer_description?: string;
  offer_price?: string;
  offer_duration?: string;
  call_to_action?: string;
  booking_link?: string;
  lead_magnet_idea?: string;
  lead_magnet_format?: string;
  lead_magnet_title?: string;
  session_format?: string;
  session_duration?: string;
  payment_terms?: string;
  cancellation_policy?: string;
}

export async function getCoachProfile(locationId: string): Promise<CoachProfile | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabase
    .from("coach_profiles")
    .select("*")
    .eq("location_id", locationId)
    .single();
  
  if (error || !data) {
    console.log("[PROFILE] No profile found for location:", locationId);
    return null;
  }
  
  return data as CoachProfile;
}

export async function upsertCoachProfile(
  locationId: string, 
  updates: Partial<CoachProfile>
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { error } = await supabase
    .from("coach_profiles")
    .upsert(
      { 
        location_id: locationId, 
        ...updates,
        updated_at: new Date().toISOString()
      }, 
      { onConflict: "location_id" }
    );
  
  if (error) {
    console.error("[PROFILE] Error upserting profile:", error);
    return false;
  }
  
  console.log("[PROFILE] Updated profile for location:", locationId);
  return true;
}

export function buildProfileContext(profile: CoachProfile | null, conversationType: string): string {
  if (!profile) {
    return ""; // No profile data yet
  }
  
  // Check if profile has any meaningful data
  const profileValues = Object.entries(profile)
    .filter(([key]) => !["id", "location_id", "created_at", "updated_at"].includes(key))
    .filter(([_, value]) => value !== null && value !== undefined && value !== "");
  
  if (profileValues.length === 0) {
    return ""; // Profile exists but is empty
  }
  
  let context = `
## PROFILE CONTEXT

The user has completed previous conversations. Here is what they've shared before:

`;

  // Add available profile data
  if (profile.coach_name) context += `- **Name:** "${profile.coach_name}"\n`;
  if (profile.business_name) context += `- **Business name:** "${profile.business_name}"\n`;
  if (profile.instagram_handle) context += `- **Instagram:** "${profile.instagram_handle}"\n`;
  if (profile.website_url) context += `- **Website:** "${profile.website_url}"\n`;
  if (profile.ideal_client_description) context += `- **Who they help:** "${profile.ideal_client_description}"\n`;
  if (profile.ideal_client_situation) context += `- **Client situation:** "${profile.ideal_client_situation}"\n`;
  if (profile.main_problem) context += `- **Main problem they solve:** "${profile.main_problem}"\n`;
  if (profile.problem_feels_like) context += `- **How the problem feels:** "${profile.problem_feels_like}"\n`;
  if (profile.what_theyve_tried) context += `- **What clients have tried:** "${profile.what_theyve_tried}"\n`;
  if (profile.transformation) context += `- **Transformation they provide:** "${profile.transformation}"\n`;
  if (profile.unique_approach) context += `- **Their unique approach:** "${profile.unique_approach}"\n`;
  if (profile.origin_story) context += `- **Their story:** "${profile.origin_story}"\n`;
  if (profile.credibility_points) context += `- **Credentials:** "${profile.credibility_points}"\n`;
  if (profile.service_type) context += `- **Service type:** "${profile.service_type}"\n`;
  if (profile.offer_name) context += `- **Offer name:** "${profile.offer_name}"\n`;
  if (profile.offer_description) context += `- **Offer description:** "${profile.offer_description}"\n`;
  if (profile.offer_price) context += `- **Offer price:** "${profile.offer_price}"\n`;
  if (profile.offer_duration) context += `- **Offer duration:** "${profile.offer_duration}"\n`;
  if (profile.booking_link) context += `- **Booking link:** "${profile.booking_link}"\n`;
  if (profile.lead_magnet_idea) context += `- **Lead magnet idea:** "${profile.lead_magnet_idea}"\n`;
  if (profile.lead_magnet_title) context += `- **Lead magnet title:** "${profile.lead_magnet_title}"\n`;
  if (profile.session_format) context += `- **Session format:** "${profile.session_format}"\n`;
  if (profile.session_duration) context += `- **Session duration:** "${profile.session_duration}"\n`;

  context += `
## HOW TO USE THIS CONTEXT

**CRITICAL RULES — READ CAREFULLY:**

1. **REFERENCE, DON'T SKIP:** When profile data exists for a topic, REFERENCE what they said before, then invite them to go deeper. Never skip a topic just because data exists.

2. **USE THEIR WORDS AS A MIRROR:** Quote their previous language back to them. This helps them see their own thinking and often triggers deeper insight.

3. **INVITE EVOLUTION:** Always give permission for their answer to have changed. Use phrases like:
   - "You mentioned [X] before — let's build on that..."
   - "Last time you described this as [X]. Has that evolved, or does that still feel right?"
   - "I'd love to go deeper on what you shared about [X]..."

4. **DEEPEN, DON'T ASSUME:** Even if they confirm their previous answer, ask a follow-up to go one level deeper.

5. **STORE NEW INSIGHTS:** If they refine or change an answer, note this so it can be saved back to their profile.

**EXAMPLE BEHAVIOR:**

Instead of: "I know you help overwhelmed moms. Moving on..."

Do this: "When you set up your content previously, you described your ideal client as '${profile.ideal_client_description || "[their description]"}.' I'd love to go deeper on this. When you imagine your absolute favourite client — the one you'd love to work with again and again — what was she really struggling with when she first found you?"

`;

  // Add conversation-specific guidance
  if (conversationType === "contract" || conversationType === "ai-foundation") {
    context += `
## FOCUS FOR THIS CONVERSATION (Contract/AI Foundation)

Focus fields:
- coach_name, business_name (for contract header)
- service_type (to customize terms)
- Session details should be gathered fresh

Even if name/business exist, confirm: "Just to make sure the contract is accurate — your name is [X] and your business is [Y], correct?"
`;
  } else if (conversationType === "phase2") {
    context += `
## FOCUS FOR THIS CONVERSATION (Phase 2 - IG/DM Content)

Focus fields:
- ideal_client_description, ideal_client_situation
- main_problem, problem_feels_like
- transformation
- lead_magnet_idea
- instagram_handle

If these exist, use the "reference and deepen" approach. This conversation may be their first time articulating these — give them space to refine.
`;
  } else if (conversationType === "phase3" || conversationType === "funnel") {
    context += `
## FOCUS FOR THIS CONVERSATION (Phase 3 - Full Funnel)

Focus fields:
- ALL fields from Phase 2 (reference and deepen)
- PLUS: origin_story, credibility_points, unique_approach
- PLUS: offer details (name, description, price, duration)

Phase 3 goes DEEPER than Phase 2. Even if ideal_client exists, ask follow-ups:
- "What was she struggling with specifically?"
- "What had she already tried that didn't work?"
- "What was the moment she realized she needed help?"

Use their Phase 2 answers as the foundation, then build a richer picture.
`;
  }

  context += `
---

## YOUR CORE INSTRUCTIONS BEGIN BELOW
## (All existing frameworks, outputs, and templates remain unchanged)

---

`;

  return context;
}

// Extract profile fields from conversation messages
export function extractProfileUpdates(messages: Array<{role: string; content: string}>): Partial<CoachProfile> {
  const updates: Partial<CoachProfile> = {};
  
  // Combine all user messages for analysis
  const userContent = messages
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join("\n");
  
  // Simple extraction patterns - these could be enhanced with AI
  const patterns: Array<{field: keyof CoachProfile; regex: RegExp}> = [
    { field: "coach_name", regex: /(?:my name is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i },
    { field: "instagram_handle", regex: /@([a-zA-Z0-9_.]+)/i },
    { field: "booking_link", regex: /(https?:\/\/[^\s]+(?:calendly|acuity|book|schedule)[^\s]*)/i },
  ];
  
  for (const { field, regex } of patterns) {
    const match = userContent.match(regex);
    if (match && match[1]) {
      updates[field] = match[1];
    }
  }
  
  return updates;
}
