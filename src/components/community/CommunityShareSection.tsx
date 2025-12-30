import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, Megaphone } from 'lucide-react';
import { COMMUNITY_CHANNELS, getChannelDisplayName, type CommunityChannel } from '@/lib/community-share';
import { useToast } from '@/hooks/use-toast';

interface CommunityShareSectionProps {
  channel: CommunityChannel;
  prewrittenMessage: string;
  onShare?: () => void;
  onDismiss?: () => void;
}

export function CommunityShareSection({
  channel,
  prewrittenMessage,
  onShare,
  onDismiss,
}: CommunityShareSectionProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const channelUrl = COMMUNITY_CHANNELS[channel];
  const channelName = getChannelDisplayName(channel);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prewrittenMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
    } catch {
      toast({
        title: "Couldn't copy",
        description: "Please select and copy manually",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    window.open(channelUrl, '_blank');
    onShare?.();
  };

  return (
    <div className="bg-muted/50 rounded-lg p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="h-5 w-5 text-[#827666]" />
        <h3 className="font-semibold text-foreground">Share your win in the Playground!</h3>
      </div>

      {/* Message preview box */}
      <div className="relative bg-background border border-border rounded-md p-4 mb-4 max-h-48 overflow-y-auto">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0"
          onClick={handleCopy}
          aria-label="Copy message to clipboard"
        >
          {copied ? (
            <Check className="h-4 w-4 text-[#56bc77]" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        <pre className="text-sm font-mono whitespace-pre-wrap text-foreground pr-10">
          {prewrittenMessage}
        </pre>
      </div>

      {/* Copy button (explicit) */}
      <Button
        variant="outline"
        size="sm"
        className="w-full mb-3"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Copy Message
          </>
        )}
      </Button>

      {/* Share button */}
      <Button
        className="w-full bg-[#ebcc89] text-black hover:bg-[#d4b876]"
        onClick={handleShare}
      >
        Share in {channelName}
        <ExternalLink className="h-4 w-4 ml-2" />
      </Button>

      {/* Maybe later link */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 py-2 transition-colors"
        >
          Maybe later
        </button>
      )}
    </div>
  );
}
