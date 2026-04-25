import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_ENDPOINTS } from '../utils/constants';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT ───────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try { await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN); } catch (_) {}
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Typed API helpers ──────────────────────────────────────────────────

export const AuthAPI = {
  register: (data) => api.post(API_ENDPOINTS.AUTH.REGISTER, data),
  login:    (data) => api.post(API_ENDPOINTS.AUTH.LOGIN, data),
  me:       ()     => api.get(API_ENDPOINTS.AUTH.ME),
  profile:  (data) => api.put(API_ENDPOINTS.AUTH.PROFILE, data),
  password: (data) => api.put(API_ENDPOINTS.AUTH.PASSWORD, data),
  delete:   (data) => api.delete(API_ENDPOINTS.AUTH.ACCOUNT, { data }),
};

export const TopicsAPI = {
  list:     (params) => api.get(API_ENDPOINTS.TOPICS.LIST, { params }),
  generate: (params) => api.get(API_ENDPOINTS.TOPICS.GENERATE, { params }),
  detail:   (id)     => api.get(API_ENDPOINTS.TOPICS.DETAIL(id)),
};

export const DebatesAPI = {
  list:        (params) => api.get(API_ENDPOINTS.DEBATES.LIST, { params }),
  detail:      (id)     => api.get(API_ENDPOINTS.DEBATES.DETAIL(id)),
  remove:      (id)     => api.delete(API_ENDPOINTS.DEBATES.DETAIL(id)),
  leaderboard: ()       => api.get(API_ENDPOINTS.DEBATES.LEADERBOARD),
};

export const ScoresAPI = {
  me:       ()   => api.get(API_ENDPOINTS.SCORES.ME),
  finalize: (id) => api.post(API_ENDPOINTS.SCORES.FINALIZE(id)),
};

export const VoiceAPI = {
  transcribe: (audioUri, topic = '') => {
    const form = new FormData();
    form.append('audio', { uri: audioUri, name: 'audio.m4a', type: 'audio/m4a' });
    form.append('topic', topic);
    return api.post(API_ENDPOINTS.VOICE.TRANSCRIBE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  },
};
