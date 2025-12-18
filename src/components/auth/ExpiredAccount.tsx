import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink } from 'lucide-react';

export function ExpiredAccount() {
  const handleSignUp = () => {
    window.open('https://app.awaken.digital', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#605547' }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Demo Access Expired</CardTitle>
          <CardDescription className="text-base mt-2">
            Your demo access has expired. Sign up for AwakenOS to continue building your coaching business.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleSignUp}
            className="w-full"
            style={{ backgroundColor: '#ebcc89', color: 'black' }}
          >
            Sign Up for AwakenOS
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Get full access to all features and start growing your business
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
