import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

const initialState = {
  user:        null,
  token:       null,
  loading:     true,
  error:       null,
  isNewUser:   false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user:      action.payload.user,
        token:     action.payload.token,
        isNewUser: action.payload.isNewUser || false,
        loading:   false,
        error:     null,
      };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'CLEAR_NEW_USER':
      return { ...state, isNewUser: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await api.get('/auth/me');
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: res.data.user, token, isNewUser: false } });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    restore();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token, isNewUser: false } });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
      return { success: false, error: msg };
    }
  };

  const register = async (username, email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await api.post('/auth/register', { username, email, password });
      const { token, user } = res.data;
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Mark as new user so navigator routes to Onboarding
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token, isNewUser: true } });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
    ]);
    delete api.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (data) => dispatch({ type: 'UPDATE_USER', payload: data });

  const clearNewUser = () => dispatch({ type: 'CLEAR_NEW_USER' });

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      updateUser,
      clearNewUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
