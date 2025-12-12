import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { User, Calendar, Link2, FileText, CreditCard, ExternalLink, Play, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SetupItemModalProps {
  itemId: string | null;
  isComplete: boolean;
  onClose: () => void;
  onComplete: (itemId: string) => void;
}

interface ItemConfig {
  title: string;
  description: string;
  icon: typeof User;
  time: string;
  videoTitle: string;
  instructions: string[];
  fields?: { id: string; label: string; placeholder: string; type?: string }[];
  externalSetup?: boolean;
  externalText?: string;
  hasAiChat?: boolean;
}

const itemConfigs: Record<string, ItemConfig> = {
  profile_complete: {
    title: 'Complete Your Profile',
    description: 'Let clients know who you are. Add your business name and a brief description.',
    icon: User,
    time: '~2 min',
    videoTitle: 'How to set up your profile',
    instructions: [
      'Enter your business or brand name',
      'Add an optional tagline that captures what you do',
      'This information will appear on your booking page and communications',
    ],
    fields: [
      { id: 'businessName', label: 'Business Name', placeholder: 'e.g., Wellness with Sarah' },
      { id: 'tagline', label: 'Tagline (optional)', placeholder: 'e.g., Helping busy professionals find balance' },
    ],
  },
  calendar_connected: {
    title: 'Connect Your Calendar',
    description: 'Sync your calendar so clients can book when you\'re actually available.',
    icon: Calendar,
    time: '~2 min',
    videoTitle: 'How to connect your calendar',
    instructions: [
      'Click the "Connect Calendar" button below',
      'Choose Google Calendar or Outlook',
      'Grant access to view your availability',
      'Your calendar will sync automatically',
    ],
    externalSetup: true,
    externalText: 'Connect your Google Calendar or Outlook to automatically sync your availability.',
  },
  booking_page_created: {
    title: 'Create Your Booking Page',
    description: 'Set up your booking page so clients can schedule calls with you.',
    icon: Link2,
    time: '~5 min',
    videoTitle: 'How to create your booking page',
    instructions: [
      'Give your session a name (e.g., "Discovery Call")',
      'Set how long the session should be',
      'Your AI assistant can help you craft the perfect description',
    ],
    hasAiChat: true,
    fields: [
      { id: 'sessionName', label: 'Session Name', placeholder: 'e.g., Discovery Call' },
      { id: 'duration', label: 'Duration (minutes)', placeholder: '30', type: 'number' },
    ],
  },
  contract_prepared: {
    title: 'Prepare Your Contract',
    description: 'Have a professional agreement ready to send when clients are ready to work with you.',
    icon: FileText,
    time: '~5 min',
    videoTitle: 'How to prepare your contract',
    instructions: [
      'Name your contract template',
      'Add any special terms or conditions',
      'Your AI assistant can help you include standard coaching agreement terms',
    ],
    hasAiChat: true,
    fields: [
      { id: 'contractName', label: 'Contract Name', placeholder: 'e.g., Coaching Agreement' },
      { id: 'terms', label: 'Key Terms (optional)', placeholder: 'Any special terms or conditions...', type: 'textarea' },
    ],
  },
  payments_connected: {
    title: 'Set Up Payments',
    description: 'Connect your payment processor so you can get paid seamlessly.',
    icon: CreditCard,
    time: '~3 min',
    videoTitle: 'How to set up payments',
    instructions: [
      'Click "Connect Stripe" to open the setup wizard',
      'Create a Stripe account or log in to an existing one',
      'Follow the prompts to complete verification',
      'Once connected, you can create invoices and accept payments',
    ],
    externalSetup: true,
    externalText: 'Connect Stripe to accept payments. You\'ll be able to create invoices and receive payments directly.',
  },
};

export function SetupItemModal({ itemId, isComplete, onClose, onComplete }: SetupItemModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!itemId) return null;

  const config = itemConfigs[itemId];
  if (!config) return null;

  const Icon = config.icon;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setShowSuccess(true);
    setTimeout(() => {
      onComplete(itemId);
      setFormData({});
      setShowSuccess(false);
      setIsSubmitting(false);
    }, 1500);
  };

  const handleExternalConnect = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowSuccess(true);
    setTimeout(() => {
      onComplete(itemId);
      setShowSuccess(false);
      setIsSubmitting(false);
    }, 1500);
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
            <p className="text-lg font-semibold text-foreground">Step completed!</p>
          </div>
        )}

        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#827666]/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#827666]" />
              </div>
              <div>
                <SheetTitle className="text-lg text-left">{config.title}</SheetTitle>
              </div>
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
              Watch: {config.videoTitle}
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

          {/* Action Section */}
          <div className="px-6 py-4">
            <p className="text-sm text-muted-foreground mb-4">{config.description}</p>

            {config.externalSetup ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-6">{config.externalText}</p>
                <Button 
                  onClick={handleExternalConnect}
                  disabled={isSubmitting}
                  className="bg-[#827666] hover:bg-[#6b5a4a]"
                >
                  {isSubmitting ? 'Connecting...' : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {itemId === 'calendar_connected' ? 'Connect Calendar' : 'Connect Stripe'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  For this demo, clicking will mark as complete.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {config.fields?.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.id}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        className="min-h-[100px]"
                      />
                    ) : (
                      <Input
                        id={field.id}
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border mt-auto">
          {!config.externalSetup ? (
            <div className="flex items-center justify-between">
              <button 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={onClose}
              >
                I'll do this later
              </button>
              <Button 
                className="bg-[#827666] hover:bg-[#6b5a4a]" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : isComplete ? 'Update' : 'Complete'}
              </Button>
            </div>
          ) : (
            <button 
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center py-2"
              onClick={onClose}
            >
              I'll do this later
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
