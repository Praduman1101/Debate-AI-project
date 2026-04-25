import { useState, useEffect, useCallback, useRef } from 'react';
import { ScoresAPI } from '../services/api';

const CACHE_KEY = 'user_stats';
const CACHE_TTL = 30_000; // 30 seconds

// Module-level cache shared across hook instances
const statsCache = { data: null, fetchedAt: null };

/**
 * useStats
 * Fetches and caches the current user's stats, level, XP, badges,
 * and recent debates from GET /api/scores/me.
 *
 * The result is cached for 30 seconds to avoid duplicate API calls
 * when ProfileScreen and HomeScreen are both mounted.
 *
 * Usage:
 *   const { stats, level, xp, badges, recentDebates, loading, refresh } = useStats();
 */
export default function useStats({ autoFetch = true } = {}) {
  const [stats,         setStats]         = useState(statsCache.data?.stats         || null);
  const [level,         setLevel]         = useState(statsCache.data?.level         || null);
  const [xp,            setXP]            = useState(statsCache.data?.xp            || null);
  const [badges,        setBadges]        = useState(statsCache.data?.badges        || []);
  const [recentDebates, setRecentDebates] = useState(statsCache.data?.recentDebates || []);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const updateState = useCallback((data) => {
    if (!mountedRef.current) return;
    setStats(data.stats);
    setLevel(data.level);
    setXP(data.xp);
    setBadges(data.badges || []);
    setRecentDebates(data.recentDebates || []);
  }, []);

  const fetchStats = useCallback(async (force = false) => {
    // Return cached data if still fresh
    const now = Date.now();
    if (!force && statsCache.data && statsCache.fetchedAt && (now - statsCache.fetchedAt < CACHE_TTL)) {
      updateState(statsCache.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res  = await ScoresAPI.me();
      const data = res.data;

      // Update cache
      statsCache.data      = data;
      statsCache.fetchedAt = Date.now();

      updateState(data);
    } catch (e) {
      if (mountedRef.current) {
        setError(e.response?.data?.error || 'Failed to load stats');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [updateState]);

  useEffect(() => {
    if (autoFetch) fetchStats();
  }, [autoFetch, fetchStats]);

  const refresh = useCallback(() => fetchStats(true), [fetchStats]);

  /** Call this after a debate is finalized to bust the stats cache */
  const invalidate = useCallback(() => {
    statsCache.data      = null;
    statsCache.fetchedAt = null;
  }, []);

  return { stats, level, xp, badges, recentDebates, loading, error, refresh, invalidate };
}
