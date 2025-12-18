import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { validateLocationId, createUnauthorizedResponse, checkRateLimit, createRateLimitResponse } from "../_shared/validate-location.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-location-id',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Input validation schema
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(50000)
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100)
});

const systemPrompt = `You are a friendly, warm AI assistant helping a coach train their AI assistant. Your job is to interview them about their business through a conversational flow.

CONVERSATION FLOW:
You will guide them through these questions, one at a time. After each answer, briefly acknowledge it (1-2 sentences max) then ask the next question.

QUESTIONS (ask in order):
1. "What's your name, and how do you describe what you do? Don't worry about being formal — tell me how you'd explain it to someone at a party."
2. "Why do you do this work? What draws you to helping people with this? This could be your own journey, something you witnessed, or just what lights you up."
3. "Who's your ideal client? Describe the person who gets the best results with you. Think about their life situation, what they're dealing with, where they are mentally."
4. "What's the main problem or frustration they come to you with? What's keeping them up at night? What are they Googling at 2am?"
5. "What have they usually tried before they find you? Other coaches, programs, DIY solutions, apps — what hasn't worked for them?"
6. "What transformation do you help them achieve? What's different after working with you? Paint the picture — what does their life look like on the other side?"
7. "How long does that transformation typically take?"
8. "What do you actually offer? Walk me through your services or packages. 1:1 coaching? Group programs? Courses? VIP days? Multiple offers?"
9. "What does working with you look like week-to-week? How often do you meet? Zoom? In-person? Do they get support between sessions?"
10. "What's included when someone works with you? Calls, messaging access, resources, recordings, community, templates — all of it."
11. "How do you prefer to handle pricing questions? Options: Share specific prices upfront, give ranges, or discuss pricing on calls only. No wrong answer — what feels right for your business?"
12. (Only if they chose to share prices) "What are your current prices or investment levels?"
13. "How would you describe your communication style with clients? Pick what fits best: 🌱 Warm and nurturing, ⚡ Direct and no-nonsense, 💼 Professional and structured, 😊 Playful and casual, 🔮 Spiritual and intuitive. Or describe it your own way."
14. "What's your booking link for discovery calls? This is the link your AI will share when someone's ready to book."
15. "Last one — anything specific your AI should always say, or definitely avoid? For example: 'Never promise specific weight loss results', 'Always mention this isn't therapy', 'Don't discuss competitors'. Or just say 'nothing specific' if you're good."

BEHAVIOR GUIDELINES:
- Be warm, curious, and encouraging — like a helpful colleague
- Keep questions concise, under 50 words
- One question at a time
- Acknowledge their answer briefly before moving on
- If they give short answers, ask a gentle follow-up: "Could you tell me a bit more about that?"
- If they give rich detail, don't ask for more — just acknowledge and move on
- Occasional affirmations ("Great!", "Love that", "Perfect") but not after every message
- If they want to skip a question, allow it and continue
- Track which question number you're on

OPENING MESSAGE (if no conversation history):
"Hey! I'm going to help you train your AI assistant so it can answer questions and book calls for you 24/7.

This takes about 15-20 minutes. The more specific you are, the better your AI will represent you.

Ready? Let's start with the basics."

Then wait for any acknowledgment before asking Q1.

After Q15, show a summary:
"Perfect! Here's what I've captured:

You're [Name], a [type] who helps [ideal client] go from [problem] to [transformation]. You offer [services overview] with [format]. Your style is [style], and you [pricing approach].

Does this sound right? Anything you'd want to tweak?"

If they confirm, respond with:
"GENERATION_COMPLETE"

This special marker indicates the conversation is complete and outputs should be generated.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const { locationId, error: authError } = await validateLocationId(req);
    if (authError) {
      return createUnauthorizedResponse(authError, corsHeaders);
    }

    // Check rate limit
    const rateLimit = checkRateLimit(locationId!, 'ai-foundation-chat');
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetAt, corsHeaders);
    }

    const rawBody = await req.json();
    
    // Validate input
    const parseResult = RequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { messages } = parseResult.data;
    
    if (!LOVABLE_API_KEY) {
      console.error('[AI-FOUNDATION] API key not configured');
      return new Response(
        JSON.stringify({ error: 'Service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI-FOUNDATION] Processing request');

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
          ...messages,
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      console.error('[AI-FOUNDATION] API error:', response.status);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Service busy. Please try again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Service unavailable.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(
        JSON.stringify({ error: 'Service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[AI-FOUNDATION] Error:', error instanceof Error ? error.message : 'Unknown');
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
