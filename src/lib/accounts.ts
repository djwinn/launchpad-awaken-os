import { supabase } from '@/integrations/supabase/client';

export interface Account {
  id: string;
  location_id: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  is_demo: boolean;
  demo_name: string | null;
  demo_email: string | null;
  demo_business: string | null;
  phase_1_complete: boolean;
  phase_2_complete: boolean;
  phase_3_complete: boolean;
  phase_1_data: Record<string, unknown> | null;
  phase_2_data: Record<string, unknown> | null;
  phase_3_data: Record<string, unknown> | null;
}

function generateRandomId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function getAccountByLocationId(locationId: string): Promise<Account | null> {
  try {
    const { data, error } = await supabase.functions.invoke('manage-accounts', {
      method: 'GET',
      body: null,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Use fetch directly since supabase.functions.invoke doesn't support query params well
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-accounts?location_id=${encodeURIComponent(locationId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Error fetching account by location_id:', response.statusText);
      return null;
    }

    const result = await response.json();
    return result.data as Account | null;
  } catch (error) {
    console.error('Error fetching account by location_id:', error);
    return null;
  }
}

export async function getAccountByEmail(email: string): Promise<Account | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-accounts?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Error fetching account by email:', response.statusText);
      return null;
    }

    const result = await response.json();
    return result.data as Account | null;
  } catch (error) {
    console.error('Error fetching account by email:', error);
    return null;
  }
}

export async function createAccount(locationId: string, isDemo: boolean = false): Promise<Account | null> {
  const expiresAt = isDemo 
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
    : null;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-accounts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location_id: locationId,
          is_demo: isDemo,
          expires_at: expiresAt,
        }),
      }
    );

    if (!response.ok) {
      console.error('Error creating account:', response.statusText);
      return null;
    }

    const result = await response.json();
    return result.data as Account;
  } catch (error) {
    console.error('Error creating account:', error);
    return null;
  }
}

export async function createDemoAccount(
  name: string,
  email: string,
  business?: string
): Promise<Account | null> {
  // Check if demo account already exists for this email
  const existingAccount = await getAccountByEmail(email);
  if (existingAccount) {
    return existingAccount;
  }

  const locationId = `demo_${generateRandomId()}`;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-accounts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location_id: locationId,
          is_demo: true,
          demo_name: name,
          demo_email: email,
          demo_business: business || null,
        }),
      }
    );

    if (!response.ok) {
      console.error('Error creating demo account:', response.statusText);
      return null;
    }

    const result = await response.json();
    return result.data as Account;
  } catch (error) {
    console.error('Error creating demo account:', error);
    return null;
  }
}

export async function updateAccountPhase(
  locationId: string,
  phase: 1 | 2 | 3,
  complete: boolean,
  data?: Record<string, unknown>
): Promise<boolean> {
  const updates: Record<string, unknown> = {
    [`phase_${phase}_complete`]: complete,
  };
  
  if (data) {
    updates[`phase_${phase}_data`] = data;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-accounts`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          'X-Location-ID': locationId,
        },
        body: JSON.stringify({ updates }),
      }
    );

    if (!response.ok) {
      console.error('Error updating account phase:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating account phase:', error);
    return false;
  }
}

export async function updateAccountPhaseData(
  locationId: string,
  phase: 1 | 2 | 3,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-accounts`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          'X-Location-ID': locationId,
        },
        body: JSON.stringify({ 
          updates: { [`phase_${phase}_data`]: data }
        }),
      }
    );

    if (!response.ok) {
      console.error('Error updating account phase data:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating account phase data:', error);
    return false;
  }
}

export function isAccountExpired(_account: Account): boolean {
  // Expiration disabled - all accounts have unlimited access
  return false;
}

export async function verifyDemoPassword(password: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('verify-demo-password', {
      body: { password },
    });

    if (error) {
      console.error('Error verifying demo password:', error);
      return false;
    }

    return data?.valid === true;
  } catch (error) {
    console.error('Error calling verify-demo-password:', error);
    return false;
  }
}
