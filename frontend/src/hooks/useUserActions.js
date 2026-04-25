import { useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * useUserActions
 * Extra user-account actions beyond the core auth flow.
 * Consumes the AuthContext so callers don't need to manage state themselves.
 */
export default function useUserActions() {
  const { logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const clearError = useCallback(() => setError(null), []);

  /* ── Change password ──────────────────────────────────────────────── */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      return true;
    } catch (e) {
      setError(e.response?.data?.error || 'Password change failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Update profile ───────────────────────────────────────────────── */
  const updateProfile = useCallback(async (fields) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put('/auth/profile', fields);
      updateUser(res.data.user);
      return true;
    } catch (e) {
      setError(e.response?.data?.error || 'Profile update failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  /* ── Delete account ───────────────────────────────────────────────── */
  const deleteAccount = useCallback(async (password) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete('/auth/account', { data: { password } });
      await logout();
      return true;
    } catch (e) {
      setError(e.response?.data?.error || 'Account deletion failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  return { loading, error, clearError, changePassword, updateProfile, deleteAccount };
}
