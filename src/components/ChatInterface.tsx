import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { streamChat, isOutputComplete } from '@/lib/chat-api';
import type { Message, UserInfo } from '@/types/chat';
import logo from '@/assets/logo.png';

interface ChatInterfaceProps {
  userInfo: UserInfo;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onOutputComplete: () => void;
}

export function ChatInterface({ userInfo, messages, setMessages, onOutputComplete }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    if (hasInitialized.current || messages.length > 0) return;
    hasInitialized.current = true;

    // Start the conversation with the AI
    const startConversation = async () => {
      setIsLoading(true);
      const initialMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: `Hi, my name is ${userInfo.name}. I'm here to create my mini-funnel.`,
      };

      let assistantContent = '';
      const assistantId = crypto.randomUUID();

      await streamChat({
        messages: [initialMessage],
        onDelta: (text) => {
          assistantContent += text;
          setMessages([
            initialMessage,
            { id: assistantId, role: 'assistant', content: assistantContent },
          ]);
        },
        onDone: () => {
          setIsLoading(false);
          if (isOutputComplete(assistantContent)) {
            onOutputComplete();
          }
        },
        onError: (error) => {
          console.error('Chat error:', error);
          setIsLoading(false);
          setMessages([
            initialMessage,
            { id: assistantId, role: 'assistant', content: 'Sorry, I encountered an error. Please refresh and try again.' },
          ]);
        },
      });
    };

    startConversation();
  }, [userInfo.name, messages.length, setMessages, onOutputComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setInput('');
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    await streamChat({
      messages: [...messages, userMessage],
      onDelta: (text) => {
        assistantContent += text;
        setMessages((prev) => {
          const existing = prev.find((m) => m.id === assistantId);
          if (existing) {
            return prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m));
          }
          return [...prev, { id: assistantId, role: 'assistant', content: assistantContent }];
        });
      },
      onDone: () => {
        setIsLoading(false);
        if (isOutputComplete(assistantContent)) {
          setTimeout(() => onOutputComplete(), 1000);
        }
      },
      onError: (error) => {
        console.error('Chat error:', error);
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
        ]);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <img src={logo} alt="Logo" className="h-8 w-auto invert dark:invert-0" />
        <div>
          <h1 className="font-medium text-foreground">Mini-Funnel Builder</h1>
          <p className="text-xs text-muted-foreground">Building with {userInfo.name}</p>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <img src={logo} alt="" className="w-5 h-5 invert dark:invert-0" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 max-w-[85%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <img src={logo} alt="" className="w-5 h-5 invert dark:invert-0" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border/50 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[52px] max-h-32 pr-12 resize-none"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 h-8 w-8"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
