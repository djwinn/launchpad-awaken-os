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
import { ArrowLeft, Loader2, Check, Circle, Globe, Mail, MessageSquare, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getPhase2Data, calculatePhase2Progress, type Phase2Data } from '@/lib/phase-data';
import awakenLogo from '@/assets/awaken-logo-white.png';

const phase2Items = [
  {
    id: 'domain_connected',
    title: 'Connect Your Domain',
    helperText: 'Make your landing page live at yourbrand.com',
    completedText: 'Domain connected ✓',
    time: '~15 min',
    icon: Globe,
    route: '/phase2/domain',
  },
  {
    id: 'email_domain_connected',
    title: 'Set Up Email Sending',
    helperText: 'So your lead magnet actually gets delivered',
    completedText: 'Email sending configured ✓',
    time: '~15 min',
    icon: Mail,
    route: '/phase2/email-setup',
  },
  {
    id: 'content_generated',
    title: 'Create Your Content',
    helperText: 'AI helps you write your post, DM, and landing page',
    completedText: 'Content created ✓',
    time: '~10 min',
    icon: MessageSquare,
    route: '/phase2/ai-conversation',
  },
  {
    id: 'automation_built',
    title: 'Build Your Automation',
    helperText: 'Connect the pieces in your dashboard',
    completedText: 'Automation built ✓',
    time: '~10 min',
    icon: Zap,
    route: '/phase2/build-automation',
  },
] as const;

const Phase2 = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [progress, setProgress] = useState<Phase2Data>({
    started: false,
    domain_connected: false,
    domain_value: '',
    has_domain: true,
    email_domain_connected: false,
    email_subdomain: '',
    email_from_address: '',
    content_generated: false,
    content_outputs: null,
    automation_built: false,
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);

  useEffect(() => {
    if (!account?.location_id) return;

    const loadProgress = async () => {
      const data = await getPhase2Data(account.location_id);
      setProgress(data);
      setLoadingData(false);
    };

    loadProgress();
  }, [account]);

  const completedCount = calculatePhase2Progress(progress);
  const progressPercentage = 20 + (completedCount * 20); // Start at 20% (from Phase 1), each step adds 20%
  const allComplete = completedCount === 4;

  const getProgressMessage = () => {
    if (completedCount === 0) return "Let's get your lead machine running!";
    if (completedCount === 1) return "Great start! Keep going.";
    if (completedCount === 2) return "Halfway there!";
    if (completedCount === 3) return "Almost done!";
    return "Your lead machine is live!";
  };

  const handleItemClick = (item: typeof phase2Items[number]) => {
    navigate(item.route);
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard?view=overview')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-white">Get Leads While You Sleep</h1>
          <p className="text-white/70 mt-1">Turn comments into clients automatically</p>
        </div>
      </header>

      {/* Motivational Stat Banner */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-lg p-4 flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-[#827666] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Comment-to-DM automations convert 3x better than cold DMs</p>
            <p className="text-sm text-muted-foreground">People who comment are already interested — they just need a nudge.</p>
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

        {/* Description Card */}
        <div className="mb-6 bg-white/10 rounded-lg p-4">
          <p className="text-white/90 text-sm">
            Set up a simple system where people comment on your post, get a DM with your free resource, 
            and join your email list — all on autopilot.
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-4">
          {phase2Items.map((item) => {
            const isComplete = Boolean(progress[item.id as keyof Phase2Data]);
            const Icon = item.icon;

            return (
              <Card
                key={item.id}
                className={cn(
                  'transition-all duration-200 cursor-pointer hover:shadow-md bg-white overflow-hidden',
                  isComplete && 'border border-[#56bc77]/30'
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
                        <Icon className="w-5 h-5 text-muted-foreground" />
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
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {isComplete ? item.completedText : item.helperText}
                      </p>
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
                        handleItemClick(item);
                      }}
                    >
                      {isComplete ? 'Review' : 'Start'}
                    </Button>
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
            <DialogTitle className="text-2xl text-center">Your Lead Machine is Live! 🎉</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Someone can now comment on your post, get a DM, land on your page, and join your email list — all while you sleep.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-6">
            {[
              'Domain connected',
              'Email sending configured',
              'Content created',
              'Automation built',
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
            <p className="text-sm text-muted-foreground">
              Ready to build a complete funnel with a full email sequence and offer? That's Phase 3.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => {
              setShowCelebration(false);
              navigate('/dashboard?view=overview');
            }}>
              Back to Dashboard
            </Button>
            <Button className="flex-1 bg-[#ebcc89] text-black hover:bg-[#d4b876]" onClick={() => {
              setShowCelebration(false);
              navigate('/funnel');
            }}>
              Start Phase 3
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Phase2;
