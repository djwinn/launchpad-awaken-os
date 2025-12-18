import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Home, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const OutputsHistory = () => {
  const { account } = useAccount();
  const navigate = useNavigate();
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (account) {
      setLoadingData(false);
    }
  }, [account]);

  if (loadingData || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf5f5]/[0.33]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // For now, outputs history is simplified since we're not using the conversations table
  // The funnel blueprint is stored in phase_3_data
  const phase3Data = account.phase_3_data as Record<string, unknown> || {};
  const hasFunnelBlueprint = Boolean(phase3Data.funnel_blueprint);

  return (
    <div className="min-h-screen bg-[#faf5f5]/[0.33] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="h-10" />
            <h1 className="text-2xl font-bold">Your Outputs</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Content */}
        {!hasFunnelBlueprint ? (
          <Card>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Completed Outputs Yet</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Complete the "Craft Your Funnel" step to generate your funnel blueprint. Your output will appear here.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate('/funnel')}>
                Build Your Funnel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Your funnel outputs are available in the Build phase.
            </p>
            
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate('/funnel/build')}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Funnel Blueprint</CardTitle>
                    <CardDescription>
                      Your generated lead magnet, landing page, and email sequence content
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View Output
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputsHistory;
