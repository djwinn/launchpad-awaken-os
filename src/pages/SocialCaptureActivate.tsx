import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ArrowLeft, Loader2, Check, ExternalLink, AlertCircle, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import awakenLogo from '@/assets/awaken-logo-white.png';

const steps = [
  'Go to Automations → Workflows',
  'Find "⚡ Comment to DM — Book a Call" and click to edit',
  'Click on the Instagram trigger and select your Page',
  'Set "Post Type" to "Published Post"',
  'Under "Contains Phrase", add your keyword (see suggestions below)',
  'Turn ON "Track First Level Comments Only"',
  'Repeat steps 3-6 for the Facebook trigger',
  'Click on the Instagram Interactive Messenger action',
  'Edit the DM message (use the template below)',
  'Replace YOUR-BOOKING-LINK-HERE with your actual booking page URL',
  'Repeat steps 8-10 for the Facebook Interactive Messenger action',
  'Click Save, then Publish the workflow',
  'Test it! Post something with your keyword CTA, then comment from another account',
];

const DM_TEMPLATE = `Hey {{contact.first_name}}! 👋

Thanks for reaching out — I'd love to connect.

[One sentence about the transformation you help clients achieve. Example: "I help busy professionals finally get consistent with their health without restrictive diets."]

Here's where you can book a free discovery call with me:
YOUR-BOOKING-LINK-HERE`;

const KEYWORDS = [
  { word: 'BOOK', description: 'clear intent to book' },
  { word: 'YES', description: 'simple, high engagement' },
  { word: 'READY', description: 'creates commitment' },
  { word: 'CALL', description: 'direct and clear' },
];

const POST_CTAS = [
  '"Ready to [your transformation]? Comment BOOK below and I\'ll send you the link to grab a free call with me."',
  '"Struggling with [problem you solve]? Comment YES if you want to chat."',
  '"Want to finally [desired outcome]? Comment READY and I\'ll DM you the details."',
];

const SocialCaptureActivate = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(new Array(steps.length).fill(false));
  const [locationId, setLocationId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showKeywords, setShowKeywords] = useState(false);
  const [showDmTemplate, setShowDmTemplate] = useState(false);
  const [showPostCtas, setShowPostCtas] = useState(false);

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
        setIsComplete(d.social_capture_active ?? false);
        if (d.social_capture_active) {
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
      .update({ 
        social_capture_active: true,
        phase2_complete: true,
      } as any)
      .eq('user_email', user.email));

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

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
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
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Help Text */}
        <Card className="p-4 bg-blue-50 border-blue-200">
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

        {/* Open in AwakenOS Button */}
        <Button
          className="w-full bg-[#ebcc89] text-black hover:bg-[#d4b876]"
          onClick={() => window.open(getAwakenLink(), '_blank')}
        >
          Open in AwakenOS
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>

        {/* Steps Checklist */}
        <Card className="p-4 bg-white">
          <h3 className="font-semibold mb-4">Complete these steps:</h3>
          <div className="space-y-3">
            {steps.map((step, index) => {
              // Add expandable helpers after specific steps
              const showKeywordHelper = index === 4;
              const showDmHelper = index === 8;

              return (
                <div key={index}>
                  <div
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

                  {/* Keyword Suggestions Helper */}
                  {showKeywordHelper && (
                    <Collapsible open={showKeywords} onOpenChange={setShowKeywords} className="ml-8 mt-2">
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-[#827666] hover:text-[#6b5a4a]">
                        {showKeywords ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        Keyword suggestions
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <Card className="p-3 bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-2">Pick one to use as your trigger word:</p>
                          <div className="space-y-1">
                            {KEYWORDS.map((k) => (
                              <div key={k.word} className="flex items-center gap-2 text-sm">
                                <span className="font-mono font-semibold text-[#827666]">{k.word}</span>
                                <span className="text-muted-foreground">— {k.description}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* DM Template Helper */}
                  {showDmHelper && (
                    <Collapsible open={showDmTemplate} onOpenChange={setShowDmTemplate} className="ml-8 mt-2">
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-[#827666] hover:text-[#6b5a4a]">
                        {showDmTemplate ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        DM message template
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <Card className="p-3 bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground">Copy this and customize the [brackets]:</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyText(DM_TEMPLATE, 'DM template');
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <pre className="text-xs whitespace-pre-wrap font-mono bg-white p-2 rounded border">{DM_TEMPLATE}</pre>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Post CTA Examples */}
        <Collapsible open={showPostCtas} onOpenChange={setShowPostCtas}>
          <Card className="p-4 bg-white">
            <CollapsibleTrigger className="w-full flex items-center justify-between">
              <h3 className="font-semibold">Post CTA Examples</h3>
              {showPostCtas ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">Use these captions to drive comments on your posts:</p>
              <div className="space-y-3">
                {POST_CTAS.map((cta, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-muted/30 rounded">
                    <p className="text-sm flex-1 italic">{cta}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs flex-shrink-0"
                      onClick={() => copyText(cta.replace(/"/g, ''), 'CTA')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex gap-3">
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