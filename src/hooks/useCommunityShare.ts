import { useState, useCallback } from 'react';

interface ToastData {
  message: string;
  channel: 'wins' | 'testLane';
  prewrittenMessage: string;
}

// Track whether phases have been shared (persisted in localStorage)
function getShareState(locationId: string) {
  try {
    const stored = localStorage.getItem(`community_share_${locationId}`);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setShareState(locationId: string, phase: string, shared: boolean) {
  try {
    const current = getShareState(locationId);
    localStorage.setItem(`community_share_${locationId}`, JSON.stringify({
      ...current,
      [phase]: shared
    }));
  } catch {
    // Ignore localStorage errors
  }
}

export function useCommunityShare(locationId: string | undefined) {
  const [toastData, setToastData] = useState<ToastData | null>(null);

  const hasSharedPhase = useCallback((phase: 'phase1' | 'phase2' | 'phase3') => {
    if (!locationId) return false;
    return getShareState(locationId)[phase] || false;
  }, [locationId]);

  const markPhaseShared = useCallback((phase: 'phase1' | 'phase2' | 'phase3') => {
    if (!locationId) return;
    setShareState(locationId, phase, true);
  }, [locationId]);

  const showShareToast = useCallback((data: ToastData) => {
    setToastData(data);
  }, []);

  const hideShareToast = useCallback(() => {
    setToastData(null);
  }, []);

  return {
    hasSharedPhase,
    markPhaseShared,
    toastData,
    showShareToast,
    hideShareToast,
  };
}
