import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, MessageSquareMore, Magnet } from 'lucide-react';
import { PhaseCard } from '@/components/dashboard/PhaseCard';
import { ProgressHeader } from '@/components/dashboard/ProgressHeader';
import awakenLogo from '@/assets/awaken-logo-white.png';

const Dashboard = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    if (account) {
      setLoadingProgress(false);
    }
  }, [account]);

  if (loadingProgress || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get name from demo account or default
  const firstName = account.demo_name?.split(' ')[0] || 'there';

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
              title={<>Capture Leads<br />While You Sleep</>}
              subtitle="Turn social posts into booked calls"
              description="Post on Instagram or Facebook, and when people engage, they automatically get a message from you with your booking link. You wake up with calls on your calendar."
              timeEstimate="~20 minutes"
              status={phase2Status}
              buttonLabel={phase2Button}
              onClick={() => navigate('/social-capture')}
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
