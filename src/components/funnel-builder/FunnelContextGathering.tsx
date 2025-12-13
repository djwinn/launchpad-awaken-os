import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ArrowRight, MessageSquare, CheckCircle2, Edit3, Home, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import botIcon from '@/assets/bot-icon.png';
import { PHASE_INTRO_STATS } from '@/lib/motivational-content';

interface FunnelContext {
  coach_name?: string;
  coaching_type?: string;
  ideal_client?: string;
  main_problem?: string;
  transformation?: string;
  main_offer?: string;
  booking_url?: string;
  raw_content?: string;
  source: 'paste' | 'conversation' | 'phase2';
}

interface ExtractedData {
  coach_name?: string;
  coaching_type?: string;
  ideal_client?: string;
  main_problem?: string;
  transformation?: string;
  main_offer?: string;
  booking_url?: string;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface FunnelContextGatheringProps {
  userName: string;
  userEmail: string;
  onContextComplete: (context: FunnelContext) => void;
}

const CONVERSATION_QUESTIONS = [
  "What do you do? How would you describe your work?",
  "Who do you help? Describe your ideal client.",
  "What's the main problem or frustration they come to you with?",
  "What transformation do you help them achieve?",
  "What's your main offer? (e.g., 1:1 coaching, group program, course)",
  "What's your booking link for discovery calls? (optional — you can skip this)"
];

export function FunnelContextGathering({ userName, userEmail, onContextComplete }: FunnelContextGatheringProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'input' | 'extracting' | 'review' | 'conversation'>('input');
  const [pastedContent, setPastedContent] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasPhase2Data, setHasPhase2Data] = useState(false);
  const [phase2Content, setPhase2Content] = useState<string | null>(null);
  
  // Conversation fallback state
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conversationInput, setConversationInput] = useState('');
  const [conversationAnswers, setConversationAnswers] = useState<string[]>([]);
  const [isProcessingConversation, setIsProcessingConversation] = useState(false);

  // Check for Phase 2 data on mount
  useEffect(() => {
    const checkPhase2Data = async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('knowledge_base_content')
        .eq('user_email', userEmail)
        .maybeSingle();

      if (data?.knowledge_base_content) {
        setHasPhase2Data(true);
        setPhase2Content(data.knowledge_base_content);
      }
    };

    checkPhase2Data();
  }, [userEmail]);

  const handleUsePhase2Data = async () => {
    if (phase2Content) {
      setPastedContent(phase2Content);
      await handleExtract(phase2Content, 'phase2');
    }
  };

  const handleExtract = async (content: string, source: 'paste' | 'phase2' = 'paste') => {
    if (!content.trim()) return;
    
    setIsExtracting(true);
    setStep('extracting');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-funnel-context`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Check if extraction found meaningful content
      const extracted = data.extracted || {};
      const hasContent = extracted.ideal_client || extracted.main_problem || extracted.transformation || extracted.coaching_type;

      if (!hasContent) {
        // Not enough content found, prompt user
        toast({
          title: "Couldn't find enough information",
          description: "Let me ask you a few questions instead.",
        });
        startConversation();
        return;
      }

      setExtractedData({
        ...extracted,
        coach_name: extracted.coach_name || userName
      });
      setStep('review');

    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Extraction failed",
        description: "Let me ask you a few questions instead.",
        variant: "destructive"
      });
      startConversation();
    } finally {
      setIsExtracting(false);
    }
  };

  const startConversation = () => {
    setStep('conversation');
    setConversationMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `No problem! Let me ask a few quick questions so I can write great copy for your funnel. This will take about 5 minutes.\n\n${CONVERSATION_QUESTIONS[0]}`
    }]);
    setCurrentQuestionIndex(0);
  };

  const handleConversationSubmit = () => {
    if (!conversationInput.trim()) return;

    const userAnswer = conversationInput.trim();
    const newAnswers = [...conversationAnswers, userAnswer];
    setConversationAnswers(newAnswers);

    // Add user message
    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userAnswer
    };
    setConversationMessages(prev => [...prev, userMessage]);
    setConversationInput('');

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < CONVERSATION_QUESTIONS.length) {
      // Ask next question
      setCurrentQuestionIndex(nextIndex);
      setTimeout(() => {
        const isOptional = nextIndex === CONVERSATION_QUESTIONS.length - 1;
        setConversationMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: isOptional 
            ? `Great! Last question (optional): ${CONVERSATION_QUESTIONS[nextIndex]}`
            : CONVERSATION_QUESTIONS[nextIndex]
        }]);
      }, 500);
    } else {
      // All questions answered, build context
      setIsProcessingConversation(true);
      setTimeout(() => {
        const extractedFromConversation: ExtractedData = {
          coach_name: userName,
          coaching_type: newAnswers[0] || undefined,
          ideal_client: newAnswers[1] || undefined,
          main_problem: newAnswers[2] || undefined,
          transformation: newAnswers[3] || undefined,
          main_offer: newAnswers[4] || undefined,
          booking_url: newAnswers[5] || undefined,
        };

        // Show summary
        setConversationMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Perfect! Here's what I've got:\n\n**You help:** ${extractedFromConversation.ideal_client || 'Not specified'}\n**Go from:** ${extractedFromConversation.main_problem || 'Not specified'}\n**To:** ${extractedFromConversation.transformation || 'Not specified'}\n**Through:** ${extractedFromConversation.main_offer || 'Not specified'}\n\nReady to build your funnel?`
        }]);

        setExtractedData(extractedFromConversation);
        setIsProcessingConversation(false);
      }, 1000);
    }
  };

  const handleConversationComplete = () => {
    if (!extractedData) return;
    
    const context: FunnelContext = {
      ...extractedData,
      raw_content: conversationAnswers.join('\n\n'),
      source: 'conversation'
    };
    onContextComplete(context);
  };

  const handleReviewConfirm = () => {
    if (!extractedData) return;
    
    const context: FunnelContext = {
      ...extractedData,
      raw_content: pastedContent,
      source: hasPhase2Data && phase2Content === pastedContent ? 'phase2' : 'paste'
    };
    onContextComplete(context);
  };

  const handleClarify = () => {
    // Start conversation with what we have, ask for missing pieces
    startConversation();
  };

  // Render based on current step
  if (step === 'extracting') {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-auto" />
            <div>
              <h1 className="font-medium text-foreground">Mini-Funnel Builder</h1>
              <p className="text-xs text-muted-foreground">Building with {userName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </header>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            <div>
              <p className="text-lg font-medium">Analyzing your content...</p>
              <p className="text-sm text-muted-foreground">This will only take a moment</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-auto" />
            <div>
              <h1 className="font-medium text-foreground">Mini-Funnel Builder</h1>
              <p className="text-xs text-muted-foreground">Building with {userName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </header>

        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Got it! Here's what I understand about your business:</h2>
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground font-medium min-w-[140px]">You are:</span>
                    <span className="text-foreground">{extractedData?.coach_name || userName} — {extractedData?.coaching_type || 'a coach/practitioner'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground font-medium min-w-[140px]">You help:</span>
                    <span className="text-foreground">{extractedData?.ideal_client || 'Not identified'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground font-medium min-w-[140px]">Main problem:</span>
                    <span className="text-foreground">{extractedData?.main_problem || 'Not identified'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground font-medium min-w-[140px]">Transformation:</span>
                    <span className="text-foreground">{extractedData?.transformation || 'Not identified'}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground font-medium min-w-[140px]">Your main offer:</span>
                    <span className="text-foreground">{extractedData?.main_offer || 'Not identified'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-muted-foreground mb-6">Does this sound right?</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleReviewConfirm} className="gap-2">
                Yes, Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleClarify} className="gap-2">
                <Edit3 className="h-4 w-4" />
                Let Me Clarify
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (step === 'conversation') {
    const isComplete = currentQuestionIndex >= CONVERSATION_QUESTIONS.length - 1 && conversationAnswers.length >= CONVERSATION_QUESTIONS.length;
    
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-auto" />
            <div>
              <h1 className="font-medium text-foreground">Mini-Funnel Builder</h1>
              <p className="text-xs text-muted-foreground">Building with {userName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </header>

        <ScrollArea className="flex-1 px-4">
          <div className="max-w-3xl mx-auto py-6 space-y-4">
            {conversationMessages.map(message => (
              <div key={message.id} className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src={botIcon} alt="" className="w-8 h-8 object-cover" />
                  </div>
                )}
                <div className={cn(
                  'rounded-2xl px-4 py-3 max-w-[85%]',
                  message.role === 'user' 
                    ? 'bg-[#827666] text-white' 
                    : 'bg-muted text-foreground'
                )}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isProcessingConversation && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src={botIcon} alt="" className="w-8 h-8 object-cover" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border/50 p-4">
          <div className="max-w-3xl mx-auto">
            {isComplete ? (
              <Button onClick={handleConversationComplete} className="w-full gap-2">
                Let's Build
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="relative">
                <Textarea
                  value={conversationInput}
                  onChange={(e) => setConversationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleConversationSubmit();
                    }
                  }}
                  placeholder="Type your answer..."
                  className="min-h-[52px] max-h-32 pr-14 resize-none"
                  disabled={isProcessingConversation}
                />
                <Button
                  onClick={handleConversationSubmit}
                  disabled={!conversationInput.trim() || isProcessingConversation}
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8 bg-[#827666] hover:bg-[#6b625a]"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: Input step
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
          <div>
            <h1 className="font-medium text-foreground">Let's Build Your Funnel</h1>
            <p className="text-xs text-muted-foreground">First, share some context about your business</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto py-8 px-4">
          {/* Motivational Stat Banner */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-[#827666] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{PHASE_INTRO_STATS.phase3.stat}</p>
              <p className="text-sm text-muted-foreground">{PHASE_INTRO_STATS.phase3.message}</p>
            </div>
          </div>

          {hasPhase2Data && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground mb-2">
                      I see you've already trained your AI assistant. Want me to use that info?
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUsePhase2Data}>
                        Yes, Use My AI Training
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setHasPhase2Data(false)}>
                        No, I'll Paste Something Else
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4 mb-6">
            <p className="text-muted-foreground">
              The more I know about your business, the better copy I can write for your funnel.
            </p>
            <div className="space-y-2">
              <p className="font-medium text-foreground">Paste any content you have:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-1">
                <li>Your AI training output (from Phase 2)</li>
                <li>Text from your website (About page, Services)</li>
                <li>A bio or description of what you do</li>
                <li>Notes about who you help and what you offer</li>
              </ul>
              <p className="text-sm text-muted-foreground italic">The more detail, the better.</p>
            </div>
          </div>

          <Textarea
            value={pastedContent}
            onChange={(e) => setPastedContent(e.target.value)}
            placeholder="Paste your content here..."
            className="min-h-[200px] resize-none mb-4"
          />

          <p className="text-sm text-muted-foreground mb-4">
            Don't have anything written? No problem.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleExtract(pastedContent)}
              disabled={!pastedContent.trim() || isExtracting}
              className="gap-2"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Continue with This Content
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={startConversation}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              I'll Answer Some Questions Instead
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
