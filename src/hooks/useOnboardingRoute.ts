import { Account } from '@/lib/accounts';

export type OnboardingDestination = 
  | 'welcome'
  | 'phase1'
  | 'phase2'
  | 'phase3'
  | 'complete'
  | 'dashboard';

interface RouteResult {
  destination: OnboardingDestination;
  path: string;
}

/**
 * Determines where a user should be routed based on their progress.
 * 
 * Logic:
 * - New users (no progress, welcome not dismissed) → Welcome Screen
 * - Phase 1 not complete → Phase 1
 * - Phase 1 complete, Phase 2 not complete → Phase 2
 * - Phase 2 complete, Phase 3 not complete → Phase 3
 * - All phases complete → Completion Dashboard
 */
export function getOnboardingRoute(
  account: Account,
  welcomeDismissed: boolean
): RouteResult {
  const phase1Data = account.phase_1_data as Record<string, unknown> || {};
  const phase1Started = ((phase1Data.items_complete as number) || 0) > 0;
  const hasAnyProgress = account.phase_1_complete || account.phase_2_complete || account.phase_3_complete || phase1Started;

  // All phases complete → Completion
  if (account.phase_1_complete && account.phase_2_complete && account.phase_3_complete) {
    return { destination: 'complete', path: '/dashboard' };
  }

  // New user who hasn't dismissed welcome → Welcome Screen
  if (!hasAnyProgress && !welcomeDismissed) {
    return { destination: 'welcome', path: '/dashboard' };
  }

  // Phase 1 not complete → Phase 1
  if (!account.phase_1_complete) {
    return { destination: 'phase1', path: '/setup' };
  }

  // Phase 2 not complete → Phase 2
  if (!account.phase_2_complete) {
    return { destination: 'phase2', path: '/phase2' };
  }

  // Phase 3 not complete → Phase 3
  if (!account.phase_3_complete) {
    return { destination: 'phase3', path: '/funnel' };
  }

  // Fallback to dashboard
  return { destination: 'dashboard', path: '/dashboard' };
}

export const WELCOME_DISMISSED_KEY = 'awaken_welcome_dismissed';

export function isWelcomeDismissed(locationId: string): boolean {
  return localStorage.getItem(`${WELCOME_DISMISSED_KEY}_${locationId}`) === 'true';
}

export function dismissWelcome(locationId: string): void {
  localStorage.setItem(`${WELCOME_DISMISSED_KEY}_${locationId}`, 'true');
}
