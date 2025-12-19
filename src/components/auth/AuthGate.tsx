import { useAccount } from '@/contexts/AccountContext';
import { PasswordGate } from './PasswordGate';
import { DemoSignupForm } from './DemoSignupForm';
import { ExpiredAccount } from './ExpiredAccount';
import { Loader2 } from 'lucide-react';
import { Account } from '@/lib/accounts';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { authState, setAuthState, setAccount } = useAccount();

  const handlePasswordSuccess = () => {
    setAuthState('demo-signup');
  };

  const handleDemoSignupSuccess = (account: Account) => {
    setAccount(account);
    setAuthState('authenticated');
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#605547' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (authState === 'password-gate') {
    return <PasswordGate onSuccess={handlePasswordSuccess} />;
  }

  if (authState === 'demo-signup') {
    return (
      <DemoSignupForm 
        onSuccess={handleDemoSignupSuccess} 
        onExpired={() => setAuthState('expired')}
      />
    );
  }

  if (authState === 'expired') {
    return <ExpiredAccount />;
  }

  // authState === 'authenticated'
  return <>{children}</>;
}
