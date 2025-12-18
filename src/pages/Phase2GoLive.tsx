import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Check, ExternalLink, Play, Flame, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getPhase2Data, updatePhase2Data, type Phase2Data } from '@/lib/phase-data';
import awakenLogo from '@/assets/awaken-logo-white.png';

type SubStep = 'domain' | 'email' | 'publish';

const Phase2GoLive = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<Phase2Data | null>(null);
  
  // Domain state
  const [hasDomain, setHasDomain] = useState<boolean | null>(null);
  const [domainComplete, setDomainComplete] = useState(false);
  
  // Email state
  const [emailComplete, setEmailComplete] = useState(false);
  
  // Publish state
  const [publishComplete, setPublishComplete] = useState(false);

  useEffect(() => {
    if (!account?.location_id) return;

    const loadProgress = async () => {
      const data = await getPhase2Data(account.location_id);
      setProgress(data);
      setDomainComplete(data.domain_connected);
      setEmailComplete(data.email_sending_configured);
      setPublishComplete(data.page_published);
      if (data.has_domain !== undefined) {
        setHasDomain(data.has_domain);
      }
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

  const handleDomainConfirm = async () => {
    if (!account?.location_id) return;
    setSaving(true);
    await updatePhase2Data(account.location_id, {
      domain_connected: true,
      has_domain: hasDomain ?? true,
    });
    await refreshAccount();
    setDomainComplete(true);
    setSaving(false);
    toast({ title: "Domain connected!" });
  };

  const handleEmailConfirm = async () => {
    if (!account?.location_id) return;
    setSaving(true);
    await updatePhase2Data(account.location_id, {
      email_sending_configured: true,
    });
    await refreshAccount();
    setEmailComplete(true);
    setSaving(false);
    toast({ title: "Email sending configured!" });
  };

  const handlePublishConfirm = async () => {
    if (!account?.location_id) return;
    setSaving(true);
    await updatePhase2Data(account.location_id, {
      page_published: true,
    });
    await refreshAccount();
    setPublishComplete(true);
    setSaving(false);
    toast({ 
      title: "Page is live!",
      description: "Great job! Your landing page is now live.",
    });
    navigate('/phase2');
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

  const allComplete = domainComplete && emailComplete && publishComplete;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#605547' }}>
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
          <h1 className="text-2xl font-bold text-white">Go Live</h1>
          <p className="text-white/70 mt-1">Connect your domain and email so everything works</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Why it matters */}
        <Card className="p-4 bg-white">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Why this matters:</strong> Your landing page needs a real URL, and your emails 
            need to come from your domain — otherwise they'll hit spam folders.
          </p>
        </Card>

        {/* Part A: Connect Your Domain */}
        <Card className={cn(
          "bg-white overflow-hidden",
          domainComplete && "border border-[#56bc77]/30"
        )}>
          {domainComplete && (
            <div className="bg-[#56bc77] px-4 py-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Domain Connected</span>
            </div>
          )}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Part A: Connect Your Domain</h2>
            
            {!domainComplete && hasDomain === null && (
              <>
                <p className="text-muted-foreground mb-4">Do you have a domain?</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card
                    className="p-4 cursor-pointer hover:border-[#827666] transition-colors"
                    onClick={() => setHasDomain(false)}
                  >
                    <h3 className="font-medium mb-1">No, I need one</h3>
                    <p className="text-sm text-muted-foreground">Buy directly in your dashboard — easiest option</p>
                  </Card>
                  <Card
                    className="p-4 cursor-pointer hover:border-[#827666] transition-colors"
                    onClick={() => setHasDomain(true)}
                  >
                    <h3 className="font-medium mb-1">Yes, I have one</h3>
                    <p className="text-sm text-muted-foreground">Connect your existing domain</p>
                  </Card>
                </div>
              </>
            )}

            {!domainComplete && hasDomain === false && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Buy a domain directly in your dashboard — easiest option, no technical headaches.
                </p>
                <Button 
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                  onClick={() => window.open(getDeepLink('/settings/domain'), '_blank')}
                >
                  Buy Domain
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
                      <p className="font-medium text-sm">Watch: How to buy your domain (~2 min)</p>
                      <p className="text-xs text-muted-foreground">Video coming soon</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">Got your domain?</p>
                  <Button
                    onClick={handleDomainConfirm}
                    disabled={saving}
                    className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Yes, I've purchased my domain
                  </Button>
                </div>
              </div>
            )}

            {!domainComplete && hasDomain === true && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Connect your existing domain. You'll add a couple of DNS records — the video walks you through it.
                </p>
                <Button 
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                  onClick={() => window.open(getDeepLink('/settings/domain'), '_blank')}
                >
                  Connect Domain
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
                      <p className="font-medium text-sm">Watch: How to connect your domain (~5 min)</p>
                      <p className="text-xs text-muted-foreground">Video coming soon</p>
                    </div>
                  </div>
                </div>

                {/* Tip */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>💡 Tip:</strong> Already have a website on this domain? Use a subdomain like 
                    <code className="mx-1 px-1 bg-amber-100 rounded">go.yourbrand.com</code> or 
                    <code className="mx-1 px-1 bg-amber-100 rounded">free.yourbrand.com</code> — the video shows you how.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">Is your domain connected?</p>
                  <Button
                    onClick={handleDomainConfirm}
                    disabled={saving}
                    className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Yes, it's connected
                  </Button>
                </div>
              </div>
            )}

            {domainComplete && (
              <p className="text-sm text-muted-foreground">
                Your domain is connected! ✓
              </p>
            )}
          </div>
        </Card>

        {/* Part B: Set Up Email Sending */}
        <Card className={cn(
          "bg-white overflow-hidden",
          emailComplete && "border border-[#56bc77]/30"
        )}>
          {emailComplete && (
            <div className="bg-[#56bc77] px-4 py-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Email Sending Configured</span>
            </div>
          )}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Part B: Set Up Email Sending</h2>
            
            {!emailComplete && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  One more step — set up your email sending domain so your emails land in inboxes, not spam.
                </p>
                <Button 
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                  onClick={() => window.open(getDeepLink('/settings/email'), '_blank')}
                >
                  Open Email Settings
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
                      <p className="font-medium text-sm">Watch: How to set up email sending (~5 min)</p>
                      <p className="text-xs text-muted-foreground">Video coming soon</p>
                    </div>
                  </div>
                </div>

                {/* Warmup Warning */}
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <div className="flex items-start gap-3">
                    <Flame className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-2">Warm up your new sending domain</h3>
                      <p className="text-sm text-amber-800 mb-3">
                        New domains need to build reputation. Start slow:
                      </p>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• Days 1-2: Max 50 emails</li>
                        <li>• Days 3-4: Max 100 emails</li>
                        <li>• Week 2+: Gradually increase</li>
                      </ul>
                      <p className="text-sm text-amber-800 mt-3 font-medium">
                        Sending too fast = spam folder.
                      </p>
                    </div>
                  </div>
                </Card>

                <Button
                  onClick={handleEmailConfirm}
                  disabled={saving}
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Email sending is set up
                </Button>
              </div>
            )}

            {emailComplete && (
              <p className="text-sm text-muted-foreground">
                Email sending is configured! ✓
              </p>
            )}
          </div>
        </Card>

        {/* Part C: Publish Your Page */}
        <Card className={cn(
          "bg-white overflow-hidden",
          publishComplete && "border border-[#56bc77]/30"
        )}>
          {publishComplete && (
            <div className="bg-[#56bc77] px-4 py-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Page Published</span>
            </div>
          )}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Part C: Publish Your Page</h2>
            
            {!publishComplete && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Now publish your landing page — it'll be live at your new domain!
                </p>
                <Button 
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                  onClick={() => window.open(getDeepLink('/funnels'), '_blank')}
                >
                  Open Landing Page
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Opens a new window. Close it when done to continue here.
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Quick checklist:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Click Publish</li>
                    <li>• Test the URL works</li>
                  </ul>
                </div>

                <Button
                  onClick={handlePublishConfirm}
                  disabled={saving}
                  className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  My page is live! 🎉
                </Button>
              </div>
            )}

            {publishComplete && (
              <p className="text-sm text-muted-foreground">
                Your page is live! ✓
              </p>
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
          {allComplete && (
            <Button
              onClick={() => navigate('/phase2')}
              className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
            >
              Continue to Final Step
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Phase2GoLive;
