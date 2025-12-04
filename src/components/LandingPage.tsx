import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { z } from 'zod';
import awakenLogo from '@/assets/awaken-logo-white.png';
interface LandingPageProps {
  onStartClick: (name: string, email: string) => void;
  className?: string;
}
const emailSchema = z.string().trim().email({
  message: "Please enter a valid email address"
});
const benefits = [
  { bold: "From Stranger to Subscriber", rest: "A lead magnet that actually gets downloads" },
  { bold: "From Subscriber to Call", rest: "10 emails that build trust on autopilot" },
  { bold: "From Call to Client", rest: "An offer that's clear, compelling, and ready to sell" }
];
export function LandingPage({
  onStartClick,
  className
}: LandingPageProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
  }>({});
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {
      name?: string;
      email?: string;
    } = {};
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
  return <main className={`min-h-screen ${className || ''}`} style={{
    backgroundColor: '#827666'
  }}>
      {/* Hero Section */}
      <section className="pt-6 md:pt-10 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="w-full max-w-4xl mx-auto mb-10 flex items-center justify-center gap-6">
            <div className="hidden md:block flex-shrink-0">
              <img src={awakenLogo} alt="Awaken OS Logo" className="w-72" />
            </div>
            <div className="flex-1 max-w-md">
              <div className="relative w-full pb-[56.25%] rounded-lg overflow-hidden shadow-lg">
                <iframe src="https://www.youtube.com/embed/ECGHeaz8qFQ" title="Introduction Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute inset-0 w-full h-full" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
            Your Entire Client-Getting System,
          </h1>
          <p className="text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight italic font-semibold -mt-2 text-white">
            Built in One Conversation
          </p>
          
          <p style={{
          color: '#f5f5f0'
        }} className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed text-[#b8b6b6]">
            A guided AI conversation that turns what you know into a complete mini-funnel — lead magnet, landing pages, emails, and offer — in less than 30 minutes.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="h-px w-full" style={{
        background: 'linear-gradient(90deg, transparent, #827666 20%, #827666 80%, transparent)'
      }} />
      </div>

      {/* Benefits + CTA Section */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 md:gap-10 items-start">
          {/* Benefits */}
          <div className="space-y-6 bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              What You'll Get:
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style={{
                backgroundColor: '#1fb14c'
              }}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-foreground/90 leading-relaxed"><strong>{benefit.bold}:</strong> {benefit.rest}</span>
                </li>)}
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
                  <Input id="name" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className={errors.name ? 'border-destructive' : ''} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={errors.email ? 'border-destructive' : ''} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <Button type="submit" size="lg" className="w-full text-black font-bold bg-[#eccd8a] hover:bg-[#d4a854] rounded-full transition-colors">
                  Start Building
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button type="button" onClick={() => navigate('/auth')} className="text-sm text-muted-foreground hover:text-primary underline">
                  Already have an account? Log in
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          In less than 30 mins you'll have your complete mini funnel strategy and copy
        </p>
      </section>
    </main>;
}