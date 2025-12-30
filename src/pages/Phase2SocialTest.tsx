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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ArrowLeft, Loader2, Check, ExternalLink, Play, ChevronDown, Copy, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getPhase2Data, updatePhase2Data, type Phase2Data } from '@/lib/phase-data';
import { CommunityShareSection } from '@/components/community/CommunityShareSection';
import { COMMUNITY_MESSAGES } from '@/lib/community-share';
import { useCommunityShare } from '@/hooks/useCommunityShare';
import awakenLogo from '@/assets/awaken-logo-white.png';

const SOCIAL_CHECKLIST = [
  'Connect Instagram account',
  'Connect Facebook page (optional)',
];

const AUTOMATION_CHECKLIST = [
  'Create workflow: Instagram Comment Contains "[KEYWORD]" → Send DM',
  'Paste your DM template from Step 1 (replace link placeholder with your landing page URL)',
  'Turn workflow ON',
];

const TEST_CHECKLIST = [
  'Make a test post using your caption from Step 1',
  'Comment with trigger word from another account (or have a friend do it)',
  'Check: DM received?',
  'Click the link, enter email',
  'Check: Lead magnet email received?',
];

const Phase2SocialTest = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<Phase2Data | null>(null);
  
  const [socialConnected, setSocialConnected] = useState(false);
  const [automationBuilt, setAutomationBuilt] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  
  const [socialChecked, setSocialChecked] = useState<Record<number, boolean>>({});
  const [automationChecked, setAutomationChecked] = useState<Record<number, boolean>>({});
  const [testChecked, setTestChecked] = useState<Record<number, boolean>>({});
  
  const [showContentPanel, setShowContentPanel] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const { hasSharedPhase, markPhaseShared } = useCommunityShare(account?.location_id);

  useEffect(() => {
    if (!account?.location_id) return;

    const loadProgress = async () => {
      const data = await getPhase2Data(account.location_id);
      setProgress(data);
      setSocialConnected(data.social_connected);
      setAutomationBuilt(data.comment_automation_built);
      setTestComplete(data.tested);
      setLoadingData(false);
    };

    loadProgress();
  }, [account]);

  const getDeepLink = (path: string) => {
    if (account?.location_id) {
      return `https://app.awaken.digital/v2/location/${account.location_id}${path}`;
    }
    return 'https://app.awaken.digital';
  };

  const copyToClipboard = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast({
      title: "Copied!",
      description: `${section} copied to clipboard`,
    });
  };

  const handleSocialConfirm = async () => {
    if (!account?.location_id) return;
    setSaving(true);
    await updatePhase2Data(account.location_id, {
      social_connected: true,
    });
    await refreshAccount();
    setSocialConnected(true);
    setSaving(false);
    toast({ title: "Social accounts connected!" });
  };

  const handleAutomationConfirm = async () => {
    if (!account?.location_id) return;
    setSaving(true);
    await updatePhase2Data(account.location_id, {
      comment_automation_built: true,
    });
    await refreshAccount();
    setAutomationBuilt(true);
    setSaving(false);
    toast({ title: "Automation built!" });
  };

  const handleTestConfirm = async () => {
    if (!account?.location_id) return;
    setSaving(true);
    await updatePhase2Data(account.location_id, {
      tested: true,
    });
    await refreshAccount();
    setTestComplete(true);
    setSaving(false);
    
    // Check if all Phase 2 is complete
    const updatedProgress = await getPhase2Data(account.location_id);
    const allComplete = updatedProgress.content_generated && 
                       updatedProgress.landing_page_built && 
                       updatedProgress.email_delivery_built && 
                       (updatedProgress.domain_connected && updatedProgress.email_sending_configured && updatedProgress.page_published) && 
                       updatedProgress.tested;

    if (allComplete) {
      setConfettiVisible(true);
      setTimeout(() => {
        setConfettiVisible(false);
        setShowCelebration(true);
      }, 3000);
    } else {
      toast({ 
        title: "Test complete!",
        description: "Your lead machine is working!",
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

  const outputs = progress?.content_outputs;

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
          <h1 className="text-2xl font-bold text-white">Connect Social & Test</h1>
          <p className="text-white/70 mt-1">The final piece — automate your DMs</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Why it matters */}
        <Card className="p-4 bg-white">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Why this matters:</strong> Now we connect Instagram so when someone comments 
            on your post, they automatically get a DM with your landing page link.
          </p>
        </Card>

        {/* Part A: Connect Instagram/Facebook */}
        <Card className={cn(
          "bg-white overflow-hidden",
          socialConnected && "border border-[#56bc77]/30"
        )}>
          {socialConnected && (
            <div className="bg-[#56bc77] px-4 py-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Social Connected</span>
            </div>
          )}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Part A: Connect Instagram/Facebook</h2>
            
            {!socialConnected && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Connect your accounts so the automation can send DMs.
                </p>
                <Button 
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                  onClick={() => window.open(getDeepLink('/settings/integrations'), '_blank')}
                >
                  Open Social Integrations
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Opens a new window. Close it when done to continue here.
                </p>
                
                {/* Video placeholder */}
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#827666]/20 flex items-center justify-center">
                      <Play className="h-4 w-4 text-[#827666]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Watch: How to connect Instagram & Facebook (~3 min)</p>
                      <p className="text-xs text-muted-foreground">Video coming soon</p>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  {SOCIAL_CHECKLIST.map((item, index) => (
                    <label key={index} className="flex items-start gap-3 cursor-pointer group">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                        socialChecked[index]
                          ? "bg-[#56bc77] border-[#56bc77]"
                          : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                      )}>
                        {socialChecked[index] && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={socialChecked[index] || false}
                        onChange={() => setSocialChecked(prev => ({ ...prev, [index]: !prev[index] }))}
                        className="sr-only"
                      />
                      <span className={cn("text-sm", socialChecked[index] && "text-muted-foreground line-through")}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>

                <Button
                  onClick={handleSocialConfirm}
                  disabled={saving}
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Accounts Connected ✓
                </Button>
              </div>
            )}

            {socialConnected && (
              <p className="text-sm text-muted-foreground">Social accounts connected! ✓</p>
            )}
          </div>
        </Card>

        {/* Part B: Build the Comment Automation */}
        <Card className={cn(
          "bg-white overflow-hidden",
          automationBuilt && "border border-[#56bc77]/30"
        )}>
          {automationBuilt && (
            <div className="bg-[#56bc77] px-4 py-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Automation Built</span>
            </div>
          )}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Part B: Build the Comment Automation</h2>
            
            {!automationBuilt && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Set up the trigger: when someone comments a keyword, send them a DM.
                </p>
                <Button 
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                  onClick={() => window.open(getDeepLink('/automations/workflows'), '_blank')}
                >
                  Open Automation Builder
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Opens a new window. Close it when done to continue here.
                </p>
                
                {/* Video placeholder */}
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#827666]/20 flex items-center justify-center">
                      <Play className="h-4 w-4 text-[#827666]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Watch: How to set up comment-to-DM (~5 min)</p>
                      <p className="text-xs text-muted-foreground">Video coming soon</p>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  {AUTOMATION_CHECKLIST.map((item, index) => (
                    <label key={index} className="flex items-start gap-3 cursor-pointer group">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                        automationChecked[index]
                          ? "bg-[#56bc77] border-[#56bc77]"
                          : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                      )}>
                        {automationChecked[index] && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={automationChecked[index] || false}
                        onChange={() => setAutomationChecked(prev => ({ ...prev, [index]: !prev[index] }))}
                        className="sr-only"
                      />
                      <span className={cn("text-sm", automationChecked[index] && "text-muted-foreground line-through")}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Quick Reference Panel */}
                {outputs && (
                  <Collapsible open={showContentPanel} onOpenChange={setShowContentPanel}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <span className="text-sm font-medium">💬 Your DM Template from Step 1</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", showContentPanel && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">DM Template</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(outputs.dm_template, 'DM Template')}
                          >
                            {copiedSection === 'DM Template' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{outputs.dm_template}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Button
                  onClick={handleAutomationConfirm}
                  disabled={saving}
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Automation Built ✓
                </Button>
              </div>
            )}

            {automationBuilt && (
              <p className="text-sm text-muted-foreground">Comment automation built! ✓</p>
            )}
          </div>
        </Card>

        {/* Part C: Test Everything */}
        <Card className={cn(
          "bg-white overflow-hidden",
          testComplete && "border border-[#56bc77]/30"
        )}>
          {testComplete && (
            <div className="bg-[#56bc77] px-4 py-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Test Complete</span>
            </div>
          )}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Part C: Test Everything</h2>
            
            {!testComplete && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Post and test the full flow.
                </p>

                {/* Checklist */}
                <div className="space-y-2">
                  {TEST_CHECKLIST.map((item, index) => (
                    <label key={index} className="flex items-start gap-3 cursor-pointer group">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                        testChecked[index]
                          ? "bg-[#56bc77] border-[#56bc77]"
                          : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                      )}>
                        {testChecked[index] && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={testChecked[index] || false}
                        onChange={() => setTestChecked(prev => ({ ...prev, [index]: !prev[index] }))}
                        className="sr-only"
                      />
                      <span className={cn("text-sm", testChecked[index] && "text-muted-foreground line-through")}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Quick Reference Panel for Post Caption */}
                {outputs && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <span className="text-sm font-medium">📱 Your Post Caption from Step 1</span>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Post Caption</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(outputs.post_caption, 'Post Caption')}
                          >
                            {copiedSection === 'Post Caption' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{outputs.post_caption}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Troubleshooting */}
                <Collapsible open={showTroubleshooting} onOpenChange={setShowTroubleshooting}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">Troubleshooting</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-amber-600 transition-transform", showTroubleshooting && "rotate-180")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                      <div>
                        <p className="text-sm font-medium text-amber-900">DM not sending?</p>
                        <p className="text-sm text-amber-800">Check Instagram connection + workflow is ON</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-900">Email not arriving?</p>
                        <p className="text-sm text-amber-800">Check spam folder + workflow trigger</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-900">Page not loading?</p>
                        <p className="text-sm text-amber-800">Check domain connection + page is published</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Button
                  onClick={handleTestConfirm}
                  disabled={saving}
                  className="bg-[#56bc77] text-white hover:bg-[#4aa868]"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  It all works! 🎉
                </Button>
              </div>
            )}

            {testComplete && (
              <p className="text-sm text-muted-foreground">Test complete — your lead machine is live! ✓</p>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handleSkip}
            className="text-sm text-white/70 hover:text-white"
          >
            I'll do this later
          </button>
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
              'Content created',
              'Landing page built',
              'Email automation active',
              'Domain connected',
              'Social automation live',
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
              Ready to build a complete funnel with more emails and an offer? That's Phase 3.
            </p>
          </div>

          {/* Community Share Section */}
          {!hasSharedPhase('phase2') && (
            <CommunityShareSection
              channel="wins"
              prewrittenMessage={COMMUNITY_MESSAGES.phase2Complete}
              onShare={() => markPhaseShared('phase2')}
              onDismiss={() => {}}
            />
          )}

          <div className="flex gap-3 mt-4">
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

export default Phase2SocialTest;
