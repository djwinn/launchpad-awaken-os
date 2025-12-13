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
import { ArrowLeft, Loader2, Check, Circle, Lock, Brain, Zap, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AITrainingItemModal } from '@/components/setup/AITrainingItemModal';

interface AIProgress {
  ai_foundation_complete: boolean;
  ai_responder_active: boolean;
  reminders_configured: boolean;
  phase1_complete: boolean;
}

const aiItems = [
  {
    id: 'ai_foundation_complete',
    title: 'Build Your AI Foundation',
    subtitle: 'Teach your AI about your business',
    helperText: 'Answer questions about who you help and what you offer. We\'ll generate everything your AI needs to represent you.',
    completedText: 'AI foundation built ✓',
    time: '~15-20 min',
    icon: Brain,
    requiresPrevious: null,
  },
  {
    id: 'ai_responder_active',
    title: 'Activate Your AI Responder',
    subtitle: 'Bring your AI to life',
    helperText: 'Set up your AI in AwakenOS and connect it to Instagram, Facebook, or your website chat.',
    completedText: 'AI responder active ✓',
    time: '~10 min',
    icon: Zap,
    requiresPrevious: 'ai_foundation_complete',
    lockedText: 'Complete your AI Foundation first',
  },
  {
    id: 'reminders_configured',
    title: 'Set Up Appointment Reminders',
    subtitle: 'Reduce no-shows by up to 50%',
    helperText: 'Configure automatic reminders so booked calls actually happen.',
    completedText: 'Reminders configured ✓',
    time: '~5 min',
    icon: Bell,
    requiresPrevious: null,
  },
] as const;

const AITraining = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [progress, setProgress] = useState<AIProgress>({
    ai_foundation_complete: false,
    ai_responder_active: false,
    reminders_configured: false,
    phase1_complete: false,
  });
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);

  useEffect(() => {
    if (!user?.email || loading) return;

    const loadProgress = async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('ai_foundation_complete, ai_responder_active, reminders_configured, phase1_complete')
        .eq('user_email', user.email)
        .maybeSingle();

      if (!error && data) {
        setProgress({
          ai_foundation_complete: data.ai_foundation_complete ?? false,
          ai_responder_active: data.ai_responder_active ?? false,
          reminders_configured: data.reminders_configured ?? false,
          phase1_complete: data.phase1_complete ?? false,
        });
      }
      setLoadingData(false);
    };

    loadProgress();
  }, [user, loading]);

  const completedCount = [
    progress.ai_foundation_complete,
    progress.ai_responder_active,
    progress.reminders_configured,
  ].filter(Boolean).length;
  
  // Start at 25% (acknowledging Phase 1), each item adds 25%
  const progressPercentage = 25 + (completedCount * 25);
  const allComplete = completedCount === 3;

  const isItemLocked = (item: typeof aiItems[number]) => {
    if (!item.requiresPrevious) return false;
    return !progress[item.requiresPrevious as keyof AIProgress];
  };

  const handleItemComplete = async (itemId: string) => {
    if (!user?.email) return;

    const newProgress = { ...progress, [itemId]: true };
    setProgress(newProgress as AIProgress);
    setActiveItem(null);

    // Check if all complete
    const newCompletedCount = [
      newProgress.ai_foundation_complete,
      newProgress.ai_responder_active,
      newProgress.reminders_configured,
    ].filter(Boolean).length;
    const phase2Complete = newCompletedCount === 3;

    // Update database
    await supabase
      .from('user_progress')
      .update({
        [itemId]: true,
        phase2_complete: phase2Complete,
      })
      .eq('user_email', user.email);

    toast({
      title: "Step completed!",
      description: `${aiItems.find(i => i.id === itemId)?.title} is done.`,
    });

    // Check if all complete
    if (phase2Complete) {
      setConfettiVisible(true);
      setTimeout(() => {
        setConfettiVisible(false);
        setShowCelebration(true);
      }, 3000);
    }
  };

  const getProgressMessage = () => {
    if (completedCount === 0) return "Phase 1 complete — let's protect your conversions";
    if (completedCount === 1) return "AI foundation ready — time to activate";
    if (completedCount === 2) return "AI live! One more step to complete protection";
    return "Your conversion protection is complete";
  };

  const getItemStatus = (item: typeof aiItems[number]) => {
    const isComplete = progress[item.id as keyof AIProgress];
    const locked = isItemLocked(item);
    
    if (isComplete) return 'complete';
    if (locked) return 'locked';
    return 'not_started';
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
          <h1 className="text-2xl font-bold text-foreground">Your 24/7 Assistant</h1>
          <p className="text-muted-foreground mt-1">Train your AI, activate it, and protect your bookings.</p>
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

        {/* Checklist */}
        <div className="space-y-4">
          {aiItems.map((item) => {
            const status = getItemStatus(item);
            const isComplete = status === 'complete';
            const isLocked = status === 'locked';
            const Icon = item.icon;

            return (
              <Card
                key={item.id}
                className={cn(
                  'p-4 transition-all duration-200',
                  isComplete && 'border-l-4 border-l-[#1fb14c] bg-[#1fb14c]/5',
                  isLocked && 'opacity-60',
                  !isComplete && !isLocked && 'cursor-pointer hover:shadow-md'
                )}
                onClick={() => {
                  if (!isComplete && !isLocked) {
                    if (item.id === 'ai_foundation_complete') {
                      navigate('/ai-training/builder');
                    } else if (item.id === 'ai_responder_active') {
                      navigate('/ai-training/activate');
                    } else if (item.id === 'reminders_configured') {
                      navigate('/ai-training/reminders');
                    }
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative',
                    isComplete ? 'bg-[#1fb14c]' : isLocked ? 'bg-muted' : 'bg-[#827666]/10'
                  )}>
                    {isComplete ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Icon className="w-5 h-5 text-[#827666]" />
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
                    <p className="text-sm text-[#827666] mt-0.5">{item.subtitle}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isComplete 
                        ? item.completedText 
                        : isLocked && 'lockedText' in item 
                          ? item.lockedText 
                          : item.helperText}
                    </p>
                  </div>

                  {/* Action Button */}
                  {!isLocked && (
                    <Button
                      variant={isComplete ? 'outline' : 'default'}
                      size="sm"
                      className={cn(
                        isComplete && 'text-[#1fb14c] border-[#1fb14c]/30'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLocked) {
                          if (item.id === 'ai_foundation_complete') {
                            navigate('/ai-training/builder');
                          } else if (item.id === 'ai_responder_active') {
                            navigate('/ai-training/activate');
                          } else if (item.id === 'reminders_configured') {
                            navigate('/ai-training/reminders');
                          }
                        }
                      }}
                    >
                      {isComplete ? 'Review' : 'Start'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {/* AI Training Item Modal */}
      <AITrainingItemModal
        itemId={activeItem}
        isComplete={activeItem ? Boolean(progress[activeItem as keyof AIProgress]) : false}
        onClose={() => setActiveItem(null)}
        onComplete={handleItemComplete}
      />

      {/* Celebration Modal */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Your Conversion Protection is Complete! 🎉</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Your AI responds instantly, and your reminders reduce no-shows by up to 50%
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

          <p className="text-sm text-muted-foreground text-center mb-4">
            Ready to generate leads? Build landing pages and lead magnets that bring clients to you.
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

export default AITraining;
