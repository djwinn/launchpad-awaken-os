import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Loader2, Send, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import awakenLogo from '@/assets/awaken-logo-white.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUESTIONS = [
  "What's the #1 problem your ideal client is trying to solve right now?",
  "What's a quick win you could give them? Something they could do or learn in 10-15 minutes that would make them feel progress.",
  "What format would work best for this quick win? (PDF Guide, Checklist, Cheat Sheet, Short Video Training, or Audio Meditation/Exercise)",
  "What would you call this free resource? Give me a working title.",
  "What are the 5-7 main points or steps you'd include?",
  "Tell me more about your ideal client. Who are they, what's their situation, and what are they struggling with?",
  "What transformation do you help them achieve? What's different after working with you?",
  "After someone downloads this, what do you want them to do next? What's your main offer?",
  "What objections or hesitations might stop someone from taking that next step with you?",
];

const FunnelCraft = () => {
  const { user, loading } = useAuth();
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
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.email || loading) return;
    
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! Let's create your Funnel Blueprint — everything you need for a complete lead generation funnel.\n\nI'll ask you 9 questions about your business, then generate your:\n• Lead magnet content\n• Landing page copy\n• 4-email nurture sequence\n• Social capture templates\n\nLet's start!\n\n**${QUESTIONS[0]}**`,
        },
      ]);
    }
  }, [user, loading, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    const newAnswers = [...answers, userMessage];
    setAnswers(newAnswers);

    const nextQuestion = currentQuestion + 1;
    
    if (nextQuestion < QUESTIONS.length) {
      setTimeout(() => {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: `**${QUESTIONS[nextQuestion]}**` },
        ]);
        setCurrentQuestion(nextQuestion);
        setSending(false);
      }, 500);
    } else {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Perfect! Let me generate your Funnel Blueprint...' },
      ]);
      
      await generateOutput(newAnswers);
      setSending(false);
    }
  };

  const generateOutput = async (allAnswers: string[]) => {
    const [problem, quickWin, format, title, points, idealClient, transformation, offer, objections] = allAnswers;
    
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Parse points into array
    const pointsList = points.split(/\d+\.|•|-/).filter(p => p.trim()).map(p => p.trim());

    const outputDoc = `YOUR FUNNEL BLUEPRINT

Created for: ${user?.user_metadata?.name || user?.email?.split('@')[0] || 'You'}
Date: ${today}

═══════════════════════════════════════════════════

LEAD MAGNET CONTENT

Title: ${title}
Format: ${format}

---

OUTLINE:

**Introduction**
${problem} — it's frustrating, overwhelming, and you're not alone. This ${format.toLowerCase()} will give you a quick win you can implement in just 10-15 minutes.

${pointsList.slice(0, 7).map((point, i) => `**${i + 1}. ${point}**
[Add 2-3 sentences explaining this point and how to implement it.]
`).join('\n')}

**Closing & Next Step**
Now that you have these foundations in place, you're ready to ${transformation.toLowerCase().substring(0, 100)}. 

If you want personalized guidance, I'd love to help. Book a free discovery call and let's talk about ${offer.toLowerCase().substring(0, 50)}.

[BOOKING LINK]

═══════════════════════════════════════════════════

LANDING PAGE COPY

---

HERO SECTION

Headline: ${title}

Subheadline: The ${format.toLowerCase()} that helps ${idealClient.toLowerCase().substring(0, 50)} ${transformation.toLowerCase().substring(0, 50)}.

CTA Button: Get My Free ${format}

Trust Badges (optional):
• Join [XXX]+ ${idealClient.toLowerCase().substring(0, 30)} on their journey
• Instant access — no spam, ever
• Free for a limited time

---

DOES THIS SOUND LIKE YOU?

You're a ${idealClient.toLowerCase().substring(0, 100)}, and you've been struggling with ${problem.toLowerCase().substring(0, 100)}. Sound familiar?

Pain Points:
• You're tired of ${problem.toLowerCase().substring(0, 60)}
• You've tried different solutions but nothing seems to stick
• You feel overwhelmed and unsure where to start
• You want ${transformation.toLowerCase().substring(0, 60)} but ${objections.toLowerCase().substring(0, 40)}

---

IMAGINE [TIMEFRAME] FROM NOW...

You've downloaded the ${title}. You've actually used it. And now?

Transformation Points:
• You ${transformation.toLowerCase().substring(0, 80)}
• You've stopped second-guessing yourself and started taking action
• You finally feel confident and in control
• You know exactly what to do next

CTA Button: Yes, I Want This!

---

WHAT YOU'LL GET

Section Title: Here's what's inside your free ${title}:

Benefits:
${pointsList.slice(0, 5).map(point => `✓ ${point}`).join('\n')}

CTA Button: Send Me the ${format}

---

ABOUT ME

Headline: Hi! I'm [Your Name].

Subheadline: Helping ${idealClient.toLowerCase().substring(0, 50)} ${transformation.toLowerCase().substring(0, 50)}.

Bio Paragraph 1: [Add your credibility — certifications, years of experience, notable clients]

Bio Paragraph 2: [Add your story — why you do this work, what drives you]

Bio Paragraph 3: I created this free ${format.toLowerCase()} because I know what it's like to ${problem.toLowerCase().substring(0, 60)}. This is the starting point I wish I'd had.

---

FINAL CTA

Headline: Ready to ${transformation.toLowerCase().substring(0, 40)}?

CTA Button: Get My Free ${format}

Below Form: Your info is safe. Unsubscribe anytime.

---

SECTIONS TO KEEP OR DELETE

For a simple lead magnet page, KEEP:
• Hero Section
• What You'll Get
• Final CTA

OPTIONAL (delete if you want a shorter page):
• Does This Sound Like You?
• Imagine [Timeframe] From Now...
• About Me

Your video tutorial will show you how to delete sections you don't need.

═══════════════════════════════════════════════════

EMAIL SEQUENCE

---

Email 1: Delivery (Send Immediately)

Subject: Here's your ${title} 🎁

Body:
Hey {{contact.first_name}},

So excited you downloaded the ${title}!

This ${format.toLowerCase()} is going to help you ${quickWin.toLowerCase().substring(0, 80)}.

Here's your free ${title}: [LINK TO LEAD MAGNET]

My suggestion? Don't just save it — open it now and pick ONE thing to implement today. Small wins lead to big transformations.

Talk soon,
[Your Name]

P.S. Keep an eye on your inbox — I'll be sharing some extra tips over the next few days that'll help you get even more from this.

---

Email 2: Quick Win (Send Day 2)

Subject: Quick tip for ${problem.toLowerCase().substring(0, 30)}

Body:
Hey {{contact.first_name}},

Did you get a chance to look at the ${title} yet?

Here's something I've noticed with my clients...

${problem} is usually a symptom of something deeper — trying to do too much, lacking a clear plan, or not having the right support.

The ${format.toLowerCase()} I sent you addresses the surface level. But if you want to go deeper...

Here's one thing you can do today: ${quickWin.toLowerCase().substring(0, 100)}

Try it and let me know how it goes. Just hit reply — I read every email.

[Your Name]

---

Email 3: Story/Proof (Send Day 4)

Subject: How [Client Name] went from ${problem.toLowerCase().substring(0, 30)} to ${transformation.toLowerCase().substring(0, 30)}

Body:
Hey {{contact.first_name}},

I want to share a quick story with you.

[Client Name] came to me feeling ${problem.toLowerCase().substring(0, 60)}.

Sound familiar?

After working together on ${offer.toLowerCase().substring(0, 50)}, they were able to ${transformation.toLowerCase().substring(0, 80)}.

The biggest shift? [One key insight or breakthrough]

If you're ready for a transformation like this, I'd love to chat.

Book a free discovery call here: [BOOKING LINK]

No pressure, no pitch — just a conversation about where you are and where you want to be.

[Your Name]

---

Email 4: Invitation (Send Day 7)

Subject: Can I help you with ${transformation.toLowerCase().substring(0, 40)}?

Body:
Hey {{contact.first_name}},

Over the past week, you've gotten some valuable insights from me.

But here's the truth: information alone doesn't create transformation. Implementation does.

If you're serious about ${transformation.toLowerCase().substring(0, 60)}, I'd love to help.

Here's what working together looks like:

${offer}

I know you might be thinking: "${objections.substring(0, 80)}"

That's exactly why I offer a free discovery call first. No commitment, no pressure — just a chance to see if we're a good fit.

Book your call here: [BOOKING LINK]

Looking forward to connecting,
[Your Name]

═══════════════════════════════════════════════════

LEAD MAGNET SOCIAL CAPTURE

---

DM Message Template:
Copy this into your "Comment to DM — Lead Magnet" workflow:

Hey {{contact.first_name}}! 👋

So excited to share this with you!

Here's your free ${title}:
[LEAD-MAGNET-LINK-HERE]

Let me know what you think!

---

Post CTA Examples:

1. "Want my free ${title}? Comment GUIDE below and I'll DM it to you!"

2. "I put together a ${format.toLowerCase()} on ${problem.toLowerCase().substring(0, 40)}. Comment FREE to grab your copy."

3. "Struggling with ${problem.toLowerCase().substring(0, 40)}? I made a free ${format.toLowerCase()} that helps. Comment YES and I'll send it over."

═══════════════════════════════════════════════════

NEXT STEPS

✅ Complete Item 2 to build each piece of your funnel
✅ Watch each video tutorial and check off when done
✅ Activate your Lead Magnet Social Capture workflow
✅ Start posting about your lead magnet!

═══════════════════════════════════════════════════`;

    setOutput(outputDoc);
    setIsComplete(true);

    if (user?.email) {
      await (supabase
        .from('user_progress')
        .update({
          funnel_craft_complete: true,
          funnel_blueprint: outputDoc,
        } as any)
        .eq('user_email', user.email));
    }

    setMessages(prev => [
      ...prev.slice(0, -1),
      { role: 'assistant', content: '🎉 Your Funnel Blueprint is ready! Scroll down to see it.' },
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
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
          <p className="text-white/70 text-sm">Question {Math.min(currentQuestion + 1, QUESTIONS.length)} of {QUESTIONS.length}</p>
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
                  <p className="whitespace-pre-wrap text-sm">{msg.content.replace(/\*\*/g, '')}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      {!isComplete && (
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
        <div className="border-t border-white/10 p-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Your Funnel Blueprint</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyAll}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                  onClick={() => navigate('/funnel')}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </div>
            </div>
            
            <Card className="p-4 bg-muted/30 max-h-[60vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">{output}</pre>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default FunnelCraft;