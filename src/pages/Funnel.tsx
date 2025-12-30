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
import { ArrowLeft, Loader2, Check, Pencil, Video, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getRandomCompletionMessage } from '@/lib/motivational-content';
import { getPhase3Data, updatePhase3Data, type Phase3Data } from '@/lib/phase-data';
import { CommunityShareSection } from '@/components/community/CommunityShareSection';
import { COMMUNITY_MESSAGES } from '@/lib/community-share';
import { useCommunityShare } from '@/hooks/useCommunityShare';
import awakenLogo from '@/assets/awaken-logo-white.png';

const funnelItems = [
  {
    id: 'funnel_craft_complete',
    title: 'Craft Your Funnel',
    subtitle: 'Generate all your funnel content',
    helperText: 'Answer questions to generate your lead magnet, landing page, emails, and social capture templates.',
    completedText: 'Funnel blueprint created ✓',
    time: '~30 min',
    icon: Pencil,
    requiresPrevious: null,
  },
  {
    id: 'funnel_build_complete',
    title: 'Build Your Funnel',
    subtitle: 'Follow video tutorials',
    helperText: 'Follow step-by-step video tutorials to implement each piece of your funnel.',
    completedText: 'Funnel built ✓',
    time: '2-3 hrs',
    icon: Video,
    requiresPrevious: 'funnel_craft_complete',
    lockedText: 'Complete "Craft Your Funnel" first',
  },
] as const;

const Funnel = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [progress, setProgress] = useState<Phase3Data>({
    started: false,
    funnel_craft_complete: false,
    funnel_build_complete: false,
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const { hasSharedPhase, markPhaseShared } = useCommunityShare(account?.location_id);

  useEffect(() => {
    if (!account?.location_id) return;

    const loadProgress = async () => {
      const data = await getPhase3Data(account.location_id);
      setProgress(data);
      setLoadingData(false);
    };

    loadProgress();
  }, [account]);

  const completedCount = [
    progress.funnel_craft_complete,
    progress.funnel_build_complete,
  ].filter(Boolean).length;
  
  const progressPercentage = Math.round((completedCount / 2) * 100);
  const allComplete = completedCount === 2;

  const isItemLocked = (item: typeof funnelItems[number]) => {
    if (!item.requiresPrevious) return false;
    return !progress[item.requiresPrevious as keyof Phase3Data];
  };

  const getProgressMessage = () => {
    if (completedCount === 0) return "Let's build your lead generation funnel";
    if (completedCount === 1) return "Great progress — now let's build it!";
    return "Your funnel is complete!";
  };

  const getItemStatus = (item: typeof funnelItems[number]) => {
    const isComplete = progress[item.id as keyof Phase3Data];
    const locked = isItemLocked(item);
    
    if (isComplete) return 'complete';
    if (locked) return 'locked';
    return 'not_started';
  };

  const handleItemClick = (item: typeof funnelItems[number]) => {
    const status = getItemStatus(item);
    if (status === 'locked') return;
    
    if (item.id === 'funnel_craft_complete') {
      navigate('/funnel/craft');
    } else if (item.id === 'funnel_build_complete') {
      navigate('/funnel/build');
    }
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
          <h1 className="text-2xl font-bold text-white">Build Your Funnel</h1>
          <p className="text-white/70 mt-1">Create a lead magnet, landing page, and email sequence that attracts your ideal clients.</p>
        </div>
      </header>

      {/* Intro Video Section */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">Watch Before You Start</h2>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border">
            {/* Replace this placeholder with your video embed */}
            <div className="text-center p-6">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Intro video will appear here</p>
              <p className="text-xs text-muted-foreground mt-1">Add your video embed URL</p>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Stat Banner */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="bg-white rounded-lg p-4 flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-[#827666] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Lead magnets convert 2-5% of website visitors into email subscribers.</p>
            <p className="text-sm text-muted-foreground">A well-crafted funnel turns cold traffic into warm leads who know, like, and trust you.</p>
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
          {funnelItems.map((item) => {
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
                          isComplete && 'text-[#56bc77] border-[#56bc77]/30',
                          !isComplete && 'bg-[#ebcc89] text-black hover:bg-[#d4b876]'
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
            <DialogTitle className="text-2xl text-center">Your Funnel is Complete! 🎉</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Your lead generation funnel is complete! You now have a lead magnet attracting subscribers, a landing page capturing emails, an email sequence nurturing leads, and social capture driving traffic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            <p className="text-sm font-medium text-foreground">Here's what you just built:</p>
            {[
              'Lead magnet that builds your list while you sleep',
              'Landing page that captures your ideal clients',
              'Email sequence that nurtures leads to booked calls',
              'Social capture workflow driving traffic to your funnel',
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
              Every piece is connected — from social posts to DMs to landing pages to emails. Your lead generation machine is ready to run.
            </p>
          </div>

          {/* Community Share Section */}
          {!hasSharedPhase('phase3') && (
            <CommunityShareSection
              channel="wins"
              prewrittenMessage={COMMUNITY_MESSAGES.phase3Complete}
              onShare={() => markPhaseShared('phase3')}
              onDismiss={() => {}}
            />
          )}

          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => {
              setShowCelebration(false);
              navigate('/dashboard');
            }}>
              Back to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Funnel;
