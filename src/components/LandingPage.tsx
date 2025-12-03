import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { z } from 'zod';

interface LandingPageProps {
  onStartClick: (name: string, email: string) => void;
  className?: string;
}

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" });

const benefits = [
  "Your lead magnet written and structured (not just an outline — the actual content)",
  "Landing page copy that speaks directly to your ideal client",
  "10 nurture emails that build trust and book calls",
  "A clear, compelling offer you can explain in 30 seconds",
  "Everything formatted and ready to paste into your templates"
];

export function LandingPage({ onStartClick, className }: LandingPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Please enter your name';
    }
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onStartClick(name.trim(), email.trim());
    }
  };

  return (
    <main className={`min-h-screen bg-background ${className || ''}`}>
      {/* Hero Section */}
      <section className="pt-6 md:pt-10 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="w-full max-w-2xl mx-auto mb-10">
            <div className="relative w-full pb-[56.25%] rounded-lg overflow-hidden shadow-lg">
              <iframe
                src="https://www.youtube.com/embed/ECGHeaz8qFQ"
                title="Introduction Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Your Entire Client-Getting System,
          </h1>
          <p className="text-3xl md:text-4xl lg:text-5xl tracking-tight text-foreground leading-tight italic font-semibold -mt-2">
            Built in One Conversation
          </p>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A guided AI conversation that turns what you know into a complete mini-funnel — lead magnet, landing pages, emails, and offer — in under an hour.
          </p>
        </div>
      </section>

      {/* Benefits + CTA Section */}
      <section className="pb-12 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 md:gap-10 items-start">
          {/* Benefits */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              What You'll Get:
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1fb14c]/10 flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4" style={{ color: '#1fb14c' }} />
                  </div>
                  <span className="text-foreground/90 leading-relaxed font-semibold">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Get Started</CardTitle>
              <CardDescription>
                Enter your details to begin your guided conversation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <Button 
                  type="submit"
                  size="lg" 
                  className="w-full text-black font-bold bg-[#eccd8a] hover:bg-[#d4a854] rounded-full transition-colors"
                >
                  Start Building
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Takes about 10-15 minutes • No credit card required
        </p>
      </section>
    </main>
  );
}
