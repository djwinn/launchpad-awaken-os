import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CoachProfile {
  id?: string;
  location_id: string;
  coach_name?: string;
  business_name?: string;
  instagram_handle?: string;
  website_url?: string;
  ideal_client_description?: string;
  ideal_client_demographics?: string;
  ideal_client_situation?: string;
  main_problem?: string;
  problem_feels_like?: string;
  what_theyve_tried?: string;
  transformation?: string;
  unique_approach?: string;
  origin_story?: string;
  credibility_points?: string;
  service_type?: string;
  offer_name?: string;
  offer_description?: string;
  offer_price?: string;
  offer_duration?: string;
  call_to_action?: string;
  booking_link?: string;
  lead_magnet_idea?: string;
  lead_magnet_format?: string;
  lead_magnet_title?: string;
  session_format?: string;
  session_duration?: string;
  payment_terms?: string;
  cancellation_policy?: string;
  created_at?: string;
  updated_at?: string;
}

interface UseCoachProfileReturn {
  profile: CoachProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<CoachProfile>) => Promise<boolean>;
}

export function useCoachProfile(locationId: string | null): UseCoachProfileReturn {
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!locationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke('manage-coach-profile', {
        body: { action: 'get' },
        headers: { 'x-location-id': locationId }
      });

      if (fetchError) {
        console.error('[useCoachProfile] Fetch error:', fetchError);
        setError('Failed to load profile');
        return;
      }

      if (data?.profile) {
        setProfile(data.profile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('[useCoachProfile] Error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  const updateProfile = useCallback(async (updates: Partial<CoachProfile>): Promise<boolean> => {
    if (!locationId) return false;

    try {
      const { data, error: updateError } = await supabase.functions.invoke('manage-coach-profile', {
        body: { action: 'update', updates },
        headers: { 'x-location-id': locationId }
      });

      if (updateError) {
        console.error('[useCoachProfile] Update error:', updateError);
        return false;
      }

      if (data?.profile) {
        setProfile(data.profile);
      }

      return true;
    } catch (err) {
      console.error('[useCoachProfile] Update failed:', err);
      return false;
    }
  }, [locationId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile
  };
}
