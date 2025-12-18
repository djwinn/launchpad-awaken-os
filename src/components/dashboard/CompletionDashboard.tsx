import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import awakenLogo from '@/assets/awaken-logo-white.png';

interface CompletionDashboardProps {
  firstName: string;
  onViewOutputs: () => void;
}

export function CompletionDashboard({ firstName, onViewOutputs }: CompletionDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#605547' }}>
      <header className="border-b border-white/10 backdrop-blur-sm" style={{ backgroundColor: 'rgba(96, 85, 71, 0.9)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={awakenLogo} alt="AwakenOS" className="h-8 md:h-10" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-[#56bc77]/20 flex items-center justify-center mx-auto">
            <Trophy className="h-10 w-10 text-[#56bc77]" />
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              You Did It, {firstName}! 🎉
            </h1>
            <p className="text-xl text-white/80">
              Your complete coaching business system is live and ready to work for you.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-6 text-left space-y-4">
            <p className="text-white/90 font-medium">Here's what you've built:</p>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#56bc77] flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">Professional setup</strong> — booking page, contracts, and payments ready</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#56bc77] flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">Social capture</strong> — comments automatically become booked calls</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#56bc77] flex-shrink-0 mt-0.5" />
                <span><strong className="text-white">Lead funnel</strong> — lead magnet, landing page, and email sequence live</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 justify-center text-white/90">
              <Sparkles className="h-5 w-5 text-[#ebcc89]" />
              <span>Your system is now working 24/7 — even while you sleep.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard?view=overview')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              View Progress Overview
            </Button>
            <Button
              onClick={onViewOutputs}
              className="bg-[#ebcc89] text-black hover:bg-[#d4b876] px-8"
            >
              View Your Outputs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
