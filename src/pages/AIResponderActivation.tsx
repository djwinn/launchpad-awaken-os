import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Copy, Check, ChevronRight, ChevronDown, ExternalLink, Database, Bot, Settings, MessageSquare, Instagram, Facebook, Globe, MessageCircle, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MarkdownContent } from '@/components/MarkdownContent';

const STEPS = [
  { id: 1, title: 'Create Knowledge Base', icon: Database },
  { id: 2, title: 'Add Your Content', icon: Copy },
  { id: 3, title: 'Create Your Bot', icon: Bot },
  { id: 4, title: 'Configure Bot Settings', icon: Settings },
  { id: 5, title: 'Connect Channels', icon: MessageSquare },
];

const CHANNELS = [
  { id: 'instagram', label: 'Instagram DM', description: 'Respond to Instagram direct messages automatically', icon: Instagram },
  { id: 'facebook', label: 'Facebook Messenger', description: 'Respond to Facebook page messages automatically', icon: Facebook },
  { id: 'website', label: 'Website Chat', description: 'Add a chat widget to your website', icon: Globe },
  { id: 'whatsapp', label: 'WhatsApp', description: 'Respond to WhatsApp messages automatically', icon: MessageCircle },
  { id: 'sms', label: 'SMS', description: 'Respond to text messages automatically', icon: Smartphone },
];

const AIResponderActivation = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [botInstructions, setBotInstructions] = useState('');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [copiedKB, setCopiedKB] = useState(false);
  const [copiedBI, setCopiedBI] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return;

      const { data } = await supabase
        .from('user_progress')
        .select('knowledge_base_content, bot_instructions, location_id, ai_foundation_complete')
        .eq('user_email', user.email)
        .maybeSingle();

      if (!data?.ai_foundation_complete || !data?.knowledge_base_content || !data?.bot_instructions) {
        toast({
          title: 'Complete AI Foundation First',
          description: 'Please complete "Build Your AI Foundation" before activating.',
          variant: 'destructive',
        });
        navigate('/ai-training');
        return;
      }

      setKnowledgeBase(data.knowledge_base_content);
      setBotInstructions(data.bot_instructions);
      setLocationId(data.location_id);
      setIsLoading(false);
    };

    if (user && !loading) {
      loadData();
    }
  }, [user, loading, navigate, toast]);

  const getAwakenLink = (path: string) => {
    if (locationId) {
      return `https://app.awaken.digital/v2/location/${locationId}${path}`;
    }
    return 'https://app.awaken.digital';
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

  const handleStepComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinalComplete();
    }
  };

  const handleFinalComplete = async () => {
    if (selectedChannels.length === 0) {
      toast({
        title: 'Connect a Channel',
        description: 'Please connect at least one channel to complete setup.',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.email) return;

    await supabase
      .from('user_progress')
      .update({ ai_responder_active: true })
      .eq('user_email', user.email);

    setShowCompletionModal(true);
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(c => c !== channelId)
        : [...prev, channelId]
    );
    setExpandedChannel(channelId);
  };

  if (loading || isLoading) {
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
      {/* Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Your AI Assistant is Live! 🎉</DialogTitle>
            <DialogDescription className="pt-2">
              Your AI is now responding to inquiries 24/7 on your connected channels.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">What's Now Active:</p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-[#1fb14c]" />
                  Knowledge Base with your business info
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-[#1fb14c]" />
                  AI bot trained on your style
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-[#1fb14c]" />
                  Connected to {selectedChannels.map(c => CHANNELS.find(ch => ch.id === c)?.label).join(', ')}
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-[#1fb14c]" />
                  Auto-pilot mode enabled
                </li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                When someone messages you, your AI will answer questions about your coaching, 
                explain how you work, share pricing, and offer to book discovery calls.
                You'll see all conversations in your AwakenOS inbox.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => navigate('/ai-training')} className="bg-[#827666] hover:bg-[#6b5a4a]">
              Continue Setup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <h1 className="text-lg font-semibold text-foreground">Activate Your AI Responder</h1>
                <p className="text-xs text-muted-foreground">Let's bring your AI to life — about 10 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Stepper */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const StepIcon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors min-w-max',
                      isCurrent && 'bg-[#827666]/10 text-[#827666]',
                      isCompleted && !isCurrent && 'text-[#1fb14c]',
                      !isCurrent && !isCompleted && 'text-muted-foreground'
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                      isCurrent && 'bg-[#827666] text-white',
                      isCompleted && !isCurrent && 'bg-[#1fb14c] text-white',
                      !isCurrent && !isCompleted && 'bg-muted text-muted-foreground'
                    )}>
                      {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Step 1 */}
            {currentStep === 1 && (
              <StepContent
                title="Step 1: Create Your Knowledge Base"
                videoPlaceholder="Watch: Creating a Knowledge Base in AwakenOS"
              >
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Click the button below to open AwakenOS</li>
                  <li>In the left menu, click <strong className="text-foreground">AI Agents</strong></li>
                  <li>Click the <strong className="text-foreground">Knowledge Base</strong> tab</li>
                  <li>Click <strong className="text-foreground">+ Create Knowledge Base</strong></li>
                  <li>Name it something like "[Your Name] Coaching Knowledge Base"</li>
                  <li>Click <strong className="text-foreground">Create</strong></li>
                  <li>Come back here and click "I've Done This"</li>
                </ol>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => window.open(getAwakenLink('/settings/ai-agents'), '_blank')}
                >
                  Open AI Agents
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>

                <p className="text-xs text-muted-foreground mt-3 italic">
                  Don't close this tab — you'll need to copy content in the next step.
                </p>

                <Button 
                  onClick={handleStepComplete}
                  className="w-full mt-4 bg-[#827666] hover:bg-[#6b5a4a]"
                >
                  I've Done This ✓
                </Button>
              </StepContent>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <StepContent
                title="Step 2: Add Your Knowledge Base Content"
                videoPlaceholder="Watch: Adding content to your Knowledge Base"
              >
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>In your Knowledge Base, click <strong className="text-foreground">+ Add Source</strong></li>
                  <li>Select <strong className="text-foreground">Rich Text</strong></li>
                  <li>Copy your Knowledge Base content from the panel on the right →</li>
                  <li>Paste it into the Rich Text editor</li>
                  <li>Click <strong className="text-foreground">Save</strong></li>
                  <li>Come back here and click "I've Done This"</li>
                </ol>

                {/* Inline Copy Panel for Mobile */}
                <div className="lg:hidden mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Your Knowledge Base Content</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopy(knowledgeBase, 'kb')}
                    >
                      {copiedKB ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground bg-background rounded p-2">
                    <MarkdownContent content={knowledgeBase.slice(0, 500) + '...'} />
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-4">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>Tip:</strong> Make sure to paste into Rich Text, not URL or FAQ. Rich Text keeps your formatting intact.
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => window.open(getAwakenLink('/settings/ai-agents'), '_blank')}
                >
                  Open Knowledge Base
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>

                <Button 
                  onClick={handleStepComplete}
                  className="w-full mt-4 bg-[#827666] hover:bg-[#6b5a4a]"
                >
                  I've Done This ✓
                </Button>
              </StepContent>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <StepContent
                title="Step 3: Create Your AI Bot"
                videoPlaceholder="Watch: Creating your Conversation AI bot"
              >
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Click the button below to open Conversation AI</li>
                  <li>Click the <strong className="text-foreground">Agent List</strong> tab (if not already there)</li>
                  <li>Click <strong className="text-foreground">+ Create Bot</strong></li>
                  <li>Select the <strong className="text-foreground">Appointment Booking</strong> template</li>
                  <li>Name your bot (e.g., "[Your Name] Assistant")</li>
                  <li>Click <strong className="text-foreground">Create</strong></li>
                  <li>Come back here and click "I've Done This"</li>
                </ol>

                <p className="text-xs text-muted-foreground mt-3 italic">
                  The template gives you a starting point — we'll customize it with your content in the next step.
                </p>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => window.open(getAwakenLink('/settings/conversation-ai'), '_blank')}
                >
                  Open Conversation AI
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>

                <Button 
                  onClick={handleStepComplete}
                  className="w-full mt-4 bg-[#827666] hover:bg-[#6b5a4a]"
                >
                  I've Done This ✓
                </Button>
              </StepContent>
            )}

            {/* Step 4 */}
            {currentStep === 4 && (
              <StepContent
                title="Step 4: Configure Your Bot's Personality"
                videoPlaceholder="Watch: Setting up Bot Goals and personality"
              >
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Click on your new bot to open its settings</li>
                  <li>Go to the <strong className="text-foreground">Bot Goals</strong> tab</li>
                  <li>For <strong className="text-foreground">Personality</strong>, paste your Bot Instructions from the panel →</li>
                  <li>For <strong className="text-foreground">Knowledge Base</strong>, select the Knowledge Base you created in Step 1</li>
                  <li>Click <strong className="text-foreground">Save</strong></li>
                  <li><strong className="text-foreground">Test your bot</strong> using the chat window on the right</li>
                  <li>Come back here and click "I've Done This"</li>
                </ol>

                {/* Inline Copy Panel for Mobile */}
                <div className="lg:hidden mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Your Bot Instructions</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopy(botInstructions, 'bi')}
                    >
                      {copiedBI ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground bg-background rounded p-2">
                    <MarkdownContent content={botInstructions.slice(0, 500) + '...'} />
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 mt-4">
                  <p className="text-sm font-medium text-foreground mb-2">Testing Tips:</p>
                  <p className="text-xs text-muted-foreground">Try asking your bot:</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground mt-1 space-y-1">
                    <li>"What kind of coaching do you offer?"</li>
                    <li>"How much does it cost?"</li>
                    <li>"How do I book a call?"</li>
                  </ul>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => window.open(getAwakenLink('/settings/conversation-ai'), '_blank')}
                >
                  Open Bot Settings
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>

                <Button 
                  onClick={handleStepComplete}
                  className="w-full mt-4 bg-[#827666] hover:bg-[#6b5a4a]"
                >
                  I've Done This ✓
                </Button>
              </StepContent>
            )}

            {/* Step 5 */}
            {currentStep === 5 && (
              <StepContent
                title="Step 5: Connect Your Channels"
                videoPlaceholder="Watch: Connecting Instagram, Facebook, and Website Chat"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  Last step! Choose where your AI will respond. Connect at least one channel to complete setup.
                  You can always add more channels later.
                </p>

                <div className="space-y-3">
                  {CHANNELS.map((channel) => {
                    const ChannelIcon = channel.icon;
                    const isSelected = selectedChannels.includes(channel.id);
                    const isExpanded = expandedChannel === channel.id;

                    return (
                      <div 
                        key={channel.id}
                        className={cn(
                          'border rounded-lg transition-colors',
                          isSelected ? 'border-[#827666] bg-[#827666]/5' : 'border-border'
                        )}
                      >
                        <div 
                          className="flex items-center gap-3 p-3 cursor-pointer"
                          onClick={() => toggleChannel(channel.id)}
                        >
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleChannel(channel.id)}
                          />
                          <ChannelIcon className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{channel.label}</p>
                            <p className="text-xs text-muted-foreground">{channel.description}</p>
                          </div>
                          <ChevronDown className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            isExpanded && 'rotate-180'
                          )} />
                        </div>

                        {isExpanded && (
                          <div className="px-3 pb-3 pt-0 border-t border-border/50">
                            <ChannelInstructions channelId={channel.id} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => window.open(getAwakenLink('/settings/conversation-ai'), '_blank')}
                >
                  Open Bot Channels
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>

                <p className="text-xs text-muted-foreground mt-3 italic">
                  Once you've connected at least one channel, set your bot to <strong>Auto-Pilot</strong> mode so it responds automatically.
                </p>

                <Button 
                  onClick={handleFinalComplete}
                  disabled={selectedChannels.length === 0}
                  className="w-full mt-4 bg-[#827666] hover:bg-[#6b5a4a] disabled:opacity-50"
                >
                  I've Connected a Channel & Set to Auto-Pilot ✓
                </Button>
              </StepContent>
            )}
          </div>
        </div>

        {/* Sidebar - Quick Copy Panel (Desktop) */}
        <div className={cn(
          'hidden lg:flex flex-col border-l border-border bg-card/50 transition-all duration-300',
          sidebarOpen ? 'w-80' : 'w-0'
        )}>
          {sidebarOpen && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Quick Copy</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Tabs defaultValue="knowledge-base" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="knowledge-base" className="text-xs">Knowledge Base</TabsTrigger>
                  <TabsTrigger value="bot-instructions" className="text-xs">Bot Instructions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="knowledge-base" className="flex-1 flex flex-col overflow-hidden m-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mb-3"
                    onClick={() => handleCopy(knowledgeBase, 'kb')}
                  >
                    {copiedKB ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copiedKB ? 'Copied!' : 'Copy All'}
                  </Button>
                  <div className="flex-1 overflow-y-auto bg-muted/30 rounded-lg p-3">
                    <MarkdownContent content={knowledgeBase} className="text-xs" />
                  </div>
                </TabsContent>
                
                <TabsContent value="bot-instructions" className="flex-1 flex flex-col overflow-hidden m-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mb-3"
                    onClick={() => handleCopy(botInstructions, 'bi')}
                  >
                    {copiedBI ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copiedBI ? 'Copied!' : 'Copy All'}
                  </Button>
                  <div className="flex-1 overflow-y-auto bg-muted/30 rounded-lg p-3">
                    <MarkdownContent content={botInstructions} className="text-xs" />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Sidebar Toggle (when collapsed) */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="fixed right-4 top-32 hidden lg:flex"
            onClick={() => setSidebarOpen(true)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Quick Copy
          </Button>
        )}
      </div>
    </div>
  );
};

// Step Content Wrapper
const StepContent = ({ 
  title, 
  videoPlaceholder, 
  children 
}: { 
  title: string; 
  videoPlaceholder: string; 
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    
    {/* Video Placeholder */}
    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-muted-foreground/20 flex items-center justify-center mx-auto mb-2">
          <svg className="w-6 h-6 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">{videoPlaceholder}</p>
      </div>
    </div>

    <div className="bg-card border border-border rounded-lg p-4">
      {children}
    </div>
  </div>
);

// Channel Instructions Component
const ChannelInstructions = ({ channelId }: { channelId: string }) => {
  const instructions: Record<string, React.ReactNode> = {
    instagram: (
      <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground mt-2">
        <li>In your bot settings, go to the <strong className="text-foreground">Channels</strong> tab</li>
        <li>Toggle on <strong className="text-foreground">Instagram</strong></li>
        <li>If not connected, click <strong className="text-foreground">Connect Instagram</strong> and follow the prompts</li>
        <li>Make sure your Instagram is a Business or Creator account</li>
      </ol>
    ),
    facebook: (
      <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground mt-2">
        <li>In your bot settings, go to the <strong className="text-foreground">Channels</strong> tab</li>
        <li>Toggle on <strong className="text-foreground">Facebook Messenger</strong></li>
        <li>If not connected, click <strong className="text-foreground">Connect Facebook</strong> and follow the prompts</li>
        <li>Select which Facebook Page to connect</li>
      </ol>
    ),
    website: (
      <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground mt-2">
        <li>In your bot settings, go to the <strong className="text-foreground">Channels</strong> tab</li>
        <li>Toggle on <strong className="text-foreground">Live Chat</strong></li>
        <li>Go to <strong className="text-foreground">Sites → Chat Widget</strong> to customize the appearance</li>
        <li>Copy the embed code to add to your website</li>
      </ol>
    ),
    whatsapp: (
      <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground mt-2">
        <li>In your bot settings, go to the <strong className="text-foreground">Channels</strong> tab</li>
        <li>Toggle on <strong className="text-foreground">WhatsApp</strong></li>
        <li>If not connected, follow the WhatsApp Business API setup</li>
        <li>Link your WhatsApp Business number</li>
      </ol>
    ),
    sms: (
      <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground mt-2">
        <li>In your bot settings, go to the <strong className="text-foreground">Channels</strong> tab</li>
        <li>Toggle on <strong className="text-foreground">SMS</strong></li>
        <li>Make sure you have a phone number configured in AwakenOS</li>
        <li>Enable auto-reply for incoming messages</li>
      </ol>
    ),
  };

  return instructions[channelId] || null;
};

export default AIResponderActivation;
