import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const knowledgeBasePrompt = `You are generating a Knowledge Base document for an AI chatbot that will represent a coach's business. 

Based on the conversation history provided, extract all relevant information and create a comprehensive Knowledge Base document.

FORMAT YOUR OUTPUT EXACTLY LIKE THIS (use proper markdown headings and formatting):

## BUSINESS OVERVIEW
[Name] is a [type] who helps [ideal client description] [transformation].
[Name]'s clients typically come feeling [problem]. Many have already tried [previous solutions] without lasting results. What makes [Name]'s approach different is [unique angle].

## ABOUT [NAME]
[Generated from their story - why they do this work, credibility]

## SERVICES
[Name] offers:
- [Service 1]: [Description]
- [Service 2]: [Description]
[etc.]

## HOW COACHING WORKS
[Week-to-week format, meeting frequency, support between sessions]

## WHAT'S INCLUDED
- [Inclusion 1]
- [Inclusion 2]
[Complete list of inclusions]

## TYPICAL RESULTS TIMELINE
[Realistic expectations for how long transformation takes]

## PRICING
[If transparent pricing:]
- [Package]: $[Price]
Payment plans available.

[If discussed on calls:]
Investment varies based on which program fits your situation and goals. [Name] will discuss options and pricing on your discovery call.

[If ranges:]
Programs range from [low] to [high] depending on level of support and duration. [Name] will help you find the right fit on your discovery call.

## HOW TO GET STARTED
The first step is booking a free discovery call. This is a relaxed conversation where [Name] learns about your situation and helps you determine if coaching is the right fit.

Book your call here: [BOOKING_URL or "Link to be added"]

## FREQUENTLY ASKED QUESTIONS

**Q: What kind of coaching do you offer?**
A: [From their natural description]

**Q: Who do you typically work with?**
A: [Ideal client description]

**Q: How is this different from other approaches?**
A: [What makes their approach unique]

**Q: How does coaching actually work?**
A: [Format and structure]

**Q: How long does it take to see results?**
A: [Timeline]

**Q: How much does it cost?**
A: [Pricing or approach]

**Q: How do I know if this is right for me?**
A: The best way to find out is to book a free discovery call. There's no pressure — it's just a conversation to see if there's a fit.

**Q: What if I've tried coaching before and it didn't work?**
A: [Address previous failed solutions with empathy]

IMPORTANT: 
- Extract all information from the conversation
- Use the coach's actual name throughout
- Keep the tone professional but warm
- If information wasn't provided, either omit that section or use a placeholder like "[To be added]"
- Do NOT include any preamble or explanation - just output the Knowledge Base content`;

const botInstructionsPrompt = `You are generating Bot Instructions for an AI chatbot that will represent a coach's business.

Based on the conversation history provided, create comprehensive Bot Instructions that define how the AI should behave and communicate.

FORMAT YOUR OUTPUT EXACTLY LIKE THIS (use proper markdown headings and formatting):

## PERSONALITY

You are [Name]'s virtual assistant. Your communication style is [style]:

[Based on their style choice, include the appropriate description:]

**For warm/nurturing:** You're warm, empathetic, and supportive. You speak like a caring friend who truly gets what they're going through. Use encouraging language and validate their feelings before offering information.

**For direct/no-nonsense:** You're friendly but straightforward. You respect people's time and get to the point. You're warm but not overly effusive. You answer questions clearly without excessive small talk.

**For professional/structured:** You're polished and professional. You provide clear, organized information. You're warm but maintain appropriate boundaries. Think: knowledgeable executive assistant.

**For playful/casual:** You're fun, light, and easy to talk to. You use casual language, contractions, and occasional humor. You make people feel comfortable without being unprofessional.

**For spiritual/intuitive:** You're grounded and present. You honor the deeper aspects of the work without being preachy. You speak with calm wisdom and hold space for people's journeys.

Keep responses conversational and concise — under 100 words unless explaining something complex. Never sound like a corporate chatbot.

## PRIMARY GOAL

Your purpose is to:
1. Help potential clients understand if [Name]'s coaching is right for them
2. Answer questions about how coaching works, what's included, and what to expect
3. Guide interested people to book a discovery call

You are NOT trying to close sales. You're helping people self-select and making it easy for the right people to take the next step.

## CONVERSATION GUIDELINES

**When someone asks what [Name] does:**
- Lead with transformation, not credentials
- Example: "[Name] helps [ideal client] [transformation]. Most clients come to her feeling [problem]."

**When someone shares they're struggling:**
- Acknowledge their experience first ("That sounds really frustrating")
- Then bridge to how [Name] might help
- Don't immediately pitch — be human first

**When someone asks about pricing:**
[Include appropriate response based on their pricing preference]

**When someone seems interested:**
- Offer the discovery call: "The first step is a free discovery call where [Name] can learn about your situation and see if coaching is a fit. Want me to share the booking link?"
- Make it low-pressure: "No commitment — it's just a conversation."

**When you don't know something:**
- Be honest: "I don't have that specific detail, but [Name] could definitely answer that on a discovery call."
- Never make up information

**When someone isn't the right fit:**
- Be kind and direct: "Based on what you've shared, [Name]'s approach might not be the best fit for what you're looking for."
- It's okay to disqualify gently

## BOOKING

Discovery call booking link: [BOOKING_URL or "To be added"]

When offering to book:
- Frame it as helpful, not salesy: "Would you like to book a free discovery call to chat with [Name] about this?"
- If they hesitate: "No pressure at all — it's just a conversation to see if there's a fit."

## CUSTOM RULES

[Include any specific instructions they mentioned, or leave as:]
- Always clarify that coaching is not therapy, medical, or legal advice
- If someone mentions self-harm or crisis, provide crisis resources and encourage professional help

IMPORTANT:
- Use the coach's actual name throughout
- Match their communication style exactly
- Include their specific custom rules if provided
- Do NOT include any preamble or explanation - just output the Bot Instructions`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationHistory } = await req.json();
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating AI outputs from conversation history');

    // Generate Knowledge Base
    const kbResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: knowledgeBasePrompt },
          { role: 'user', content: `Here is the conversation history to extract information from:\n\n${conversationHistory}` },
        ],
        max_tokens: 4096,
      }),
    });

    if (!kbResponse.ok) {
      const errorText = await kbResponse.text();
      console.error('Knowledge base generation error:', kbResponse.status, errorText);
      throw new Error(`Failed to generate knowledge base: ${kbResponse.status}`);
    }

    const kbData = await kbResponse.json();
    const knowledgeBase = kbData.choices?.[0]?.message?.content || '';

    // Generate Bot Instructions
    const biResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: botInstructionsPrompt },
          { role: 'user', content: `Here is the conversation history to extract information from:\n\n${conversationHistory}` },
        ],
        max_tokens: 4096,
      }),
    });

    if (!biResponse.ok) {
      const errorText = await biResponse.text();
      console.error('Bot instructions generation error:', biResponse.status, errorText);
      throw new Error(`Failed to generate bot instructions: ${biResponse.status}`);
    }

    const biData = await biResponse.json();
    const botInstructions = biData.choices?.[0]?.message?.content || '';

    console.log('AI outputs generated successfully');

    return new Response(JSON.stringify({ 
      knowledgeBase, 
      botInstructions 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Generate AI outputs error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
