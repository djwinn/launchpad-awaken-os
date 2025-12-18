import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Mic, MicOff, Paperclip, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { streamChat } from '@/lib/chat-api';
import { transcribeAudio, parseDocument } from '@/lib/location-api';
import { isOutputComplete } from '@/lib/output-parser';
import { updateConversationMessages, markConversationComplete } from '@/lib/conversations';
import { useToast } from '@/hooks/use-toast';
import { useAccount } from '@/contexts/AccountContext';
import type { Message, UserInfo } from '@/types/chat';
import logo from '@/assets/logo.png';
import botIcon from '@/assets/bot-icon.png';

interface FunnelContext {
  coach_name?: string;
  coaching_type?: string;
  ideal_client?: string;
  main_problem?: string;
  transformation?: string;
  main_offer?: string;
  booking_url?: string;
  raw_content?: string;
  source: 'paste' | 'conversation' | 'phase2';
}

interface ChatInterfaceProps {
  userInfo: UserInfo;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onOutputComplete: () => void;
  conversationId: string | null;
  funnelContext?: FunnelContext | null;
}

export function ChatInterface({
  userInfo,
  messages,
  setMessages,
  onOutputComplete,
  conversationId,
  funnelContext
}: ChatInterfaceProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { account } = useAccount();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const locationId = account?.location_id || '';

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!locationId) {
      toast({
        title: "Not authenticated",
        description: "Please log in to use voice input.",
        variant: "destructive"
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) {
          setIsRecording(false);
          return;
        }
        
        setIsTranscribing(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            const data = await transcribeAudio(locationId, base64Audio);
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            if (data.text) {
              setInput(prev => {
                const trimmed = prev.trim();
                return trimmed ? trimmed + ' ' + data.text : data.text;
              });
            }
            
            setIsTranscribing(false);
            setIsRecording(false);
          };
        } catch (error) {
          console.error('Transcription error:', error);
          toast({
            title: "Transcription failed",
            description: "Could not transcribe audio. Please try again.",
            variant: "destructive"
          });
          setIsTranscribing(false);
          setIsRecording(false);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access in your browser settings.",
        variant: "destructive"
      });
    }
  }, [toast, locationId]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    e.target.value = '';

    if (!locationId) {
      toast({
        title: "Not authenticated",
        description: "Please log in to upload files.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const data = await parseDocument(locationId, file);

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.text) {
        const prefix = `[Content from ${data.fileName}]:\n\n`;
        setInput(prev => {
          const trimmed = prev.trim();
          return trimmed ? trimmed + '\n\n' + prefix + data.text : prefix + data.text;
        });
        toast({
          title: "Document uploaded",
          description: `Content from "${data.fileName}" has been added to your message.`,
        });
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not process the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, locationId]);

  // Auto-scroll to bottom - triggers on messages change and loading state
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    };
    // Small delay to ensure content is rendered
    requestAnimationFrame(scrollToBottom);
  }, [messages, isLoading]);

  // Initialize conversation (only if no existing messages)
  useEffect(() => {
    if (hasInitialized.current || messages.length > 0 || !locationId) return;
    hasInitialized.current = true;

    // Start the conversation with the AI
    const startConversation = async () => {
      setIsLoading(true);
      
      // Build initial message with context if available
      let initialContent = `Hi, my name is ${userInfo.name}. I'm here to create my mini-funnel.`;
      
      if (funnelContext) {
        initialContent = `Hi, my name is ${userInfo.name}. I'm here to create my mini-funnel.\n\n`;
        initialContent += `Here's what I know about my business:\n`;
        if (funnelContext.coaching_type) initialContent += `- I'm a ${funnelContext.coaching_type}\n`;
        if (funnelContext.ideal_client) initialContent += `- I help: ${funnelContext.ideal_client}\n`;
        if (funnelContext.main_problem) initialContent += `- Main problem they have: ${funnelContext.main_problem}\n`;
        if (funnelContext.transformation) initialContent += `- Transformation I provide: ${funnelContext.transformation}\n`;
        if (funnelContext.main_offer) initialContent += `- My main offer: ${funnelContext.main_offer}\n`;
        if (funnelContext.booking_url) initialContent += `- Booking link: ${funnelContext.booking_url}\n`;
      }
      
      const initialMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: initialContent
      };
      let assistantContent = '';
      const assistantId = crypto.randomUUID();
      await streamChat({
        messages: [{
          role: initialMessage.role,
          content: initialMessage.content
        }],
        locationId,
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
            await updateConversationMessages(conversationId, finalMessages, locationId);
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
  }, [userInfo.name, messages.length, setMessages, onOutputComplete, conversationId, locationId, funnelContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !locationId) return;
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
      locationId,
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
          await updateConversationMessages(conversationId, finalMessages, locationId);
        }
        if (isOutputComplete(assistantContent)) {
          if (conversationId) {
            await markConversationComplete(conversationId, {
              completed: true
            }, locationId);
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
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
          <div>
            <h1 className="font-medium text-foreground">Mini-Funnel Builder</h1>
            <p className="text-xs text-muted-foreground">Building with {userInfo.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {messages.map(message => <div key={message.id} className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'assistant' && <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src={botIcon} alt="" className="w-8 h-8 object-cover" />
                </div>}
              <div className={cn('rounded-2xl px-4 py-3 max-w-[85%]', message.role === 'user' ? 'bg-[#827666] text-white' : 'bg-muted text-foreground')}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>)}
          {isLoading && messages[messages.length - 1]?.role === 'user' && <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={botIcon} alt="" className="w-8 h-8 object-cover" />
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message..." className="min-h-[52px] max-h-32 pr-32 resize-none overflow-y-auto" disabled={isLoading} />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <Button
                type="button"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                className={cn(
                  "h-8 w-8 transition-all",
                  isUploading
                    ? "bg-amber-500 text-white"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
                title={isUploading ? "Processing document..." : "Upload a document (.txt, .md, .csv, .doc, .docx)"}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </Button>
              <Button
                type="button"
                size="icon"
                onClick={toggleRecording}
                disabled={isLoading || isTranscribing}
                className={cn(
                  "h-8 w-8 transition-all",
                  isRecording 
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                    : isTranscribing
                      ? "bg-amber-500 text-white"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
                title={isRecording ? "Click to stop recording" : isTranscribing ? "Transcribing..." : "Click to start voice input"}
              >
                {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-8 w-8 bg-[#827666] hover:bg-[#6b625a]">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Tip: Use the microphone for voice input, or paste content from your website, bio, or other materials.
          </p>
        </form>
      </div>
    </div>;
}
