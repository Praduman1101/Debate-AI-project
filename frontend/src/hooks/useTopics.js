import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const cache = new Map(); // Simple in-memory cache

/**
 * useTopics
 * Fetches and caches debate topics with filtering support.
 */
export default function useTopics({ category = 'All', search = '', limit = 20 } = {}) {
  const [topics,     setTopics]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const abortRef = useRef(null);

  const fetchTopics = useCallback(async (isRefresh = false) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const cacheKey = `${category}:${search}:${limit}`;

    if (!isRefresh && cache.has(cacheKey)) {
      setTopics(cache.get(cacheKey));
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = { limit };
      if (category !== 'All') params.category = category.toLowerCase();
      if (search)              params.search   = search;

      const res = await api.get('/topics', { params, signal: abortRef.current.signal });
      const data = res.data.topics || [];

      cache.set(cacheKey, data);
      setTopics(data);
    } catch (e) {
      if (e.name !== 'CanceledError' && e.name !== 'AbortError') {
        setError(e.response?.data?.error || 'Failed to load topics');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, search, limit]);

  useEffect(() => {
    fetchTopics();
    return () => abortRef.current?.abort();
  }, [fetchTopics]);

  const refresh = useCallback(() => fetchTopics(true), [fetchTopics]);

  const invalidateCache = useCallback(() => cache.clear(), []);

  return { topics, loading, refreshing, error, refresh, invalidateCache };
}
