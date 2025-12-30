import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, Loader2, Check, ChevronDown, ChevronUp, Play, Copy, X, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getPhase3Data, updatePhase3Data } from '@/lib/phase-data';
import { CommunityShareSection } from '@/components/community/CommunityShareSection';
import { COMMUNITY_MESSAGES } from '@/lib/community-share';
import { useCommunityShare } from '@/hooks/useCommunityShare';
import awakenLogo from '@/assets/awaken-logo-white.png';

interface BuildProgress {
  landing_page: boolean;
  lead_magnet: boolean;
  email_sequence: boolean;
  social_capture: boolean;
  lead_magnet_workflow: boolean;
}

interface EditableContent {
  landingPage: {
    heroHeadline: string;
    heroSubheadline: string;
    heroButtonText: string;
    problemIntro: string;
    painPoints: string[];
    transformationIntro: string;
    transformationPoints: string[];
    benefitsTitle: string;
    benefits: string[];
    aboutHeadline: string;
    aboutSubheadline: string;
    aboutBio: string;
    ctaHeadline: string;
    ctaButtonText: string;
    ctaBelowText: string;
  };
  leadMagnet: {
    title: string;
    format: string;
    introduction: string;
    points: { title: string; content: string }[];
    conclusion: string;
  };
  emails: {
    title: string;
    day: string;
    subjectLine: string;
    body: string;
  }[];
  socialCapture: {
    dmMessage: string;
    commentReplies: string[];
    postCTAs: { hook: string; content: string }[];
    keywords: string[];
  };
  leadMagnetWorkflow: {
    dmMessage: string;
    postCTAs: string[];
  };
}

const DEFAULT_CONTENT: EditableContent = {
  landingPage: {
    heroHeadline: '',
    heroSubheadline: '',
    heroButtonText: 'Get My Free Guide',
    problemIntro: '',
    painPoints: ['', '', '', ''],
    transformationIntro: '',
    transformationPoints: ['', '', '', ''],
    benefitsTitle: 'Inside your free guide:',
    benefits: ['', '', '', '', ''],
    aboutHeadline: '',
    aboutSubheadline: '',
    aboutBio: '',
    ctaHeadline: '',
    ctaButtonText: 'Get My Free Guide',
    ctaBelowText: 'Your info is safe. Unsubscribe anytime.',
  },
  leadMagnet: {
    title: '',
    format: '',
    introduction: '',
    points: [],
    conclusion: '',
  },
  emails: [],
  socialCapture: {
    dmMessage: '',
    commentReplies: ['Just sent you a DM! 💫', 'Check your messages ✨', 'Sent you the details — check your DMs!', 'Message incoming! 📩', 'Just DMed you the link 🙌'],
    postCTAs: [],
    keywords: ['FREE', 'YES', 'GUIDE', 'SEND'],
  },
  leadMagnetWorkflow: {
    dmMessage: '',
    postCTAs: [],
  },
};

const FunnelBuild = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [blueprint, setBlueprint] = useState<string | null>(null);
  const [originalBlueprint, setOriginalBlueprint] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [progress, setProgress] = useState<BuildProgress>({
    landing_page: false,
    lead_magnet: false,
    email_sequence: false,
    social_capture: false,
    lead_magnet_workflow: false,
  });
  const [openSections, setOpenSections] = useState<string[]>(['landing_page']);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const { hasSharedPhase, markPhaseShared } = useCommunityShare(account?.location_id);
  const [content, setContent] = useState<EditableContent>(DEFAULT_CONTENT);

  // Parse blueprint into structured content
  const parseBlueprint = useCallback((blueprintText: string): EditableContent => {
    const parsed = { ...DEFAULT_CONTENT };
    
    try {
      // Parse Landing Page Copy
      const heroMatch = blueprintText.match(/## HERO SECTION[\s\S]*?\*\*Headline:\*\*\s*([^\n]+)[\s\S]*?\*\*Subheadline:\*\*\s*([^\n]+)[\s\S]*?\*\*CTA Button Text:\*\*\s*([^\n]+)/);
      if (heroMatch) {
        parsed.landingPage.heroHeadline = heroMatch[1].trim();
        parsed.landingPage.heroSubheadline = heroMatch[2].trim();
        parsed.landingPage.heroButtonText = heroMatch[3].trim();
      }

      // Parse Problem Section
      const problemMatch = blueprintText.match(/## DOES THIS SOUND LIKE YOU\?[\s\S]*?\*\*Intro:\*\*\s*([^\n]+)[\s\S]*?\*\*Pain Points:\*\*([\s\S]*?)(?=-----|\n##)/);
      if (problemMatch) {
        parsed.landingPage.problemIntro = problemMatch[1].trim();
        const painPoints = problemMatch[2].match(/• ([^\n]+)/g) || [];
        parsed.landingPage.painPoints = painPoints.map(p => p.replace('• ', '').trim());
      }

      // Parse Transformation Section
      const transformMatch = blueprintText.match(/## IMAGINE[\s\S]*?\*\*Intro:\*\*\s*([^\n]+)[\s\S]*?\*\*Transformation Points:\*\*([\s\S]*?)(?=-----|\n##)/);
      if (transformMatch) {
        parsed.landingPage.transformationIntro = transformMatch[1].trim();
        const transformPoints = transformMatch[2].match(/• ([^\n]+)/g) || [];
        parsed.landingPage.transformationPoints = transformPoints.map(p => p.replace('• ', '').trim());
      }

      // Parse Benefits Section
      const benefitsMatch = blueprintText.match(/## WHAT YOU'LL GET[\s\S]*?\*\*Section Title:\*\*\s*([^\n]+)[\s\S]*?\*\*Benefits:\*\*([\s\S]*?)(?=-----|\n##)/);
      if (benefitsMatch) {
        parsed.landingPage.benefitsTitle = benefitsMatch[1].trim();
        const benefits = benefitsMatch[2].match(/✓ ([^\n]+)/g) || [];
        parsed.landingPage.benefits = benefits.map(b => b.replace('✓ ', '').trim());
      }

      // Parse About Section
      const aboutMatch = blueprintText.match(/## ABOUT ME[\s\S]*?\*\*Headline:\*\*\s*([^\n]+)[\s\S]*?\*\*Subheadline:\*\*\s*([^\n]+)[\s\S]*?\*\*Bio:\*\*\s*([\s\S]*?)(?=-----|\n##)/);
      if (aboutMatch) {
        parsed.landingPage.aboutHeadline = aboutMatch[1].trim();
        parsed.landingPage.aboutSubheadline = aboutMatch[2].trim();
        parsed.landingPage.aboutBio = aboutMatch[3].trim();
      }

      // Parse Final CTA
      const ctaMatch = blueprintText.match(/## FINAL CTA[\s\S]*?\*\*Headline:\*\*\s*([^\n]+)[\s\S]*?\*\*CTA Button Text:\*\*\s*([^\n]+)[\s\S]*?\*\*Below Form Text:\*\*\s*([^\n]+)/);
      if (ctaMatch) {
        parsed.landingPage.ctaHeadline = ctaMatch[1].trim();
        parsed.landingPage.ctaButtonText = ctaMatch[2].trim();
        parsed.landingPage.ctaBelowText = ctaMatch[3].trim();
      }

      // Parse Lead Magnet Content
      const leadMagnetSection = blueprintText.match(/SECTION 2: LEAD MAGNET CONTENT OUTLINE[\s\S]*?## ([^\n]+)[\s\S]*?\*Format: ([^\*]+)\*[\s\S]*?### Introduction\s*([\s\S]*?)(?=-----|\n###)/);
      if (leadMagnetSection) {
        parsed.leadMagnet.title = leadMagnetSection[1].trim();
        parsed.leadMagnet.format = leadMagnetSection[2].trim();
        parsed.leadMagnet.introduction = leadMagnetSection[3].trim();
      }

      // Parse Lead Magnet Points
      const pointsMatches = blueprintText.matchAll(/### (\d+)\. ([^\n]+)\s*\n\s*([^\n#]+(?:\n[^\n#]+)*)/g);
      const points: { title: string; content: string }[] = [];
      for (const match of pointsMatches) {
        points.push({ title: match[2].trim(), content: match[3].trim() });
      }
      if (points.length > 0) {
        parsed.leadMagnet.points = points;
      }

      // Parse Conclusion
      const conclusionMatch = blueprintText.match(/### Conclusion \+ Next Step\s*([\s\S]*?)(?=═══|$)/);
      if (conclusionMatch) {
        parsed.leadMagnet.conclusion = conclusionMatch[1].trim();
      }

      // Parse Emails
      const emailRegex = /## EMAIL (\d+): ([^\n]+)\s*\*Send: ([^\*]+)\*[\s\S]*?\*\*Subject Line(?:[^:]*)?:\*\*\s*([^\n]+)[\s\S]*?\*\*Body:\*\*\s*([\s\S]*?)(?=-----\s*\n\s*## EMAIL|\n═══|$)/g;
      const emails: { title: string; day: string; subjectLine: string; body: string }[] = [];
      let emailMatch;
      while ((emailMatch = emailRegex.exec(blueprintText)) !== null) {
        emails.push({
          title: `Email ${emailMatch[1]}: ${emailMatch[2].trim()}`,
          day: emailMatch[3].trim(),
          subjectLine: emailMatch[4].trim(),
          body: emailMatch[5].trim(),
        });
      }
      if (emails.length > 0) {
        parsed.emails = emails;
      }

      // Parse Social Capture
      const dmMatch = blueprintText.match(/## DM MESSAGE TEMPLATE[\s\S]*?\*\*For Comment-to-DM Automation:\*\*\s*([\s\S]*?)(?=-----|\n##)/);
      if (dmMatch) {
        parsed.socialCapture.dmMessage = dmMatch[1].trim();
      }

      // Parse Post CTAs
      const ctasMatch = blueprintText.match(/## POST CTA EXAMPLES[\s\S]*?\*\*Problem-Aware Hook:\*\*\s*([\s\S]*?)\*\*Aspiration Hook:\*\*\s*([\s\S]*?)\*\*Curiosity Hook:\*\*\s*([\s\S]*?)(?=-----|\n##)/);
      if (ctasMatch) {
        parsed.socialCapture.postCTAs = [
          { hook: 'Problem Hook', content: ctasMatch[1].trim() },
          { hook: 'Aspiration Hook', content: ctasMatch[2].trim() },
          { hook: 'Curiosity Hook', content: ctasMatch[3].trim() },
        ];
      }

      // Parse Lead Magnet Workflow DM (if different section exists)
      const leadMagnetDmMatch = blueprintText.match(/LEAD MAGNET DM[\s\S]*?(?:Hey|Hi) {{contact\.first_name}}[\s\S]*?(?=-----|\n##|$)/);
      if (leadMagnetDmMatch) {
        parsed.leadMagnetWorkflow.dmMessage = leadMagnetDmMatch[0].trim();
      } else if (parsed.socialCapture.dmMessage) {
        // Use social capture DM as base for lead magnet workflow
        parsed.leadMagnetWorkflow.dmMessage = parsed.socialCapture.dmMessage;
      }

      parsed.leadMagnetWorkflow.postCTAs = [
        `Want my free ${parsed.leadMagnet.title || '[Lead Magnet Title]'}? Comment GUIDE below and I'll DM it to you!`,
        `I put together a free ${parsed.leadMagnet.format || 'guide'} on [topic]. Comment FREE if you want yours!`,
      ];

    } catch (error) {
      console.error('Error parsing blueprint:', error);
    }
    
    return parsed;
  }, []);

  useEffect(() => {
    if (!account?.location_id) return;

    const loadData = async () => {
      const phase3Data = await getPhase3Data(account.location_id);
      
      setBlueprint(phase3Data.funnel_blueprint ?? null);
      setOriginalBlueprint(phase3Data.funnel_blueprint ?? null);
      
      if (!phase3Data.funnel_craft_complete) {
        toast({
          title: "Complete Craft Your Funnel First",
          description: "You need to craft your funnel before you can build it.",
          variant: "destructive",
        });
        navigate('/funnel');
        return;
      }

      // Parse the blueprint into editable content
      if (phase3Data.funnel_blueprint) {
        const parsedContent = parseBlueprint(phase3Data.funnel_blueprint);
        setContent(parsedContent);
      }
      setLoadingData(false);
    };

    loadData();
  }, [account, navigate, toast, parseBlueprint]);

  const completedCount = Object.values(progress).filter(Boolean).length;
  const progressPercentage = Math.round((completedCount / 5) * 100);
  const allComplete = completedCount === 5;

  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const handleCheckboxChange = async (id: string, checked: boolean) => {
    const newProgress = { ...progress, [id]: checked };
    setProgress(newProgress);

    const newCompletedCount = Object.values(newProgress).filter(Boolean).length;
    const isAllComplete = newCompletedCount === 5;

    if (account?.location_id) {
      await updatePhase3Data(account.location_id, {
        funnel_build_complete: isAllComplete,
      });
      await refreshAccount();
    }

    if (checked) {
      toast({ title: "Section completed!" });
      
      // Collapse completed section and open next
      const sections = ['landing_page', 'lead_magnet', 'email_sequence', 'social_capture', 'lead_magnet_workflow'];
      const currentIndex = sections.indexOf(id);
      if (currentIndex < sections.length - 1) {
        const nextId = sections[currentIndex + 1];
        setOpenSections(prev => prev.filter(s => s !== id).concat(nextId));
      }
    }

    if (isAllComplete) {
      setConfettiVisible(true);
      setTimeout(() => {
        setConfettiVisible(false);
        setShowCelebration(true);
      }, 3000);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copied to clipboard ✓` });
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const copyAllLandingPage = () => {
    const lp = content.landingPage;
    const text = `HERO SECTION
Headline: ${lp.heroHeadline}
Subheadline: ${lp.heroSubheadline}
Button Text: ${lp.heroButtonText}

DOES THIS SOUND LIKE YOU?
${lp.problemIntro}
${lp.painPoints.map(p => `• ${p}`).join('\n')}

IMAGINE...
${lp.transformationIntro}
${lp.transformationPoints.map(p => `• ${p}`).join('\n')}

WHAT YOU'LL GET
${lp.benefitsTitle}
${lp.benefits.map(b => `✓ ${b}`).join('\n')}

ABOUT ME
${lp.aboutHeadline}
${lp.aboutSubheadline}
${lp.aboutBio}

FINAL CTA
${lp.ctaHeadline}
Button: ${lp.ctaButtonText}
${lp.ctaBelowText}`;
    copyToClipboard(text, 'All landing page content');
  };

  const copyAllLeadMagnet = () => {
    const lm = content.leadMagnet;
    const text = `${lm.title}
Format: ${lm.format}

INTRODUCTION
${lm.introduction}

${lm.points.map((p, i) => `${i + 1}. ${p.title}\n${p.content}`).join('\n\n')}

CONCLUSION + NEXT STEP
${lm.conclusion}`;
    copyToClipboard(text, 'All lead magnet content');
  };

  const copyAllEmails = () => {
    const text = content.emails.map(e => 
      `${e.title} (${e.day})\n\nSubject: ${e.subjectLine}\n\n${e.body}`
    ).join('\n\n═══════════════════════════════════════\n\n');
    copyToClipboard(text, 'All emails');
  };

  const updateContent = <K extends keyof EditableContent>(
    section: K,
    field: string,
    value: any
  ) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateArrayItem = <K extends keyof EditableContent>(
    section: K,
    field: string,
    index: number,
    value: string
  ) => {
    setContent(prev => {
      const sectionData = prev[section] as any;
      const array = [...sectionData[field]];
      array[index] = value;
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: array,
        },
      };
    });
  };

  const addArrayItem = <K extends keyof EditableContent>(
    section: K,
    field: string,
    defaultValue: string = ''
  ) => {
    setContent(prev => {
      const sectionData = prev[section] as any;
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: [...sectionData[field], defaultValue],
        },
      };
    });
  };

  if (loadingData || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <img src={awakenLogo} alt="AwakenOS" className="h-8" />
            <Button variant="ghost" size="sm" onClick={() => navigate('/funnel')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-white">Build Your Funnel</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Motivational Banner */}
        {showBanner && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 relative">
            <button 
              onClick={() => setShowBanner(false)}
              className="absolute top-2 right-2 text-amber-600 hover:text-amber-800"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-amber-800 font-medium">💡 Your content is 80% of the way there!</p>
            <p className="text-amber-700 text-sm mt-1">
              Feel free to tweak anything to make it sound more like you. But remember — done is better than perfect. 
              Don't let editing stop you from publishing and starting to attract clients.
            </p>
          </div>
        )}

        {/* Progress Section */}
        <div className="mb-8 bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-foreground">Build Your Funnel</span>
            <span className="text-sm text-muted-foreground">{completedCount} of 5 complete — {progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Build Sections */}
        <div className="space-y-4">
          {/* Section 1: Landing Page Copy */}
          <BuildSection
            id="landing_page"
            title="1. Landing Page Copy"
            subtitle="Create your lead magnet opt-in page"
            videoTitle="How to Build Your Landing Page"
            videoDuration="5:32"
            isComplete={progress.landing_page}
            isOpen={openSections.includes('landing_page')}
            onToggle={() => toggleSection('landing_page')}
            onCheckChange={(checked) => handleCheckboxChange('landing_page', checked)}
            checkLabel="I've built my landing page in the system"
            onCopyAll={copyAllLandingPage}
          >
            <div className="space-y-6">
              {/* Hero Section */}
              <EditableSubsection
                title="HERO SECTION"
                onCopy={() => copyToClipboard(
                  `Headline: ${content.landingPage.heroHeadline}\nSubheadline: ${content.landingPage.heroSubheadline}\nButton: ${content.landingPage.heroButtonText}`,
                  'Hero section'
                )}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Headline</label>
                    <Input
                      value={content.landingPage.heroHeadline}
                      onChange={(e) => updateContent('landingPage', 'heroHeadline', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subheadline</label>
                    <Input
                      value={content.landingPage.heroSubheadline}
                      onChange={(e) => updateContent('landingPage', 'heroSubheadline', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Button Text</label>
                    <Input
                      value={content.landingPage.heroButtonText}
                      onChange={(e) => updateContent('landingPage', 'heroButtonText', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </EditableSubsection>

              {/* Problem Section */}
              <EditableSubsection
                title="DOES THIS SOUND LIKE YOU?"
                onCopy={() => copyToClipboard(
                  `${content.landingPage.problemIntro}\n\n${content.landingPage.painPoints.map(p => `• ${p}`).join('\n')}`,
                  'Problem section'
                )}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Intro</label>
                    <Textarea
                      value={content.landingPage.problemIntro}
                      onChange={(e) => updateContent('landingPage', 'problemIntro', e.target.value)}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pain Points</label>
                    <div className="space-y-2 mt-1">
                      {content.landingPage.painPoints.map((point, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-muted-foreground">•</span>
                          <Input
                            value={point}
                            onChange={(e) => updateArrayItem('landingPage', 'painPoints', i, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-muted-foreground"
                      onClick={() => addArrayItem('landingPage', 'painPoints', '')}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add another pain point
                    </Button>
                  </div>
                </div>
              </EditableSubsection>

              {/* Transformation Section */}
              <EditableSubsection
                title="IMAGINE X FROM NOW…"
                onCopy={() => copyToClipboard(
                  `${content.landingPage.transformationIntro}\n\n${content.landingPage.transformationPoints.map(p => `• ${p}`).join('\n')}`,
                  'Transformation section'
                )}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Intro</label>
                    <Textarea
                      value={content.landingPage.transformationIntro}
                      onChange={(e) => updateContent('landingPage', 'transformationIntro', e.target.value)}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Transformation Points</label>
                    <div className="space-y-2 mt-1">
                      {content.landingPage.transformationPoints.map((point, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-muted-foreground">•</span>
                          <Input
                            value={point}
                            onChange={(e) => updateArrayItem('landingPage', 'transformationPoints', i, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </EditableSubsection>

              {/* Benefits Section */}
              <EditableSubsection
                title="WHAT YOU'LL GET"
                onCopy={() => copyToClipboard(
                  `${content.landingPage.benefitsTitle}\n\n${content.landingPage.benefits.map(b => `✓ ${b}`).join('\n')}`,
                  'Benefits section'
                )}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Section Title</label>
                    <Input
                      value={content.landingPage.benefitsTitle}
                      onChange={(e) => updateContent('landingPage', 'benefitsTitle', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Benefits</label>
                    <div className="space-y-2 mt-1">
                      {content.landingPage.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[#56bc77]">✓</span>
                          <Input
                            value={benefit}
                            onChange={(e) => updateArrayItem('landingPage', 'benefits', i, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </EditableSubsection>

              {/* About Me Section */}
              <EditableSubsection
                title="ABOUT ME"
                onCopy={() => copyToClipboard(
                  `${content.landingPage.aboutHeadline}\n${content.landingPage.aboutSubheadline}\n\n${content.landingPage.aboutBio}`,
                  'About section'
                )}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Headline</label>
                    <Input
                      value={content.landingPage.aboutHeadline}
                      onChange={(e) => updateContent('landingPage', 'aboutHeadline', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subheadline</label>
                    <Input
                      value={content.landingPage.aboutSubheadline}
                      onChange={(e) => updateContent('landingPage', 'aboutSubheadline', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bio</label>
                    <Textarea
                      value={content.landingPage.aboutBio}
                      onChange={(e) => updateContent('landingPage', 'aboutBio', e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </EditableSubsection>

              {/* Final CTA Section */}
              <EditableSubsection
                title="FINAL CTA"
                onCopy={() => copyToClipboard(
                  `${content.landingPage.ctaHeadline}\nButton: ${content.landingPage.ctaButtonText}\n${content.landingPage.ctaBelowText}`,
                  'Final CTA'
                )}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Headline</label>
                    <Input
                      value={content.landingPage.ctaHeadline}
                      onChange={(e) => updateContent('landingPage', 'ctaHeadline', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Button Text</label>
                    <Input
                      value={content.landingPage.ctaButtonText}
                      onChange={(e) => updateContent('landingPage', 'ctaButtonText', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Below Form Text</label>
                    <Input
                      value={content.landingPage.ctaBelowText}
                      onChange={(e) => updateContent('landingPage', 'ctaBelowText', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </EditableSubsection>
            </div>
          </BuildSection>

          {/* Section 2: Lead Magnet Content */}
          <BuildSection
            id="lead_magnet"
            title="2. Lead Magnet Content"
            subtitle="Create your free resource"
            videoTitle="How to Create Your Lead Magnet PDF"
            videoDuration="4:15"
            isComplete={progress.lead_magnet}
            isOpen={openSections.includes('lead_magnet')}
            onToggle={() => toggleSection('lead_magnet')}
            onCheckChange={(checked) => handleCheckboxChange('lead_magnet', checked)}
            checkLabel="I've created my lead magnet"
            onCopyAll={copyAllLeadMagnet}
          >
            <div className="space-y-6">
              {/* Introduction */}
              <EditableSubsection
                title="INTRODUCTION"
                onCopy={() => copyToClipboard(content.leadMagnet.introduction, 'Introduction')}
              >
                <Textarea
                  value={content.leadMagnet.introduction}
                  onChange={(e) => updateContent('leadMagnet', 'introduction', e.target.value)}
                  rows={4}
                />
              </EditableSubsection>

              {/* Content Points */}
              {content.leadMagnet.points.map((point, index) => (
                <EditableSubsection
                  key={index}
                  title={`POINT ${index + 1}: ${point.title}`}
                  onCopy={() => copyToClipboard(`${point.title}\n\n${point.content}`, `Point ${index + 1}`)}
                >
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Title</label>
                      <Input
                        value={point.title}
                        onChange={(e) => {
                          const newPoints = [...content.leadMagnet.points];
                          newPoints[index] = { ...newPoints[index], title: e.target.value };
                          setContent(prev => ({ ...prev, leadMagnet: { ...prev.leadMagnet, points: newPoints } }));
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Content</label>
                      <Textarea
                        value={point.content}
                        onChange={(e) => {
                          const newPoints = [...content.leadMagnet.points];
                          newPoints[index] = { ...newPoints[index], content: e.target.value };
                          setContent(prev => ({ ...prev, leadMagnet: { ...prev.leadMagnet, points: newPoints } }));
                        }}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </EditableSubsection>
              ))}

              {/* Conclusion */}
              <EditableSubsection
                title="CONCLUSION + NEXT STEP"
                onCopy={() => copyToClipboard(content.leadMagnet.conclusion, 'Conclusion')}
              >
                <Textarea
                  value={content.leadMagnet.conclusion}
                  onChange={(e) => updateContent('leadMagnet', 'conclusion', e.target.value)}
                  rows={4}
                />
              </EditableSubsection>
            </div>
          </BuildSection>

          {/* Section 3: Email Sequence */}
          <BuildSection
            id="email_sequence"
            title="3. Email Sequence"
            subtitle="Set up your 7-email welcome series"
            videoTitle="How to Build Your Email Automation"
            videoDuration="6:48"
            isComplete={progress.email_sequence}
            isOpen={openSections.includes('email_sequence')}
            onToggle={() => toggleSection('email_sequence')}
            onCheckChange={(checked) => handleCheckboxChange('email_sequence', checked)}
            checkLabel="I've set up my email automation"
            onCopyAll={copyAllEmails}
          >
            <div className="space-y-4">
              <Accordion type="single" collapsible defaultValue="email-0" className="space-y-2">
                {content.emails.map((email, index) => (
                  <AccordionItem key={index} value={`email-${index}`} className="border rounded-lg bg-muted/30">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{email.title}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{email.day}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(`Subject: ${email.subjectLine}\n\n${email.body}`, email.title);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Subject Line</label>
                          <Input
                            value={email.subjectLine}
                            onChange={(e) => {
                              const newEmails = [...content.emails];
                              newEmails[index] = { ...newEmails[index], subjectLine: e.target.value };
                              setContent(prev => ({ ...prev, emails: newEmails }));
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email Body</label>
                          <Textarea
                            value={email.body}
                            onChange={(e) => {
                              const newEmails = [...content.emails];
                              newEmails[index] = { ...newEmails[index], body: e.target.value };
                              setContent(prev => ({ ...prev, emails: newEmails }));
                            }}
                            rows={10}
                            className="mt-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </BuildSection>

          {/* Section 4: Social Capture Templates */}
          <BuildSection
            id="social_capture"
            title="4. Social Capture"
            subtitle="Set up your Instagram/Facebook DM automation"
            videoTitle="How to Activate Comment-to-DM"
            videoDuration="4:22"
            isComplete={progress.social_capture}
            isOpen={openSections.includes('social_capture')}
            onToggle={() => toggleSection('social_capture')}
            onCheckChange={(checked) => handleCheckboxChange('social_capture', checked)}
            checkLabel="I've activated my social capture workflow"
          >
            <div className="space-y-6">
              {/* DM Message */}
              <EditableSubsection
                title="DM MESSAGE TEMPLATE"
                onCopy={() => copyToClipboard(content.socialCapture.dmMessage, 'DM message')}
              >
                <Textarea
                  value={content.socialCapture.dmMessage}
                  onChange={(e) => updateContent('socialCapture', 'dmMessage', e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  ℹ️ {'{{contact.first_name}}'} will be replaced with their name
                </p>
              </EditableSubsection>

              {/* Comment Replies */}
              <EditableSubsection
                title="COMMENT REPLY VARIATIONS"
                onCopy={() => copyToClipboard(content.socialCapture.commentReplies.join('\n'), 'Comment replies')}
              >
                <p className="text-sm text-muted-foreground mb-3">The system will randomly pick from these replies:</p>
                <div className="space-y-2">
                  {content.socialCapture.commentReplies.map((reply, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm w-4">{i + 1}.</span>
                      <Input
                        value={reply}
                        onChange={(e) => updateArrayItem('socialCapture', 'commentReplies', i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-muted-foreground"
                  onClick={() => addArrayItem('socialCapture', 'commentReplies', '')}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add another variation
                </Button>
              </EditableSubsection>

              {/* Post CTAs */}
              <EditableSubsection
                title="POST CTA EXAMPLES"
                onCopy={() => copyToClipboard(
                  content.socialCapture.postCTAs.map(c => `${c.hook}:\n${c.content}`).join('\n\n'),
                  'Post CTAs'
                )}
              >
                <p className="text-sm text-muted-foreground mb-3">Use these at the end of your social posts:</p>
                <div className="space-y-4">
                  {content.socialCapture.postCTAs.map((cta, i) => (
                    <div key={i}>
                      <label className="text-sm font-medium text-muted-foreground">Option {i + 1} - {cta.hook}</label>
                      <Textarea
                        value={cta.content}
                        onChange={(e) => {
                          const newCTAs = [...content.socialCapture.postCTAs];
                          newCTAs[i] = { ...newCTAs[i], content: e.target.value };
                          setContent(prev => ({ ...prev, socialCapture: { ...prev.socialCapture, postCTAs: newCTAs } }));
                        }}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </EditableSubsection>

              {/* Keywords */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-3">YOUR TRIGGER KEYWORDS</h4>
                <p className="text-sm text-muted-foreground mb-3">When someone comments these words, they'll get your DM:</p>
                <div className="flex flex-wrap gap-2">
                  {content.socialCapture.keywords.map((keyword, i) => (
                    <div key={i} className="bg-white border rounded-lg px-3 py-2 font-medium text-sm">
                      {keyword}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-muted-foreground"
                  onClick={() => {
                    const keyword = prompt('Enter a custom keyword:');
                    if (keyword) {
                      addArrayItem('socialCapture', 'keywords', keyword.toUpperCase());
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add custom keyword
                </Button>
              </div>
            </div>
          </BuildSection>

          {/* Section 5: Lead Magnet Social Capture (Optional) */}
          <BuildSection
            id="lead_magnet_workflow"
            title="5. Lead Magnet Social Capture"
            subtitle="Update your DM to send your lead magnet"
            videoTitle="How to Update Your DM for Lead Magnet"
            videoDuration="2:15"
            isComplete={progress.lead_magnet_workflow}
            isOpen={openSections.includes('lead_magnet_workflow')}
            onToggle={() => toggleSection('lead_magnet_workflow')}
            onCheckChange={(checked) => handleCheckboxChange('lead_magnet_workflow', checked)}
            checkLabel="I've updated my workflow for lead magnet delivery"
            isOptional
          >
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  ℹ️ This is for AFTER you've published your landing page. Once your lead magnet is live, 
                  you can update your DM to send people to your landing page instead of (or in addition to) your booking link.
                </p>
              </div>

              {/* Lead Magnet DM */}
              <EditableSubsection
                title="LEAD MAGNET DM TEMPLATE"
                onCopy={() => copyToClipboard(content.leadMagnetWorkflow.dmMessage, 'Lead magnet DM')}
              >
                <Textarea
                  value={content.leadMagnetWorkflow.dmMessage}
                  onChange={(e) => updateContent('leadMagnetWorkflow', 'dmMessage', e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </EditableSubsection>

              {/* Lead Magnet Post CTAs */}
              <EditableSubsection
                title="LEAD MAGNET POST CTAS"
                onCopy={() => copyToClipboard(content.leadMagnetWorkflow.postCTAs.join('\n\n'), 'Lead magnet CTAs')}
              >
                <div className="space-y-3">
                  {content.leadMagnetWorkflow.postCTAs.map((cta, i) => (
                    <Textarea
                      key={i}
                      value={cta}
                      onChange={(e) => {
                        const newCTAs = [...content.leadMagnetWorkflow.postCTAs];
                        newCTAs[i] = e.target.value;
                        setContent(prev => ({ ...prev, leadMagnetWorkflow: { ...prev.leadMagnetWorkflow, postCTAs: newCTAs } }));
                      }}
                      rows={3}
                    />
                  ))}
                </div>
              </EditableSubsection>
            </div>
          </BuildSection>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center text-white/60 text-sm">
          Need help? <button className="underline hover:text-white">Watch all tutorials</button> | <button className="underline hover:text-white">Contact support</button>
        </div>
      </main>

      {/* Celebration Modal */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">🎉 Your Funnel is LIVE!</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              You've built a complete lead generation system!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {[
              'Landing page capturing leads',
              'Lead magnet delivering value',
              'Email sequence nurturing subscribers',
              'Social capture turning followers into leads',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#56bc77] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-foreground">✅ {item}</span>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground text-center">
              Now it's time to share it with the world. Post your first CTA and watch the leads roll in!
            </p>
          </div>

          {/* Community Share Section */}
          {!hasSharedPhase('phase3') && (
            <CommunityShareSection
              channel="wins"
              prewrittenMessage={COMMUNITY_MESSAGES.phase3Complete}
              onShare={() => markPhaseShared('phase3')}
              onDismiss={() => {}}
            />
          )}

          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => {
              setShowCelebration(false);
              navigate('/dashboard');
            }}>
              Back to Dashboard
            </Button>
            <Button className="flex-1 bg-[#ebcc89] text-black hover:bg-[#d4b876]" onClick={() => {
              setShowCelebration(false);
            }}>
              Post Your First CTA →
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Build Section Component
interface BuildSectionProps {
  id: string;
  title: string;
  subtitle: string;
  videoTitle: string;
  videoDuration: string;
  isComplete: boolean;
  isOpen: boolean;
  isOptional?: boolean;
  onToggle: () => void;
  onCheckChange: (checked: boolean) => void;
  checkLabel: string;
  onCopyAll?: () => void;
  children: React.ReactNode;
}

const BuildSection = ({
  id,
  title,
  subtitle,
  videoTitle,
  videoDuration,
  isComplete,
  isOpen,
  isOptional,
  onToggle,
  onCheckChange,
  checkLabel,
  onCopyAll,
  children,
}: BuildSectionProps) => {
  return (
    <Card className={cn(
      'bg-white overflow-hidden',
      isComplete && 'border border-[#56bc77]/30'
    )}>
      {isComplete && (
        <div className="bg-[#56bc77] px-4 py-2 flex items-center gap-2">
          <Check className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">Completed</span>
        </div>
      )}

      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full">
          <div className="p-4 flex items-center justify-between">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "font-semibold text-lg",
                  isComplete && "text-[#56bc77]"
                )}>{title}</h3>
                {isOptional && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">Optional</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4">
            {/* Two-column layout */}
            <div className="grid md:grid-cols-5 gap-6">
              {/* Video Column (40%) */}
              <div className="md:col-span-2">
                <div className="bg-muted rounded-lg aspect-video flex items-center justify-center sticky top-24">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-[#827666]/20 flex items-center justify-center mx-auto mb-3">
                      <Play className="w-8 h-8 text-[#827666]" />
                    </div>
                    <p className="font-medium text-foreground">{videoTitle}</p>
                    <p className="text-sm text-muted-foreground">{videoDuration}</p>
                  </div>
                </div>
              </div>

              {/* Content Column (60%) */}
              <div className="md:col-span-3 space-y-4">
                {children}

                {/* Copy All Button */}
                {onCopyAll && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onCopyAll}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All {title.split('.')[1]?.trim()} Content
                  </Button>
                )}

                {/* Checkbox */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mt-4">
                  <Checkbox
                    id={id}
                    checked={isComplete}
                    onCheckedChange={(checked) => onCheckChange(checked as boolean)}
                  />
                  <label
                    htmlFor={id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {checkLabel}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// Editable Subsection Component
interface EditableSubsectionProps {
  title: string;
  onCopy: () => void;
  children: React.ReactNode;
}

const EditableSubsection = ({ title, onCopy, children }: EditableSubsectionProps) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
        <span className="font-medium text-sm">{title}</span>
        <Button variant="ghost" size="sm" onClick={onCopy}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default FunnelBuild;
