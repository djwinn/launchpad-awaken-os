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
import { ArrowLeft, Loader2, Copy, ChevronDown, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getPhase2Data, updatePhase2Data, type Phase2Data } from '@/lib/phase-data';
import awakenLogo from '@/assets/awaken-logo-white.png';

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
      'Make sure proxy is OFF (gray cloud) for MX records',
    ],
  },
];

const Phase2EmailSetup = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<Phase2Data | null>(null);
  
  const [subdomain, setSubdomain] = useState('mail');
  const [fromAddress, setFromAddress] = useState('');
  const [recordsAdded, setRecordsAdded] = useState(false);
  const [expandedRegistrar, setExpandedRegistrar] = useState<string | null>(null);

  useEffect(() => {
    if (!account?.location_id) return;

    const loadProgress = async () => {
      const data = await getPhase2Data(account.location_id);
      setProgress(data);
      if (data.email_subdomain) {
        setSubdomain(data.email_subdomain);
      }
      if (data.email_from_address) {
        setFromAddress(data.email_from_address);
      }
      if (data.email_domain_connected) {
        setRecordsAdded(true);
      }
      setLoadingData(false);
    };

    loadProgress();
  }, [account]);

  const domain = progress?.domain_value || 'yourdomain.com';

  const EMAIL_DNS_RECORDS = [
    { type: 'TXT', host: '@', value: 'v=spf1 include:mailgun.org ~all' },
    { type: 'TXT', host: 'email._domainkey', value: 'k=rsa; p=MIGfMA0GCSqGSIb3DQEBA...' },
    { type: 'TXT', host: '_dmarc', value: 'v=DMARC1; p=none;' },
    { type: 'MX', host: subdomain, value: 'mxa.mailgun.org (priority 10)' },
    { type: 'MX', host: subdomain, value: 'mxb.mailgun.org (priority 10)' },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: text,
    });
  };

  const handleComplete = async () => {
    if (!account?.location_id || !fromAddress) return;
    
    setSaving(true);
    await updatePhase2Data(account.location_id, {
      email_domain_connected: true,
      email_subdomain: subdomain,
      email_from_address: fromAddress,
    });
    await refreshAccount();
    setSaving(false);
    
    toast({
      title: "Email setup completed!",
      description: "Your email sending is configured.",
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

  const isComplete = progress?.email_domain_connected;

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
          <h1 className="text-2xl font-bold text-white">Set Up Email Sending</h1>
          <p className="text-white/70 mt-1">~15 minutes</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Why it matters */}
        <Card className="p-4 bg-white">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Why this matters:</strong> When someone opts in for your free resource, they need to receive it! 
            This ensures your emails land in inboxes, not spam folders.
          </p>
        </Card>

        {/* Step 1: Choose subdomain */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">Choose a sending subdomain</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This is the subdomain emails will be sent from. We suggest <strong>mail.{domain}</strong>
          </p>
          <RadioGroup value={subdomain} onValueChange={setSubdomain}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mail" id="mail" />
              <Label htmlFor="mail">mail.{domain}</Label>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <RadioGroupItem value="send" id="send" />
              <Label htmlFor="send">send.{domain}</Label>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <RadioGroupItem value="email" id="email" />
              <Label htmlFor="email">email.{domain}</Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Step 2: DNS Records */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">Add DNS Records</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add these 5 records to your domain's DNS settings:
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
                {EMAIL_DNS_RECORDS.map((record, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs">{record.type}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{record.host}</td>
                    <td className="py-3 font-mono text-xs break-all max-w-[200px] truncate">{record.value}</td>
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
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </Card>

        {/* Step 3: From address */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">Set your "From" address</h2>
          <p className="text-sm text-muted-foreground mb-4">
            What email should your messages come from?
          </p>
          <Input
            placeholder={`hello@${domain}`}
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value.toLowerCase())}
            className="mb-2"
          />
          <p className="text-xs text-muted-foreground">
            This is what people see and reply to. Make sure you can access this inbox!
          </p>
        </Card>

        {/* Confirm records */}
        <Card className="p-6 bg-white">
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
        </Card>

        {/* Warmup Warning */}
        {recordsAdded && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <Flame className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Warm up your new domain</h3>
                <p className="text-sm text-amber-800 mb-3">
                  New email domains need to build reputation. Start slow:
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
            disabled={!fromAddress || !recordsAdded || saving}
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

export default Phase2EmailSetup;
