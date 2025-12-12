import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import logo from '@/assets/logo.png';

const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const prefillName = searchParams.get('name') || '';
  const prefillEmail = searchParams.get('email') || '';
  const isSignupFlow = Boolean(prefillName && prefillEmail);

  const [mode, setMode] = useState<AuthMode>(isSignupFlow ? 'signup' : 'login');
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [name, setName] = useState(prefillName);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for recovery mode from URL hash on mount (before any redirects)
  const [isRecoveryMode, setIsRecoveryMode] = useState(() => {
    const hash = window.location.hash;
    return hash.includes('type=recovery');
  });

  useEffect(() => {
    // Check for error or recovery in URL hash
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      
      // Check for error (from failed/expired password reset links)
      if (hash.includes('error=')) {
        const errorDescription = params.get('error_description');
        if (errorDescription) {
          toast({
            title: "Link expired",
            description: "The reset link has expired. Please request a new one.",
            variant: "destructive",
          });
          setMode('forgot');
          setIsRecoveryMode(false);
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
      }
      
      // Check for password recovery type in URL hash
      const type = params.get('type');
      if (type === 'recovery') {
        setMode('reset');
        setIsRecoveryMode(true);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        setIsRecoveryMode(true);
      } else if (session?.user && !isRecoveryMode && mode !== 'reset') {
        navigate('/dashboard');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Don't redirect if in recovery mode
      const hash = window.location.hash;
      const isRecovery = hash.includes('type=recovery');
      
      if (session?.user) {
        if (isRecovery) {
          setMode('reset');
          setIsRecoveryMode(true);
        } else if (!isRecoveryMode && mode !== 'reset') {
          navigate('/dashboard');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast, mode, isRecoveryMode]);

  const validate = () => {
    const newErrors: { password?: string } = {};
    
    if (mode === 'login' || mode === 'signup' || mode === 'reset') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
        setMode('login');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password updated",
          description: "Your password has been reset successfully.",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);

    try {
      if (mode === 'login') {
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
              title: "Welcome back!",
              description: "This email is already registered. Switching to login.",
            });
            setMode('login');
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

  const getTitle = () => {
    if (mode === 'reset') return 'Reset Password';
    if (mode === 'forgot') return 'Forgot Password';
    if (isSignupFlow) return 'Create Your Password';
    return mode === 'login' ? 'Welcome Back' : 'Create Account';
  };

  const getDescription = () => {
    if (mode === 'reset') return 'Enter your new password below.';
    if (mode === 'forgot') return "Enter your email and we'll send you a reset link.";
    if (isSignupFlow) return `Almost there, ${prefillName}! Just create a password to get started.`;
    return mode === 'login' 
      ? 'Sign in to continue building your mini-funnel' 
      : 'Sign up to start building your client-getting system';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf5f5]/[0.33] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Logo" className="h-12" />
          </div>
          <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-muted-foreground hover:text-primary underline"
                >
                  Back to login
                </button>
              </div>
            </form>
          ) : mode === 'reset' ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'border-destructive' : ''}
                  autoFocus
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isSignupFlow && mode === 'signup' && (
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
                
                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm text-muted-foreground hover:text-primary underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : (isSignupFlow ? 'Create Account' : (mode === 'login' ? 'Sign In' : 'Create Account'))}
                </Button>
              </form>
              
              {!isSignupFlow && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      setErrors({});
                    }}
                    className="text-sm text-muted-foreground hover:text-primary underline"
                  >
                    {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>
                </div>
              )}

              {isSignupFlow && (
                <div className="mt-4 text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrors({});
                    }}
                    className="text-sm text-muted-foreground hover:text-primary underline block w-full"
                  >
                    Already have an account? Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-sm text-muted-foreground hover:text-primary underline block w-full"
                  >
                    Go back
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
