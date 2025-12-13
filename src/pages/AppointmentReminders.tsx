import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Loader2, Copy, Check, ChevronDown, ExternalLink, Mail, Clock, Bell, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const TEMPLATES = {
  confirmation: {
    label: 'Confirmation Email',
    content: `Subject: Your call with [Your Name] is confirmed!

Hi {{contact.first_name}},

Your discovery call is booked for {{appointment.start_time}} on {{appointment.start_date}}.

[Meeting link/details]

Looking forward to speaking with you!

[Your Name]`,
  },
  reminder24h: {
    label: '24-Hour SMS',
    content: `Hi {{contact.first_name}}, just a reminder about your call with [Your Name] tomorrow at {{appointment.start_time}}. 

Reply C to confirm or R if you need to reschedule.`,
  },
  reminder1h: {
    label: '1-Hour SMS',
    content: `Hi {{contact.first_name}}, your call with [Your Name] starts in 1 hour at {{appointment.start_time}}. 

Here's the link: [Zoom link]

See you soon!`,
  },
};

const CUSTOM_VALUES = [
  { value: '{{contact.first_name}}', description: "Client's first name" },
  { value: '{{contact.name}}', description: "Client's full name" },
  { value: '{{appointment.start_time}}', description: 'Time of appointment' },
  { value: '{{appointment.start_date}}', description: 'Date of appointment' },
  { value: '{{appointment.end_time}}', description: 'End time' },
  { value: '{{calendar.name}}', description: 'Name of the calendar' },
];

const AppointmentReminders = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [locationId, setLocationId] = useState<string | null>(null);
  const [phase1Complete, setPhase1Complete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [valuesOpen, setValuesOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  
  const [selectedReminders, setSelectedReminders] = useState({
    confirmation: false,
    reminder24h: false,
    reminder1h: false,
  });
  
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return;

      const { data } = await supabase
        .from('user_progress')
        .select('location_id, phase1_complete, booking_page_created')
        .eq('user_email', user.email)
        .maybeSingle();

      if (data) {
        setLocationId(data.location_id);
        setPhase1Complete(data.phase1_complete || data.booking_page_created);
      }
      setIsLoading(false);
    };

    if (user && !loading) {
      loadData();
    }
  }, [user, loading]);

  const getAwakenLink = () => {
    if (locationId) {
      return `https://app.awaken.digital/v2/location/${locationId}/settings/calendars`;
    }
    return 'https://app.awaken.digital';
  };

  const handleCopyTemplate = async (templateKey: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateKey];
    await navigator.clipboard.writeText(template.content);
    setCopiedTemplate(templateKey);
    setTimeout(() => setCopiedTemplate(null), 2000);
    toast({
      title: 'Copied!',
      description: `${template.label} copied to clipboard.`,
    });
  };

  const toggleReminder = (key: keyof typeof selectedReminders) => {
    setSelectedReminders(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasAtLeastOneReminder = Object.values(selectedReminders).some(Boolean);

  const handleComplete = async () => {
    if (!hasAtLeastOneReminder) {
      toast({
        title: 'Select at Least One Reminder',
        description: 'Please indicate which reminders you set up.',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.email) return;

    // Update database
    await supabase
      .from('user_progress')
      .update({
        reminders_configured: true,
        phase2_complete: true,
      })
      .eq('user_email', user.email);

    // Show celebration
    setConfettiVisible(true);
    setTimeout(() => {
      setConfettiVisible(false);
      setShowCompletionModal(true);
    }, 3000);
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

  // Check if Phase 1 is complete
  if (!phase1Complete) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/ai-training')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Phase 2
            </Button>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">You'll need a booking calendar first</h2>
          <p className="text-muted-foreground mb-6">
            Head back to Phase 1 to create your booking page before setting up reminders.
          </p>
          <Button onClick={() => navigate('/setup')} className="bg-[#827666] hover:bg-[#6b5a4a]">
            Go to Phase 1
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Confetti overlay */}
      {confettiVisible && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-[confetti_3s_ease-out_forwards]"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: ['#1fb14c', '#827666', '#fbbf24', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
                width: '10px',
                height: '10px',
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}

      {/* Phase 2 Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Your Conversion Protection is Complete! 🎉</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Your AI responds instantly, and your reminders reduce no-shows by up to 50%.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-6">
            {[
              'AI trained on your business',
              'AI responder active',
              'Appointment reminders configured',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1fb14c] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-foreground">{text}</span>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-foreground font-medium mb-2">The Transformation:</p>
            <p className="text-sm text-muted-foreground">
              You've gone from "I hope I don't miss anything" to "the system has my back."
              Inquiries get instant responses. Bookings get reminders. You're not leaving money on the table anymore.
            </p>
          </div>

          <p className="text-sm text-muted-foreground text-center mb-4">
            Ready to bring more clients in? Build landing pages, lead magnets, and email sequences that attract the right people to you.
          </p>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setShowCompletionModal(false);
              navigate('/dashboard');
            }}>
              Back to Dashboard
            </Button>
            <Button onClick={() => {
              setShowCompletionModal(false);
              navigate('/funnel-builder');
            }} className="bg-[#827666] hover:bg-[#6b5a4a]">
              Build Your First Funnel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ai-training')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Phase 2
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Set Up Appointment Reminders</h1>
          <p className="text-muted-foreground mt-1">Reduce no-shows by up to 50% — about 5 minutes</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* The Problem Section */}
        <section className="space-y-4">
          <p className="text-muted-foreground">
            No-shows cost you time and money. The average coach loses 15-30% of booked calls to no-shows.
          </p>
          <p className="text-muted-foreground">
            The fix is simple: automatic reminders. SMS reminders alone reduce no-shows by up to 50%.
          </p>
          <p className="text-foreground font-medium">Let's set up three notifications:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#827666]" />
              <span><strong>Confirmation</strong> — Sent immediately when they book</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-[#827666]" />
              <span><strong>24-Hour Reminder</strong> — Sent the day before</span>
            </div>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-[#827666]" />
              <span><strong>1-Hour Reminder</strong> — Sent right before the call</span>
            </div>
          </div>
        </section>

        {/* Video Placeholder */}
        <section className="bg-muted/30 rounded-lg border border-border overflow-hidden">
          <div className="aspect-video bg-muted flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center mx-auto mb-3">
                <div className="w-0 h-0 border-l-[20px] border-l-muted-foreground/40 border-y-[12px] border-y-transparent ml-1" />
              </div>
              <p className="text-sm text-muted-foreground">Watch: Setting up appointment reminders in AwakenOS</p>
            </div>
          </div>
        </section>

        {/* Written Instructions */}
        <section>
          <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left">
              <span className="font-semibold text-foreground">Step-by-Step Instructions</span>
              <ChevronDown className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                instructionsOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 pt-2">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Click the button below to open your Calendars</li>
                <li>Click on your <strong className="text-foreground">Discovery Call</strong> calendar (or whatever you named it)</li>
                <li>Go to the <strong className="text-foreground">Notifications</strong> tab</li>
                <li>Set up these three notifications:</li>
              </ol>

              {/* Notification 1 */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <h4 className="font-semibold text-foreground mb-2">Notification 1: Booking Confirmation</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">When:</strong> Immediately after booking</p>
                  <p><strong className="text-foreground">Channel:</strong> Email (SMS optional)</p>
                  <p><strong className="text-foreground">Purpose:</strong> Confirms the booking, provides call details</p>
                </div>
              </div>

              {/* Notification 2 */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <h4 className="font-semibold text-foreground mb-2">Notification 2: 24-Hour Reminder</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">When:</strong> 24 hours before appointment</p>
                  <p><strong className="text-foreground">Channel:</strong> SMS recommended (98% open rate)</p>
                  <p><strong className="text-foreground">Purpose:</strong> Primary reminder, gives time to reschedule if needed</p>
                </div>
              </div>

              {/* Notification 3 */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <h4 className="font-semibold text-foreground mb-2">Notification 3: 1-Hour Reminder</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">When:</strong> 1 hour before appointment</p>
                  <p><strong className="text-foreground">Channel:</strong> SMS only</p>
                  <p><strong className="text-foreground">Purpose:</strong> Final reminder, ensures they're ready</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* Copy Templates Section */}
        <section>
          <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t border-border">
              <div>
                <span className="font-semibold text-foreground">Copy Templates</span>
                <p className="text-sm text-muted-foreground">Need help with the wording? Copy and customize these templates.</p>
              </div>
              <ChevronDown className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                templatesOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-4">
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                  <span className="font-medium text-foreground">{template.label}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyTemplate(key as keyof typeof TEMPLATES)}
                  >
                    {copiedTemplate === key ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* Quick Setup Option */}
        <section className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Quick Setup:</strong> At minimum, just enable the 24-hour SMS reminder. That alone reduces no-shows significantly.
          </p>
        </section>

        {/* Open AwakenOS Button */}
        <Button 
          variant="outline" 
          size="lg"
          className="w-full"
          onClick={() => window.open(getAwakenLink(), '_blank')}
        >
          Open Calendar Settings
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>

        {/* Custom Values Reference */}
        <section>
          <Collapsible open={valuesOpen} onOpenChange={setValuesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t border-border">
              <span className="text-sm font-medium text-muted-foreground">Available Custom Values Reference</span>
              <ChevronDown className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                valuesOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <p className="text-xs text-muted-foreground mb-3">These values automatically fill in with the contact's info:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Value</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">What It Shows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CUSTOM_VALUES.map((item) => (
                      <tr key={item.value} className="border-b border-border/50">
                        <td className="py-2 font-mono text-xs text-foreground">{item.value}</td>
                        <td className="py-2 text-muted-foreground">{item.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* Completion Section */}
        <section className="border-t border-border pt-6 space-y-4">
          <p className="font-medium text-foreground">Which reminders did you set up?</p>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={selectedReminders.confirmation}
                onCheckedChange={() => toggleReminder('confirmation')}
              />
              <span className="text-muted-foreground">Booking confirmation (email)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={selectedReminders.reminder24h}
                onCheckedChange={() => toggleReminder('reminder24h')}
              />
              <span className="text-muted-foreground">24-hour reminder (SMS)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={selectedReminders.reminder1h}
                onCheckedChange={() => toggleReminder('reminder1h')}
              />
              <span className="text-muted-foreground">1-hour reminder (SMS)</span>
            </label>
          </div>

          {hasAtLeastOneReminder && (
            <p className="text-sm text-[#1fb14c]">
              Great start! You can always add more reminders later.
            </p>
          )}

          <Button 
            onClick={handleComplete}
            disabled={!hasAtLeastOneReminder}
            className="w-full bg-[#827666] hover:bg-[#6b5a4a] disabled:opacity-50"
            size="lg"
          >
            Complete Setup ✓
          </Button>
        </section>

        {/* Multiple Calendars Note */}
        <p className="text-xs text-muted-foreground text-center">
          Have multiple calendars? Repeat these steps for each one. The notifications are set per calendar.
        </p>
      </main>
    </div>
  );
};

export default AppointmentReminders;
