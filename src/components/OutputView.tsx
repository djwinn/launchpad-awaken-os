import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Copy, Download, RotateCcw, Check, MessageSquare, Link, FileText, Globe, Heart, Calendar, Package, Mail, ClipboardList, Send } from 'lucide-react';
import { toast } from 'sonner';
import { parseOutputDocument, type ParsedOutput } from '@/lib/output-parser';
import { MarkdownContent } from '@/components/MarkdownContent';
import type { Message, UserInfo } from '@/types/chat';
import logo from '@/assets/logo.png';

interface OutputViewProps {
  userInfo: UserInfo;
  messages: Message[];
  onStartOver: () => void;
  onBackToChat: () => void;
}

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  instruction: string;
  content: string;
}

function SectionCard({ title, icon, instruction, content }: SectionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
          {instruction}
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="p-3 bg-background rounded-lg border border-border/50">
            <MarkdownContent content={content} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function EmailAccordion({ emails }: { emails: { title: string; content: string }[] }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Send className="w-5 h-5" />
          <span>Email Sequence</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
          Set these up as a nurture sequence in GHL. Go to Email Marketing → Sequences → Create Sequence. Schedule them on the days shown.
        </div>
        <Accordion type="single" collapsible className="w-full">
          {emails.map((email, index) => (
            <AccordionItem key={index} value={`email-${index}`}>
              <AccordionTrigger className="text-sm hover:no-underline">
                {email.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(email.content, index)}
                      className="gap-2"
                    >
                      {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedIndex === index ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <div className="p-3 bg-background rounded-lg border border-border/50">
                    <MarkdownContent content={email.content} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

export function OutputView({ userInfo, messages, onStartOver, onBackToChat }: OutputViewProps) {
  // Find the output document from messages
  const outputMessage = messages.find(
    (m) => m.role === 'assistant' && m.content.includes('YOUR COMPLETE MINI-FUNNEL COPY')
  );
  const rawOutput = outputMessage?.content || '';
  const parsed = parseOutputDocument(rawOutput);

  const handleDownloadAll = () => {
    const blob = new Blob([rawOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mini-funnel-${userInfo.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded successfully!');
  };

  if (!parsed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">Output not ready yet.</p>
            <Button onClick={onBackToChat}>Back to Chat</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-auto" />
            <div>
              <h1 className="font-medium text-foreground">Your Mini-Funnel Copy</h1>
              <p className="text-xs text-muted-foreground">For {userInfo.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBackToChat} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Back to Chat
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadAll} className="gap-2">
              <Download className="w-4 h-4" />
              Download All
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        {parsed.linkHub && (
          <SectionCard
            title="Link Hub"
            icon={<Link className="w-5 h-5" />}
            instruction="Copy this into your Link Hub page in GHL. Go to Sites → Funnels → Link Hub template."
            content={parsed.linkHub}
          />
        )}

        {parsed.leadMagnet && (
          <SectionCard
            title="Lead Magnet PDF"
            icon={<FileText className="w-5 h-5" />}
            instruction="Create this as a PDF. You can paste into Google Docs or Canva. This is what people download when they opt in."
            content={parsed.leadMagnet}
          />
        )}

        {parsed.landingPage && (
          <SectionCard
            title="Landing Page"
            icon={<Globe className="w-5 h-5" />}
            instruction="Paste this into your Landing Page template in GHL. Go to Sites → Funnels → Lead Magnet Funnel → Landing Page."
            content={parsed.landingPage}
          />
        )}

        {parsed.thankYouPage && (
          <SectionCard
            title="Thank You Page"
            icon={<Heart className="w-5 h-5" />}
            instruction="Paste this into your Thank You Page in GHL. This appears after they enter their email."
            content={parsed.thankYouPage}
          />
        )}

        {parsed.bookingPage && (
          <SectionCard
            title="Booking Page"
            icon={<Calendar className="w-5 h-5" />}
            instruction="Paste this into your Booking Page template in GHL. This is where people book discovery calls."
            content={parsed.bookingPage}
          />
        )}

        {parsed.yourOffer && (
          <SectionCard
            title="Your Offer"
            icon={<Package className="w-5 h-5" />}
            instruction="This is your offer structure. Use this as your script when explaining what you sell on discovery calls."
            content={parsed.yourOffer}
          />
        )}

        {parsed.welcomeEmail && (
          <SectionCard
            title="Welcome Email"
            icon={<Mail className="w-5 h-5" />}
            instruction="Set this up as an automation in GHL. Trigger: When someone purchases. Go to Automation → Create Workflow."
            content={parsed.welcomeEmail}
          />
        )}

        {parsed.intakeForm && (
          <SectionCard
            title="Intake Form"
            icon={<ClipboardList className="w-5 h-5" />}
            instruction="Create a form in GHL with these questions. Go to Sites → Forms → Create New Form."
            content={parsed.intakeForm}
          />
        )}

        {parsed.emails.length > 0 && <EmailAccordion emails={parsed.emails} />}

        {/* Actions */}
        <div className="flex justify-center pt-6">
          <Button variant="outline" onClick={onStartOver} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Start Over
          </Button>
        </div>
      </main>
    </div>
  );
}
