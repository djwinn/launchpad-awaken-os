import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { findIncompleteConversation, createConversation, deleteConversation } from '@/lib/conversations';
import { ResumeDialog } from '@/components/ResumeDialog';
import type { UserInfo, Message, Conversation } from '@/types/chat';

interface LandingPageProps {
  onStart: (userInfo: UserInfo, conversationId: string, existingMessages?: Message[]) => void;
}
export function LandingPage({
  onStart
}: LandingPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
  }>({});
  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
    } = {};
    if (!name.trim()) {
      newErrors.name = 'Please enter your name';
    }
    if (!email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [isLoading, setIsLoading] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [existingConversation, setExistingConversation] = useState<Conversation | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const existing = await findIncompleteConversation(email.trim());

    if (existing && existing.messages.length > 0) {
      setExistingConversation(existing);
      setShowResumeDialog(true);
      setIsLoading(false);
      return;
    }

    const conversationId = await createConversation(email.trim(), name.trim());
    setIsLoading(false);
    if (conversationId) {
      onStart({ name: name.trim(), email: email.trim() }, conversationId);
    }
  };

  const handleContinue = () => {
    setShowResumeDialog(false);
    if (existingConversation) {
      onStart(
        { name: existingConversation.user_name || name.trim(), email: email.trim() },
        existingConversation.id,
        existingConversation.messages
      );
    }
  };

  const handleStartFresh = async () => {
    setShowResumeDialog(false);
    setIsLoading(true);
    if (existingConversation) {
      await deleteConversation(existingConversation.id);
    }
    const conversationId = await createConversation(email.trim(), name.trim());
    setIsLoading(false);
    if (conversationId) {
      onStart({ name: name.trim(), email: email.trim() }, conversationId);
    }
  };
  return <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <img alt="Awaken Digital Logo" className="h-20 w-auto" src="/lovable-uploads/9b3205c4-a8f8-49cb-8bc7-7b766e4dbbba.png" />
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Mini-Funnel Builder
            </h1>
            <p className="text-muted-foreground text-lg">
              Create your complete mini-funnel copy in one conversation
            </p>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Get Started</CardTitle>
            <CardDescription>
              Our AI will guide you through a series of questions to understand your coaching business and create all the copy you need.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" type="text" placeholder="Sarah Smith" value={name} onChange={e => setName(e.target.value)} className={errors.name ? 'border-destructive' : ''} disabled={isLoading} />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="sarah@example.com" value={email} onChange={e => setEmail(e.target.value)} className={errors.email ? 'border-destructive' : ''} disabled={isLoading} />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Start Building'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Takes about 10-15 minutes • No credit card required
        </p>
      </div>

      <ResumeDialog
        open={showResumeDialog}
        onContinue={handleContinue}
        onStartFresh={handleStartFresh}
      />
    </main>;
}