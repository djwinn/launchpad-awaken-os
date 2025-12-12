import { supabase } from '@/integrations/supabase/client';

export interface UserProgress {
  id: string;
  user_email: string;
  phase1_progress: number;
  phase1_complete: boolean;
  phase2_complete: boolean;
  funnels_created: number;
  created_at: string;
  updated_at: string;
}

export async function getUserProgress(email: string): Promise<UserProgress | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_email', email)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user progress:', error);
    return null;
  }

  return data;
}

export async function createUserProgress(email: string): Promise<UserProgress | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .insert({ user_email: email })
    .select()
    .single();

  if (error) {
    console.error('Error creating user progress:', error);
    return null;
  }

  return data;
}

export async function getOrCreateUserProgress(email: string): Promise<UserProgress | null> {
  let progress = await getUserProgress(email);
  if (!progress) {
    progress = await createUserProgress(email);
  }
  return progress;
}

export async function updateUserProgress(
  email: string, 
  updates: Partial<Pick<UserProgress, 'phase1_progress' | 'phase1_complete' | 'phase2_complete' | 'funnels_created'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('user_progress')
    .update(updates)
    .eq('user_email', email);

  if (error) {
    console.error('Error updating user progress:', error);
    return false;
  }

  return true;
}

export function calculateOverallProgress(progress: UserProgress): number {
  // Starting bonus: 10% (endowed progress)
  let total = 10;
  
  // Phase 1: 0-5 items = 0-40% of total
  total += (progress.phase1_progress / 5) * 40;
  
  // Phase 2: complete = 30% of total
  if (progress.phase2_complete) {
    total += 30;
  }
  
  // Phase 3: at least 1 funnel = 30% of total (use 20% since we cap at 100)
  if (progress.funnels_created > 0) {
    total += 20;
  }
  
  return Math.min(100, Math.round(total));
}

export function getProgressMessage(percentage: number): string {
  if (percentage <= 30) {
    return "Great start — your foundation is taking shape";
  } else if (percentage <= 60) {
    return "You're making real progress";
  } else if (percentage < 100) {
    return "Almost there — just a few more steps";
  } else {
    return "You're fully ready for business!";
  }
}
