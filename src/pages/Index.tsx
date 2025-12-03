import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingPage } from '@/components/LandingPage';
import { ChatInterface } from '@/components/ChatInterface';
import { OutputView } from '@/components/OutputView';
import { useAuth } from '@/hooks/useAuth';
import { findIncompleteConversation, createConversation } from '@/lib/conversations';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import type { Message, UserInfo, AppView } from '@/types/chat';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<AppView>('landing');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  // When user logs in, initialize their conversation
  useEffect(() => {
    const initConversation = async () => {
      if (!user?.email) return;
      
      setInitializing(true);
      const name = user.user_metadata?.name || user.email.split('@')[0];
      setUserInfo({ name, email: user.email });
      
      // Check for existing incomplete conversation
      const existing = await findIncompleteConversation(user.email);
      if (existing) {
        setConversationId(existing.id);
        setMessages(existing.messages || []);
      } else {
        // Create new conversation
        const newId = await createConversation(user.email, name);
        if (newId) {
          setConversationId(newId);
        }
      }
      setView('chat');
      setInitializing(false);
    };

    if (user && view === 'landing') {
      initConversation();
    }
  }, [user, view]);

  const handleStartClick = () => {
    if (user) {
      // User is already logged in, start conversation
      return;
    }
    // Redirect to auth
    navigate('/auth');
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
    return <LandingPage onStartClick={handleStartClick} className="bg-[#faf5f5]/[0.33]" />;
  }

  // Show loading while checking auth or initializing conversation
  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf5f5]/[0.33]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !userInfo) {
    return null;
  }

  if (view === 'output') {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
        <OutputView 
          userInfo={userInfo} 
          messages={messages} 
          onStartOver={handleStartOver} 
          onBackToChat={handleBackToChat} 
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
      <ChatInterface 
        userInfo={userInfo} 
        messages={messages} 
        setMessages={setMessages} 
        onOutputComplete={handleOutputComplete} 
        conversationId={conversationId} 
      />
    </div>
  );
};

export default Index;
