import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Check, Circle, User, Calendar, Link2, FileText, CreditCard, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { SetupItemModal } from '@/components/setup/SetupItemModal';
import { LocationIdModal } from '@/components/setup/LocationIdModal';

interface SetupProgress {
  profile_complete: boolean;
  calendar_connected: boolean;
  booking_page_created: boolean;
  contract_prepared: boolean;
  payments_connected: boolean;
  location_id: string | null;
}

const setupItems = [
  {
    id: 'profile_complete',
    title: 'Complete Your Profile',
    helperText: 'Add your name and logo',
    completedText: 'Profile completed ✓',
    time: '~2 min',
    icon: User,
  },
  {
    id: 'calendar_connected',
    title: 'Connect Your Calendar',
    helperText: 'Sync with Google or Outlook',
    completedText: 'Calendar connected ✓',
    time: '~2 min',
    icon: Calendar,
  },
  {
    id: 'booking_page_created',
    title: 'Create Your Booking Page',
    helperText: 'Get your shareable booking link',
    completedText: 'Booking page created ✓',
    time: '~5 min',
    icon: Link2,
  },
  {
    id: 'contract_prepared',
    title: 'Prepare Your Contract',
    helperText: 'Professional agreements ready to send',
    completedText: 'Contract prepared ✓',
    time: '~5 min',
    icon: FileText,
  },
  {
    id: 'payments_connected',
    title: 'Set Up Payments',
    helperText: 'Get paid seamlessly',
    completedText: 'Payments connected ✓',
    time: '~3 min',
    icon: CreditCard,
  },
] as const;

const Setup = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [progress, setProgress] = useState<SetupProgress>({
    profile_complete: false,
    calendar_connected: false,
    booking_page_created: false,
    contract_prepared: false,
    payments_connected: false,
    location_id: null,
  });
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [hasShownLocationPrompt, setHasShownLocationPrompt] = useState(false);

  useEffect(() => {
    if (!user?.email || loading) return;

    const loadProgress = async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('profile_complete, calendar_connected, booking_page_created, contract_prepared, payments_connected, location_id')
        .eq('user_email', user.email)
        .maybeSingle();

      if (!error && data) {
        setProgress({
          profile_complete: data.profile_complete ?? false,
          calendar_connected: data.calendar_connected ?? false,
          booking_page_created: data.booking_page_created ?? false,
          contract_prepared: data.contract_prepared ?? false,
          payments_connected: data.payments_connected ?? false,
          location_id: data.location_id ?? null,
        });
        
        // Show location modal on first visit if no location_id
        if (!data.location_id && !hasShownLocationPrompt) {
          setShowLocationModal(true);
          setHasShownLocationPrompt(true);
        }
      } else if (!data && !hasShownLocationPrompt) {
        // New user, show modal
        setShowLocationModal(true);
        setHasShownLocationPrompt(true);
      }
      setLoadingData(false);
    };

    loadProgress();
  }, [user, loading, hasShownLocationPrompt]);

  const completedCount = [
    progress.profile_complete,
    progress.calendar_connected,
    progress.booking_page_created,
    progress.contract_prepared,
    progress.payments_connected,
  ].filter(Boolean).length;
  const progressPercentage = 20 + (completedCount * 16); // Start at 20%, each item adds 16%
  const allComplete = completedCount === 5;

  const handleItemComplete = async (itemId: string) => {
    if (!user?.email) return;

    const newProgress = { ...progress, [itemId]: true };
    setProgress(newProgress as SetupProgress);
    setActiveItem(null);

    // Update database
    const newCompletedCount = [
      newProgress.profile_complete,
      newProgress.calendar_connected,
      newProgress.booking_page_created,
      newProgress.contract_prepared,
      newProgress.payments_connected,
    ].filter(Boolean).length;
    const phase1Complete = newCompletedCount === 5;

    await supabase
      .from('user_progress')
      .update({
        [itemId]: true,
        phase1_progress: completedCount,
        phase1_complete: phase1Complete,
      })
      .eq('user_email', user.email);

    toast({
      title: "Step completed!",
      description: `${setupItems.find(i => i.id === itemId)?.title} is done.`,
    });

    // Check if all complete
    if (phase1Complete) {
      setConfettiVisible(true);
      setTimeout(() => {
        setConfettiVisible(false);
        setShowCelebration(true);
      }, 3000);
    }
  };

  const handleSaveLocationId = async (locationId: string) => {
    if (!user?.email) return;

    await supabase
      .from('user_progress')
      .upsert({
        user_email: user.email,
        location_id: locationId,
      }, { onConflict: 'user_email' });

    setProgress(prev => ({ ...prev, location_id: locationId }));
    setShowLocationModal(false);
    
    toast({
      title: 'Location ID saved!',
      description: 'Links will now take you directly to the right pages in AwakenOS.',
    });
  };

  const getProgressMessage = () => {
    if (completedCount === 0) return "You've already set up your account!";
    if (completedCount === 1) return "Great start! Keep going.";
    if (completedCount === 2) return "You're making progress!";
    if (completedCount === 3) return "Halfway there!";
    if (completedCount === 4) return "Almost done!";
    return "You're ready for business!";
  };

  if (loading || loadingData) {
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

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Ready for Business</h1>
          <p className="text-muted-foreground mt-1">Five quick steps to handle any client inquiry professionally.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold">{progressPercentage}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-3 mb-2" />
          <p className="text-sm text-muted-foreground">{getProgressMessage()}</p>
        </div>

        {/* Location ID Section */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-foreground">AwakenOS Location ID: </span>
            {progress.location_id ? (
              <code className="text-sm font-mono text-muted-foreground">{progress.location_id.slice(0, 8)}...</code>
            ) : (
              <span className="text-sm text-muted-foreground">Not set</span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowLocationModal(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-3 h-3 mr-1" />
            {progress.location_id ? 'Edit' : 'Add'}
          </Button>
        </div>

        {/* Checklist */}
        <div className="space-y-4">
          {setupItems.map((item) => {
            const isComplete = Boolean(progress[item.id as keyof Omit<SetupProgress, 'location_id'>]);
            const Icon = item.icon;

            return (
              <Card
                key={item.id}
                className={cn(
                  'p-4 transition-all duration-200 cursor-pointer hover:shadow-md',
                  isComplete && 'border-l-4 border-l-[#1fb14c] bg-[#1fb14c]/5'
                )}
                onClick={() => !isComplete && setActiveItem(item.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    isComplete ? 'bg-[#1fb14c]' : 'bg-muted'
                  )}>
                    {isComplete ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {isComplete ? item.completedText : item.helperText}
                    </p>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant={isComplete ? 'outline' : 'default'}
                    size="sm"
                    className={cn(
                      isComplete && 'text-[#1fb14c] border-[#1fb14c]/30'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveItem(item.id);
                    }}
                  >
                    {isComplete ? 'Done ✓' : 'Start'}
                  </Button>
                </div>

                {/* Skip option */}
                {!isComplete && (
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground mt-2 ml-14"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Just close, doesn't mark complete
                    }}
                  >
                    I'll do this later
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      </main>

      {/* Setup Item Modal */}
      <SetupItemModal
        itemId={activeItem}
        isComplete={activeItem && activeItem !== 'location_id' ? Boolean(progress[activeItem as keyof Omit<SetupProgress, 'location_id'>]) : false}
        onClose={() => setActiveItem(null)}
        onComplete={handleItemComplete}
        locationId={progress.location_id}
      />

      {/* Location ID Modal */}
      <LocationIdModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSave={handleSaveLocationId}
        currentLocationId={progress.location_id || undefined}
      />

      {/* Celebration Modal */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">You're Ready for Business! 🎉</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Someone could find you, book a call, sign a contract, and pay you — all handled professionally.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-6">
            {[
              'Your brand is set up',
              'Your calendar is synced',
              'Your booking page is live',
              'Your contract is ready',
              'Your payments are connected',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#1fb14c] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-foreground">{text}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground text-center mb-4">
            Ready for the next step? Set up your 24/7 AI assistant to handle inquiries while you sleep.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => {
              setShowCelebration(false);
              navigate('/dashboard');
            }}>
              Back to Dashboard
            </Button>
            <Button className="flex-1 bg-[#827666] hover:bg-[#6b5a4a]" onClick={() => {
              setShowCelebration(false);
              navigate('/ai-training');
            }}>
              Set Up AI Assistant
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Setup;