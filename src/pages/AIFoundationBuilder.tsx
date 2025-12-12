import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Send, Copy, Check, ChevronRight, ChevronDown, User, Users, Briefcase, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MarkdownContent } from '@/components/MarkdownContent';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

interface CapturedData {
  name?: string;
  coachingType?: string;
  story?: string;
  idealClient?: string;
  mainProblem?: string;
  previousSolutions?: string;
  transformation?: string;
  timeline?: string;
  services?: string;
  format?: string;
  inclusions?: string;
  pricingApproach?: string;
  pricingDetails?: string;
  communicationStyle?: string;
  bookingUrl?: string;
  customRules?: string;
}

const AIFoundationBuilder = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [capturedData, setCapturedData] = useState<CapturedData>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [botInstructions, setBotInstructions] = useState('');
  const [showOutputs, setShowOutputs] = useState(false);
  const [copiedKB, setCopiedKB] = useState(false);
  const [copiedBI, setCopiedBI] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0 && user) {
      const openingMessage = `Hey! I'm going to help you train your AI assistant so it can answer questions and book calls for you 24/7.

This takes about 15-20 minutes. The more specific you are, the better your AI will represent you.

Ready? Let's start with the basics.`;
      setMessages([{ role: 'assistant', content: openingMessage }]);
    }
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input after AI responds
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-foundation-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const data = await response.json();
      const assistantMessage = data.message || '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      
      // Update question counter (rough estimate based on message count)
      const questionCount = Math.min(15, Math.floor(messages.length / 2) + 1);
      setCurrentQuestion(questionCount);

      // Check if generation is complete
      if (assistantMessage.includes('GENERATION_COMPLETE')) {
        await generateOutputs();
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateOutputs = async () => {
    setIsGenerating(true);
    
    // Build conversation history string
    const conversationHistory = messages
      .map(m => `${m.role === 'user' ? 'Coach' : 'Interviewer'}: ${m.content}`)
      .join('\n\n');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-outputs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ conversationHistory }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate outputs');
      }

      const data = await response.json();
      setKnowledgeBase(data.knowledgeBase || '');
      setBotInstructions(data.botInstructions || '');
      setShowOutputs(true);

      // Save to database
      if (user?.email) {
        await supabase
          .from('user_progress')
          .update({
            knowledge_base_content: data.knowledgeBase,
            bot_instructions: data.botInstructions,
            ai_foundation_data: { conversationHistory, generatedAt: new Date().toISOString() },
          })
          .eq('user_email', user.email);
      }

      // Remove the GENERATION_COMPLETE message and add success message
      setMessages(prev => {
        const filtered = prev.filter(m => !m.content.includes('GENERATION_COMPLETE'));
        return [...filtered, {
          role: 'assistant',
          content: `Done! I've created two things for you:

1. **Knowledge Base Content** — The facts about your business your AI will reference
2. **Bot Instructions** — How your AI should behave and communicate

Review them in the tabs below, then copy them to your clipboard when ready.`
        }];
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate outputs',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (content: string, type: 'kb' | 'bi') => {
    await navigator.clipboard.writeText(content);
    if (type === 'kb') {
      setCopiedKB(true);
      setTimeout(() => setCopiedKB(false), 2000);
    } else {
      setCopiedBI(true);
      setTimeout(() => setCopiedBI(false), 2000);
    }
    toast({
      title: 'Copied!',
      description: `${type === 'kb' ? 'Knowledge Base' : 'Bot Instructions'} copied to clipboard.`,
    });
  };

  const handleComplete = async () => {
    if (!user?.email) return;

    await supabase
      .from('user_progress')
      .update({ ai_foundation_complete: true })
      .eq('user_email', user.email);

    toast({
      title: 'AI Foundation Complete!',
      description: 'Moving to activation step...',
    });

    navigate('/ai-training');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/ai-training')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Train Your AI Assistant</h1>
                <p className="text-xs text-muted-foreground">
                  Question {Math.min(currentQuestion + 1, 15)} of 15
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#827666] transition-all duration-300"
                  style={{ width: `${Math.min((currentQuestion / 15) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{Math.round((currentQuestion / 15) * 100)}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-[#827666] text-white'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <MarkdownContent content={message.content} className="text-sm" />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Generating your AI training content...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Output Tabs (shown after generation) */}
          {showOutputs && (
            <div className="border-t border-border p-4 bg-card/50 max-h-[50vh] overflow-y-auto">
              <Tabs defaultValue="knowledge-base" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
                  <TabsTrigger value="bot-instructions">Bot Instructions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="knowledge-base" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Copy this to your AI's knowledge base</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopy(knowledgeBase, 'kb')}
                    >
                      {copiedKB ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copiedKB ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
                    <MarkdownContent content={knowledgeBase} className="text-sm" />
                  </div>
                </TabsContent>
                
                <TabsContent value="bot-instructions" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Copy this to your AI's instructions</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopy(botInstructions, 'bi')}
                    >
                      {copiedBI ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copiedBI ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
                    <MarkdownContent content={botInstructions} className="text-sm" />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
                <Button onClick={handleComplete} className="bg-[#827666] hover:bg-[#6b5a4a]">
                  Continue to Activation
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Input Area */}
          {!showOutputs && (
            <div className="border-t border-border p-4 bg-card/50">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer..."
                  disabled={isLoading || isGenerating}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!inputValue.trim() || isLoading || isGenerating}
                  className="bg-[#827666] hover:bg-[#6b5a4a]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send • Take your time, detailed answers create better AI responses
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - Desktop only */}
        <div className={cn(
          'hidden lg:flex flex-col border-l border-border bg-card/30 transition-all duration-300',
          sidebarOpen ? 'w-72' : 'w-0'
        )}>
          {sidebarOpen && (
            <div className="p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Your AI Profile</h3>
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <ProfileSection 
                  icon={User} 
                  title="About You" 
                  items={[
                    { label: 'Name', value: capturedData.name },
                    { label: 'What you do', value: capturedData.coachingType },
                  ]}
                />
                <ProfileSection 
                  icon={Users} 
                  title="Your Clients" 
                  items={[
                    { label: 'Ideal client', value: capturedData.idealClient },
                    { label: 'Main problem', value: capturedData.mainProblem },
                  ]}
                />
                <ProfileSection 
                  icon={Briefcase} 
                  title="Your Services" 
                  items={[
                    { label: 'Services', value: capturedData.services },
                    { label: 'Pricing', value: capturedData.pricingApproach },
                  ]}
                />
                <ProfileSection 
                  icon={MessageSquare} 
                  title="Style" 
                  items={[
                    { label: 'Communication', value: capturedData.communicationStyle },
                  ]}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                This profile updates as you answer questions
              </p>
            </div>
          )}
        </div>
        
        {/* Sidebar toggle when closed */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-20 hidden lg:flex"
            onClick={() => setSidebarOpen(true)}
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
            Profile
          </Button>
        )}
      </div>
    </div>
  );
};

// Helper component for profile sections
const ProfileSection = ({ 
  icon: Icon, 
  title, 
  items 
}: { 
  icon: typeof User; 
  title: string; 
  items: { label: string; value?: string }[];
}) => {
  const hasData = items.some(item => item.value);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-[#827666]" />
        {title}
      </div>
      <div className="space-y-1 pl-6">
        {items.map((item, i) => (
          <div key={i} className="text-xs">
            <span className="text-muted-foreground">{item.label}: </span>
            <span className={item.value ? 'text-foreground' : 'text-muted-foreground/50'}>
              {item.value || 'Not captured yet'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIFoundationBuilder;
