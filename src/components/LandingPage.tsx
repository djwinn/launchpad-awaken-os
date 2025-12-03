import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';
import { findIncompleteConversation, createConversation, deleteConversation } from '@/lib/conversations';
import { ResumeDialog } from '@/components/ResumeDialog';
import type { UserInfo, Message, Conversation } from '@/types/chat';
interface LandingPageProps {
  onStart: (userInfo: UserInfo, conversationId: string, existingMessages?: Message[]) => void;
  className?: string;
}
const benefits = ["Your lead magnet written and structured (not just an outline — the actual content)", "Landing page copy that speaks directly to your ideal client", "10 nurture emails that build trust and book calls", "A clear, compelling offer you can explain in 30 seconds", "Everything formatted and ready to paste into your templates"];
export function LandingPage({
  onStart,
  className
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
      onStart({
        name: name.trim(),
        email: email.trim()
      }, conversationId);
    }
  };
  const handleContinue = () => {
    setShowResumeDialog(false);
    if (existingConversation) {
      onStart({
        name: existingConversation.user_name || name.trim(),
        email: email.trim()
      }, existingConversation.id, existingConversation.messages);
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
      onStart({
        name: name.trim(),
        email: email.trim()
      }, conversationId);
    }
  };
  return <main className={`min-h-screen bg-background ${className || ''}`}>
      {/* Hero Section */}
      <section className="pt-6 md:pt-10 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <img alt="Awaken Digital Logo" className="h-32 md:h-40 w-auto mx-auto mb-4" src="/lovable-uploads/9b3205c4-a8f8-49cb-8bc7-7b766e4dbbba.png" />
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Your Entire Client-Getting System,
          </h1>
          <p className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Built in One Conversation
          </p>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A guided AI conversation that turns what you know into a complete mini-funnel — lead magnet, landing pages, emails, and offer — in under an hour.
          </p>
        </div>
      </section>

      {/* Benefits + Form Section */}
      <section className="pb-12 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 md:gap-10 items-start">
          {/* Benefits */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              What You'll Get:
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground/90 leading-relaxed">{benefit}</span>
                </li>)}
            </ul>
          </div>

          {/* Form Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Get Started</CardTitle>
              <CardDescription>
                Enter your details below to begin your guided conversation.
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

                <Button type="submit" size="lg" disabled={isLoading} className="w-full text-black font-bold bg-[#eccd8a] rounded-full">
                  {isLoading ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </> : 'Start Building'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Takes about 10-15 minutes • No credit card required
        </p>
      </section>

      <ResumeDialog open={showResumeDialog} onContinue={handleContinue} onStartFresh={handleStartFresh} />
    </main>;
}