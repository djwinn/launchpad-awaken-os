import type { Account } from './accounts';

// Phase 1 data structure
export interface Phase1Data {
  items_complete: number;
  profile_complete: boolean;
  calendar_connected: boolean;
  booking_page_created: boolean;
  contract_prepared: boolean;
  payments_connected: boolean;
  location_id?: string;
}

// Phase 2 data structure
export interface Phase2Data {
  started: boolean;
  social_accounts_connected: boolean;
  social_capture_active: boolean;
  social_capture_toolkit?: string;
}

// Phase 3 data structure
export interface Phase3Data {
  started: boolean;
  funnel_craft_complete: boolean;
  funnel_build_complete: boolean;
  funnel_blueprint?: string;
}

async function fetchAccountPhaseData(locationId: string, phase: 1 | 2 | 3): Promise<Record<string, unknown> | null> {
  try {
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
      return null;
    }

    const result = await response.json();
    const account = result.data;
    if (!account) return null;

    return (account[`phase_${phase}_data`] as Record<string, unknown>) || {};
  } catch (error) {
    console.error(`Error fetching phase ${phase} data:`, error);
    return null;
  }
}

async function updateAccountData(locationId: string, updates: Record<string, unknown>): Promise<boolean> {
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

    return response.ok;
  } catch (error) {
    console.error('Error updating account data:', error);
    return false;
  }
}

export async function getPhase1Data(locationId: string): Promise<Phase1Data> {
  const phase1Data = await fetchAccountPhaseData(locationId, 1);

  if (!phase1Data) {
    return {
      items_complete: 0,
      profile_complete: false,
      calendar_connected: false,
      booking_page_created: false,
      contract_prepared: false,
      payments_connected: false,
    };
  }

  return {
    items_complete: (phase1Data.items_complete as number) || 0,
    profile_complete: (phase1Data.profile_complete as boolean) || false,
    calendar_connected: (phase1Data.calendar_connected as boolean) || false,
    booking_page_created: (phase1Data.booking_page_created as boolean) || false,
    contract_prepared: (phase1Data.contract_prepared as boolean) || false,
    payments_connected: (phase1Data.payments_connected as boolean) || false,
    location_id: phase1Data.location_id as string | undefined,
  };
}

export async function updatePhase1Data(
  locationId: string,
  updates: Partial<Phase1Data>
): Promise<boolean> {
  // First get current data
  const currentData = await getPhase1Data(locationId);
  const newData = { ...currentData, ...updates };
  
  // Calculate items complete
  const completedCount = [
    newData.profile_complete,
    newData.calendar_connected,
    newData.booking_page_created,
    newData.contract_prepared,
    newData.payments_connected,
  ].filter(Boolean).length;
  
  newData.items_complete = completedCount;
  const phase1Complete = completedCount === 5;

  return updateAccountData(locationId, {
    phase_1_data: newData,
    phase_1_complete: phase1Complete,
  });
}

export async function getPhase2Data(locationId: string): Promise<Phase2Data> {
  const phase2Data = await fetchAccountPhaseData(locationId, 2);

  if (!phase2Data) {
    return {
      started: false,
      social_accounts_connected: false,
      social_capture_active: false,
    };
  }

  return {
    started: (phase2Data.started as boolean) || false,
    social_accounts_connected: (phase2Data.social_accounts_connected as boolean) || false,
    social_capture_active: (phase2Data.social_capture_active as boolean) || false,
    social_capture_toolkit: phase2Data.social_capture_toolkit as string | undefined,
  };
}

export async function updatePhase2Data(
  locationId: string,
  updates: Partial<Phase2Data>
): Promise<boolean> {
  const currentData = await getPhase2Data(locationId);
  const newData = { ...currentData, ...updates, started: true };
  
  const phase2Complete = newData.social_accounts_connected && newData.social_capture_active;

  return updateAccountData(locationId, {
    phase_2_data: newData,
    phase_2_complete: phase2Complete,
  });
}

export async function getPhase3Data(locationId: string): Promise<Phase3Data> {
  const phase3Data = await fetchAccountPhaseData(locationId, 3);

  if (!phase3Data) {
    return {
      started: false,
      funnel_craft_complete: false,
      funnel_build_complete: false,
    };
  }

  return {
    started: (phase3Data.started as boolean) || false,
    funnel_craft_complete: (phase3Data.funnel_craft_complete as boolean) || false,
    funnel_build_complete: (phase3Data.funnel_build_complete as boolean) || false,
    funnel_blueprint: phase3Data.funnel_blueprint as string | undefined,
  };
}

export async function updatePhase3Data(
  locationId: string,
  updates: Partial<Phase3Data>
): Promise<boolean> {
  const currentData = await getPhase3Data(locationId);
  const newData = { ...currentData, ...updates, started: true };
  
  const phase3Complete = newData.funnel_craft_complete && newData.funnel_build_complete;

  return updateAccountData(locationId, {
    phase_3_data: newData,
    phase_3_complete: phase3Complete,
  });
}
