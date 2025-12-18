import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-location-id',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const locationId = req.headers.get('x-location-id');
    if (!locationId) {
      return new Response(JSON.stringify({ error: 'Missing location ID' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { coaching_type, ideal_client, main_problem, lead_magnet, next_step, social_handle, domain } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a marketing copywriter who specializes in helping coaches, healers, and wellness practitioners create authentic, warm content that converts. You use the PAS (Problem-Agitate-Solution) framework but keep the tone conversational and non-pushy.

Generate marketing content based on the user's business information. The content should feel personal, warm, and speak directly to their ideal client's pain points.

IMPORTANT: Return ONLY valid JSON with no markdown formatting, no code blocks, just the raw JSON object.`;

    const userPrompt = `Create marketing content for this coach:

Business: ${coaching_type}
Ideal Client: ${ideal_client}
Main Problem: ${main_problem}
Lead Magnet: ${lead_magnet}
Next Step: ${next_step}
Social Handle: ${social_handle}
Website Domain: ${domain}

Generate:
1. An Instagram/Facebook post caption (with a clear CTA asking people to comment a keyword like "GUIDE" or "YES" to get the free resource)
2. A DM template that warmly delivers the link when someone comments
3. Landing page copy (headline, subheadline, button text)
4. A delivery email (subject + body) that delivers the lead magnet
5. A follow-up email for day 2 (subject + body) that adds value and has a soft CTA

Return as JSON with this exact structure:
{
  "post_caption": "string",
  "dm_template": "string",
  "landing_page": {
    "headline": "string",
    "subheadline": "string",
    "button_text": "string"
  },
  "delivery_email": {
    "subject": "string",
    "body": "string"
  },
  "followup_email": {
    "subject": "string",
    "body": "string"
  },
  "coaching_type": "${coaching_type}",
  "ideal_client": "${ideal_client}",
  "main_problem": "${main_problem}",
  "lead_magnet": "${lead_magnet}",
  "next_step": "${next_step}",
  "social_handle": "${social_handle}"
}`;

    console.log('Calling Lovable AI for Phase 2 content generation...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log('Raw AI response:', content);

    // Parse the JSON response
    let outputs;
    try {
      // Remove any markdown code block formatting if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      outputs = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a fallback structure
      outputs = {
        post_caption: `🌟 Ready to ${lead_magnet?.toLowerCase() || 'transform your life'}?\n\nI created something special for ${ideal_client?.toLowerCase() || 'you'}...\n\nComment "GUIDE" below and I'll send it to you! 👇`,
        dm_template: `Hey! 👋 Thanks for your interest!\n\nHere's your free resource: https://${domain || 'yourdomain.com'}\n\nLet me know if you have any questions!`,
        landing_page: {
          headline: `Free: ${lead_magnet || 'Your Guide'}`,
          subheadline: `For ${ideal_client || 'those ready to transform'}`,
          button_text: "Get Instant Access"
        },
        delivery_email: {
          subject: `Your ${lead_magnet || 'free resource'} is here! 🎉`,
          body: `Hi there!\n\nThank you for requesting your free resource.\n\nYou can access it here: [LINK]\n\nEnjoy!\n\nWarmly`
        },
        followup_email: {
          subject: `Quick tip for you`,
          body: `Hi there!\n\nI hope you're finding value in the resource I sent!\n\nHere's a quick tip to get even more from it...\n\nWarmly`
        },
        coaching_type,
        ideal_client,
        main_problem,
        lead_magnet,
        next_step,
        social_handle
      };
    }

    console.log('Generated outputs:', outputs);

    return new Response(JSON.stringify({ outputs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-phase2-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
