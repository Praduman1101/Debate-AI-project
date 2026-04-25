import { useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * useHaptics
 * Provides haptic feedback for key app events.
 * Respects user's haptics toggle from Settings.
 *
 * Usage:
 *   const { impact, notification, selection } = useHaptics();
 *   impact('medium');           // button press
 *   notification('success');    // debate won
 *   selection();                // toggle / chip select
 */
export default function useHaptics() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.HAPTICS_ENABLED).then(val => {
      if (val !== null) setEnabled(val === 'true');
    });
  }, []);

  /** Light / medium / heavy impact */
  const impact = useCallback(async (style = 'medium') => {
    if (!enabled) return;
    const styles = {
      light:  Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy:  Haptics.ImpactFeedbackStyle.Heavy,
    };
    try { await Haptics.impactAsync(styles[style] || styles.medium); } catch {}
  }, [enabled]);

  /** success / warning / error */
  const notification = useCallback(async (type = 'success') => {
    if (!enabled) return;
    const types = {
      success: Haptics.NotificationFeedbackType.Success,
      warning: Haptics.NotificationFeedbackType.Warning,
      error:   Haptics.NotificationFeedbackType.Error,
    };
    try { await Haptics.notificationAsync(types[type] || types.success); } catch {}
  }, [enabled]);

  /** Soft tap for chip/toggle selections */
  const selection = useCallback(async () => {
    if (!enabled) return;
    try { await Haptics.selectionAsync(); } catch {}
  }, [enabled]);

  const toggle = useCallback(async () => {
    const next = !enabled;
    setEnabled(next);
    await AsyncStorage.setItem(STORAGE_KEYS.HAPTICS_ENABLED, String(next));
  }, [enabled]);

  return { impact, notification, selection, enabled, toggle };
}
