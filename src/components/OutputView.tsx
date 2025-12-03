import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { extractOutputDocument } from '@/lib/chat-api';
import type { Message, UserInfo } from '@/types/chat';
import logo from '@/assets/logo.png';

interface OutputViewProps {
  userInfo: UserInfo;
  messages: Message[];
  onStartOver: () => void;
  onBackToChat: () => void;
}

export function OutputView({ userInfo, messages, onStartOver, onBackToChat }: OutputViewProps) {
  const [copied, setCopied] = useState(false);
  const outputDocument = extractOutputDocument(messages) || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputDocument);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy. Please try again.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([outputDocument], { type: 'text/plain' });
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-auto invert dark:invert-0" />
            <div>
              <h1 className="font-medium text-foreground">Your Mini-Funnel Copy</h1>
              <p className="text-xs text-muted-foreground">For {userInfo.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBackToChat}>
              Back to Chat
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 pb-24">
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span>Complete Output</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy All'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh]">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground bg-muted/50 p-4 rounded-lg">
                {outputDocument}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={onStartOver}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </Button>
        </div>
      </main>
    </div>
  );
}
