import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Account, 
  getAccountByLocationId, 
  createAccount, 
  isAccountExpired 
} from '@/lib/accounts';

type AuthState = 
  | 'loading'
  | 'password-gate'
  | 'demo-signup'
  | 'expired'
  | 'authenticated';

interface AccountContextType {
  account: Account | null;
  authState: AuthState;
  locationId: string | null;
  setAccount: (account: Account | null) => void;
  setAuthState: (state: AuthState) => void;
  refreshAccount: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const LOCATION_ID_STORAGE_KEY = 'awaken_location_id';

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initializeAccount = async () => {
    // Check URL parameter first
    const urlLocationId = searchParams.get('locationId');
    
    // Then check localStorage for returning users
    const storedLocationId = localStorage.getItem(LOCATION_ID_STORAGE_KEY);
    
    const effectiveLocationId = urlLocationId || storedLocationId;

    // If locationId is empty or whitespace, treat as no locationId
    if (!effectiveLocationId || effectiveLocationId.trim() === '') {
      setAuthState('password-gate');
      return;
    }

    setLocationId(effectiveLocationId);
    
    // Store locationId for future visits
    if (effectiveLocationId) {
      localStorage.setItem(LOCATION_ID_STORAGE_KEY, effectiveLocationId);
    }

    // Query database for existing account
    const existingAccount = await getAccountByLocationId(effectiveLocationId);

    if (existingAccount) {
      // Check if demo account has expired
      if (isAccountExpired(existingAccount)) {
        setAuthState('expired');
        return;
      }
      
      setAccount(existingAccount);
      setAuthState('authenticated');
    } else {
      // Create new account for this locationId (production flow)
      const newAccount = await createAccount(effectiveLocationId, false);
      if (newAccount) {
        setAccount(newAccount);
        setAuthState('authenticated');
      } else {
        // Failed to create account, show password gate as fallback
        setAuthState('password-gate');
      }
    }
  };

  const refreshAccount = async () => {
    if (!locationId && !account?.location_id) return;
    
    const id = locationId || account?.location_id;
    if (!id) return;
    
    const refreshedAccount = await getAccountByLocationId(id);
    if (refreshedAccount) {
      setAccount(refreshedAccount);
    }
  };

  useEffect(() => {
    initializeAccount();
  }, [searchParams]);

  return (
    <AccountContext.Provider 
      value={{ 
        account, 
        authState, 
        locationId,
        setAccount, 
        setAuthState,
        refreshAccount
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
