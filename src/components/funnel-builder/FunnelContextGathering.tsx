import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ArrowRight, MessageSquare, CheckCircle2, Edit3, Home, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractFunnelContext } from '@/lib/location-api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { getPhase2Data } from '@/lib/phase-data';
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

export function FunnelContextGathering({ userName, onContextComplete }: FunnelContextGatheringProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { account } = useAccount();
  
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

  const locationId = account?.location_id || '';

  // Check for Phase 2 data on mount
  useEffect(() => {
    const checkPhase2Data = async () => {
      if (!locationId) return;
      
      const phase2Data = await getPhase2Data(locationId);
      // Check if Phase 2 has content outputs we can use
      if (phase2Data?.content_outputs) {
        const outputs = phase2Data.content_outputs;
        // Build a content string from Phase 2 outputs for extraction
        const phase2Summary = [
          outputs.coaching_type && `What I do: ${outputs.coaching_type}`,
          outputs.ideal_client && `Who I help: ${outputs.ideal_client}`,
          outputs.main_problem && `Main problem: ${outputs.main_problem}`,
          outputs.lead_magnet && `Lead magnet: ${outputs.lead_magnet}`,
        ].filter(Boolean).join('\n\n');
        
        if (phase2Summary) {
          setHasPhase2Data(true);
          setPhase2Content(phase2Summary);
        }
      }
    };

    checkPhase2Data();
  }, [locationId]);

  const handleUsePhase2Data = async () => {
    if (phase2Content) {
      setPastedContent(phase2Content);
      await handleExtract(phase2Content, 'phase2');
    }
  };

  const handleExtract = async (content: string, source: 'paste' | 'phase2' = 'paste') => {
    if (!content.trim() || !locationId) return;
    
    setIsExtracting(true);
    setStep('extracting');

    try {
      const data = await extractFunnelContext(locationId, content);

      if (data.error) {
        throw new Error(data.error);
      }

      // Check if extraction found meaningful content
      const extracted = (data.extracted || {}) as ExtractedData;
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
          {/* Motivational stat */}
          <div className="mb-8 p-4 bg-muted/50 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                {PHASE_INTRO_STATS.phase3.stat}
              </p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Let's Get Started</h2>
            <p className="text-muted-foreground">
              First, I need to learn about your business so I can write copy that sounds like you.
            </p>
          </div>

          {/* Option 1: Paste content */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Option 1: Paste Your Content</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Paste text from your website, bio, or any existing marketing materials. I'll extract the key information.
              </p>
              <Textarea
                placeholder="Paste your website content, bio, or marketing copy here..."
                className="min-h-[150px] mb-4"
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
              />
              <Button 
                onClick={() => handleExtract(pastedContent)} 
                disabled={!pastedContent.trim() || isExtracting || !locationId}
                className="w-full"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Extract Information
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Phase 2 data option */}
          {hasPhase2Data && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">Use Your AI Training Data</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  I found the content from your Phase 2 AI training. Want to use that instead?
                </p>
                <Button 
                  onClick={handleUsePhase2Data}
                  variant="outline"
                  className="w-full"
                  disabled={!locationId}
                >
                  Use My Existing Data
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Option 2: Answer questions */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-2">Option 2: Answer a Few Questions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Don't have content to paste? No problem! I'll ask you 6 quick questions instead (~5 minutes).
              </p>
              <Button 
                variant="outline" 
                onClick={startConversation}
                className="w-full gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Start Questions
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
