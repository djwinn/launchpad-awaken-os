import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateLocationId, createUnauthorizedResponse } from "../_shared/validate-location.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-location-id",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate location_id
    const { locationId, error: authError } = await validateLocationId(req);
    if (authError) {
      console.error('Auth error:', authError);
      return createUnauthorizedResponse(authError, corsHeaders);
    }

    console.log('Authenticated request from location:', locationId);

    const { content } = await req.json();
    
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for nonsense/irrelevant content
    const wordCount = content.trim().split(/\s+/).length;
    
    // Check if content looks like code/HTML
    const looksLikeCode = /<[^>]+>/.test(content) && content.includes('</') ||
                         /function\s*\(/.test(content) ||
                         /const\s+\w+\s*=/.test(content) ||
                         /import\s+.*from/.test(content);
    
    if (looksLikeCode) {
      return new Response(
        JSON.stringify({ 
          error: "Content appears to be code or HTML. Please paste plain text about your business.",
          extracted: null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert at extracting business information from text. Your task is to analyze the provided content and extract key information about a coaching or consulting business.

Extract the following fields from the content:
- coach_name: The name of the coach/practitioner (if mentioned)
- coaching_type: What type of coaching they do (e.g., "life coach", "business coach", "health coach", "wellness practitioner")
- ideal_client: Who they help (their target audience/ideal client description)
- main_problem: The main problem, pain point, or frustration their clients have
- transformation: The outcome, result, or transformation they help clients achieve
- main_offer: Their main service, package, or program
- booking_url: Any URL that looks like a booking/scheduling link

Return ONLY a valid JSON object with these fields. If a field cannot be determined from the content, use null for that field.

Example response:
{
  "coach_name": "Sarah Johnson",
  "coaching_type": "executive coach",
  "ideal_client": "mid-level managers feeling stuck in their careers",
  "main_problem": "feeling overwhelmed and unable to advance despite working hard",
  "transformation": "confident leaders who get promoted and have work-life balance",
  "main_offer": "3-month Executive Presence Program",
  "booking_url": null
}

Be thorough but only include information that is clearly stated or strongly implied in the content.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please extract business information from this content:\n\n${content}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to process content");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let extracted;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extracted = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      // Return partial extraction failure
      return new Response(
        JSON.stringify({ 
          extracted: null,
          error: "Could not parse extracted information"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ extracted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Extraction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
