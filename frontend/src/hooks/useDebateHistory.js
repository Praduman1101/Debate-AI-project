import { useState, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * useDebateHistory
 * Manages paginated debate history with server-side filtering and delete support.
 *
 * @param {string} statusFilter  - 'all' | 'completed' | 'abandoned'
 * @param {number} pageSize      - items per page (default 10)
 */
export default function useDebateHistory({ statusFilter = 'all', pageSize = 10 } = {}) {
  const [debates,    setDebates]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore,setLoadingMore]= useState(false);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const abortRef = useRef(null);

  const buildParams = useCallback((p) => {
    const params = { page: p, limit: pageSize };
    if (statusFilter !== 'all') params.status = statusFilter;
    return params;
  }, [statusFilter, pageSize]);

  const fetchPage = useCallback(async (pageNum, mode = 'replace') => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    if (mode === 'replace') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'append')  setLoadingMore(true);
    setError(null);

    try {
      const res = await api.get('/debates', {
        params: buildParams(pageNum),
        signal: abortRef.current.signal,
      });

      const { debates: newDebates, total } = res.data;
      setTotalCount(total);
      setHasMore(newDebates.length === pageSize);
      setPage(pageNum);

      if (mode === 'append') {
        setDebates(prev => [...prev, ...newDebates]);
      } else {
        setDebates(newDebates);
      }
    } catch (e) {
      if (e.name !== 'CanceledError' && e.name !== 'AbortError') {
        setError(e.response?.data?.error || 'Failed to load debates');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [buildParams, pageSize]);

  // Initial load / filter change
  const load = useCallback(() => fetchPage(1, 'replace'), [fetchPage]);

  // Pull-to-refresh
  const refresh = useCallback(() => fetchPage(1, 'refresh'), [fetchPage]);

  // Load next page
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    fetchPage(page + 1, 'append');
  }, [hasMore, loadingMore, loading, page, fetchPage]);

  // Optimistic delete
  const deleteDebate = useCallback(async (id) => {
    const previous = [...debates];
    setDebates(prev => prev.filter(d => d._id !== id));
    setTotalCount(prev => Math.max(0, prev - 1));

    try {
      await api.delete(`/debates/${id}`);
    } catch (e) {
      // Rollback on error
      setDebates(previous);
      setTotalCount(prev => prev + 1);
      throw e;
    }
  }, [debates]);

  return {
    debates,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    totalCount,
    load,
    refresh,
    loadMore,
    deleteDebate,
  };
}
