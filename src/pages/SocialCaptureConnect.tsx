import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import awakenLogo from '@/assets/awaken-logo-white.png';

const steps = [
  'Go to Settings → Integrations',
  'Find the Facebook–Instagram card and click Connect',
  'Log in to Facebook when prompted',
  'Select the Facebook Page you want to connect',
  'Make sure your Instagram Business account is linked to that Facebook Page',
  'Grant all permissions when asked',
  'Verify both Facebook and Instagram show as connected',
];

const SocialCaptureConnect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(new Array(steps.length).fill(false));
  const [locationId, setLocationId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!user?.email || loading) return;

    const loadData = async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_email', user.email)
        .maybeSingle();

      if (data) {
        const d = data as any;
        setLocationId(d.location_id);
        setIsComplete(d.social_accounts_connected ?? false);
        if (d.social_accounts_connected) {
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

    await (supabase
      .from('user_progress')
      .update({ social_accounts_connected: true } as any)
      .eq('user_email', user.email));

    toast({ title: 'Social accounts connected!' });
    setIsComplete(true);
    navigate('/social-capture');
  };

  const getAwakenLink = () => {
    if (locationId) {
      return `https://app.awaken.digital/v2/location/${locationId}/settings/integrations`;
    }
    return 'https://app.awaken.digital';
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
          <h1 className="text-xl font-bold text-white">Connect Your Social Accounts</h1>
          <p className="text-white/70 text-sm">Link Instagram and Facebook to enable automation</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Help Text */}
        <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Important</p>
              <p className="text-sm text-amber-700 mt-1">
                Your Instagram must be a Business account (not Personal or Creator) and must be linked to your Facebook Page. This is required by Meta for the automation to work.
              </p>
            </div>
          </div>
        </Card>

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

export default SocialCaptureConnect;