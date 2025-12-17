import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Check, ExternalLink, AlertCircle, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import awakenLogo from '@/assets/awaken-logo-white.png';

const steps = [
  'Go to Automations → Workflows',
  'Find "⚡ Comment to DM — Book a Call" and click to edit',
  'Click on the Instagram trigger and select your Page from "Page Is"',
  'Set "Post Type" to "Published Post"',
  'Under "Contains Phrase", add your chosen keyword (e.g., BOOK)',
  'Turn ON "Track First Level Comments Only"',
  'Repeat steps 3-6 for the Facebook trigger',
  'Click on the Instagram Interactive Messenger action',
  'Edit the message — paste in your DM Message from the toolkit',
  'Replace YOUR-BOOKING-LINK-HERE with your actual booking page URL',
  'Repeat steps 8-10 for the Facebook Interactive Messenger action',
  'Click Save, then Publish the workflow',
  'Test it! Post something with your keyword CTA, then comment your keyword from another account',
];

const SocialCaptureActivate = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(new Array(steps.length).fill(false));
  const [locationId, setLocationId] = useState<string | null>(null);
  const [toolkit, setToolkit] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!user?.email || loading) return;

    const loadData = async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('location_id, social_capture_active, social_capture_toolkit')
        .eq('user_email', user.email)
        .maybeSingle();

      if (data) {
        setLocationId(data.location_id);
        setToolkit((data as any).social_capture_toolkit);
        setIsComplete((data as any).social_capture_active ?? false);
        if ((data as any).social_capture_active) {
          setCheckedSteps(new Array(steps.length).fill(true));
        }
      }
      setLoadingData(false);
    };

    loadData();
  }, [user, loading]);

  const handleStepToggle = (index: number) => {
    if (isComplete) return;
    const newChecked = [...checkedSteps];
    newChecked[index] = !newChecked[index];
    setCheckedSteps(newChecked);
  };

  const allChecked = checkedSteps.every(Boolean);

  const handleComplete = async () => {
    if (!user?.email || !allChecked) return;

    await supabase
      .from('user_progress')
      .update({ 
        social_capture_active: true,
        phase2_complete: true,
      })
      .eq('user_email', user.email);

    toast({ title: 'Social capture activated!' });
    setIsComplete(true);
    navigate('/social-capture');
  };

  const getAwakenLink = () => {
    if (locationId) {
      return `https://app.awaken.digital/v2/location/${locationId}/automation/workflows`;
    }
    return 'https://app.awaken.digital';
  };

  const copyToolkit = () => {
    if (toolkit) {
      navigator.clipboard.writeText(toolkit);
      toast({ title: 'Toolkit copied to clipboard!' });
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
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10" style={{ backgroundColor: 'rgba(96, 85, 71, 0.9)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <img src={awakenLogo} alt="AwakenOS" className="h-8" />
            <Button variant="ghost" size="sm" onClick={() => navigate('/social-capture')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-xl font-bold text-white">Activate Social Capture</h1>
          <p className="text-white/70 text-sm">Set up your comment-to-DM automation</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Help Text */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">How it works</p>
              <p className="text-sm text-blue-700 mt-1">
                This workflow sends an automatic DM to anyone who comments your keyword on your posts. The DM includes a button linking to your booking page.
              </p>
            </div>
          </div>
        </Card>

        {/* Toolkit Reference */}
        {toolkit && (
          <Card className="p-4 mb-6 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Your Toolkit (for reference)</h3>
              <Button variant="outline" size="sm" onClick={copyToolkit}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto bg-muted/30 rounded p-2">
              <pre className="text-xs whitespace-pre-wrap font-mono">{toolkit}</pre>
            </div>
          </Card>
        )}

        {/* Open in AwakenOS Button */}
        <Button
          className="w-full mb-6 bg-[#ebcc89] text-black hover:bg-[#d4b876]"
          onClick={() => window.open(getAwakenLink(), '_blank')}
        >
          Open in AwakenOS
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>

        {/* Steps Checklist */}
        <Card className="p-4 bg-white">
          <h3 className="font-semibold mb-4">Complete these steps:</h3>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                  checkedSteps[index] ? 'bg-[#56bc77]/10' : 'hover:bg-muted/50',
                  isComplete && 'cursor-default'
                )}
                onClick={() => handleStepToggle(index)}
              >
                <Checkbox
                  checked={checkedSteps[index]}
                  onCheckedChange={() => handleStepToggle(index)}
                  disabled={isComplete}
                  className="mt-0.5"
                />
                <span className={cn(
                  'text-sm',
                  checkedSteps[index] && 'text-[#56bc77]'
                )}>
                  {index + 1}. {step}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 bg-white"
            onClick={() => navigate('/social-capture')}
          >
            I'll do this later
          </Button>
          <Button
            className={cn(
              'flex-1',
              allChecked && !isComplete
                ? 'bg-[#56bc77] hover:bg-[#4aa868] text-white'
                : 'bg-[#ebcc89] text-black hover:bg-[#d4b876]'
            )}
            disabled={!allChecked || isComplete}
            onClick={handleComplete}
          >
            {isComplete ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Complete
              </>
            ) : (
              "I've Completed This ✓"
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SocialCaptureActivate;