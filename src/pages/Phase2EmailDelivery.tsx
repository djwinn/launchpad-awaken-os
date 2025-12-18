import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Check, ExternalLink, Play, ChevronRight, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getPhase2Data, updatePhase2Data, type Phase2Data } from '@/lib/phase-data';
import awakenLogo from '@/assets/awaken-logo-white.png';

const CHECKLIST_ITEMS = [
  'Create new workflow',
  'Set trigger: "Form Submitted" (your landing page form)',
  'Add action: "Send Email"',
  'Paste your Delivery Email from Step 1',
  'Add wait (1 day) + second "Send Email" with Follow-up Email',
  'Turn workflow ON',
];

const Phase2EmailDelivery = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<Phase2Data | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [showContentPanel, setShowContentPanel] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    if (!account?.location_id) return;

    const loadProgress = async () => {
      const data = await getPhase2Data(account.location_id);
      setProgress(data);
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

  const toggleItem = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
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

  const handleComplete = async () => {
    if (!account?.location_id) return;
    
    setSaving(true);
    await updatePhase2Data(account.location_id, {
      email_delivery_built: true,
    });
    await refreshAccount();
    setSaving(false);
    
    toast({
      title: "Email delivery set up!",
      description: "Ready for the next step.",
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

  const isComplete = progress?.email_delivery_built;
  const outputs = progress?.content_outputs;

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
          <h1 className="text-2xl font-bold text-white">Set Up Email Delivery</h1>
          <p className="text-white/70 mt-1">So your lead magnet actually gets delivered</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Why it matters */}
        <Card className="p-4 bg-white">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Why this matters:</strong> When someone enters their email, they need to immediately 
            receive your free resource. This automation handles that.
          </p>
        </Card>

        {/* Instructions */}
        <Card className="p-6 bg-white">
          <p className="text-muted-foreground mb-4">
            You'll create a simple automation: someone fills out form → they get your email with the lead magnet.
          </p>
          
          {/* CTA Button */}
          <Button 
            className="bg-[#ebcc89] text-black hover:bg-[#d4b876] mb-4"
            onClick={() => window.open(getDeepLink('/automations/workflows'), '_blank')}
          >
            Open Automation Builder
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground mb-6">
            Opens a new window. Close it when done to continue here.
          </p>

          {/* Video placeholder */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#827666]/20 flex items-center justify-center">
                <Play className="h-5 w-5 text-[#827666]" />
              </div>
              <div>
                <p className="font-medium text-sm">Watch: How to set up email delivery (~5 min)</p>
                <p className="text-xs text-muted-foreground">Video coming soon</p>
              </div>
            </div>
            <div className="aspect-video bg-muted-foreground/10 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Video tutorial coming soon</p>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <p className="font-medium text-sm">Checklist:</p>
            {CHECKLIST_ITEMS.map((item, index) => (
              <label
                key={index}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                  checkedItems[index]
                    ? "bg-[#56bc77] border-[#56bc77]"
                    : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                )}>
                  {checkedItems[index] && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={checkedItems[index] || false}
                  onChange={() => toggleItem(index)}
                  className="sr-only"
                />
                <span className={cn(
                  "text-sm",
                  checkedItems[index] && "text-muted-foreground line-through"
                )}>
                  {item}
                </span>
              </label>
            ))}
          </div>
        </Card>

        {/* Quick Reference Panel */}
        {outputs && (
          <Card className="bg-white overflow-hidden">
            <button
              onClick={() => setShowContentPanel(!showContentPanel)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium">📧 Your Emails from Step 1</span>
              <ChevronRight className={cn(
                "h-5 w-5 transition-transform",
                showContentPanel && "rotate-90"
              )} />
            </button>
            
            {showContentPanel && (
              <div className="border-t p-4 space-y-6">
                {/* Delivery Email */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Delivery Email</label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(
                        `Subject: ${outputs.delivery_email.subject}\n\n${outputs.delivery_email.body}`,
                        'Delivery Email'
                      )}
                    >
                      {copiedSection === 'Delivery Email' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span className="ml-1 text-xs">Copy All</span>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded-lg">
                      <span className="text-xs text-muted-foreground">Subject: </span>
                      <span className="text-sm font-medium">{outputs.delivery_email.subject}</span>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap">
                      {outputs.delivery_email.body}
                    </div>
                  </div>
                </div>
                
                {/* Follow-up Email */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Follow-up Email (Day 2)</label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(
                        `Subject: ${outputs.followup_email.subject}\n\n${outputs.followup_email.body}`,
                        'Follow-up Email'
                      )}
                    >
                      {copiedSection === 'Follow-up Email' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span className="ml-1 text-xs">Copy All</span>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded-lg">
                      <span className="text-xs text-muted-foreground">Subject: </span>
                      <span className="text-sm font-medium">{outputs.followup_email.subject}</span>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap">
                      {outputs.followup_email.body}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

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
            {isComplete ? 'Update & Continue' : "Workflow is Active ✓"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Phase2EmailDelivery;
