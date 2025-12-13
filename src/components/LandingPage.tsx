import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Calendar, Bot, Bell, Target, Link } from 'lucide-react';
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
  { bold: "Ready to receive clients", rest: "Calendar, booking page, contracts, and payments — so when someone wants to work with you, you're ready." },
  { bold: "AI that responds 24/7", rest: "Trained on your voice, your services, your style — answering questions and booking calls while you sleep." },
  { bold: "Reminders that protect your bookings", rest: "Reduce no-shows by up to 50% with automatic SMS and email reminders." },
  { bold: "A complete funnel to attract clients", rest: "Lead magnet, landing page, nurture emails, and offer — all written for you." },
  { bold: "One connected system", rest: "No more juggling scattered tools. Everything works together." }
];

const phases = [
  { 
    title: "Ready for Business", 
    time: "~17 minutes",
    description: "Book, sign, and get paid professionally. Calendar, booking page, contracts, and payments."
  },
  { 
    title: "Your 24/7 Assistant", 
    time: "~35 minutes",
    description: "Train an AI that sounds like you. It handles inquiries and books calls while you sleep."
  },
  { 
    title: "Client Magnet", 
    time: "~30 minutes",
    description: "Build landing pages, lead magnets, and emails that bring the right people to you."
  }
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
    backgroundColor: '#605547'
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
            From Scattered to Systemized
          </h1>
          <p className="text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight italic font-semibold -mt-2 text-white">
            In One Afternoon
          </p>
          
          <p style={{
          color: '#d4d4d4'
        }} className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            A guided setup that gives you everything you need to receive inquiries, respond instantly, and convert them into paying clients — without the tech overwhelm.
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
          <div className="space-y-6 bg-white rounded-xl p-6 shadow-lg h-full">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              What You'll Walk Away With:
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style={{
                backgroundColor: '#56bc77'
              }}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-foreground/90 leading-relaxed"><strong>{benefit.bold}:</strong> {benefit.rest}</span>
                </li>)}
            </ul>
          </div>

          {/* CTA Card */}
          <Card className="border-border/50 shadow-lg h-full rounded-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl md:text-3xl font-bold">Start Your Setup</CardTitle>
              <CardDescription>
                Three guided conversations. Under an hour. Fully ready for business.
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
                  Start Now — Free
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
          In under an hour, you'll go from "I need to get organized" to "I'm fully ready for business."
        </p>
      </section>

      {/* How It Works Section */}
      <section className="py-12 px-4" style={{ backgroundColor: '#4a453c' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {phases.map((phase, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#eccd8a' }}>
                  <span className="text-black font-bold">{index + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{phase.title}</h3>
                <p className="text-sm text-white/70 mb-3">{phase.time}</p>
                <p className="text-white/90 text-sm leading-relaxed">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>;
}