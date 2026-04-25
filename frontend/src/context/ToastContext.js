import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

const ToastContext = createContext(null);

const TOAST_TYPES = {
  success: { icon: '✅', bg: COLORS.primaryBg, border: COLORS.primary,  text: COLORS.primary },
  error:   { icon: '❌', bg: COLORS.dangerBg,  border: COLORS.danger,   text: COLORS.danger  },
  warning: { icon: '⚠️', bg: COLORS.amberBg,   border: COLORS.amber,    text: COLORS.amber   },
  info:    { icon: 'ℹ️', bg: COLORS.accentBg,  border: COLORS.accent,   text: COLORS.accent  },
};

const TOAST_DURATION = {
  short:  2000,
  medium: 3500,
  long:   5000,
};

let toastId = 0;

/* ─── Single Toast item ───────────────────────────────────────────────── */
const Toast = ({ id, type, message, onDismiss }) => {
  const cfg      = TOAST_TYPES[type] || TOAST_TYPES.info;
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0,  useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacAnim,  { toValue: 1,  duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -80, duration: 250, useNativeDriver: true }),
      Animated.timing(opacAnim,  { toValue: 0,   duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss(id));
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
        { opacity: opacAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.toastIcon}>{cfg.icon}</Text>
      <Text style={[styles.toastMessage, { color: cfg.text }]} numberOfLines={3}>
        {message}
      </Text>
      <TouchableOpacity onPress={dismiss} style={styles.toastDismiss}>
        <Text style={[styles.toastDismissText, { color: cfg.text }]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ─── Toast Container ─────────────────────────────────────────────────── */
const ToastContainer = ({ toasts, onDismiss }) => {
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        { top: insets.top + (Platform.OS === 'android' ? 8 : 4) },
      ]}
      pointerEvents="box-none"
    >
      {toasts.map(t => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </View>
  );
};

/* ─── Provider ────────────────────────────────────────────────────────── */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', duration = 'medium') => {
    const id  = ++toastId;
    const ms  = typeof duration === 'number' ? duration : (TOAST_DURATION[duration] || 3500);

    setToasts(prev => [...prev.slice(-2), { id, type, message }]); // max 3 toasts
    timersRef.current[id] = setTimeout(() => dismiss(id), ms);
    return id;
  }, [dismiss]);

  const success = useCallback((msg, dur) => show(msg, 'success', dur), [show]);
  const error   = useCallback((msg, dur) => show(msg, 'error',   dur), [show]);
  const warning = useCallback((msg, dur) => show(msg, 'warning', dur), [show]);
  const info    = useCallback((msg, dur) => show(msg, 'info',    dur), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

/* ─── Hook ────────────────────────────────────────────────────────────── */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left:     SPACING.lg,
    right:    SPACING.lg,
    zIndex:   9999,
    gap:      8,
  },
  toast: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    borderRadius:  RADIUS.lg,
    padding:       SPACING.md,
    borderWidth:   1,
    shadowColor:   '#000',
    shadowOpacity: 0.3,
    shadowRadius:  8,
    shadowOffset:  { width: 0, height: 4 },
    elevation:     8,
  },
  toastIcon:        { fontSize: 18, flexShrink: 0 },
  toastMessage:     { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  toastDismiss:     { padding: 4, flexShrink: 0 },
  toastDismissText: { fontSize: 12, fontWeight: '700' },
});
