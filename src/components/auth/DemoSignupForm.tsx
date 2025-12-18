import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createDemoAccount, Account } from '@/lib/accounts';
import { UserPlus, Loader2 } from 'lucide-react';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Please enter a valid email').max(255, 'Email must be less than 255 characters'),
  business: z.string().trim().max(200, 'Business name must be less than 200 characters').optional(),
});

interface DemoSignupFormProps {
  onSuccess: (account: Account) => void;
}

export function DemoSignupForm({ onSuccess }: DemoSignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [business, setBusiness] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = signupSchema.safeParse({ name, email, business: business || undefined });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const account = await createDemoAccount(
        result.data.name,
        result.data.email,
        result.data.business
      );
      
      if (account) {
        // Store location_id for future visits
        localStorage.setItem('awaken_location_id', account.location_id);
        onSuccess(account);
      } else {
        setErrors({ form: 'Failed to create account. Please try again.' });
      }
    } catch (err) {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#605547' }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Let's Get You Set Up</CardTitle>
          <CardDescription>
            Enter your details to start your 7-day demo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Your Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="business">Business Name (optional)</Label>
              <Input
                id="business"
                type="text"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="Your coaching business"
                disabled={isLoading}
              />
              {errors.business && (
                <p className="text-sm text-destructive">{errors.business}</p>
              )}
            </div>

            {errors.form && (
              <p className="text-sm text-destructive text-center">{errors.form}</p>
            )}

            <Button 
              type="submit" 
              className="w-full"
              style={{ backgroundColor: '#ebcc89', color: 'black' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Start Your Demo'
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your demo access expires in 7 days
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
