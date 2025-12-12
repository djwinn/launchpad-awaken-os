import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Copy } from 'lucide-react';

interface LocationIdModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (locationId: string) => void;
  currentLocationId?: string;
}

export function LocationIdModal({ open, onClose, onSave, currentLocationId }: LocationIdModalProps) {
  const [locationId, setLocationId] = useState(currentLocationId || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = locationId.trim();
    
    // Basic validation - alphanumeric string
    if (!trimmed) {
      setError('Please enter your Location ID');
      return;
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
      setError('Location ID should only contain letters and numbers');
      return;
    }
    
    onSave(trimmed);
    setError('');
  };

  const handleOpenAwakenOS = () => {
    window.open('https://app.awaken.digital', '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your AwakenOS Account</DialogTitle>
          <DialogDescription>
            So we can take you directly to the right pages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">How to find your Location ID:</p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-medium">1</span>
                <span>Open AwakenOS in another tab</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-medium">2</span>
                <span>Go to Settings → Business Profile</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-medium">3</span>
                <span>Your Location ID is shown at the top of the screen</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-medium">4</span>
                <span className="flex items-center gap-1">
                  Click the <Copy className="w-3 h-3 inline" /> button next to it, then paste below
                </span>
              </li>
            </ol>
          </div>

          {/* Visual hint */}
          <div className="border border-border rounded-lg p-3 bg-background">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>Location ID appears like:</span>
            </div>
            <div className="flex items-center gap-2 bg-muted rounded px-3 py-2">
              <code className="text-sm font-mono text-foreground">RNvR5mKx7z...</code>
              <Copy className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Open AwakenOS button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleOpenAwakenOS}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open AwakenOS
          </Button>

          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="locationId">Your Location ID</Label>
            <Input
              id="locationId"
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setError('');
              }}
              placeholder="Paste your Location ID here"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={handleSave}
            className="w-full bg-[#827666] hover:bg-[#6b5a4a]"
          >
            Save & Continue
          </Button>
          <button 
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            I'll do this later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
