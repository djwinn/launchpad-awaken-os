import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, X } from 'lucide-react';
import { COMMUNITY_CHANNELS, getChannelDisplayName, type CommunityChannel } from '@/lib/community-share';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CommunityShareToastProps {
  message: string;
  channel: CommunityChannel;
  prewrittenMessage: string;
  onDismiss: () => void;
  isVisible: boolean;
}

export function CommunityShareToast({
  message,
  channel,
  prewrittenMessage,
  onDismiss,
  isVisible,
}: CommunityShareToastProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const channelUrl = COMMUNITY_CHANNELS[channel];
  const channelName = getChannelDisplayName(channel);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(onDismiss, 10000);
    return () => clearTimeout(timer);
  }, [isVisible, onDismiss]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prewrittenMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      className={cn(
        "fixed bottom-4 right-4 left-4 md:left-auto md:max-w-md bg-background border border-border rounded-lg shadow-lg p-4 z-50",
        "animate-in slide-in-from-right-full duration-300"
      )}
    >
      {/* Header with message and close button */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 text-[#56bc77] flex-shrink-0" />
          <span className="font-medium text-foreground">{message}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex-1"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
        <Button
          size="sm"
          onClick={handleShare}
          className="flex-1 bg-[#ebcc89] text-black hover:bg-[#d4b876]"
        >
          Share in {channelName}
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
