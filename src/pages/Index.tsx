import { useState } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { ChatInterface } from '@/components/ChatInterface';
import { OutputView } from '@/components/OutputView';
import type { Message, UserInfo, AppView } from '@/types/chat';

const Index = () => {
  const [view, setView] = useState<AppView>('landing');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleStart = (info: UserInfo, convId: string, existingMessages?: Message[]) => {
    setUserInfo(info);
    setConversationId(convId);
    setMessages(existingMessages || []);
    setView('chat');
  };

  const handleOutputComplete = () => {
    setView('output');
  };

  const handleStartOver = () => {
    setUserInfo(null);
    setMessages([]);
    setConversationId(null);
    setView('landing');
  };

  const handleBackToChat = () => {
    setView('chat');
  };

  if (view === 'landing' || !userInfo) {
    return <LandingPage onStart={(info, convId, msgs) => handleStart(info, convId, msgs)} />;
  }

  if (view === 'output') {
    return (
      <OutputView
        userInfo={userInfo}
        messages={messages}
        onStartOver={handleStartOver}
        onBackToChat={handleBackToChat}
      />
    );
  }

  return (
    <ChatInterface
      userInfo={userInfo}
      messages={messages}
      setMessages={setMessages}
      onOutputComplete={handleOutputComplete}
      conversationId={conversationId}
    />
  );
};

export default Index;
