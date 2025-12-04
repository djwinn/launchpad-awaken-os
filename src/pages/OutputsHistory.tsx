import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Loader2, MessageSquare } from 'lucide-react';
import { OutputView } from '@/components/OutputView';
import type { Message, UserInfo } from '@/types/chat';
import logo from '@/assets/logo.png';

interface CompletedConversation {
  id: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
  output: unknown;
}

const OutputsHistory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [completedConversations, setCompletedConversations] = useState<CompletedConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<CompletedConversation | null>(null);
  const [hasIncomplete, setHasIncomplete] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    const fetchConversations = async () => {
      setLoadingConversations(true);
      
      // Fetch completed conversations
      const { data: completed, error: completedError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_email', user.email)
        .eq('completed', true)
        .order('updated_at', { ascending: false });

      if (completedError) {
        console.error('Error fetching completed conversations:', completedError);
      } else {
        setCompletedConversations((completed || []).map(c => ({
          ...c,
          messages: (c.messages as unknown as Message[]) || []
        })));
      }

      // Check for incomplete conversation
      const { data: incomplete } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_email', user.email)
        .eq('completed', false)
        .limit(1);

      setHasIncomplete((incomplete?.length || 0) > 0);
      setLoadingConversations(false);
    };

    fetchConversations();
  }, [user?.email]);

  // Redirect to auth if not logged in
  if (!loading && !user) {
    navigate('/auth');
    return null;
  }

  if (loading || loadingConversations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf5f5]/[0.33]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show selected conversation output
  if (selectedConversation) {
    const userInfo: UserInfo = {
      name: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
      email: user?.email || ''
    };

    return (
      <div className="relative">
        <div className="absolute top-4 left-4 z-10">
          <Button variant="outline" size="sm" onClick={() => setSelectedConversation(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
        </div>
        <OutputView 
          userInfo={userInfo} 
          messages={selectedConversation.messages}
          onStartOver={() => navigate('/')}
          onBackToChat={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf5f5]/[0.33] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="h-10" />
            <h1 className="text-2xl font-bold">Your Outputs</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
        </div>

        {/* Content */}
        {completedConversations.length === 0 ? (
          <Card>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Completed Outputs Yet</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                {hasIncomplete 
                  ? "You have a conversation in progress. Complete it to see your mini-funnel output here."
                  : "Start a new conversation to build your mini-funnel. Once complete, your output will appear here."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate('/')}>
                {hasIncomplete ? 'Continue Conversation' : 'Start Building'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {completedConversations.length} completed {completedConversations.length === 1 ? 'funnel' : 'funnels'}
            </p>
            
            {completedConversations.map((conversation) => (
              <Card 
                key={conversation.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedConversation(conversation)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Mini-Funnel Output</CardTitle>
                      <CardDescription>
                        Completed {new Date(conversation.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      View Output
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {hasIncomplete && (
              <Card className="border-dashed">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-muted-foreground">Conversation in Progress</CardTitle>
                      <CardDescription>
                        You have an incomplete conversation. Continue where you left off.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                      Continue
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputsHistory;
