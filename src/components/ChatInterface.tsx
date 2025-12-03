import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { streamChat } from '@/lib/chat-api';
import { isOutputComplete } from '@/lib/output-parser';
import { updateConversationMessages, markConversationComplete } from '@/lib/conversations';
import { useToast } from '@/hooks/use-toast';
import type { Message, UserInfo } from '@/types/chat';
import logo from '@/assets/logo.png';

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
interface ChatInterfaceProps {
  userInfo: UserInfo;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onOutputComplete: () => void;
  conversationId: string | null;
}
export function ChatInterface({
  userInfo,
  messages,
  setMessages,
  onOutputComplete,
  conversationId
}: ChatInterfaceProps) {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  // Initialize speech recognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      isListeningRef.current = true;
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setInput(prev => {
          const trimmed = prev.trim();
          return trimmed ? trimmed + ' ' + finalTranscript : finalTranscript;
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      isListeningRef.current = false;
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access in your browser settings.",
          variant: "destructive"
        });
      } else if (event.error !== 'aborted') {
        toast({
          title: "Speech recognition error",
          description: "Please try again.",
          variant: "destructive"
        });
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    
    if (!recognition) {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListeningRef.current) {
      console.log('Stopping recognition');
      recognition.stop();
    } else {
      console.log('Starting recognition');
      try {
        recognition.start();
      } catch (e) {
        // Already started, stop and restart
        recognition.stop();
      }
    }
  }, [toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize conversation (only if no existing messages)
  useEffect(() => {
    if (hasInitialized.current || messages.length > 0) return;
    hasInitialized.current = true;

    // Start the conversation with the AI
    const startConversation = async () => {
      setIsLoading(true);
      const initialMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: `Hi, my name is ${userInfo.name}. I'm here to create my mini-funnel.`
      };
      let assistantContent = '';
      const assistantId = crypto.randomUUID();
      await streamChat({
        messages: [{
          role: initialMessage.role,
          content: initialMessage.content
        }],
        onDelta: text => {
          assistantContent += text;
          setMessages([initialMessage, {
            id: assistantId,
            role: 'assistant',
            content: assistantContent
          }]);
        },
        onDone: async () => {
          setIsLoading(false);
          const finalMessages: Message[] = [initialMessage, {
            id: assistantId,
            role: 'assistant' as const,
            content: assistantContent
          }];
          setMessages(finalMessages);

          // Save to database
          if (conversationId) {
            await updateConversationMessages(conversationId, finalMessages);
          }
          if (isOutputComplete(assistantContent)) {
            onOutputComplete();
          }
        },
        onError: error => {
          console.error('Chat error:', error);
          setIsLoading(false);
          setMessages([initialMessage, {
            id: assistantId,
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please refresh and try again.'
          }]);
        }
      });
    };
    startConversation();
  }, [userInfo.name, messages.length, setMessages, onOutputComplete, conversationId]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim()
    };
    const newMessages = [...messages, userMessage];
    setInput('');
    setMessages(newMessages);
    setIsLoading(true);
    let assistantContent = '';
    const assistantId = crypto.randomUUID();
    await streamChat({
      messages: newMessages.map(m => ({
        role: m.role,
        content: m.content
      })),
      onDelta: text => {
        assistantContent += text;
        setMessages(prev => {
          const existing = prev.find(m => m.id === assistantId);
          if (existing) {
            return prev.map(m => m.id === assistantId ? {
              ...m,
              content: assistantContent
            } : m);
          }
          return [...prev, {
            id: assistantId,
            role: 'assistant',
            content: assistantContent
          }];
        });
      },
      onDone: async () => {
        setIsLoading(false);

        // Get final messages and save
        const finalMessages = [...newMessages, {
          id: assistantId,
          role: 'assistant' as const,
          content: assistantContent
        }];
        setMessages(finalMessages);
        if (conversationId) {
          await updateConversationMessages(conversationId, finalMessages);
        }
        if (isOutputComplete(assistantContent)) {
          if (conversationId) {
            await markConversationComplete(conversationId, {
              completed: true
            });
          }
          setTimeout(() => onOutputComplete(), 1000);
        }
      },
      onError: error => {
        console.error('Chat error:', error);
        setIsLoading(false);
        setMessages(prev => [...prev, {
          id: assistantId,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }]);
      }
    });
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  return <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <img src={logo} alt="Logo" className="h-8 w-auto" />
        <div>
          <h1 className="font-medium text-foreground">Mini-Funnel Builder</h1>
          <p className="text-xs text-muted-foreground">Building with {userInfo.name}</p>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {messages.map(message => <div key={message.id} className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'assistant' && <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#827666]">
                  <img src={logo} alt="" className="w-5 h-5" />
                </div>}
              <div className={cn('rounded-2xl px-4 py-3 max-w-[85%]', message.role === 'user' ? 'bg-[#827666] text-white' : 'bg-muted text-foreground')}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>)}
          {isLoading && messages[messages.length - 1]?.role === 'user' && <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <img src={logo} alt="" className="w-5 h-5" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border/50 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <Textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message..." className="min-h-[52px] max-h-32 pr-24 resize-none" disabled={isLoading} />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <Button
                type="button"
                size="icon"
                onClick={toggleListening}
                disabled={isLoading}
                className={cn(
                  "h-8 w-8 transition-all",
                  isListening 
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
                title={isListening ? "Click to stop recording" : "Click to start voice input"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-8 w-8 bg-[#827666] hover:bg-[#6b625a]">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>;
}