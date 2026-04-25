import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';

/**
 * useLeaderboard
 * Fetches leaderboard data with caching and refresh support.
 * Also resolves the current user's rank from the list.
 */
export default function useLeaderboard({ currentUsername } = {}) {
  const [leaders,    setLeaders]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [myRank,     setMyRank]     = useState(null);

  const cacheRef = useRef(null);
  const cacheAgeRef = useRef(null);
  const CACHE_TTL = 60_000; // 1 minute

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    // Return cached data if fresh
    if (!isRefresh && cacheRef.current && Date.now() - cacheAgeRef.current < CACHE_TTL) {
      setLeaders(cacheRef.current);
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    setError(null);

    try {
      const res  = await api.get('/debates/stats/leaderboard');
      const list = res.data.leaderboard || [];

      cacheRef.current    = list;
      cacheAgeRef.current = Date.now();
      setLeaders(list);

      if (currentUsername) {
        const idx = list.findIndex(u => u.username === currentUsername);
        setMyRank(idx >= 0 ? idx + 1 : null);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUsername]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const refresh = useCallback(() => {
    cacheRef.current = null; // invalidate cache on manual refresh
    fetchLeaderboard(true);
  }, [fetchLeaderboard]);

  return { leaders, loading, refreshing, error, myRank, refresh };
}
