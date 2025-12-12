import { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { User, Calendar, Link2, FileText, CreditCard, ExternalLink, Play, ChevronDown, Check, Copy, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MarkdownContent } from '@/components/MarkdownContent';

interface SetupItemModalProps {
  itemId: string | null;
  isComplete: boolean;
  onClose: () => void;
  onComplete: (itemId: string) => void;
  locationId?: string | null;
}

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

interface ItemConfig {
  title: string;
  description: string;
  icon: typeof User;
  time: string;
  videoCaption: string;
  instructions: string[];
  troubleshooting?: string[];
  note?: string;
  completionMessage: string;
  hasAiChat?: boolean;
  aiOpeningMessage?: string;
  hasContractOutput?: boolean;
  awakenPath: string;
}

const AWAKEN_BASE_URL = 'https://app.awaken.digital/v2/location';
const AWAKEN_HOME = 'https://app.awaken.digital';

const itemConfigs: Record<string, ItemConfig> = {
  profile_complete: {
    title: 'Complete Your Profile',
    description: 'Set up your business identity in AwakenOS so everything you create carries your brand.',
    icon: User,
    time: '~2 min',
    videoCaption: 'Watch: Setting up your profile in AwakenOS',
    instructions: [
      'Click the button below to open AwakenOS',
      'Go to Settings → Business Profile',
      'Enter your business name (sole traders: just use your name, e.g., "Sarah Smith Coaching")',
      'Add your email and phone number',
      'Upload your logo (optional but recommended)',
      'Click Save in AwakenOS',
      'Come back here and click "I\'ve Completed This"',
    ],
    completionMessage: 'Your brand is set up! Everything you create will now carry your name.',
    awakenPath: '/settings/company',
  },
  calendar_connected: {
    title: 'Connect Your Calendar',
    description: 'Sync your calendar so clients can only book when you\'re actually available.',
    icon: Calendar,
    time: '~2 min',
    videoCaption: 'Watch: Connecting your calendar in AwakenOS',
    instructions: [
      'Click the button below to open AwakenOS',
      'Go to Settings → Calendars → Connections',
      'Click "Connect" next to Google Calendar, Outlook, or iCloud',
      'Sign in and grant permission',
      'You should see "Connected" status appear',
      'Come back here and click "I\'ve Completed This"',
    ],
    troubleshooting: [
      'Multiple Google accounts? Try an incognito window and sign into just the one you want to connect',
      'Make sure you\'re granting calendar permissions, not just signing in',
    ],
    completionMessage: 'Calendar connected! Your availability syncs automatically — no more double-bookings.',
    awakenPath: '/settings/calendars/connections',
  },
  booking_page_created: {
    title: 'Create Your Booking Page',
    description: 'Set up a professional booking page so clients can schedule calls with you.',
    icon: Link2,
    time: '~5 min',
    videoCaption: 'Watch: Creating your booking page in AwakenOS',
    instructions: [
      'Click the button below to open AwakenOS',
      'Click "Create Calendar"',
      'Choose a name (e.g., "Discovery Call" or "Free Consultation")',
      'Set duration (30 minutes works well for most coaches)',
      'Choose meeting type (Zoom, Google Meet, or Phone)',
      'Set your available hours',
      'Save and copy your booking link',
      'Come back here and click "I\'ve Completed This"',
    ],
    note: 'Most coaches start with a 30-minute Discovery Call on Zoom — but choose whatever fits your style.',
    completionMessage: 'Your booking page is live! You now have a professional link to share with potential clients.',
    awakenPath: '/settings/calendars',
  },
  contract_prepared: {
    title: 'Prepare Your Contract',
    description: 'Have a professional agreement ready to send when clients are ready to work with you.',
    icon: FileText,
    time: '~4 min',
    videoCaption: 'Watch: Setting up contracts in AwakenOS',
    instructions: [
      'Answer the questions in the AI chat below (about 7 quick questions)',
      'Review the generated contract and make any edits',
      'Click "Copy Contract" to copy the text',
      'Click the button to open AwakenOS',
      'Go to Payments → Documents & Contracts → Templates',
      'Create a new template and paste your contract',
      'Save the template',
      'Come back here and confirm completion',
    ],
    completionMessage: 'Contract template ready! You can now send professional agreements to clients with one click.',
    hasAiChat: true,
    hasContractOutput: true,
    aiOpeningMessage: "Let's create your coaching agreement. I'll ask a few questions, then generate a professional contract you can paste into AwakenOS. This takes about 3-4 minutes.\n\nFirst question: What type of coaching do you offer? (e.g., life coaching, health coaching, business coaching, relationship coaching)",
    awakenPath: '/payments/proposals-estimates',
  },
  payments_connected: {
    title: 'Set Up Payments',
    description: 'Connect your payment processor so you can get paid seamlessly.',
    icon: CreditCard,
    time: '~3 min',
    videoCaption: 'Watch: Connecting Stripe in AwakenOS',
    instructions: [
      'Click the button below to open AwakenOS',
      'Go to Payments → Integrations',
      'Click "Connect with Stripe"',
      'Create a Stripe account (free) or sign in to existing',
      'Grant permissions',
      'You should see "Connected" status',
      'Come back here and click "I\'ve Completed This"',
    ],
    note: "Don't have Stripe yet? You'll create a free account during the connection process.",
    completionMessage: 'Payments connected! You can now invoice clients and get paid directly.',
    awakenPath: '/payments/integrations',
  },
};

export function SetupItemModal({ itemId, isComplete, onClose, onComplete, locationId }: SetupItemModalProps) {
  const { toast } = useToast();
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [troubleshootingOpen, setTroubleshootingOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Contract state
  const [contractText, setContractText] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Initialize chat when panel opens
  useEffect(() => {
    if (itemId && itemConfigs[itemId]?.hasAiChat && chatMessages.length === 0) {
      const config = itemConfigs[itemId];
      if (config.aiOpeningMessage) {
        setChatMessages([{ role: 'assistant', content: config.aiOpeningMessage }]);
      }
    }
  }, [itemId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Reset state when modal closes
  useEffect(() => {
    if (!itemId) {
      setChatMessages([]);
      setChatInput('');
      setContractText('');
      setDisclaimerAccepted(false);
    }
  }, [itemId]);

  if (!itemId) return null;

  const config = itemConfigs[itemId];
  if (!config) return null;

  const Icon = config.icon;

  const handleOpenAwaken = () => {
    const url = locationId 
      ? `${AWAKEN_BASE_URL}/${locationId}${config.awakenPath}`
      : AWAKEN_HOME;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    setShowSuccess(true);
    
    setTimeout(() => {
      onComplete(itemId);
      setShowSuccess(false);
      setIsCompleting(false);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const systemPrompt = itemId === 'booking_page_created' 
        ? `You are a helpful assistant guiding a coach through setting up their booking page in AwakenOS. Be warm, direct, and keep responses under 60 words. Guide them through:
1. What to name their booking page (suggest "Discovery Call" or "Free Consultation")
2. How long sessions should be (suggest 30 minutes)
3. Meeting type (Zoom, Google Meet, or phone)
After gathering these, summarize their choices and tell them they're ready to create it in AwakenOS.`
        : `You are a warm, helpful assistant creating a professional coaching agreement. Ask ONE question at a time, be concise (under 50 words per response). Follow this flow:

QUESTIONS TO ASK (one at a time):
1. What type of coaching do you offer? (already asked in opening)
2. What's your typical package structure? (e.g., "6 sessions over 3 months", "Weekly sessions for 8 weeks", "Monthly retainer")
3. How long are your sessions and how are they delivered? (e.g., "60-minute Zoom calls")
4. What's your cancellation/rescheduling policy? (Most coaches require 24-48 hours notice)
5. What's your refund policy? (Options: no refunds once begun, pro-rated for unused, full refund within 7 days)
6. Where is your business based? (Country and state/province for governing law)
7. Anything else to include? (confidentiality, recording permissions, materials provided — or "that's everything")

After ALL questions answered, generate the contract with this EXACT format and say "Here's your contract text:":

## COACHING AGREEMENT

**Between:** [Coach - use placeholder]
**And:** [Client Name - placeholder]
**Effective Date:** [Date - placeholder]

### 1. SERVICES
[Coach] agrees to provide [coaching type] coaching services consisting of [package structure and session details].

### 2. INVESTMENT & PAYMENT
Investment: $____ (placeholder for them to fill)
Payment is due [based on their structure].

### 3. SCHEDULING & CANCELLATION
Sessions are scheduled by mutual agreement. Client must provide at least [their policy] notice to cancel or reschedule. Late cancellations or no-shows [consequence from their policy].

### 4. REFUND POLICY
[Their refund terms]

### 5. CONFIDENTIALITY
Both parties agree to keep all information shared during coaching sessions confidential, except as required by law or where there is risk of harm to self or others.

### 6. WHAT COACHING IS AND ISN'T
Coaching is a collaborative process focused on personal and/or professional development. The Coach is not acting as a therapist, counsellor, medical professional, or legal/financial advisor. Coaching does not replace professional mental health treatment, medical care, or legal/financial advice.

The Client is responsible for their own decisions and actions. Results are not guaranteed and depend on the Client's commitment and effort.

### 7. INTELLECTUAL PROPERTY
Any materials, worksheets, or resources provided by the Coach remain the intellectual property of the Coach and are for the Client's personal use only.

### 8. TERMINATION
Either party may terminate this agreement with 14 days written notice. [Apply their refund policy]

### 9. LIMITATION OF LIABILITY
The Coach's liability is limited to the fees paid for coaching services. The Coach is not liable for any indirect, consequential, or incidental damages.

### 10. GOVERNING LAW
This agreement shall be governed by the laws of [their location].

### 11. AGREEMENT
By signing below, both parties agree to the terms of this coaching agreement.

**Coach Signature:** ___________________ **Date:** ________
**Client Signature:** ___________________ **Date:** ________

---

After generating, say: "Review it above and make any edits you need. When you're happy with it, click 'Copy Contract' and paste it into AwakenOS."`;

      const response = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          systemPrompt,
          isSetupChat: true,
        }
      });

      if (response.error) throw response.error;
      
      const assistantMessage = response.data?.message || response.data?.choices?.[0]?.message?.content || '';
      setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      
      // Check if contract was generated
      if (itemId === 'contract_prepared' && assistantMessage.toLowerCase().includes("here's your contract")) {
        const contractMatch = assistantMessage.split(/here'?s your contract text:?/i)[1];
        if (contractMatch) {
          setContractText(contractMatch.trim());
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractText);
    toast({
      title: 'Copied!',
      description: 'Contract text copied to clipboard.',
    });
  };

  const canComplete = !config.hasContractOutput || (contractText && disclaimerAccepted);

  return (
    <Sheet open={!!itemId} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-[500px] flex flex-col p-0 gap-0">
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-background/95 z-50 flex flex-col items-center justify-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#1fb14c] flex items-center justify-center mb-4 animate-scale-in">
              <Check className="w-8 h-8 text-white" />
            </div>
            <p className="text-lg font-semibold text-foreground text-center px-6">{config.completionMessage}</p>
          </div>
        )}

        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#827666]/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#827666]" />
              </div>
              <SheetTitle className="text-lg text-left">{config.title}</SheetTitle>
            </div>
            <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
              {config.time}
            </span>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Video Placeholder */}
          <div className="px-6 py-4 border-b border-border">
            <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-background/80 flex items-center justify-center mb-3">
                <Play className="w-6 h-6 text-muted-foreground ml-1" />
              </div>
              <span className="text-sm text-muted-foreground">Video coming soon</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {config.videoCaption}
            </p>
          </div>

          {/* Collapsible Instructions */}
          <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen} className="border-b border-border">
            <CollapsibleTrigger className="w-full px-6 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium text-foreground">Step-by-step instructions</span>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                instructionsOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-4">
                <ol className="space-y-2">
                  {config.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-medium">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* AI Chat Section (for item 4 - contract) */}
          {config.hasAiChat && (
            <div className="border-b border-border">
              <div className="px-6 py-3 bg-muted/30">
                <span className="text-sm font-medium text-foreground">Chat with AI Assistant</span>
              </div>
              
              {/* Chat Messages */}
              <div className="h-[250px] overflow-y-auto px-6 py-4 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2',
                      msg.role === 'assistant' 
                        ? 'bg-muted text-foreground' 
                        : 'bg-[#827666] text-white ml-auto'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownContent content={msg.content} className="text-sm" />
                    ) : (
                      <span className="text-sm">{msg.content}</span>
                    )}
                  </div>
                ))}
                {isChatLoading && (
                  <div className="bg-muted rounded-lg px-3 py-2 max-w-[85%]">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="px-6 pb-4">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your response..."
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={isChatLoading}
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSendMessage} 
                    disabled={!chatInput.trim() || isChatLoading}
                    className="bg-[#827666] hover:bg-[#6b5a4a]"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  This AI generates a template contract for guidance only — it is not legal advice. We recommend having an attorney review any contract before use.
                </p>
              </div>
            </div>
          )}

          {/* Contract Output (for item 4) */}
          {config.hasContractOutput && contractText && (
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Your Coaching Agreement</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyContract}
                  disabled={!disclaimerAccepted}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Contract
                </Button>
              </div>
              <div className="bg-muted rounded-lg p-4 max-h-[250px] overflow-y-auto">
                <MarkdownContent content={contractText} className="text-xs" />
              </div>
              
              {/* Legal Disclaimer */}
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200 mb-3">
                  This is a template to help you get started — it's not legal advice. We recommend having a lawyer review your contract before using it with clients, especially for your specific jurisdiction.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={disclaimerAccepted} 
                    onCheckedChange={(checked) => setDisclaimerAccepted(checked === true)}
                  />
                  <span className="text-xs text-foreground">I understand this is a template and I should seek legal advice</span>
                </label>
              </div>
            </div>
          )}

          {/* Troubleshooting Tips (for calendar) */}
          {config.troubleshooting && (
            <Collapsible open={troubleshootingOpen} onOpenChange={setTroubleshootingOpen} className="border-b border-border">
              <CollapsibleTrigger className="w-full px-6 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium text-foreground">Troubleshooting tips</span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  troubleshootingOpen && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 pb-4">
                  <ul className="space-y-2">
                    {config.troubleshooting.map((tip, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Note (for payments) */}
          {config.note && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                💡 {config.note}
              </p>
            </div>
          )}

          {/* Action Section */}
          <div className="px-6 py-4">
            <p className="text-sm text-muted-foreground mb-4">{config.description}</p>
            
            <Button 
              onClick={handleOpenAwaken}
              className="w-full bg-[#827666] hover:bg-[#6b5a4a] mb-4"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {locationId ? 'Open in AwakenOS →' : 'Open AwakenOS →'}
            </Button>
            
            {!locationId && (
              <p className="text-xs text-muted-foreground mb-4 text-center">
                Add your Location ID to go directly to the right page
              </p>
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-3">
                Done? Let us know so we can track your progress.
              </p>
              <Button
                variant="outline"
                onClick={handleComplete}
                disabled={isCompleting || !canComplete}
                className={cn(
                  'w-full',
                  isComplete && 'text-[#1fb14c] border-[#1fb14c]/30'
                )}
              >
                {isCompleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {isComplete ? 'Complete ✓' : "I've Completed This ✓"}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <button 
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center py-2"
            onClick={onClose}
          >
            I'll do this later
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
