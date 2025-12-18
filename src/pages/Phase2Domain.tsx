import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ArrowLeft, Loader2, Check, Copy, ChevronDown, AlertTriangle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getPhase2Data, updatePhase2Data, type Phase2Data } from '@/lib/phase-data';
import awakenLogo from '@/assets/awaken-logo-white.png';

const DNS_RECORDS = {
  root: [
    { type: 'A', host: '@', value: '34.120.54.74' },
    { type: 'CNAME', host: 'www', value: 'funnels.msgsndr.com' },
  ],
  subdomain: [
    { type: 'CNAME', host: 'go', value: 'funnels.msgsndr.com' },
  ],
};

const REGISTRAR_INSTRUCTIONS = [
  {
    name: 'GoDaddy',
    steps: [
      'Sign in to GoDaddy and go to My Products',
      'Find your domain and click DNS',
      'Click Add under Records',
      'Select the record type and enter the values',
      'Save your changes',
    ],
  },
  {
    name: 'Namecheap',
    steps: [
      'Sign in to Namecheap and go to Domain List',
      'Click Manage next to your domain',
      'Click Advanced DNS tab',
      'Add a new record with the values shown',
      'Save all changes',
    ],
  },
  {
    name: 'Cloudflare',
    steps: [
      'Sign in to Cloudflare dashboard',
      'Select your domain',
      'Go to DNS settings',
      'Add the records shown',
      '⚠️ IMPORTANT: Turn OFF the orange proxy cloud — use DNS only (gray cloud)',
    ],
  },
];

const Phase2Domain = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<Phase2Data | null>(null);
  
  const [hasDomain, setHasDomain] = useState<'yes' | 'no'>('yes');
  const [domain, setDomain] = useState('');
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [recordsAdded, setRecordsAdded] = useState(false);
  const [expandedRegistrar, setExpandedRegistrar] = useState<string | null>(null);

  useEffect(() => {
    if (!account?.location_id) return;

    const loadProgress = async () => {
      const data = await getPhase2Data(account.location_id);
      setProgress(data);
      if (data.domain_value) {
        setDomain(data.domain_value);
        setIsSubdomain(data.domain_value.split('.').length > 2);
      }
      setHasDomain(data.has_domain ? 'yes' : 'no');
      if (data.domain_connected) {
        setRecordsAdded(true);
      }
      setLoadingData(false);
    };

    loadProgress();
  }, [account]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: text,
    });
  };

  const handleComplete = async () => {
    if (!account?.location_id || !domain) return;
    
    setSaving(true);
    await updatePhase2Data(account.location_id, {
      domain_connected: true,
      domain_value: domain,
      has_domain: hasDomain === 'yes',
    });
    await refreshAccount();
    setSaving(false);
    
    toast({
      title: "Domain step completed!",
      description: "Your domain is configured. DNS may take up to 24 hours to propagate.",
    });
    
    navigate('/phase2');
  };

  const handleSkip = () => {
    navigate('/phase2');
  };

  // Detect if domain looks like a subdomain
  useEffect(() => {
    const parts = domain.split('.').filter(Boolean);
    setIsSubdomain(parts.length > 2 || (parts.length === 2 && parts[0] !== 'www'));
  }, [domain]);

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
          <p className="text-white/70 mt-1">~15 minutes</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Why it matters */}
        <Card className="p-4 bg-white">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Why this matters:</strong> Your landing page needs a real URL. 
            Without this, you'd just be sending people a clunky system link that looks unprofessional and may get flagged as spam.
          </p>
        </Card>

        {/* Step 1: Do you have a domain? */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">Do you have a domain?</h2>
          <RadioGroup value={hasDomain} onValueChange={(v) => setHasDomain(v as 'yes' | 'no')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes">Yes, I own a domain</Label>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no">No, I need to get one</Label>
            </div>
          </RadioGroup>

          {hasDomain === 'no' && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                You'll need to purchase a domain from a registrar. Popular options include:
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="https://www.namecheap.com" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Namecheap <ExternalLink className="h-3 w-3" />
                </a>
                <a href="https://www.godaddy.com" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                  GoDaddy <ExternalLink className="h-3 w-3" />
                </a>
                <a href="https://www.cloudflare.com/products/registrar/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Cloudflare <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Once you have a domain, come back and continue this setup.
              </p>
            </div>
          )}
        </Card>

        {/* Step 2: Enter your domain */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">Enter your domain</h2>
          <Input
            placeholder="yourbrand.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, ''))}
            className="mb-2"
          />
          <p className="text-xs text-muted-foreground">
            Enter without http:// or www
          </p>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Already have a website? Use a subdomain like <strong>go.yourbrand.com</strong> or <strong>free.yourbrand.com</strong>
            </p>
          </div>
        </Card>

        {/* Step 3: DNS Records */}
        {domain && (
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4">Add DNS Records</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add these records to your domain's DNS settings:
            </p>

            {/* DNS Records Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Type</th>
                    <th className="text-left py-2 pr-4 font-medium">Host</th>
                    <th className="text-left py-2 font-medium">Value</th>
                    <th className="py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {(isSubdomain ? DNS_RECORDS.subdomain : DNS_RECORDS.root).map((record, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-mono text-xs">{record.type}</td>
                      <td className="py-3 pr-4 font-mono text-xs">
                        {isSubdomain ? domain.split('.')[0] : record.host}
                      </td>
                      <td className="py-3 font-mono text-xs break-all">{record.value}</td>
                      <td className="py-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(record.value)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cloudflare Warning */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg mb-6">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Cloudflare users:</strong> Turn OFF the orange proxy cloud — use DNS only (gray cloud)
              </p>
            </div>

            {/* Registrar Instructions */}
            <div className="space-y-2">
              <p className="text-sm font-medium mb-2">Need help? Select your registrar:</p>
              {REGISTRAR_INSTRUCTIONS.map((registrar) => (
                <Collapsible
                  key={registrar.name}
                  open={expandedRegistrar === registrar.name}
                  onOpenChange={(open) => setExpandedRegistrar(open ? registrar.name : null)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <span className="text-sm font-medium">{registrar.name} instructions</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      expandedRegistrar === registrar.name && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ol className="mt-2 ml-4 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      {registrar.steps.map((step, i) => (
                        <li key={i} className={step.includes('⚠️') ? 'text-amber-700 font-medium' : ''}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </Card>
        )}

        {/* Verification */}
        {domain && (
          <Card className="p-6 bg-white">
            <h2 className="text-lg font-semibold mb-4">Confirm DNS Records</h2>
            <div className="flex items-start gap-3 mb-4">
              <input
                type="checkbox"
                id="records-added"
                checked={recordsAdded}
                onChange={(e) => setRecordsAdded(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="records-added" className="text-sm text-muted-foreground">
                I've added the DNS records above
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              DNS can take a few minutes to 24 hours to update. You can continue and come back to verify later.
            </p>
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
            disabled={!domain || !recordsAdded || saving}
            className="bg-[#ebcc89] text-black hover:bg-[#d4b876]"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isComplete ? 'Update & Continue' : "I've Completed This ✓"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Phase2Domain;
