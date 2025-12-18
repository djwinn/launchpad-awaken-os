import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, ExternalLink, Play, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getPhase2Data, updatePhase2Data, type Phase2Data } from '@/lib/phase-data';
import awakenLogo from '@/assets/awaken-logo-white.png';

const Phase2Domain = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<Phase2Data | null>(null);
  
  const [selectedOption, setSelectedOption] = useState<'buy' | 'connect' | null>(null);

  useEffect(() => {
    if (!account?.location_id) return;

    const loadProgress = async () => {
      const data = await getPhase2Data(account.location_id);
      setProgress(data);
      // Pre-select based on previous choice
      if (data.has_domain === false) {
        setSelectedOption('buy');
      } else if (data.has_domain === true) {
        setSelectedOption('connect');
      }
      setLoadingData(false);
    };

    loadProgress();
  }, [account]);

  const handleComplete = async (hasDomain: boolean) => {
    if (!account?.location_id) return;
    
    setSaving(true);
    await updatePhase2Data(account.location_id, {
      domain_connected: true,
      has_domain: hasDomain,
    });
    await refreshAccount();
    setSaving(false);
    
    toast({
      title: "Domain step completed!",
      description: "Great job! Moving to the next step.",
    });
    
    navigate('/phase2');
  };

  const handleSkip = () => {
    navigate('/phase2');
  };

  const getDeepLink = () => {
    if (account?.location_id) {
      return `https://app.awaken.digital/v2/location/${account.location_id}/settings/domain`;
    }
    return 'https://app.awaken.digital';
  };

  if (loadingData || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isComplete = progress?.domain_connected;

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
          <h1 className="text-2xl font-bold text-white">Connect Your Domain</h1>
          <p className="text-white/70 mt-1">Step 1 of 4</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Why it matters */}
        <Card className="p-4 bg-white">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Why this matters:</strong> Your landing page needs a real URL. 
            Without this, you'd be sending people an ugly system link that looks unprofessional.
          </p>
        </Card>

        {/* Question */}
        <div className="text-white text-lg font-medium">
          Do you already own a domain?
        </div>

        {/* Option Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Option A: No, I need to get one */}
          <Card 
            className={cn(
              "p-6 bg-white cursor-pointer transition-all border-2",
              selectedOption === 'buy' 
                ? "border-[#ebcc89] ring-2 ring-[#ebcc89]/20" 
                : "border-transparent hover:border-muted"
            )}
            onClick={() => setSelectedOption('buy')}
          >
            <h3 className="font-semibold text-lg mb-2">No, I need to get one</h3>
            <p className="text-sm text-muted-foreground">
              I don't have a domain yet and need to purchase one.
            </p>
          </Card>

          {/* Option B: Yes, I already have one */}
          <Card 
            className={cn(
              "p-6 bg-white cursor-pointer transition-all border-2",
              selectedOption === 'connect' 
                ? "border-[#ebcc89] ring-2 ring-[#ebcc89]/20" 
                : "border-transparent hover:border-muted"
            )}
            onClick={() => setSelectedOption('connect')}
          >
            <h3 className="font-semibold text-lg mb-2">Yes, I already have one</h3>
            <p className="text-sm text-muted-foreground">
              I own a domain and want to connect it.
            </p>
          </Card>
        </div>

        {/* Expanded Content for Option A: Buy Domain */}
        {selectedOption === 'buy' && (
          <Card className="p-6 bg-white space-y-5">
            <div>
              <h3 className="font-semibold text-lg mb-2">Buy a domain directly in your dashboard</h3>
              <p className="text-sm text-muted-foreground">
                This is the easiest option — no DNS headaches, it just works.
              </p>
            </div>

            {/* CTA Button */}
            <Button 
              className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
              onClick={() => window.open(getDeepLink(), '_blank')}
            >
              Buy Domain
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground -mt-3">
              Opens a new window. Close it when done to continue here.
            </p>

            {/* Video Placeholder */}
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center mx-auto mb-3">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Video to be added</p>
                </div>
              </div>
              <div className="p-3 bg-muted/30 border-t">
                <p className="text-sm font-medium">Watch: How to buy your domain (~2 min)</p>
              </div>
            </div>

            {/* Confirmation */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Got your domain?</p>
              <Button 
                onClick={() => handleComplete(false)}
                disabled={saving}
                className="bg-[#56bc77] hover:bg-[#4aa868] text-white"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Yes, I've purchased my domain
              </Button>
            </div>
          </Card>
        )}

        {/* Expanded Content for Option B: Connect Existing Domain */}
        {selectedOption === 'connect' && (
          <Card className="p-6 bg-white space-y-5">
            <div>
              <h3 className="font-semibold text-lg mb-2">Connect your existing domain</h3>
              <p className="text-sm text-muted-foreground">
                You'll add a couple of DNS records in your domain provider (GoDaddy, Namecheap, Cloudflare, etc). 
                The video walks you through it.
              </p>
            </div>

            {/* CTA Button */}
            <Button 
              className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
              onClick={() => window.open(getDeepLink(), '_blank')}
            >
              Connect Domain
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground -mt-3">
              Opens a new window. Close it when done to continue here.
            </p>

            {/* Video Placeholder */}
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-black/10 flex items-center justify-center mx-auto mb-3">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Video to be added</p>
                </div>
              </div>
              <div className="p-3 bg-muted/30 border-t">
                <p className="text-sm font-medium">Watch: How to connect your domain (~5 min)</p>
              </div>
            </div>

            {/* Tip Box */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
              <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Already have a website on this domain?</strong> Use a subdomain like{' '}
                <span className="font-mono">go.yourbrand.com</span> or{' '}
                <span className="font-mono">free.yourbrand.com</span> — the video shows you how.
              </p>
            </div>

            {/* Confirmation */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Is your domain connected?</p>
              <Button 
                onClick={() => handleComplete(true)}
                disabled={saving}
                className="bg-[#56bc77] hover:bg-[#4aa868] text-white"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Yes, it's connected
              </Button>
            </div>
          </Card>
        )}

        {/* Skip Link */}
        <div className="flex justify-start pt-4">
          <button
            onClick={handleSkip}
            className="text-sm text-white/70 hover:text-white"
          >
            I'll do this later
          </button>
        </div>
      </main>
    </div>
  );
};

export default Phase2Domain;
