import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ArrowLeft, Loader2, Check, ChevronDown, ChevronUp, FileText, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import awakenLogo from '@/assets/awaken-logo-white.png';

interface BuildProgress {
  lead_magnet: boolean;
  landing_page: boolean;
  email_sequence: boolean;
  social_capture: boolean;
}

const buildSections = [
  {
    id: 'lead_magnet',
    title: '1. Create Your Lead Magnet',
    videoTitle: 'How to Create Your Lead Magnet PDF',
    videoLength: '~10 min',
    videoUrl: '[VIDEO_LEAD_MAGNET_URL]',
    description: 'Use Canva to create a professional PDF from your blueprint content.',
    checkboxLabel: "I've created my lead magnet PDF",
  },
  {
    id: 'landing_page',
    title: '2. Build Your Landing Page',
    videoTitle: 'How to Build Your Landing Page',
    videoLength: '~15 min',
    videoUrl: '[VIDEO_LANDING_PAGE_URL]',
    description: 'Create your landing page using the template and copy from your blueprint.',
    checkboxLabel: "I've built and published my landing page",
  },
  {
    id: 'email_sequence',
    title: '3. Set Up Your Email Sequence',
    videoTitle: 'How to Set Up Your Email Automation',
    videoLength: '~12 min',
    videoUrl: '[VIDEO_EMAIL_SEQUENCE_URL]',
    description: 'Create the 4-email nurture sequence that turns subscribers into booked calls.',
    checkboxLabel: "I've set up my email sequence",
  },
  {
    id: 'social_capture',
    title: '4. Activate Lead Magnet Social Capture',
    videoTitle: 'How to Activate Your Lead Magnet Workflow',
    videoLength: '~8 min',
    videoUrl: '[VIDEO_SOCIAL_CAPTURE_URL]',
    description: 'Set up the comment-to-DM workflow that delivers your lead magnet automatically.',
    checkboxLabel: "I've activated my lead magnet social capture",
  },
];

const FunnelBuild = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [progress, setProgress] = useState<BuildProgress>({
    lead_magnet: false,
    landing_page: false,
    email_sequence: false,
    social_capture: false,
  });
  const [openSections, setOpenSections] = useState<string[]>(['lead_magnet']);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);

  useEffect(() => {
    if (!user?.email || loading) return;

    const loadData = async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_email', user.email)
        .maybeSingle();

      if (!error && data) {
        const d = data as any;
        setBlueprint(d.funnel_blueprint ?? null);
        
        // Check if Item 1 is complete
        if (!d.funnel_craft_complete) {
          toast({
            title: "Complete Item 1 First",
            description: "You need to craft your funnel before you can build it.",
            variant: "destructive",
          });
          navigate('/funnel');
          return;
        }
      }
      setLoadingData(false);
    };

    loadData();
  }, [user, loading, navigate, toast]);

  const completedCount = Object.values(progress).filter(Boolean).length;
  const progressPercentage = Math.round((completedCount / 4) * 100);
  const allComplete = completedCount === 4;

  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const handleCheckboxChange = async (id: string, checked: boolean) => {
    const newProgress = { ...progress, [id]: checked };
    setProgress(newProgress);

    const newCompletedCount = Object.values(newProgress).filter(Boolean).length;
    const isAllComplete = newCompletedCount === 4;

    if (user?.email) {
      await (supabase
        .from('user_progress')
        .update({
          funnel_build_complete: isAllComplete,
        } as any)
        .eq('user_email', user.email));
    }

    if (checked) {
      toast({ title: "Step completed!" });
      
      // Auto-open next section
      const currentIndex = buildSections.findIndex(s => s.id === id);
      if (currentIndex < buildSections.length - 1) {
        const nextId = buildSections[currentIndex + 1].id;
        if (!openSections.includes(nextId)) {
          setOpenSections(prev => [...prev, nextId]);
        }
      }
    }

    if (isAllComplete) {
      setConfettiVisible(true);
      setTimeout(() => {
        setConfettiVisible(false);
        setShowCelebration(true);
      }, 3000);
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/funnel')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-white">Build Your Funnel</h1>
          <p className="text-white/70 mt-1">Follow each tutorial to implement your funnel.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* View Blueprint Button */}
        <Button
          variant="outline"
          className="w-full mb-6 bg-white hover:bg-gray-50"
          onClick={() => setShowBlueprint(true)}
        >
          <FileText className="h-4 w-4 mr-2" />
          View Your Funnel Blueprint
        </Button>

        {/* Progress Section */}
        <div className="mb-8 bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-foreground">{completedCount} of 4 complete</span>
            <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Build Sections */}
        <div className="space-y-4">
          {buildSections.map((section) => {
            const isComplete = progress[section.id as keyof BuildProgress];
            const isOpen = openSections.includes(section.id);

            return (
              <Card
                key={section.id}
                className={cn(
                  'bg-white overflow-hidden',
                  isComplete && 'border border-[#56bc77]/30'
                )}
              >
                {/* Green header bar for completed items */}
                {isComplete && (
                  <div className="bg-[#56bc77] px-4 py-2 flex items-center gap-2">
                    <Check className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium text-white">Completed</span>
                  </div>
                )}

                <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.id)}>
                  <CollapsibleTrigger className="w-full">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          isComplete ? 'bg-[#56bc77]/10' : 'bg-muted'
                        )}>
                          {isComplete ? (
                            <Check className="w-4 h-4 text-[#56bc77]" />
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">
                              {section.title.split('.')[0]}
                            </span>
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className={cn(
                            "font-semibold",
                            isComplete && "text-[#56bc77]"
                          )}>{section.title.split('. ')[1]}</h3>
                          <p className="text-sm text-muted-foreground">{section.description}</p>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4">
                      {/* Video Placeholder */}
                      <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-[#827666]/20 flex items-center justify-center mx-auto mb-3">
                            <Play className="w-8 h-8 text-[#827666]" />
                          </div>
                          <p className="font-medium text-foreground">{section.videoTitle}</p>
                          <p className="text-sm text-muted-foreground">{section.videoLength}</p>
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Checkbox
                          id={section.id}
                          checked={isComplete}
                          onCheckedChange={(checked) => handleCheckboxChange(section.id, checked as boolean)}
                        />
                        <label
                          htmlFor={section.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {section.checkboxLabel}
                        </label>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Blueprint Modal */}
      <Dialog open={showBlueprint} onOpenChange={setShowBlueprint}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Your Funnel Blueprint</DialogTitle>
            <DialogDescription>
              Reference this while building each piece of your funnel.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg">
              {blueprint || 'No blueprint found. Please complete Item 1 first.'}
            </pre>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (blueprint) {
                  navigator.clipboard.writeText(blueprint);
                  toast({ title: 'Blueprint copied!' });
                }
              }}
            >
              Copy All
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              'Lead magnet PDF ready to share',
              'Landing page capturing email subscribers',
              'Email sequence nurturing leads to calls',
              'Social capture delivering your lead magnet',
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
              Start posting about your lead magnet using the CTAs from your blueprint. Every comment could be a new subscriber!
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
              navigate('/funnel');
            }}>
              View Phase 3
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FunnelBuild;