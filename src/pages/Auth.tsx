import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });

const Auth = () => {
  const [searchParams] = useSearchParams();
  const prefillName = searchParams.get('name') || '';
  const prefillEmail = searchParams.get('email') || '';
  const isSignupFlow = Boolean(prefillName && prefillEmail);

  const [isLogin, setIsLogin] = useState(!isSignupFlow);
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [name, setName] = useState(prefillName);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validate = () => {
    const newErrors: { password?: string } = {};
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name.trim(),
            },
          },
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please log in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account created",
            description: "You're now signed in!",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf5f5]/[0.33] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignupFlow ? 'Create Your Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </CardTitle>
          <CardDescription>
            {isSignupFlow 
              ? `Almost there, ${prefillName}! Just create a password to get started.`
              : (isLogin 
                ? 'Sign in to continue building your mini-funnel' 
                : 'Sign up to start building your client-getting system')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignupFlow && !isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            {!isSignupFlow && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            {isSignupFlow && (
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">{prefillEmail}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'border-destructive' : ''}
                autoFocus={isSignupFlow}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Please wait...' : (isSignupFlow ? 'Create Account' : (isLogin ? 'Sign In' : 'Create Account'))}
            </Button>
          </form>
          
          {!isSignupFlow && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-primary underline"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          )}

          {isSignupFlow && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-muted-foreground hover:text-primary underline"
              >
                Go back
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
