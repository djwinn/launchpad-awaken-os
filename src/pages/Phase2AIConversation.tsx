import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/contexts/AccountContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Send, Copy, Download, RefreshCw, Check, Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getPhase2Data, updatePhase2Data, type Phase2Data, type Phase2ContentOutputs } from '@/lib/phase-data';
import awakenLogo from '@/assets/awaken-logo-white.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUESTIONS = [
  "What do you help people with? Just tell me in your own words — don't worry about making it perfect.",
  "Who specifically do you help? Think about your favorite past client — what were they struggling with when they found you?",
  "What's the main problem your people face that keeps them stuck? What does it feel like for them?",
  "What free resource could you offer that would give them a quick win? This could be a PDF guide, checklist, short video, or something you already have.",
  "What should happen after someone gets your free resource? Do you want them to book a call with you, or just stay on your email list for now?",
  "Last one — what's your Instagram or Facebook handle? And what's the website domain you set up?",
];

const Phase2AIConversation = () => {
  const { account, refreshAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [loadingData, setLoadingData] = useState(true);
  const [progress, setProgress] = useState<Phase2Data | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showOutputs, setShowOutputs] = useState(false);
  const [outputs, setOutputs] = useState<Phase2ContentOutputs | null>(null);
  const [generatingOutputs, setGeneratingOutputs] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const { isRecording, isTranscribing, toggleRecording } = useVoiceInput({
    locationId: account?.location_id,
    onTranscription: (text) => {
      setInput(prev => {
        const trimmed = prev.trim();
        return trimmed ? trimmed + ' ' + text : text;
      });
    }
  });

  useEffect(() => {
    if (!account?.location_id) return;

    const loadProgress = async () => {
      const data = await getPhase2Data(account.location_id);
      setProgress(data);
      
      // If content already generated, show outputs
      if (data.content_generated && data.content_outputs) {
        setOutputs(data.content_outputs);
        setShowOutputs(true);
      } else {
        // Start conversation
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm going to help you create all the content you need for your lead machine — your post caption, DM template, landing page copy, and delivery emails.\n\nThis should only take about 10 minutes. Let's go! 🚀\n\n${QUESTIONS[0]}`
        }]);
      }
      setLoadingData(false);
    };

    loadProgress();
  }, [account]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    const newAnswers = [...answers, userMessage];
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      // More questions to ask
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Great! ${QUESTIONS[nextQuestion]}`
        }]);
      }, 500);
    } else {
      // All questions answered - generate outputs
      setGeneratingOutputs(true);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Perfect! I have everything I need. Let me generate your content... ✨"
      }]);

      try {
        const generatedOutputs = await generateContentOutputs(newAnswers);
        setOutputs(generatedOutputs);
        
        // Save to database
        if (account?.location_id) {
          await updatePhase2Data(account.location_id, {
            content_generated: true,
            content_outputs: generatedOutputs,
          });
          await refreshAccount();
        }

        setTimeout(() => {
          setShowOutputs(true);
        }, 1000);
      } catch (error) {
        console.error('Error generating outputs:', error);
        toast({
          title: "Error",
          description: "Failed to generate content. Please try again.",
          variant: "destructive",
        });
      } finally {
        setGeneratingOutputs(false);
      }
    }
  };

  const generateContentOutputs = async (answers: string[]): Promise<Phase2ContentOutputs> => {
    const [coachingType, idealClient, mainProblem, leadMagnet, nextStep, socialHandle] = answers;
    
    // Call edge function to generate content
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-phase2-content`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          'X-Location-ID': account?.location_id || '',
        },
        body: JSON.stringify({
          coaching_type: coachingType,
          ideal_client: idealClient,
          main_problem: mainProblem,
          lead_magnet: leadMagnet,
          next_step: nextStep,
          social_handle: socialHandle,
          domain: progress?.domain_value || 'yourdomain.com',
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    return data.outputs;
  };

  const copyToClipboard = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast({
      title: "Copied!",
      description: `${section} copied to clipboard`,
    });
  };

  const handleComplete = () => {
    toast({
      title: "Content created!",
      description: "Your content is ready to use.",
    });
    navigate('/phase2');
  };

  const handleRegenerate = async () => {
    setShowOutputs(false);
    setMessages([{
      role: 'assistant',
      content: `Let's create fresh content! ${QUESTIONS[0]}`
    }]);
    setCurrentQuestion(0);
    setAnswers([]);
    setOutputs(null);
  };

  if (loadingData || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#605547' }}>
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10" style={{ backgroundColor: 'rgba(96, 85, 71, 0.9)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <img src={awakenLogo} alt="AwakenOS" className="h-8" />
            <Button variant="ghost" size="sm" onClick={() => navigate('/phase2')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Phase 2
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Your Content</h1>
          <p className="text-white/70 mt-1">Let's write everything you need in about 10 minutes</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col">
        {showOutputs && outputs ? (
          /* Outputs View */
          <div className="space-y-6 pb-20">
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold text-white mb-2">Your Content — Ready to Use 🎉</h2>
              <p className="text-white/70">Copy each section and use it in your automation</p>
            </div>

            {/* Post Caption */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  📱 Your Post Caption
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(outputs.post_caption, 'Post Caption')}
                >
                  {copiedSection === 'Post Caption' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedSection === 'Post Caption' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                {outputs.post_caption}
              </div>
            </Card>

            {/* DM Template */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  💬 Your DM Template
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(outputs.dm_template, 'DM Template')}
                >
                  {copiedSection === 'DM Template' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedSection === 'DM Template' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                {outputs.dm_template}
              </div>
            </Card>

            {/* Landing Page */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  📄 Your Landing Page
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(
                    `Headline: ${outputs.landing_page.headline}\n\nSubheadline: ${outputs.landing_page.subheadline}\n\nButton: ${outputs.landing_page.button_text}`,
                    'Landing Page'
                  )}
                >
                  {copiedSection === 'Landing Page' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedSection === 'Landing Page' ? 'Copied!' : 'Copy All'}
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Headline</label>
                  <div className="bg-muted p-3 rounded-lg mt-1 text-lg font-semibold">
                    {outputs.landing_page.headline}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Subheadline</label>
                  <div className="bg-muted p-3 rounded-lg mt-1">
                    {outputs.landing_page.subheadline}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Button Text</label>
                  <div className="bg-muted p-3 rounded-lg mt-1">
                    {outputs.landing_page.button_text}
                  </div>
                </div>
              </div>
            </Card>

            {/* Delivery Email */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  📧 Your Delivery Email
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(
                    `Subject: ${outputs.delivery_email.subject}\n\n${outputs.delivery_email.body}`,
                    'Delivery Email'
                  )}
                >
                  {copiedSection === 'Delivery Email' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedSection === 'Delivery Email' ? 'Copied!' : 'Copy All'}
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Subject Line</label>
                  <div className="bg-muted p-3 rounded-lg mt-1 font-medium">
                    {outputs.delivery_email.subject}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Body</label>
                  <div className="bg-muted p-3 rounded-lg mt-1 whitespace-pre-wrap text-sm">
                    {outputs.delivery_email.body}
                  </div>
                </div>
              </div>
            </Card>

            {/* Follow-up Email */}
            <Card className="p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  📧 Your Follow-up Email (Day 2)
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(
                    `Subject: ${outputs.followup_email.subject}\n\n${outputs.followup_email.body}`,
                    'Follow-up Email'
                  )}
                >
                  {copiedSection === 'Follow-up Email' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedSection === 'Follow-up Email' ? 'Copied!' : 'Copy All'}
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Subject Line</label>
                  <div className="bg-muted p-3 rounded-lg mt-1 font-medium">
                    {outputs.followup_email.subject}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Body</label>
                  <div className="bg-muted p-3 rounded-lg mt-1 whitespace-pre-wrap text-sm">
                    {outputs.followup_email.body}
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleRegenerate}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button 
                onClick={handleComplete}
                className="flex-1 bg-[#ebcc89] text-black hover:bg-[#d4b876]"
              >
                Done — Back to Checklist
              </Button>
            </div>
          </div>
        ) : (
          /* Chat View */
          <>
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      message.role === 'user'
                        ? "bg-[#827666] text-white"
                        : "bg-white text-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {generatingOutputs && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!generatingOutputs && (
              <div className="sticky bottom-0 bg-transparent pt-4">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type your answer..."
                    className="min-h-[60px] max-h-32 bg-white resize-none"
                    disabled={isLoading || isTranscribing}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      size="icon"
                      onClick={toggleRecording}
                      disabled={isLoading}
                      className={cn(
                        "h-10 w-10 shrink-0",
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
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="bg-[#827666] hover:bg-[#6b5f4f] h-10 w-10"
                      size="icon"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Phase2AIConversation;
