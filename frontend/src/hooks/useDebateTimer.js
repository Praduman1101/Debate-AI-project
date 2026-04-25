import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebateTimer
 * A controlled countdown timer for debate turns.
 * The server is the source of truth (via socket timer:update events),
 * but this hook provides local interpolation for smooth UI updates.
 *
 * @param {number}   initialSeconds  Starting value (synced from socket)
 * @param {Function} onExpire        Called when timer hits 0
 * @param {boolean}  active          Whether the timer is running
 */
export default function useDebateTimer({ initialSeconds = 30, onExpire, active = false } = {}) {
  const [timeLeft,   setTimeLeft]   = useState(initialSeconds);
  const [isUrgent,   setIsUrgent]   = useState(false);
  const intervalRef  = useRef(null);
  const expiredRef   = useRef(false);

  // Sync from external value (socket tick)
  const syncTime = useCallback((serverTime) => {
    setTimeLeft(serverTime);
    setIsUrgent(serverTime <= 8);
    expiredRef.current = serverTime <= 0;
  }, []);

  // Local countdown (runs between socket ticks to keep UI smooth)
  useEffect(() => {
    if (!active) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, prev - 1);
        setIsUrgent(next <= 8);

        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          if (onExpire) onExpire();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [active, onExpire]);

  const reset = useCallback((seconds = initialSeconds) => {
    clearInterval(intervalRef.current);
    expiredRef.current = false;
    setTimeLeft(seconds);
    setIsUrgent(false);
  }, [initialSeconds]);

  // Formatted display string "0:28"
  const formatted = `0:${String(timeLeft).padStart(2, '0')}`;

  // Progress ratio 0–1 for animated bars
  const progress = timeLeft / initialSeconds;

  return { timeLeft, formatted, progress, isUrgent, syncTime, reset };
}
