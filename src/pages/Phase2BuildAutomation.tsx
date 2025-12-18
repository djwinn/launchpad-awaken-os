import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Check, ExternalLink, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getPhase2Data, updatePhase2Data, type Phase2Data } from '@/lib/phase-data';
import awakenLogo from '@/assets/awaken-logo-white.png';

interface ChecklistSection {
  id: string;
  title: string;
  description: string;
  linkText: string;
  linkUrl: string;
  items: string[];
}

const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    id: 'landing_page',
    title: 'Create Your Landing Page',
    description: 'Use the headline and copy from Step 3. Your template is waiting in your dashboard.',
    linkText: 'Open Landing Page Builder →',
    linkUrl: '/funnels',
    items: [
      'Paste your headline',
      'Paste your subheadline',
      'Add your lead magnet description',
      'Connect form to your email automation',
      'Publish the page',
    ],
  },
  {
    id: 'email_delivery',
    title: 'Set Up Email Delivery',
    description: 'When someone opts in, they should immediately get your lead magnet.',
    linkText: 'Open Automation Builder →',
    linkUrl: '/automations/workflows',
    items: [
      'Create workflow triggered by form submission',
      'Add "Send Email" action with your delivery email',
      'Add wait + second email with your follow-up',
      'Turn on workflow',
    ],
  },
  {
    id: 'social_connect',
    title: 'Connect Instagram/Facebook',
    description: 'So comments on your posts trigger the DM automatically.',
    linkText: 'Open Social Settings →',
    linkUrl: '/settings/integrations',
    items: [
      'Connect your Instagram account',
      'Connect your Facebook page (optional)',
      'Create automation: Comment keyword → Send DM',
    ],
  },
  {
    id: 'test',
    title: 'Post & Test',
    description: 'Make your first post and test the whole flow.',
    linkText: '',
    linkUrl: '',
    items: [
      'Post using your caption from Step 3',
      'Comment with trigger word from another account',
      'Verify DM is received',
      'Click link, submit email',
      'Verify lead magnet email arrives',
    ],
  },
];

const Phase2BuildAutomation = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<Phase2Data | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
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

  const getGHLLink = (path: string) => {
    if (!account?.location_id || account.location_id.startsWith('demo_')) {
      return 'https://app.gohighlevel.com';
    }
    return `https://app.gohighlevel.com/v2/location/${account.location_id}${path}`;
  };

  const toggleItem = (sectionId: string, itemIndex: number) => {
    const key = `${sectionId}-${itemIndex}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isItemChecked = (sectionId: string, itemIndex: number) => {
    return checkedItems[`${sectionId}-${itemIndex}`] || false;
  };

  const getSectionProgress = (section: ChecklistSection) => {
    const checkedCount = section.items.filter((_, i) => isItemChecked(section.id, i)).length;
    return { checked: checkedCount, total: section.items.length };
  };

  const handleComplete = async () => {
    if (!account?.location_id) return;
    
    setSaving(true);
    await updatePhase2Data(account.location_id, {
      automation_built: true,
    });
    await refreshAccount();
    setSaving(false);

    // Check if all Phase 2 is complete
    const updatedProgress = await getPhase2Data(account.location_id);
    const allComplete = updatedProgress.domain_connected && 
                       updatedProgress.email_domain_connected && 
                       updatedProgress.content_generated && 
                       updatedProgress.automation_built;

    if (allComplete) {
      setConfettiVisible(true);
      setTimeout(() => {
        setConfettiVisible(false);
        setShowCelebration(true);
      }, 3000);
    } else {
      toast({
        title: "Step completed!",
        description: "Your automation is built.",
      });
      navigate('/phase2');
    }
  };

  const handleSkip = () => {
    navigate('/phase2');
  };

  if (loadingData || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isComplete = progress?.automation_built;

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
            <Button variant="ghost" size="sm" onClick={() => navigate('/phase2')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Phase 2
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-white">Build Your Automation</h1>
          <p className="text-white/70 mt-1">Connect the pieces — you've got everything you need</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Video Placeholder */}
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#827666]/10 flex items-center justify-center">
              <Play className="h-5 w-5 text-[#827666]" />
            </div>
            <div>
              <h3 className="font-semibold">Watch: How to set this up (5 min)</h3>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </div>
          </div>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Video tutorial coming soon</p>
          </div>
        </Card>

        {/* Checklist Sections */}
        {CHECKLIST_SECTIONS.map((section) => {
          const sectionProgress = getSectionProgress(section);
          
          return (
            <Card key={section.id} className="p-6 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                  {sectionProgress.checked}/{sectionProgress.total}
                </span>
              </div>

              {section.linkUrl && (
                <a
                  href={getGHLLink(section.linkUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
                >
                  {section.linkText}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              <div className="space-y-3">
                {section.items.map((item, index) => (
                  <label
                    key={index}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                      isItemChecked(section.id, index)
                        ? "bg-[#56bc77] border-[#56bc77]"
                        : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                    )}>
                      {isItemChecked(section.id, index) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={isItemChecked(section.id, index)}
                      onChange={() => toggleItem(section.id, index)}
                      className="sr-only"
                    />
                    <span className={cn(
                      "text-sm",
                      isItemChecked(section.id, index) && "text-muted-foreground line-through"
                    )}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          );
        })}

        {/* Helper text for external links */}
        <p className="text-xs text-white/50 text-center">
          Links open in a new window. Close them when done to continue here.
        </p>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handleSkip}
            className="text-sm text-white/70 hover:text-white"
          >
            I'll do this later
          </button>
          <Button
            onClick={handleComplete}
            disabled={saving}
            className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isComplete ? 'Update & Continue' : "I've Completed This ✓"}
          </Button>
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

export default Phase2BuildAutomation;
