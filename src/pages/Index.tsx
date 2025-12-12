import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LandingPage } from '@/components/LandingPage';
import { ChatInterface } from '@/components/ChatInterface';
import { OutputView } from '@/components/OutputView';
import { useAuth } from '@/hooks/useAuth';
import { findIncompleteConversation, createConversation } from '@/lib/conversations';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, FileText, Plus } from 'lucide-react';
import type { Message, UserInfo, AppView } from '@/types/chat';
import { Link } from 'react-router-dom';
const Index = () => {
  const {
    user,
    loading,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const continueChat = searchParams.get('continue') === 'true';
  const [view, setView] = useState<AppView>(continueChat ? 'chat' : 'landing');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const initializingRef = useRef(false);

  // When user logs in, initialize their conversation
  useEffect(() => {
    const initConversation = async () => {
      // Prevent duplicate initialization
      if (!user?.email || initializingRef.current) return;
      initializingRef.current = true;
      setInitializing(true);
      const name = user.user_metadata?.name || user.email.split('@')[0];
      setUserInfo({
        name,
        email: user.email
      });
      try {
        // Check for existing incomplete conversation
        const existing = await findIncompleteConversation(user.email);
        if (existing) {
          console.log('Found existing conversation:', existing.id);
          setConversationId(existing.id);
          setMessages(existing.messages || []);
        } else {
          // Create new conversation
          console.log('Creating new conversation for:', user.email);
          const newId = await createConversation(user.email, name);
          if (newId) {
            console.log('Created conversation:', newId);
            setConversationId(newId);
          }
        }
        setView('chat');
      } catch (error) {
        console.error('Error initializing conversation:', error);
      } finally {
        setInitializing(false);
        initializingRef.current = false;
      }
    };
    if (user && view === 'landing' && !loading) {
      initConversation();
    }
  }, [user, view, loading]);

  // Redirect authenticated users to dashboard unless they're continuing chat
  useEffect(() => {
    if (user && !loading && view === 'landing' && window.location.pathname === '/' && !continueChat) {
      navigate('/dashboard');
    }
  }, [user, loading, view, navigate, continueChat]);

  const handleStartClick = (name: string, email: string) => {
    // Pass name and email to auth page via URL params
    navigate(`/auth?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
  };
  const handleOutputComplete = () => {
    setView('output');
  };
  const handleStartOver = async () => {
    if (!user?.email) return;
    setInitializing(true);
    const name = user.user_metadata?.name || user.email.split('@')[0];
    const newId = await createConversation(user.email, name);
    if (newId) {
      setConversationId(newId);
      setMessages([]);
      setView('chat');
    }
    setInitializing(false);
  };
  const handleBackToChat = () => {
    setView('chat');
  };
  const handleSignOut = async () => {
    await signOut();
    setView('landing');
    setUserInfo(null);
    setMessages([]);
    setConversationId(null);
  };

  // Show landing page for unauthenticated users
  if (!user && !loading) {
    return <LandingPage onStartClick={handleStartClick} className="bg-[#6c6254]" />;
  }

  // Show loading while checking auth or initializing conversation
  if (loading || initializing) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf5f5]/[0.33]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>;
  }
  if (!user || !userInfo) {
    return null;
  }
  if (view === 'output') {
    return <div className="relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleStartOver}>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/outputs">
              <FileText className="h-4 w-4 mr-2" />
              My Outputs
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
        <OutputView userInfo={userInfo} messages={messages} onStartOver={handleStartOver} onBackToChat={handleBackToChat} />
      </div>;
  }
  return <div className="relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="outline" size="sm" onClick={handleStartOver}>
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/outputs">
            <FileText className="h-4 w-4 mr-2" />
            My Outputs
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
      <ChatInterface userInfo={userInfo} messages={messages} setMessages={setMessages} onOutputComplete={handleOutputComplete} conversationId={conversationId} />
    </div>;
};
export default Index;