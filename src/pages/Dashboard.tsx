import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, MessageSquareMore, Magnet, Sparkles, ArrowRight } from 'lucide-react';
import { PhaseCard } from '@/components/dashboard/PhaseCard';
import { ProgressHeader } from '@/components/dashboard/ProgressHeader';
import { CompletionDashboard } from '@/components/dashboard/CompletionDashboard';
import { getOnboardingRoute, isWelcomeDismissed, dismissWelcome } from '@/hooks/useOnboardingRoute';
import awakenLogo from '@/assets/awaken-logo-white.png';

const Dashboard = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [currentView, setCurrentView] = useState<'loading' | 'welcome' | 'dashboard' | 'complete'>('loading');

  useEffect(() => {
    if (!account) return;

    setLoadingProgress(false);

    // Check if user explicitly wants to see dashboard overview
    const viewOverride = searchParams.get('view');
    if (viewOverride === 'overview') {
      setCurrentView('dashboard');
      return;
    }

    // Determine where user should be routed
    const welcomeDismissed = isWelcomeDismissed(account.location_id);
    const { destination, path } = getOnboardingRoute(account, welcomeDismissed);

    switch (destination) {
      case 'welcome':
        setCurrentView('welcome');
        break;
      case 'complete':
        setCurrentView('complete');
        break;
      case 'phase1':
      case 'phase2':
      case 'phase3':
        // Auto-redirect to the appropriate phase
        navigate(path, { replace: true });
        break;
      default:
        setCurrentView('dashboard');
    }
  }, [account, navigate, searchParams]);

  const handleDismissWelcome = () => {
    if (account) {
      dismissWelcome(account.location_id);
    }
    // Go directly to Phase 1
    navigate('/setup');
  };

  if (loadingProgress || !account || currentView === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get name from demo account or default
  const firstName = account.demo_name?.split(' ')[0] || 'there';

  // Completion Dashboard
  if (currentView === 'complete') {
    return (
      <CompletionDashboard
        firstName={firstName}
        onViewOutputs={() => navigate('/outputs')}
      />
    );
  }

  // Welcome screen for new users
  if (currentView === 'welcome') {
    const userName = account.demo_name?.split(' ')[0] || 'there';

    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#605547' }}>
        <header className="border-b border-white/10 backdrop-blur-sm" style={{ backgroundColor: 'rgba(96, 85, 71, 0.9)' }}>
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <img src={awakenLogo} alt="AwakenOS" className="h-8 md:h-10" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-2xl text-center space-y-8">
            {/* Intro Video */}
            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/rMrbxHA99vo"
                title="Welcome Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Welcome{userName !== 'there' ? `, ${userName}` : ''}! 👋
              </h1>
              <p className="text-xl text-white/80">
                You're about to set up your complete coaching business system.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-6 text-left space-y-4">
              <p className="text-white/90">
                In the next hour or so, you'll have everything you need to:
              </p>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#56bc77] flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Look professional</strong> — booking page, contracts, payments ready</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#56bc77] flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Capture leads automatically</strong> — social comments become booked calls</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#56bc77] flex-shrink-0 mt-0.5" />
                  <span><strong className="text-white">Convert leads to clients</strong> — lead magnets, landing pages, email sequences</span>
                </li>
              </ul>
            </div>

            <p className="text-white/60 text-sm">
              Take your time — there's no rush. Each section is designed to guide you step by step.
            </p>

            <Button
              onClick={handleDismissWelcome}
              className="bg-[#ebcc89] text-black hover:bg-[#d4b876] px-8 py-6 text-lg"
            >
              Start the Guided Setup
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Calculate progress based on phase completion
  const calculateProgress = () => {
    let total = 10; // Starting bonus
    if (account.phase_1_complete) total += 30;
    if (account.phase_2_complete) total += 30;
    if (account.phase_3_complete) total += 30;
    return Math.min(100, total);
  };

  const getProgressMessage = (percentage: number): string => {
    if (percentage <= 30) {
      return "Great start — your foundation is taking shape";
    } else if (percentage <= 60) {
      return "You're making real progress";
    } else if (percentage < 100) {
      return "Almost there — just a few more steps";
    } else {
      return "You're fully ready for business!";
    }
  };

  const overallProgress = calculateProgress();
  const progressMessage = getProgressMessage(overallProgress);

  // Get phase data from JSON fields
  const phase1Data = account.phase_1_data as Record<string, unknown> || {};
  const phase2Data = account.phase_2_data as Record<string, unknown> || {};
  const phase3Data = account.phase_3_data as Record<string, unknown> || {};

  // Phase 1 progress (items completed out of 5)
  const phase1ItemsComplete = (phase1Data.items_complete as number) || 0;
  const phase1InProgress = phase1ItemsComplete > 0 && !account.phase_1_complete;

  // Determine phase statuses
  const phase1Status: 'not-started' | 'in-progress' | 'complete' = account.phase_1_complete
    ? 'complete'
    : phase1InProgress
    ? 'in-progress'
    : 'not-started';

  const phase2InProgress = Boolean(phase2Data.started);
  const phase2Status: 'not-started' | 'in-progress' | 'complete' = account.phase_2_complete
    ? 'complete'
    : phase2InProgress
    ? 'in-progress'
    : 'not-started';

  const phase3InProgress = Boolean(phase3Data.started);
  const phase3Status: 'not-started' | 'in-progress' | 'complete' = account.phase_3_complete
    ? 'complete'
    : phase3InProgress
    ? 'in-progress'
    : 'not-started';

  // Determine button labels
  const phase1Button = phase1Status === 'complete' ? 'Review' : phase1Status === 'in-progress' ? 'Continue' : 'Get Started';
  const phase2Button = phase2Status === 'complete' ? 'Review' : 'Get Leads';
  const phase3Button = account.phase_3_complete ? 'Review' : phase3InProgress ? 'Continue' : 'Get Clients';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#605547' }}>
      {/* Navigation */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10" style={{ backgroundColor: 'rgba(96, 85, 71, 0.9)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={awakenLogo} alt="AwakenOS" className="h-8 md:h-10" />
          {account.is_demo && (
            <span className="text-white/70 text-sm">Demo Mode</span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-8 md:space-y-12">
          {/* Progress Header */}
          <ProgressHeader
            firstName={firstName}
            percentage={overallProgress}
            message={progressMessage}
          />

          {/* Phase Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <PhaseCard
              icon={CheckCircle}
              title={<>Get Ready<br />for Business</>}
              subtitle="Look and feel like a pro from day one"
              description="When someone wants to work with you, you'll be ready — with a booking page, professional contracts, and payments all set up. No more scrambling."
              timeEstimate="~17 minutes"
              status={phase1Status}
              progress={{ current: phase1ItemsComplete, total: 5 }}
              buttonLabel={phase1Button}
              onClick={() => navigate('/setup')}
            />

            <PhaseCard
              icon={MessageSquareMore}
              title={<>Get Leads<br />While You Sleep</>}
              subtitle="Turn comments into clients automatically"
              description="Set up a simple system where people comment on your post, get a DM with your free resource, and join your email list — all on autopilot."
              timeEstimate="~45 minutes"
              status={phase2Status}
              buttonLabel={phase2Button}
              onClick={() => navigate('/phase2')}
            />

            <PhaseCard
              icon={Magnet}
              title={<>Convert Leads<br />Into Clients</>}
              subtitle="Your complete client conversion system"
              description="This is where it all comes together — your offer, your lead magnet, your landing page, and a nurture sequence that turns subscribers into clients."
              timeEstimate="~2 hours"
              status={phase3Status}
              buttonLabel={phase3Button}
              onClick={() => navigate('/funnel')}
              secondaryButtonLabel={account.phase_3_complete ? "View Outputs" : undefined}
              onSecondaryClick={account.phase_3_complete ? () => navigate('/outputs') : undefined}
            />
          </div>

          {/* Encouragement Footer */}
          <div className="text-center py-8">
            <p className="text-white/70 text-lg">
              Take your time — this is a journey, not a race. ✨
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
