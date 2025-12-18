import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
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
import { ArrowLeft, Loader2, Check, Circle, User, Calendar, Link2, FileText, CreditCard, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { SetupItemModal } from '@/components/setup/SetupItemModal';
import { PHASE_INTRO_STATS, PHASE1_CELEBRATION, SETUP_ITEM_MOTIVATION, getRandomCompletionMessage } from '@/lib/motivational-content';
import { getPhase1Data, updatePhase1Data, type Phase1Data } from '@/lib/phase-data';
import awakenLogo from '@/assets/awaken-logo-white.png';

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
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [progress, setProgress] = useState<Phase1Data>({
    items_complete: 0,
    profile_complete: false,
    calendar_connected: false,
    booking_page_created: false,
    contract_prepared: false,
    payments_connected: false,
  });
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);

  useEffect(() => {
    if (!account?.location_id) return;

    const loadProgress = async () => {
      const data = await getPhase1Data(account.location_id);
      setProgress(data);
      setLoadingData(false);
    };

    loadProgress();
  }, [account]);

  const completedCount = [
    progress.profile_complete,
    progress.calendar_connected,
    progress.booking_page_created,
    progress.contract_prepared,
    progress.payments_connected,
  ].filter(Boolean).length;
  const progressPercentage = 20 + (completedCount * 16);
  const allComplete = completedCount === 5;

  const handleItemComplete = async (itemId: string) => {
    if (!account?.location_id) return;

    const newProgress = { ...progress, [itemId]: true };
    setProgress(newProgress);
    setActiveItem(null);

    await updatePhase1Data(account.location_id, { [itemId]: true });
    await refreshAccount();

    toast({
      title: "Step completed!",
      description: getRandomCompletionMessage(),
    });

    const newCompletedCount = [
      newProgress.profile_complete,
      newProgress.calendar_connected,
      newProgress.booking_page_created,
      newProgress.contract_prepared,
      newProgress.payments_connected,
    ].filter(Boolean).length;

    if (newCompletedCount === 5) {
      setConfettiVisible(true);
      setTimeout(() => {
        setConfettiVisible(false);
        setShowCelebration(true);
      }, 3000);
    }
  };

  const handleItemUncomplete = async (itemId: string) => {
    if (!account?.location_id) return;

    const newProgress = { ...progress, [itemId]: false };
    setProgress(newProgress);

    await updatePhase1Data(account.location_id, { [itemId]: false });
    await refreshAccount();

    toast({
      title: "Step unmarked",
      description: `${setupItems.find(i => i.id === itemId)?.title} marked as incomplete.`,
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

  if (loadingData || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#605547' }}>
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
                backgroundColor: ['#56bc77', '#827666', '#fbbf24', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
                width: '10px',
                height: '10px',
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10" style={{ backgroundColor: 'rgba(96, 85, 71, 0.9)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <img src={awakenLogo} alt="AwakenOS" className="h-8" />
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-white">Ready for Business</h1>
          <p className="text-white/70 mt-1">Five quick steps to handle any client inquiry professionally.</p>
        </div>
      </header>

      {/* Motivational Stat Banner */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-lg p-4 flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-[#827666] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{PHASE_INTRO_STATS.phase1.stat}</p>
            <p className="text-sm text-muted-foreground">{PHASE_INTRO_STATS.phase1.message}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Section */}
        <div className="mb-8 bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-foreground">{progressPercentage}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-3 mb-2" />
          <p className="text-sm text-muted-foreground">{getProgressMessage()}</p>
        </div>

        {/* Checklist */}
        <div className="space-y-4">
          {setupItems.map((item) => {
            const isComplete = Boolean(progress[item.id as keyof Omit<Phase1Data, 'items_complete' | 'location_id'>]);
            const Icon = item.icon;

            return (
              <Card
                key={item.id}
                className={cn(
                  'transition-all duration-200 cursor-pointer hover:shadow-md bg-white overflow-hidden',
                  isComplete && 'border border-[#56bc77]/30'
                )}
                onClick={() => !isComplete && setActiveItem(item.id)}
              >
                {/* Green header bar for completed items */}
                {isComplete && (
                  <div className="bg-[#56bc77] px-4 py-2 flex items-center gap-2">
                    <Check className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium text-white">Completed</span>
                  </div>
                )}
                
                <div className={cn("p-4", !isComplete && "pt-4")}>
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      isComplete ? 'bg-[#56bc77]/10' : 'bg-muted'
                    )}>
                      {isComplete ? (
                        <Check className="w-5 h-5 text-[#56bc77]" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn(
                          "font-semibold",
                          isComplete ? "text-[#56bc77]" : "text-foreground"
                        )}>{item.title}</h3>
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                          {item.time}
                        </span>
                      </div>
                      {isComplete ? (
                        <p className="text-sm text-muted-foreground mt-0.5">{item.completedText}</p>
                      ) : (
                        <p className="text-sm text-[#827666] font-medium mt-0.5">
                          {SETUP_ITEM_MOTIVATION[item.id as keyof typeof SETUP_ITEM_MOTIVATION]?.cardStat}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      variant={isComplete ? 'outline' : 'default'}
                      size="sm"
                      className={cn(
                        isComplete && 'text-[#56bc77] border-[#56bc77]/30'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isComplete) {
                          handleItemUncomplete(item.id);
                        } else {
                          setActiveItem(item.id);
                        }
                      }}
                    >
                      {isComplete ? 'Undo' : 'Start'}
                    </Button>
                  </div>

                  {/* Skip option */}
                  {!isComplete && (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground mt-2 ml-14"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      I'll do this later
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Setup Item Modal */}
      <SetupItemModal
        itemId={activeItem}
        isComplete={activeItem && activeItem !== 'location_id' ? Boolean(progress[activeItem as keyof Omit<Phase1Data, 'items_complete' | 'location_id'>]) : false}
        onClose={() => setActiveItem(null)}
        onComplete={handleItemComplete}
        locationId={account.location_id}
      />


      {/* Celebration Modal */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">{PHASE1_CELEBRATION.headline} 🎉</DialogTitle>
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
                <div className="w-6 h-6 rounded-full bg-[#56bc77] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-foreground">{text}</span>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground">{PHASE1_CELEBRATION.supportingStat}</p>
          </div>

          <p className="text-sm italic text-muted-foreground text-center mb-4">
            "{PHASE1_CELEBRATION.quote}"
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => {
              setShowCelebration(false);
              navigate('/dashboard');
            }}>
              Back to Dashboard
            </Button>
            <Button className="flex-1 bg-[#ebcc89] text-black hover:bg-[#d4b876]" onClick={() => {
              setShowCelebration(false);
              navigate('/social-capture');
            }}>
              Get Leads While You Sleep
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Setup;
