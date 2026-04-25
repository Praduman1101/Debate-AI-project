import { useCallback } from 'react';
import { useToast } from '../context/ToastContext';

const BADGE_META = {
  first_win:  { icon: '🏆', label: 'First Win' },
  streak_5:   { icon: '🔥', label: '5-Win Streak' },
  expert:     { icon: '🎓', label: 'Expert Debater' },
  centurion:  { icon: '💯', label: '100 Debates' },
  ai_slayer:  { icon: '🤖', label: 'AI Slayer' },
};

/**
 * useBadgeUnlock
 * Shows a celebratory toast when the API returns newBadges after finalizing a debate.
 *
 * Usage:
 *   const { announceBadges } = useBadgeUnlock();
 *   announceBadges(response.newBadges); // pass the array from /scores/finalize
 */
export default function useBadgeUnlock() {
  const toast = useToast();

  const announceBadges = useCallback((newBadges = []) => {
    if (!newBadges?.length) return;

    // Stagger toasts so they don't all appear at once
    newBadges.forEach((badgeId, index) => {
      const meta = BADGE_META[badgeId] || { icon: '🎖', label: badgeId };
      setTimeout(() => {
        toast.success(`${meta.icon} Badge unlocked: ${meta.label}!`, 'long');
      }, index * 1200);
    });
  }, [toast]);

  return { announceBadges };
}
