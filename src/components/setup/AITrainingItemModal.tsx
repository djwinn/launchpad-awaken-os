import { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Brain, Zap, Bell, ExternalLink, Play, ChevronDown, Check, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AITrainingItemModalProps {
  itemId: string | null;
  isComplete: boolean;
  onClose: () => void;
  onComplete: (itemId: string) => void;
}

interface ItemConfig {
  title: string;
  description: string;
  icon: typeof Brain;
  time: string;
  videoCaption: string;
  instructions: string[];
  note?: string;
  completionMessage: string;
  awakenPath: string;
  buttonText: string;
}

const AWAKEN_BASE_URL = 'https://app.awaken.digital/v2/location';
const AWAKEN_HOME = 'https://app.awaken.digital';

const itemConfigs: Record<string, ItemConfig> = {
  ai_foundation_complete: {
    title: 'Build Your AI Foundation',
    description: 'Answer questions about your business so your AI can represent you authentically.',
    icon: Brain,
    time: '~15-20 min',
    videoCaption: 'Watch: Training your AI in AwakenOS',
    instructions: [
      'Click the button below to open AwakenOS',
      'Go to Conversations AI → AI Employees',
      'Click "Create AI Employee" or select your existing one',
      'Go through the setup wizard, answering questions about:',
      '• Who you help (your ideal client)',
      '• What problems you solve',
      '• Your coaching approach and methodology',
      '• Common questions clients ask',
      '• Your unique selling points',
      'Review the generated AI responses and make any adjustments',
      'Click Save to complete your AI foundation',
      'Come back here and click "I\'ve Completed This"',
    ],
    note: 'Take your time with this step — the more detailed your answers, the better your AI will represent you.',
    completionMessage: 'Your AI foundation is built! Your assistant now knows how to represent your business.',
    awakenPath: '/conversations/ai-employees',
    buttonText: 'Start Training',
  },
  ai_responder_active: {
    title: 'Activate Your AI Responder',
    description: 'Connect your AI to your communication channels so it can start responding to inquiries.',
    icon: Zap,
    time: '~10 min',
    videoCaption: 'Watch: Activating your AI responder',
    instructions: [
      'Click the button below to open AwakenOS',
      'Go to Conversations AI → AI Employees',
      'Select the AI Employee you created',
      'Click on "Channels" or "Integrations"',
      'Connect to your preferred channels:',
      '• Instagram DMs',
      '• Facebook Messenger',
      '• Website chat widget',
      '• SMS (if available)',
      'Follow the prompts to authenticate each channel',
      'Enable the AI to auto-respond on selected channels',
      'Test by sending a message to one of your connected channels',
      'Come back here and click "I\'ve Completed This"',
    ],
    note: 'Start with one channel and add more once you\'re comfortable with how your AI responds.',
    completionMessage: 'Your AI responder is live! It will now handle inquiries 24/7 across your connected channels.',
    awakenPath: '/conversations/ai-employees',
    buttonText: 'Activate AI',
  },
  reminders_configured: {
    title: 'Set Up Appointment Reminders',
    description: 'Configure automatic reminders to reduce no-shows and protect your calendar.',
    icon: Bell,
    time: '~5 min',
    videoCaption: 'Watch: Setting up appointment reminders',
    instructions: [
      'Click the button below to open AwakenOS',
      'Go to Settings → Calendars',
      'Select your calendar or booking page',
      'Find "Notifications" or "Reminders" section',
      'Enable appointment reminders',
      'Configure reminder timing (recommended: 24 hours and 1 hour before)',
      'Customize the reminder message if desired',
      'Enable confirmation request (optional but recommended)',
      'Save your settings',
      'Come back here and click "I\'ve Completed This"',
    ],
    note: 'Studies show that reminders sent 24 hours and 1 hour before appointments reduce no-shows by up to 50%.',
    completionMessage: 'Reminders are set up! Your bookings are now protected from no-shows.',
    awakenPath: '/settings/calendars',
    buttonText: 'Set Up Reminders',
  },
};

export const AITrainingItemModal = ({
  itemId,
  isComplete,
  onClose,
  onComplete,
}: AITrainingItemModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocationId = async () => {
      if (!user?.email) return;
      const { data } = await supabase
        .from('user_progress')
        .select('location_id')
        .eq('user_email', user.email)
        .maybeSingle();
      if (data?.location_id) {
        setLocationId(data.location_id);
      }
    };
    fetchLocationId();
  }, [user?.email]);

  const config = itemId ? itemConfigs[itemId] : null;
  if (!config) return null;

  const Icon = config.icon;

  const handleComplete = () => {
    if (!itemId) return;
    
    setShowSuccess(true);
    setTimeout(() => {
      onComplete(itemId);
      setShowSuccess(false);
    }, 1500);
  };

  const handleOpenAwaken = () => {
    const url = locationId 
      ? `${AWAKEN_BASE_URL}/${locationId}${config.awakenPath}`
      : AWAKEN_HOME;
    window.open(url, '_blank');
  };

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
              <span className="text-sm text-muted-foreground">{config.videoCaption}</span>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 py-4 border-b border-border">
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>

          {/* Step-by-step Instructions */}
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
                    <li key={index} className={cn(
                      "text-sm text-muted-foreground",
                      instruction.startsWith('•') ? 'ml-4' : 'flex gap-2'
                    )}>
                      {instruction.startsWith('•') ? (
                        instruction
                      ) : (
                        <>
                          <span className="text-[#827666] font-medium">{index + 1}.</span>
                          <span>{instruction}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ol>
                {config.note && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      💡 {config.note}
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card/50">
          <div className="flex items-center justify-between gap-3">
            <button 
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              I'll do this later
            </button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleOpenAwaken}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open AwakenOS
              </Button>
              {isComplete ? (
                <Button variant="outline" className="text-[#1fb14c] border-[#1fb14c]/30">
                  <Check className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-[#827666] hover:bg-[#6b5a4a]">
                  I've Completed This ✓
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
