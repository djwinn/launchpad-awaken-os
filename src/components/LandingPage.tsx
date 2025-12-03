import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

interface LandingPageProps {
  onStartClick: () => void;
  className?: string;
}

const benefits = [
  "Your lead magnet written and structured (not just an outline — the actual content)",
  "Landing page copy that speaks directly to your ideal client",
  "10 nurture emails that build trust and book calls",
  "A clear, compelling offer you can explain in 30 seconds",
  "Everything formatted and ready to paste into your templates"
];

export function LandingPage({ onStartClick, className }: LandingPageProps) {
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
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground/90 leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Get Started</CardTitle>
              <CardDescription>
                Create a free account to begin your guided conversation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={onStartClick}
                size="lg" 
                className="w-full text-black font-bold bg-[#eccd8a] hover:bg-[#d4a854] rounded-full transition-colors"
              >
                Start Building
              </Button>
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
