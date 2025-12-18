import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, CheckCircle, MessageSquareMore, Magnet } from 'lucide-react';
import { PhaseCard } from '@/components/dashboard/PhaseCard';
import { ProgressHeader } from '@/components/dashboard/ProgressHeader';
import {
  getOrCreateUserProgress,
  calculateOverallProgress,
  getProgressMessage,
  type UserProgress,
} from '@/lib/user-progress';
import { supabase } from '@/integrations/supabase/client';
import awakenLogo from '@/assets/awaken-logo-white.png';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [hasIncompleteChat, setHasIncompleteChat] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!user?.email) {
      setLoadingProgress(false);
      return;
    }

    const loadProgress = async () => {
      const userProgress = await getOrCreateUserProgress(user.email);
      if (userProgress) {
        // Count completed funnels
        const { count } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('user_email', user.email)
          .eq('completed', true);

        if (count !== null && count !== userProgress.funnels_created) {
          setProgress({ ...userProgress, funnels_created: count });
        } else {
          setProgress(userProgress);
        }
      }

      // Check for incomplete conversation
      const { data: incomplete } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_email', user.email)
        .eq('completed', false)
        .limit(1);

      setHasIncompleteChat((incomplete?.length || 0) > 0);
      setLoadingProgress(false);
    };

    loadProgress();
  }, [user, loading]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || loadingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  const firstName = user.user_metadata?.name?.split(' ')[0] || user.email?.split('@')[0] || 'there';
  const overallProgress = progress ? calculateOverallProgress(progress) : 10;
  const progressMessage = getProgressMessage(overallProgress);

  // Determine phase statuses
  const phase1Status: 'not-started' | 'in-progress' | 'complete' = progress?.phase1_complete
    ? 'complete'
    : (progress?.phase1_progress ?? 0) > 0
    ? 'in-progress'
    : 'not-started';

  const phase2InProgress = Boolean(
    (progress as any)?.social_accounts_connected || 
    (progress as any)?.social_capture_active
  );
  const phase2Complete = Boolean(
    (progress as any)?.social_accounts_connected && 
    (progress as any)?.social_capture_active
  );
  const phase2Status: 'not-started' | 'in-progress' | 'complete' = phase2Complete
    ? 'complete'
    : phase2InProgress
    ? 'in-progress'
    : 'not-started';

  // Phase 3 status based on new funnel columns
  const phase3InProgress = Boolean(
    (progress as any)?.funnel_craft_complete || 
    (progress as any)?.funnel_build_complete
  );
  const phase3Complete = Boolean(
    (progress as any)?.funnel_craft_complete && 
    (progress as any)?.funnel_build_complete
  );
  const phase3Status: 'not-started' | 'in-progress' | 'complete' = phase3Complete
    ? 'complete'
    : phase3InProgress
    ? 'in-progress'
    : 'not-started';

  const hasFunnels = (progress?.funnels_created ?? 0) > 0 || phase3Complete;

  // Determine button labels
  const phase1Button = phase1Status === 'complete' ? 'Review' : phase1Status === 'in-progress' ? 'Continue' : 'Get Started';
  const phase2Button = phase2Status === 'complete' ? 'Review' : 'Get Leads';
  const phase3Button = phase3Complete ? 'Review' : phase3InProgress ? 'Continue' : 'Get Clients';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#605547' }}>
      {/* Navigation */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10" style={{ backgroundColor: 'rgba(96, 85, 71, 0.9)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={awakenLogo} alt="AwakenOS" className="h-8 md:h-10" />
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white hover:bg-white/10">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
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
              progress={{ current: progress?.phase1_progress ?? 0, total: 5 }}
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
              secondaryButtonLabel={phase3Complete ? "View Outputs" : undefined}
              onSecondaryClick={phase3Complete ? () => navigate('/outputs') : undefined}
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
