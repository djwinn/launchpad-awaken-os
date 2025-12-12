import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Calendar, Link2, FileText, CreditCard, ExternalLink } from 'lucide-react';

interface SetupItemModalProps {
  itemId: string | null;
  isComplete: boolean;
  onClose: () => void;
  onComplete: (itemId: string) => void;
}

const itemConfigs: Record<string, {
  title: string;
  description: string;
  icon: typeof User;
  fields?: { id: string; label: string; placeholder: string; type?: string }[];
  externalSetup?: boolean;
  externalText?: string;
}> = {
  profile_complete: {
    title: 'Complete Your Profile',
    description: 'Let clients know who you are. Add your business name and a brief description.',
    icon: User,
    fields: [
      { id: 'businessName', label: 'Business Name', placeholder: 'e.g., Wellness with Sarah' },
      { id: 'tagline', label: 'Tagline (optional)', placeholder: 'e.g., Helping busy professionals find balance' },
    ],
  },
  calendar_connected: {
    title: 'Connect Your Calendar',
    description: 'Sync your calendar so clients can book when you\'re actually available.',
    icon: Calendar,
    externalSetup: true,
    externalText: 'Connect your Google Calendar or Outlook to automatically sync your availability.',
  },
  booking_page_created: {
    title: 'Create Your Booking Page',
    description: 'Set up your booking page so clients can schedule calls with you.',
    icon: Link2,
    fields: [
      { id: 'sessionName', label: 'Session Name', placeholder: 'e.g., Discovery Call' },
      { id: 'duration', label: 'Duration (minutes)', placeholder: '30', type: 'number' },
    ],
  },
  contract_prepared: {
    title: 'Prepare Your Contract',
    description: 'Have a professional agreement ready to send when clients are ready to work with you.',
    icon: FileText,
    fields: [
      { id: 'contractName', label: 'Contract Name', placeholder: 'e.g., Coaching Agreement' },
      { id: 'terms', label: 'Key Terms (optional)', placeholder: 'Any special terms or conditions...', type: 'textarea' },
    ],
  },
  payments_connected: {
    title: 'Set Up Payments',
    description: 'Connect your payment processor so you can get paid seamlessly.',
    icon: CreditCard,
    externalSetup: true,
    externalText: 'Connect Stripe to accept payments. You\'ll be able to create invoices and receive payments directly.',
  },
};

export function SetupItemModal({ itemId, isComplete, onClose, onComplete }: SetupItemModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!itemId) return null;

  const config = itemConfigs[itemId];
  if (!config) return null;

  const Icon = config.icon;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate a brief delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    onComplete(itemId);
    setFormData({});
    setIsSubmitting(false);
  };

  const handleExternalConnect = async () => {
    setIsSubmitting(true);
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 1000));
    onComplete(itemId);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={!!itemId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#827666]/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#827666]" />
            </div>
            <DialogTitle className="text-xl">{config.title}</DialogTitle>
          </div>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {config.externalSetup ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-6">{config.externalText}</p>
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
            <>
              {config.fields?.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.id}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
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
            </>
          )}
        </div>

        {!config.externalSetup && (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-[#827666] hover:bg-[#6b5a4a]" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isComplete ? 'Update' : 'Complete'}
            </Button>
          </div>
        )}

        {config.externalSetup && (
          <Button variant="ghost" className="w-full" onClick={onClose}>
            I'll do this later
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}