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

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

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

  const phase2Status: 'not-started' | 'in-progress' | 'complete' = progress?.phase2_complete
    ? 'complete'
    : 'not-started';

  const hasFunnels = (progress?.funnels_created ?? 0) > 0;

  // Determine button labels
  const phase1Button = phase1Status === 'complete' ? 'Review' : phase1Status === 'in-progress' ? 'Continue' : 'Get Ready';
  const phase2Button = phase2Status === 'complete' ? 'Review' : 'Set Up Your Assistant';
  const phase3Button = hasFunnels ? 'View Funnels' : 'Build Your First Funnel';

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-semibold text-lg text-foreground">AwakenOS</div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
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
              title="Ready for Business"
              subtitle="Book, sign, and get paid professionally"
              description="Set up your calendar, booking page, contracts, and payments — so when someone wants to work with you, you're ready."
              timeEstimate="~17 minutes"
              status={phase1Status}
              progress={{ current: progress?.phase1_progress ?? 0, total: 5 }}
              buttonLabel={phase1Button}
              onClick={() => navigate('/setup')}
            />

            <PhaseCard
              icon={MessageSquareMore}
              title="Your 24/7 Assistant"
              subtitle="Answer inquiries while you sleep"
              description="Train an AI that sounds like you — it handles questions, explains your services, and books discovery calls while you're with clients or offline."
              timeEstimate="~20 minutes"
              status={phase2Status}
              buttonLabel={phase2Button}
              onClick={() => navigate('/ai-training')}
            />

            <PhaseCard
              icon={Magnet}
              title="Client Magnet"
              subtitle="Attract and convert on autopilot"
              description="Build landing pages, lead magnets, and email sequences that bring the right people to you."
              timeEstimate="20-30 minutes per funnel"
              status={hasFunnels ? 'complete' : 'not-started'}
              buttonLabel={phase3Button}
              onClick={() => hasFunnels ? navigate('/outputs') : navigate('/funnel-builder')}
            />
          </div>

          {/* Encouragement Footer */}
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">
              Take your time — this is a journey, not a race. ✨
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
