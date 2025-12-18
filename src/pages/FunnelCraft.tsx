import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Loader2, Send, Copy, Check, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updatePhase3Data } from '@/lib/phase-data';
import awakenLogo from '@/assets/awaken-logo-white.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  options?: string[];
  multiSelect?: boolean;
}

interface FunnelData {
  userName: string;
  whatYouDo: string;
  idealClient: string;
  mainProblem: string;
  emotionalPain: string;
  transformation: string;
  uniqueApproach: string;
  quickWin: string;
  leadMagnetFormat: string;
  leadMagnetTitle: string;
  leadMagnetPoints: string[];
  nextStep: string;
  bookingLink: string;
  voiceStyle: string[];
}

const FORMAT_OPTIONS = ['Checklist', 'Cheat Sheet', 'Short Guide (PDF)', 'Video Training', 'Audio/Meditation'];
const NEXT_STEP_OPTIONS = ['Book a free discovery call', 'Join my program/course', 'Book a paid session', 'Join my community', 'Just stay on my email list for now'];
const VOICE_STYLE_OPTIONS = ['Warm', 'Direct', 'Playful', 'Grounded', 'Encouraging', 'No-nonsense', 'Gentle', 'Inspiring'];

const MILESTONES = {
  1: "Great — I'm already getting a clear picture of who you help. Let's dig into the transformation you provide.",
  2: "This is gold. I can already see your messaging taking shape. Now let's create your free resource — the thing that attracts these ideal clients to you.",
  3: "Perfect — your lead magnet is taking shape. A few more questions about your voice and next steps, then I'll generate everything.",
};

const FunnelCraft = () => {
  const { account } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    landingPage: true,
    leadMagnet: true,
    emailSequence: true,
    socialCapture: true,
  });
  
  const [funnelData, setFunnelData] = useState<FunnelData>({
    userName: '',
    whatYouDo: '',
    idealClient: '',
    mainProblem: '',
    emotionalPain: '',
    transformation: '',
    uniqueApproach: '',
    quickWin: '',
    leadMagnetFormat: '',
    leadMagnetTitle: '',
    leadMagnetPoints: [],
    nextStep: '',
    bookingLink: '',
    voiceStyle: [],
  });

  const [awaitingProbe, setAwaitingProbe] = useState(false);
  const [awaitingBookingLink, setAwaitingBookingLink] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!account?.location_id) return;
    
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Let's create your complete lead generation system — a free resource, landing page, email sequence, and social media templates that bring you aligned clients.\n\nThis usually takes about 20-25 minutes. I'll ask you questions about who you help and how, then generate everything you need.\n\nReady? Let's start with the basics.\n\n**What's your name, and how do you describe what you do in a sentence or two?**`,
        },
      ]);
    }
  }, [account, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isVagueAnswer = (answer: string, questionIndex: number): boolean => {
    const vaguePatterns = [
      /^(people|anyone|everyone)/i,
      /feel stuck/i,
      /want more balance/i,
      /want to feel better/i,
      /^i help people$/i,
      /^just.{0,20}$/i,
    ];
    
    if ([1, 2, 4, 5].includes(questionIndex)) {
      return answer.length < 30 || vaguePatterns.some(p => p.test(answer));
    }
    return false;
  };

  const getProbeQuestion = (questionIndex: number): string => {
    const probes: Record<number, string> = {
      1: "Think of your favorite client ever. What were they dealing with when they first came to you?",
      2: "Can you give me a specific example of how that shows up in their daily life?",
      4: "If I interviewed a client 3 months after working with you, what would they tell me changed?",
      5: "What do clients often say surprised them about working with you? Or what's something you do that others in your field don't?",
    };
    return probes[questionIndex] || '';
  };

  const getQuestionByIndex = (index: number): { question: string; options?: string[]; multiSelect?: boolean } => {
    const questions: Record<number, { question: string; options?: string[]; multiSelect?: boolean }> = {
      0: { question: "What's your name, and how do you describe what you do in a sentence or two?" },
      1: { question: "Who is your ideal client? Describe them like you're describing a friend — who are they, what's their situation?" },
      2: { question: "What's the #1 problem keeping them up at night? The thing they're Googling at 2am?" },
      3: { question: "How does this problem make them feel day-to-day? What's the emotional toll?\n\n*For example: exhausted, frustrated, anxious, stuck, overwhelmed, like they're failing...*" },
      4: { question: "What specific transformation do you help them achieve? What's different after working with you?" },
      5: { question: "What makes your approach different from other things they've tried?" },
      6: { question: "What's a quick win you could give them? Something they could do or learn in 10-15 minutes that would make them feel progress?" },
      7: { question: "What format would work best for this quick win?", options: FORMAT_OPTIONS },
      8: { question: "What would you call this free resource? Give me a working title." },
      9: { question: "What are the main points or steps you'd include? Just give me 3-7 bullet points — we'll flesh these out." },
      10: { question: "What's the next step you want people to take after they get your free resource?", options: NEXT_STEP_OPTIONS },
      11: { question: "Last one — how would you describe your communication style? Pick 2-3 words.", options: VOICE_STYLE_OPTIONS, multiSelect: true },
    };
    return questions[index] || { question: '' };
  };

  const storeAnswer = (questionIndex: number, answer: string) => {
    const updates: Partial<FunnelData> = {};
    
    switch (questionIndex) {
      case 0:
        const parts = answer.split(/[,.]/).filter(p => p.trim());
        updates.userName = parts[0]?.trim() || answer.split(' ')[0] || '';
        updates.whatYouDo = answer;
        break;
      case 1: updates.idealClient = answer; break;
      case 2: updates.mainProblem = answer; break;
      case 3: updates.emotionalPain = answer; break;
      case 4: updates.transformation = answer; break;
      case 5: updates.uniqueApproach = answer; break;
      case 6: updates.quickWin = answer; break;
      case 7: updates.leadMagnetFormat = answer; break;
      case 8: updates.leadMagnetTitle = answer; break;
      case 9: 
        updates.leadMagnetPoints = answer.split(/\n|•|-|\d+\./).filter(p => p.trim()).map(p => p.trim());
        break;
      case 10: updates.nextStep = answer; break;
      case 11: updates.voiceStyle = answer.split(',').map(s => s.trim()); break;
    }
    
    setFunnelData(prev => ({ ...prev, ...updates }));
  };

  const getMilestoneAfterQuestion = (questionIndex: number): string | null => {
    if (questionIndex === 2) return MILESTONES[1];
    if (questionIndex === 5) return MILESTONES[2];
    if (questionIndex === 9) return MILESTONES[3];
    return null;
  };

  const handleOptionSelect = (option: string, multiSelect: boolean) => {
    if (multiSelect) {
      setSelectedOptions(prev => 
        prev.includes(option) 
          ? prev.filter(o => o !== option)
          : prev.length < 3 ? [...prev, option] : prev
      );
    } else {
      setSelectedOptions([option]);
    }
  };

  const handleSendOptions = () => {
    if (selectedOptions.length === 0) return;
    const answer = selectedOptions.join(', ');
    setSelectedOptions([]);
    handleSendWithAnswer(answer);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMessage = input.trim();
    setInput('');
    handleSendWithAnswer(userMessage);
  };

  const handleSendWithAnswer = async (userMessage: string) => {
    setSending(true);

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    // Handle booking link follow-up
    if (awaitingBookingLink) {
      setFunnelData(prev => ({ ...prev, bookingLink: userMessage }));
      setAwaitingBookingLink(false);
      proceedToNextQuestion(newMessages, currentQuestion);
      return;
    }

    // Handle probe response
    if (awaitingProbe) {
      storeAnswer(currentQuestion, userMessage);
      setAwaitingProbe(false);
      
      const milestone = getMilestoneAfterQuestion(currentQuestion);
      if (milestone) {
        const withMilestone: Message[] = [...newMessages, { role: 'assistant', content: milestone }];
        setMessages(withMilestone);
        setTimeout(() => proceedToNextQuestion(withMilestone, currentQuestion), 1000);
      } else {
        proceedToNextQuestion(newMessages, currentQuestion);
      }
      return;
    }

    // Check for vague answer and probe
    if (isVagueAnswer(userMessage, currentQuestion) && !awaitingProbe) {
      const probe = getProbeQuestion(currentQuestion);
      if (probe) {
        setAwaitingProbe(true);
        setTimeout(() => {
          setMessages([...newMessages, { role: 'assistant', content: probe }]);
          setSending(false);
        }, 500);
        return;
      }
    }

    // Store the answer
    storeAnswer(currentQuestion, userMessage);

    // Check if next step needs booking link follow-up
    if (currentQuestion === 10) {
      const needsBooking = userMessage.toLowerCase().includes('discovery call') || 
                           userMessage.toLowerCase().includes('paid session') ||
                           userMessage.toLowerCase().includes('book');
      if (needsBooking) {
        setAwaitingBookingLink(true);
        setTimeout(() => {
          setMessages([...newMessages, { role: 'assistant', content: "What's your booking link?" }]);
          setSending(false);
        }, 500);
        return;
      }
    }

    // Check for milestone
    const milestone = getMilestoneAfterQuestion(currentQuestion);
    if (milestone) {
      const withMilestone: Message[] = [...newMessages, { role: 'assistant', content: milestone }];
      setMessages(withMilestone);
      setTimeout(() => proceedToNextQuestion(withMilestone, currentQuestion), 1000);
    } else {
      proceedToNextQuestion(newMessages, currentQuestion);
    }
  };

  const proceedToNextQuestion = (currentMessages: Message[], fromQuestion: number) => {
    const nextQuestion = fromQuestion + 1;
    
    if (nextQuestion >= 12) {
      // All questions answered - start generation
      setMessages([
        ...currentMessages,
        { 
          role: 'assistant', 
          content: "Amazing — I have everything I need.\n\nGive me a moment to craft your:\n✓ Lead magnet landing page copy\n✓ Lead magnet content outline\n✓ 7-email nurture sequence\n✓ Social media DM templates & post CTAs\n\nGenerating now..." 
        },
      ]);
      setGenerating(true);
      setTimeout(() => generateOutput(), 2000);
      setSending(false);
      return;
    }

    const nextQ = getQuestionByIndex(nextQuestion);
    
    setTimeout(() => {
      setMessages([
        ...currentMessages,
        { 
          role: 'assistant', 
          content: `**${nextQ.question}**`,
          options: nextQ.options,
          multiSelect: nextQ.multiSelect,
        },
      ]);
      setCurrentQuestion(nextQuestion);
      setSending(false);
    }, 500);
  };

  const generateOutput = async () => {
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const { userName, whatYouDo, idealClient, mainProblem, emotionalPain, transformation, 
            uniqueApproach, quickWin, leadMagnetFormat, leadMagnetTitle, leadMagnetPoints, 
            nextStep, bookingLink, voiceStyle } = funnelData;

    const formatShort = leadMagnetFormat.replace(/\s*\(PDF\)/, '').replace('Short ', '');

    const outputDoc = `YOUR FUNNEL BLUEPRINT

Created for: ${userName || account?.demo_name || 'You'}
Date: ${today}

═══════════════════════════════════════════════════════════════

SECTION 1: LEAD MAGNET LANDING PAGE COPY

═══════════════════════════════════════════════════════════════

## HERO SECTION

**Headline:**
${leadMagnetTitle}

**Subheadline:**
${idealClient.substring(0, 60)}? Discover ${quickWin.substring(0, 60).toLowerCase()}.

**CTA Button Text:**
Get My Free ${formatShort}

-----

## DOES THIS SOUND LIKE YOU?

**Intro:**
You're ${idealClient.substring(0, 80).toLowerCase()}, and you've been struggling with ${mainProblem.substring(0, 60).toLowerCase()}. Sound familiar?

**Pain Points:**
• You're tired of ${mainProblem.substring(0, 60).toLowerCase()}
• You feel ${emotionalPain.substring(0, 50).toLowerCase()} more often than you'd like to admit
• You've tried different solutions but nothing seems to stick
• You want ${transformation.substring(0, 50).toLowerCase()} but you're not sure how to get there

-----

## IMAGINE A FEW WEEKS FROM NOW…

**Intro:**
You've downloaded the ${leadMagnetTitle}. You've actually used it. And now?

**Transformation Points:**
• You ${transformation.substring(0, 80).toLowerCase()}
• You've stopped second-guessing yourself and started taking action
• You finally feel confident and in control
• You know exactly what to do next

**CTA Button Text:**
Yes, I Want This!

-----

## WHAT YOU'LL GET

**Section Title:**
Inside your free ${leadMagnetTitle}:

**Benefits:**
${leadMagnetPoints.slice(0, 5).map(point => `✓ ${point}`).join('\n')}

**CTA Button Text:**
Send Me the ${formatShort}

-----

## ABOUT ME

**Headline:**
Hi! I'm ${userName}.

**Subheadline:**
${whatYouDo.substring(0, 100)}

**Bio:**
${uniqueApproach.substring(0, 200)}

I created this free ${formatShort.toLowerCase()} because I know what it's like to ${mainProblem.substring(0, 60).toLowerCase()}. This is the starting point I wish I'd had.

-----

## FINAL CTA

**Headline:**
Ready to ${transformation.substring(0, 40).toLowerCase()}?

**CTA Button Text:**
Get My Free ${formatShort}

**Below Form Text:**
Your info is safe. Unsubscribe anytime.

═══════════════════════════════════════════════════════════════

SECTION 2: LEAD MAGNET CONTENT OUTLINE

═══════════════════════════════════════════════════════════════

## ${leadMagnetTitle.toUpperCase()}

*Format: ${leadMagnetFormat}*

-----

### Introduction

${mainProblem} — it's frustrating, overwhelming, and you're not alone. This ${formatShort.toLowerCase()} will help you ${quickWin.toLowerCase().substring(0, 80)}.

-----

${leadMagnetPoints.slice(0, 7).map((point, i) => `### ${i + 1}. ${point}

[Add 2-3 sentences explaining this point. Include one specific, actionable tip they can implement immediately.]
`).join('\n')}

-----

### Conclusion + Next Step

You now have the foundation to ${transformation.substring(0, 60).toLowerCase()}. Take action on even one of these points and you'll feel the difference.

${nextStep.includes('discovery call') || nextStep.includes('Book') 
  ? `If you're ready to go deeper, I'd love to help. Book a free discovery call and let's talk about your next steps: ${bookingLink || '[YOUR BOOKING LINK]'}`
  : `If you want to take this further, ${nextStep.toLowerCase()}.`}

═══════════════════════════════════════════════════════════════

SECTION 3: EMAIL NURTURE SEQUENCE (7 EMAILS)

═══════════════════════════════════════════════════════════════

## EMAIL 1: Welcome + Delivery
*Send: Immediately*

**Subject Line:**
Your ${leadMagnetTitle} is here ✨

**Body:**
Hey {{contact.first_name}},

Welcome! I'm so glad you're here.

Here's your free ${leadMagnetTitle}: [LINK]

Inside, you'll discover ${quickWin.substring(0, 60).toLowerCase()}.

My favorite part is [Point 1 from your lead magnet] — try it today and let me know how it goes.

${userName}

P.S. Keep an eye on your inbox — I'll be sharing some insights over the next couple weeks that'll help you ${transformation.substring(0, 40).toLowerCase()}.

-----

## EMAIL 2: Connection + Story
*Send: Day 2*

**Subject Line Options:**
• "Why I created this (personal)"
• "The moment everything changed for me"
• "I almost gave up"

**Body:**
Hey {{contact.first_name}},

I want to share something with you.

[Tell your story here — what you struggled with, how you found your way, why you do this work now]

That's why I created the ${leadMagnetTitle}. It's what I wish I'd had when I was where you might be now.

Have you had a chance to check it out yet? If not, here's the link again: [LINK]

Hit reply and let me know what resonates most.

${userName}

-----

## EMAIL 3: Value + Teaching
*Send: Day 4*

**Subject Line Options:**
• "The #1 mistake I see ${idealClient.substring(0, 20).toLowerCase()} make"
• "Why [common approach] doesn't work"
• "The missing piece most people overlook"

**Body:**
Hey {{contact.first_name}},

Here's something I've noticed after working with dozens of ${idealClient.substring(0, 30).toLowerCase()}...

Most people think the solution to ${mainProblem.substring(0, 40).toLowerCase()} is [common assumption]. But actually, it's about ${uniqueApproach.substring(0, 60).toLowerCase()}.

Here's what I'd suggest: [One specific, actionable tip]

Try it and let me know how it goes. I read every reply.

${userName}

-----

## EMAIL 4: Social Proof + Results
*Send: Day 6*

**Subject Line Options:**
• "How [name/type of client] went from stuck to unstoppable"
• "This is possible for you"
• "A transformation story"

**Body:**
Hey {{contact.first_name}},

I want to tell you about someone a lot like you.

[Client name or "A client of mine"] came to me feeling ${emotionalPain.substring(0, 40).toLowerCase()}. They were dealing with ${mainProblem.substring(0, 60).toLowerCase()}.

After working together, they ${transformation.substring(0, 80).toLowerCase()}.

The biggest shift? [One key insight or breakthrough]

This is possible for you too.

${userName}

-----

## EMAIL 5: Invitation
*Send: Day 8*

**Subject Line Options:**
• "Can I help you with this?"
• "A question for you"
• "Ready for the next step?"

**Body:**
Hey {{contact.first_name}},

You've been reading my emails (thank you!), and I have a question...

Are you still dealing with ${mainProblem.substring(0, 40).toLowerCase()}?

If so, I'd love to help.

${nextStep.includes('discovery call') || nextStep.includes('Book')
  ? `I offer free discovery calls where we can talk through what's going on and figure out if working together makes sense.\n\nNo pressure, no pitch — just a real conversation.\n\nBook a time here: ${bookingLink || '[YOUR BOOKING LINK]'}`
  : `I'd love to share more about ${nextStep.toLowerCase()}.\n\n[Add your CTA and link here]`}

${userName}

-----

## EMAIL 6: Objection Handling
*Send: Day 10*

**Subject Line Options:**
• "Is this you?"
• "The voice in your head saying 'not yet'"
• "What's really holding you back"

**Body:**
Hey {{contact.first_name}},

Can we talk about something?

If you're still reading these emails but haven't taken the next step, I get it.

Maybe there's a voice saying:
• "I should be able to figure this out myself"
• "I'm not ready yet"
• "What if it doesn't work for me?"

Here's what I know: Waiting rarely makes things easier. ${transformation.substring(0, 60)} doesn't happen by accident.

You don't have to have it all figured out. You just have to be willing to start.

${nextStep.includes('discovery call') || nextStep.includes('Book')
  ? `If you're curious, let's just talk: ${bookingLink || '[YOUR BOOKING LINK]'}`
  : `[Your soft CTA here]`}

${userName}

-----

## EMAIL 7: Soft Close + Value
*Send: Day 14*

**Subject Line Options:**
• "One more thing before I go quiet"
• "Still thinking about this?"
• "A gift before I go"

**Body:**
Hey {{contact.first_name}},

This is my last planned email in this series (though I'll still be in touch from time to time).

Before I go, I want to leave you with this:

${quickWin.substring(0, 100)}

That's the foundation. Everything else builds from there.

If you ever want to go deeper — if you're ready to truly ${transformation.substring(0, 50).toLowerCase()} — I'm here.

${nextStep.includes('discovery call') || nextStep.includes('Book')
  ? `Just book a call and we'll figure out the best path forward: ${bookingLink || '[YOUR BOOKING LINK]'}`
  : `[Your invitation here]`}

Wishing you all the best,
${userName}

═══════════════════════════════════════════════════════════════

SECTION 4: SOCIAL CAPTURE TEMPLATES

═══════════════════════════════════════════════════════════════

## DM MESSAGE TEMPLATE

**For Comment-to-DM Automation:**

Hey {{contact.first_name}}! 👋

Thanks for reaching out — I'm so glad ${leadMagnetTitle.substring(0, 30).toLowerCase()} resonated with you.

Here's where you can grab it: [LANDING PAGE LINK]

Inside you'll find ${quickWin.substring(0, 50).toLowerCase()}.

Let me know what you think!

${userName}

-----

## COMMENT REPLY VARIATIONS

*(For auto-reply to comments)*

1. Just sent you a DM! 💫
2. Check your messages ✨
3. Sent you the details — check your DMs!
4. Message incoming! 📩
5. Just DMed you the link 🙌

-----

## POST CTA EXAMPLES

**Problem-Aware Hook:**
Struggling with ${mainProblem.substring(0, 40).toLowerCase()}? I put together a free ${formatShort.toLowerCase()} that shows you ${quickWin.substring(0, 40).toLowerCase()}.

Comment "FREE" and I'll DM you the link.

**Aspiration Hook:**
Want to ${transformation.substring(0, 40).toLowerCase()} without ${emotionalPain.substring(0, 30).toLowerCase()}?

I created ${leadMagnetTitle} just for you.

Comment "YES" below and I'll send it over.

**Curiosity Hook:**
I used to think [common misconception about ${mainProblem.substring(0, 20).toLowerCase()}]. Then I discovered ${uniqueApproach.substring(0, 50).toLowerCase()}.

I put everything I learned into a free ${formatShort.toLowerCase()}. Comment "GUIDE" if you want it.

-----

## SUGGESTED KEYWORDS

• FREE
• YES
• GUIDE
• SEND
• [Custom keyword related to your topic]

═══════════════════════════════════════════════════════════════

NEXT STEPS

✅ Head to "Build Your Funnel" to implement each piece
✅ Watch the video tutorials for step-by-step guidance
✅ Your generated content will be ready to paste

═══════════════════════════════════════════════════════════════`;

    setOutput(outputDoc);
    setIsComplete(true);
    setGenerating(false);

    if (account?.location_id) {
      await updatePhase3Data(account.location_id, {
        funnel_craft_complete: true,
        funnel_blueprint: outputDoc,
      });
    }

    setMessages(prev => [
      ...prev.slice(0, -1),
      { 
        role: 'assistant', 
        content: "🎉 Your Funnel Blueprint is ready!\n\n**Next step:** Head to 'Build Your Funnel' to implement each piece in your system. You'll find video tutorials and your generated content ready to paste." 
      },
    ]);
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const copyAll = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast({ title: 'Full blueprint copied!' });
    }
  };

  const getSection = (sectionName: string): string => {
    if (!output) return '';
    const sections: Record<string, RegExp> = {
      landingPage: /SECTION 1: LEAD MAGNET LANDING PAGE COPY[\s\S]*?(?=═══.*SECTION 2)/,
      leadMagnet: /SECTION 2: LEAD MAGNET CONTENT OUTLINE[\s\S]*?(?=═══.*SECTION 3)/,
      emailSequence: /SECTION 3: EMAIL NURTURE SEQUENCE[\s\S]*?(?=═══.*SECTION 4)/,
      socialCapture: /SECTION 4: SOCIAL CAPTURE TEMPLATES[\s\S]*?(?=═══.*NEXT STEPS)/,
    };
    const match = output.match(sections[sectionName]);
    return match ? match[0].trim() : '';
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const lastMessage = messages[messages.length - 1];
  const hasOptions = lastMessage?.role === 'assistant' && lastMessage?.options;

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#605547' }}>
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10" style={{ backgroundColor: 'rgba(96, 85, 71, 0.9)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <img src={awakenLogo} alt="AwakenOS" className="h-8" />
            <Button variant="ghost" size="sm" onClick={() => navigate('/funnel')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-xl font-bold text-white">Craft Your Funnel</h1>
          <p className="text-white/70 text-sm">
            {generating ? 'Generating your blueprint...' : `Question ${Math.min(currentQuestion + 1, 12)} of 12`}
          </p>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4">
        <ScrollArea className="h-[calc(100vh-280px)]" ref={scrollRef}>
          <div className="py-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-[#827666] text-white'
                      : 'bg-white text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">
                    {msg.content.split('**').map((part, j) => 
                      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                    )}
                  </p>
                </div>
              </div>
            ))}
            {generating && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Options Selection */}
      {hasOptions && !isComplete && (
        <div className="border-t border-white/10 p-4" style={{ backgroundColor: 'rgba(96, 85, 71, 0.95)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {lastMessage.options?.map((option) => (
                <Button
                  key={option}
                  variant={selectedOptions.includes(option) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleOptionSelect(option, lastMessage.multiSelect || false)}
                  className={selectedOptions.includes(option) 
                    ? 'bg-[#ebcc89] text-black hover:bg-[#d4b876]' 
                    : 'bg-white hover:bg-gray-100'
                  }
                >
                  {option}
                </Button>
              ))}
            </div>
            <Button
              onClick={handleSendOptions}
              disabled={selectedOptions.length === 0 || sending}
              className="w-full bg-[#827666] hover:bg-[#6b5a4a]"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
            </Button>
          </div>
        </div>
      )}

      {/* Text Input Area */}
      {!hasOptions && !isComplete && (
        <div className="border-t border-white/10 p-4" style={{ backgroundColor: 'rgba(96, 85, 71, 0.95)' }}>
          <div className="max-w-3xl mx-auto flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              className="flex-1 min-h-[60px] max-h-32 resize-none bg-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="bg-[#827666] hover:bg-[#6b5a4a] h-auto"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      )}

      {/* Output Display */}
      {isComplete && output && (
        <div className="border-t border-white/10 p-4 bg-white flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Your Funnel Blueprint</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyAll}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Landing Page Section */}
              <Collapsible open={expandedSections.landingPage} onOpenChange={() => toggleSection('landingPage')}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <span className="font-semibold">1. Lead Magnet Landing Page Copy</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(getSection('landingPage'), 'landingPage');
                        }}
                      >
                        {copiedSection === 'landingPage' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      {expandedSections.landingPage ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4">
                      <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                        {getSection('landingPage')}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Lead Magnet Section */}
              <Collapsible open={expandedSections.leadMagnet} onOpenChange={() => toggleSection('leadMagnet')}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <span className="font-semibold">2. Lead Magnet Content Outline</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(getSection('leadMagnet'), 'leadMagnet');
                        }}
                      >
                        {copiedSection === 'leadMagnet' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      {expandedSections.leadMagnet ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4">
                      <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                        {getSection('leadMagnet')}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Email Sequence Section */}
              <Collapsible open={expandedSections.emailSequence} onOpenChange={() => toggleSection('emailSequence')}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <span className="font-semibold">3. Email Nurture Sequence (7 Emails)</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(getSection('emailSequence'), 'emailSequence');
                        }}
                      >
                        {copiedSection === 'emailSequence' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      {expandedSections.emailSequence ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4">
                      <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                        {getSection('emailSequence')}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Social Capture Section */}
              <Collapsible open={expandedSections.socialCapture} onOpenChange={() => toggleSection('socialCapture')}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <span className="font-semibold">4. Social Capture Templates</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(getSection('socialCapture'), 'socialCapture');
                        }}
                      >
                        {copiedSection === 'socialCapture' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      {expandedSections.socialCapture ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4">
                      <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                        {getSection('socialCapture')}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

            {/* Next Step Button */}
            <div className="mt-6">
              <Button 
                className="w-full bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                onClick={() => navigate('/funnel/build')}
              >
                Start Building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FunnelCraft;
