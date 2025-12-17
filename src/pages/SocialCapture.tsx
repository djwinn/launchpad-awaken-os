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
import { ArrowLeft, Loader2, Check, MessageSquare, Link2, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getRandomCompletionMessage } from '@/lib/motivational-content';
import awakenLogo from '@/assets/awaken-logo-white.png';

interface SocialCaptureProgress {
  social_message_complete: boolean;
  social_accounts_connected: boolean;
  social_capture_active: boolean;
  phase1_complete: boolean;
}

const socialCaptureItems = [
  {
    id: 'social_message_complete',
    title: 'Craft Your Message',
    subtitle: 'Generate your social capture templates',
    helperText: 'Answer questions to create your DM message, comment replies, and post CTAs.',
    completedText: 'Message templates created ✓',
    time: '~15 min',
    icon: MessageSquare,
    requiresPrevious: null,
  },
  {
    id: 'social_accounts_connected',
    title: 'Connect Your Social Accounts',
    subtitle: 'Link Instagram and Facebook',
    helperText: 'Connect your social accounts to enable the automation.',
    completedText: 'Accounts connected ✓',
    time: '~5 min',
    icon: Link2,
    requiresPrevious: null,
  },
  {
    id: 'social_capture_active',
    title: 'Activate Social Capture',
    subtitle: 'Set up comment-to-DM automation',
    helperText: 'Configure the workflow that DMs people who comment on your posts.',
    completedText: 'Social capture active ✓',
    time: '~10 min',
    icon: Zap,
    requiresPrevious: 'social_message_complete',
    lockedText: 'Complete "Craft Your Message" first',
  },
] as const;

const SocialCapture = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [progress, setProgress] = useState<SocialCaptureProgress>({
    social_message_complete: false,
    social_accounts_connected: false,
    social_capture_active: false,
    phase1_complete: false,
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);

  useEffect(() => {
    if (!user?.email || loading) return;

    const loadProgress = async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_email', user.email)
        .maybeSingle();

      if (!error && data) {
        const d = data as any;
        setProgress({
          social_message_complete: d.social_message_complete ?? false,
          social_accounts_connected: d.social_accounts_connected ?? false,
          social_capture_active: d.social_capture_active ?? false,
          phase1_complete: d.phase1_complete ?? false,
        });
      }
      setLoadingData(false);
    };

    loadProgress();
  }, [user, loading]);

  const completedCount = [
    progress.social_message_complete,
    progress.social_accounts_connected,
    progress.social_capture_active,
  ].filter(Boolean).length;
  
  const progressPercentage = Math.round((completedCount / 3) * 100);
  const allComplete = completedCount === 3;

  const isItemLocked = (item: typeof socialCaptureItems[number]) => {
    if (!item.requiresPrevious) return false;
    return !progress[item.requiresPrevious as keyof SocialCaptureProgress];
  };

  const handleItemComplete = async (itemId: string) => {
    if (!user?.email) return;

    const newProgress = { ...progress, [itemId]: true };
    setProgress(newProgress as SocialCaptureProgress);

    const newCompletedCount = [
      newProgress.social_message_complete,
      newProgress.social_accounts_connected,
      newProgress.social_capture_active,
    ].filter(Boolean).length;
    const phase2Complete = newCompletedCount === 3;

    await supabase
      .from('user_progress')
      .update({
        [itemId]: true,
        phase2_complete: phase2Complete,
      })
      .eq('user_email', user.email);

    toast({
      title: "Step completed!",
      description: getRandomCompletionMessage(),
    });

    if (phase2Complete) {
      setConfettiVisible(true);
      setTimeout(() => {
        setConfettiVisible(false);
        setShowCelebration(true);
      }, 3000);
    }
  };

  const getProgressMessage = () => {
    if (completedCount === 0) return "Let's set up your lead capture system";
    if (completedCount === 1) return "Great start — keep going";
    if (completedCount === 2) return "Almost there — one more step";
    return "Your social capture is live!";
  };

  const getItemStatus = (item: typeof socialCaptureItems[number]) => {
    const isComplete = progress[item.id as keyof SocialCaptureProgress];
    const locked = isItemLocked(item);
    
    if (isComplete) return 'complete';
    if (locked) return 'locked';
    return 'not_started';
  };

  const handleItemClick = (item: typeof socialCaptureItems[number]) => {
    const status = getItemStatus(item);
    if (status === 'locked') return;
    
    if (item.id === 'social_message_complete') {
      navigate('/social-capture/builder');
    } else if (item.id === 'social_accounts_connected') {
      navigate('/social-capture/connect');
    } else if (item.id === 'social_capture_active') {
      navigate('/social-capture/activate');
    }
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
          <h1 className="text-2xl font-bold text-white">Get Leads While You Sleep</h1>
          <p className="text-white/70 mt-1">Turn social comments into booked calls — automatically.</p>
        </div>
      </header>

      {/* Motivational Stat Banner */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-lg p-4 flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-[#827666] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Comment-to-DM automation converts 3x better than cold outreach.</p>
            <p className="text-sm text-muted-foreground">When someone comments, they're already interested. Capture them instantly.</p>
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
          {socialCaptureItems.map((item) => {
            const status = getItemStatus(item);
            const isComplete = status === 'complete';
            const isLocked = status === 'locked';
            const Icon = item.icon;

            return (
              <Card
                key={item.id}
                className={cn(
                  'transition-all duration-200 bg-white overflow-hidden',
                  isComplete && 'border border-[#56bc77]/30',
                  isLocked && 'opacity-60',
                  !isComplete && !isLocked && 'cursor-pointer hover:shadow-md'
                )}
                onClick={() => handleItemClick(item)}
              >
                {/* Green header bar for completed items */}
                {isComplete && (
                  <div className="bg-[#56bc77] px-4 py-2 flex items-center gap-2">
                    <Check className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium text-white">Completed</span>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative',
                      isComplete ? 'bg-[#56bc77]/10' : isLocked ? 'bg-muted' : 'bg-[#827666]/10'
                    )}>
                      {isComplete ? (
                        <Check className="w-5 h-5 text-[#56bc77]" />
                      ) : (
                        <Icon className={cn('w-5 h-5', isLocked ? 'text-muted-foreground' : 'text-[#827666]')} />
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
                      ) : isLocked && 'lockedText' in item ? (
                        <p className="text-sm text-muted-foreground mt-0.5">{item.lockedText}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-0.5">{item.helperText}</p>
                      )}
                    </div>

                    {/* Action Button */}
                    {!isLocked && (
                      <Button
                        variant={isComplete ? 'outline' : 'default'}
                        size="sm"
                        className={cn(
                          isComplete && 'text-[#56bc77] border-[#56bc77]/30'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                      >
                        {isComplete ? 'Review' : 'Start'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Celebration Modal */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Your Social Capture is Live! 🎉</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              When someone comments on your posts with your keyword, they'll automatically receive a DM with your booking link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            <p className="text-sm font-medium text-foreground">Here's what you just set up:</p>
            {[
              'Automatic DM to anyone who comments your keyword',
              'Comment replies that drive engagement',
              'Booking link delivered instantly',
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#56bc77] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-foreground">{stat}</span>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground">
              Every comment on your posts is now a potential booked call — captured automatically while you sleep, coach, or live your life.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => {
              setShowCelebration(false);
              navigate('/dashboard');
            }}>
              Back to Dashboard
            </Button>
            <Button className="flex-1 bg-[#ebcc89] text-black hover:bg-[#d4b876]" onClick={() => {
              setShowCelebration(false);
              navigate('/funnel-builder');
            }}>
              Build Your First Funnel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SocialCapture;