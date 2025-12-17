import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Loader2, Send, Copy, Check, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import awakenLogo from '@/assets/awaken-logo-white.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUESTIONS = [
  "What's your name, and how do you describe what you do?",
  "Who's your ideal client? Describe the person who gets the best results with you.",
  "What's the main problem or frustration they come to you with?",
  "What transformation do you help them achieve? What's different after working with you?",
  "What do you offer? Walk me through your main service (1:1 coaching, group program, course, etc.).",
  "Do you share your pricing openly, or prefer to discuss it on a call?",
];

const SocialCaptureBuilder = () => {
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
    
    // Initialize with first question
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Hi! Let's create your Social Capture Toolkit — everything you need for comment-to-DM automation.\n\nI'll ask you 6 quick questions about your business, then generate your:\n• DM message template\n• Comment reply variations\n• Suggested keywords\n• Post CTA examples\n\nLet's start!\n\n**${QUESTIONS[0]}**`,
        },
      ]);
    }
  }, [user, loading, messages.length]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    // Add user message
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    // Store answer
    const newAnswers = [...answers, userMessage];
    setAnswers(newAnswers);

    // Check if we have more questions
    const nextQuestion = currentQuestion + 1;
    
    if (nextQuestion < QUESTIONS.length) {
      // Ask next question
      setTimeout(() => {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: `**${QUESTIONS[nextQuestion]}**` },
        ]);
        setCurrentQuestion(nextQuestion);
        setSending(false);
      }, 500);
    } else {
      // Generate output
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Perfect! Let me generate your Social Capture Toolkit...' },
      ]);
      
      await generateOutput(newAnswers);
      setSending(false);
    }
  };

  const generateOutput = async (allAnswers: string[]) => {
    const [nameAndWork, idealClient, problem, transformation, offer, pricing] = allAnswers;
    
    // Extract first name from answer
    const firstName = nameAndWork.split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'there';
    
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Generate transformation-based sentence
    const transformationSentence = transformation.length > 100 
      ? transformation.substring(0, 100) + '...'
      : transformation;

    const outputDoc = `YOUR SOCIAL CAPTURE TOOLKIT

Created for: ${firstName}
Date: ${today}

═══════════════════════════════════════════════════

DM MESSAGE

Copy this into your Comment-to-DM workflow:

---

Hey {{contact.first_name}}! 👋

Thanks for reaching out — I'd love to connect.

I help people ${transformationSentence.toLowerCase()}

Here's where you can book a free discovery call with me:
[YOUR-BOOKING-LINK-HERE]

Looking forward to chatting!

---

═══════════════════════════════════════════════════

COMMENT REPLY VARIATIONS

Paste these into your workflow (the system will rotate through them):

• Just sent you a DM! 💫
• Check your messages ✨
• Sent you the details — check your DMs!
• Message incoming! 📩
• Just DMed you the link 🙌

═══════════════════════════════════════════════════

SUGGESTED KEYWORDS

Pick one to use as your trigger word:

• BOOK — clear intent to book a call
• YES — simple, high engagement
• READY — creates commitment feeling
• CALL — direct and clear
• INFO — for those wanting more details

═══════════════════════════════════════════════════

POST CTA EXAMPLES

Use these captions to drive comments:

1. "Ready to ${transformation.toLowerCase().substring(0, 50)}? Comment BOOK below and I'll send you the link to grab a free call with me."

2. "Struggling with ${problem.toLowerCase().substring(0, 50)}? I help ${idealClient.toLowerCase().substring(0, 40)} achieve real results. Comment YES if you want to chat."

3. "Want to finally ${transformation.toLowerCase().substring(0, 40)}? Comment READY and I'll DM you the details."

4. "If you're a ${idealClient.toLowerCase().substring(0, 30)} who's tired of ${problem.toLowerCase().substring(0, 30)}, comment INFO and I'll share how I can help."

═══════════════════════════════════════════════════

NEXT STEPS

✅ Complete Item 2 to connect your social accounts
✅ Complete Item 3 to activate your workflow
✅ Make your first post using one of the CTAs above!

═══════════════════════════════════════════════════`;

    setOutput(outputDoc);
    setIsComplete(true);

    // Save to database
    if (user?.email) {
      await supabase
        .from('user_progress')
        .update({
          social_message_complete: true,
          social_capture_toolkit: outputDoc,
        })
        .eq('user_email', user.email);
    }

    setMessages(prev => [
      ...prev.slice(0, -1),
      { role: 'assistant', content: '🎉 Your Social Capture Toolkit is ready! Scroll down to see it.' },
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
      toast({ title: 'Full toolkit copied!' });
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/social-capture')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-xl font-bold text-white">Craft Your Message</h1>
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
              <h2 className="text-lg font-bold">Your Social Capture Toolkit</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyAll}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                  onClick={() => navigate('/social-capture')}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </div>
            </div>
            
            <Card className="p-4 bg-muted/30">
              <pre className="whitespace-pre-wrap text-sm font-mono">{output}</pre>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialCaptureBuilder;