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
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('location_id', locationId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching account by location_id:', error);
    return null;
  }

  return data as Account | null;
}

export async function getAccountByEmail(email: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('demo_email', email)
    .eq('is_demo', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching account by email:', error);
    return null;
  }

  return data as Account | null;
}

export async function createAccount(locationId: string, isDemo: boolean = false): Promise<Account | null> {
  const expiresAt = isDemo 
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
    : null;

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      location_id: locationId,
      is_demo: isDemo,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating account:', error);
    return null;
  }

  return data as Account;
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
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      location_id: locationId,
      is_demo: true,
      expires_at: expiresAt,
      demo_name: name,
      demo_email: email,
      demo_business: business || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating demo account:', error);
    return null;
  }

  return data as Account;
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

  const { error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('location_id', locationId);

  if (error) {
    console.error('Error updating account phase:', error);
    return false;
  }

  return true;
}

export async function updateAccountPhaseData(
  locationId: string,
  phase: 1 | 2 | 3,
  data: Record<string, unknown>
): Promise<boolean> {
  const { error } = await supabase
    .from('accounts')
    .update({ [`phase_${phase}_data`]: data })
    .eq('location_id', locationId);

  if (error) {
    console.error('Error updating account phase data:', error);
    return false;
  }

  return true;
}

export function isAccountExpired(account: Account): boolean {
  if (!account.is_demo || !account.expires_at) {
    return false;
  }
  return new Date(account.expires_at) < new Date();
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
